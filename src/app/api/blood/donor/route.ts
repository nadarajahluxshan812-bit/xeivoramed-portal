import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";

const schema = z.object({
  bloodGroup: z.enum(["A", "B", "AB", "O"]),
  rhesusFactor: z.enum(["POSITIVE", "NEGATIVE"]),
  city: z.string().optional(),
  country: z.string().default("LK"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  searchRadius: z.coerce.number().int().positive().default(25),
  availabilityStatus: z.enum(["AVAILABLE", "UNAVAILABLE", "TEMPORARILY_INELIGIBLE", "RECENTLY_DONATED"]).default("AVAILABLE"),
  emergencyContact: z.string().optional(),
});

/**
 * Part 1 — patient opts in / updates their donor profile.
 * XeivoraMed does not determine eligibility; status reflects self-declared +
 * organisational review only.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !user.patientProfileId || !can(user.role, "blood:donor")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ct = request.headers.get("content-type") ?? "";
  const raw = ct.includes("application/json") ? await request.json() : Object.fromEntries(await request.formData());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten() }, { status: 400 });

  if (isDemoMode) {
    if (ct.includes("application/json")) return NextResponse.json({ ok: true, demo: true });
    return NextResponse.redirect(`${new URL(request.url).origin}/dashboard/donor?saved=demo`, { status: 303 });
  }

  const data = parsed.data;
  const profile = await prisma.bloodDonorProfile.upsert({
    where: { patientId: user.patientProfileId },
    create: { patientId: user.patientProfileId, ...data },
    update: { ...data },
  });

  await audit({ actorId: user.id, actorRole: user.role, action: "BLOOD_DONOR_UPSERT", entityType: "BloodDonorProfile", entityId: profile.id, subjectPatientId: user.patientProfileId });

  if (ct.includes("application/json")) return NextResponse.json({ ok: true, profile });
  return NextResponse.redirect(`${new URL(request.url).origin}/dashboard/donor?saved=1`, { status: 303 });
}
