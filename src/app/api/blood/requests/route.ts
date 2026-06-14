import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { env, isDemoMode } from "@/lib/env";
import { rankDonors, notifyBatchSize, type DonorInput } from "@/lib/blood/matching";
import { sendDonorAlert } from "@/lib/blood/alerts";
import { demoMatches } from "@/lib/blood/demo";

const createSchema = z.object({
  hospitalId: z.string().optional(),
  patientId: z.string().optional(),
  bloodGroupNeeded: z.string().min(1),
  unitsRequired: z.coerce.number().int().positive().default(1),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
  reason: z.string().optional(),
  location: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radius: z.coerce.number().int().positive().default(25),
});

/** GET — current hospital's open requests + matches (board uses the data layer). */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !can(user.role, "blood:request")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (isDemoMode) return NextResponse.json({ requests: [], demo: true });
  const requests = await prisma.bloodRequest.findMany({
    where: { hospitalId: user.clinicId ?? undefined },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ requests });
}

/**
 * POST — create an emergency blood request, run the matching engine, and alert
 * the best-matched donors first. Returns ranked matches (donor identities masked).
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "blood:request")) {
    return NextResponse.json({ error: "Forbidden — hospital/provider authorisation required" }, { status: 403 });
  }

  const ct = request.headers.get("content-type") ?? "";
  const raw = ct.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;

  // ── Demo mode: run the real matching engine over the demo donor pool ──
  if (isDemoMode) {
    const matches = demoMatches();
    return NextResponse.json({
      ok: true, demo: true,
      request: { id: "demo-req", ...input, status: "MATCHING" },
      matchCount: matches.length,
      notified: Math.min(matches.length, notifyBatchSize(input.urgency)),
      matches,
    });
  }

  const hospitalId = input.hospitalId ?? user.clinicId;
  if (!hospitalId) return NextResponse.json({ error: "No hospital context" }, { status: 400 });

  // 1) Persist the request
  const br = await prisma.bloodRequest.create({
    data: {
      hospitalId, patientId: input.patientId, bloodGroupNeeded: input.bloodGroupNeeded,
      unitsRequired: input.unitsRequired, urgency: input.urgency, reason: input.reason,
      location: input.location, latitude: input.latitude, longitude: input.longitude,
      radius: input.radius, status: "MATCHING",
    },
  });

  // 2) Candidate donors (available + eligible) → rank in-memory
  const donors = await prisma.bloodDonorProfile.findMany({
    where: { availabilityStatus: "AVAILABLE", eligibilityStatus: "ELIGIBLE" },
    include: { patient: { include: { user: true } } },
    take: 500,
  });
  const donorInputs: DonorInput[] = donors.map((d) => ({
    id: d.id, group: d.bloodGroup, rh: d.rhesusFactor, latitude: d.latitude, longitude: d.longitude,
    searchRadius: d.searchRadius, availabilityStatus: d.availabilityStatus, eligibilityStatus: d.eligibilityStatus,
    lastDonationDate: d.lastDonationDate?.toISOString() ?? null,
  }));
  const ranked = rankDonors(
    { bloodGroupNeeded: input.bloodGroupNeeded, latitude: input.latitude, longitude: input.longitude, radius: input.radius, urgency: input.urgency },
    donorInputs
  );

  // 3) Persist matches
  await prisma.bloodMatch.createMany({
    data: ranked.map((m) => ({ requestId: br.id, donorId: m.donorId, matchScore: m.matchScore, distanceKm: m.distanceKm, etaMinutes: m.etaMinutes })),
    skipDuplicates: true,
  });

  // 4) Notify the best matches first (scaled by urgency)
  const batch = ranked.slice(0, notifyBatchSize(input.urgency));
  const hospital = await prisma.clinic.findUnique({ where: { id: hospitalId } });
  await Promise.all(
    batch.map(async (m) => {
      const donor = donors.find((d) => d.id === m.donorId);
      if (!donor) return;
      await sendDonorAlert(
        { userId: donor.patient.user.id, fullName: donor.patient.user.fullName, phone: donor.patient.user.phone, email: donor.patient.user.email },
        { bloodType: input.bloodGroupNeeded, hospitalName: hospital?.name ?? "Hospital", distanceKm: m.distanceKm, urgency: input.urgency, matchId: "", appUrl: env.appUrl }
      );
      await prisma.bloodMatch.updateMany({ where: { requestId: br.id, donorId: m.donorId }, data: { status: "NOTIFIED", notifiedAt: new Date() } });
    })
  );

  await audit({ actorId: user.id, actorRole: user.role, action: "BLOOD_REQUEST_CREATE", entityType: "BloodRequest", entityId: br.id, metadata: { matches: ranked.length, notified: batch.length } });

  if (ct.includes("application/json")) {
    return NextResponse.json({ ok: true, request: br, matchCount: ranked.length, notified: batch.length });
  }
  return NextResponse.redirect(`${new URL(request.url).origin}/clinic/blood`, { status: 303 });
}
