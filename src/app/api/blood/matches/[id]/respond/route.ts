import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";

const schema = z.object({ action: z.enum(["accept", "decline", "arrived", "donated"]) });

const STATUS_MAP = {
  accept: "ACCEPTED",
  decline: "DECLINED",
  arrived: "ARRIVED",
  donated: "DONATED",
} as const;

/**
 * Donor response (Part 5). Accept reveals the donor to the hospital, updates the
 * request status and triggers ETA/navigation; decline/arrived/donated track the
 * donor journey. Donor identity is exposed to the hospital ONLY on accept+.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !can(user.role, "blood:donor")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const status = STATUS_MAP[parsed.data.action];

  if (isDemoMode) return NextResponse.json({ ok: true, demo: true, status });

  const match = await prisma.bloodMatch.findUnique({ where: { id }, include: { donor: true } });
  if (!match || match.donor.patientId !== user.patientProfileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  await prisma.bloodMatch.update({
    where: { id },
    data: {
      status,
      respondedAt: status === "ACCEPTED" || status === "DECLINED" ? now : undefined,
      arrivedAt: status === "ARRIVED" ? now : undefined,
      donatedAt: status === "DONATED" ? now : undefined,
    },
  });

  // On acceptance, advance the request and mark the donor recently-donated on donation.
  if (status === "ACCEPTED") {
    await prisma.bloodRequest.update({ where: { id: match.requestId }, data: { status: "DONOR_FOUND" } });
  }
  if (status === "DONATED") {
    await prisma.bloodDonorProfile.update({
      where: { id: match.donorId },
      data: { availabilityStatus: "RECENTLY_DONATED", lastDonationDate: now },
    });
  }

  await audit({ actorId: user.id, actorRole: user.role, action: `BLOOD_MATCH_${status}`, entityType: "BloodMatch", entityId: id, subjectPatientId: user.patientProfileId });

  return NextResponse.json({ ok: true, status });
}
