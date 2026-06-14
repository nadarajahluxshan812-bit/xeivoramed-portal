import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { generateGlobalId, generateEmergencyToken } from "@/lib/global/id";

/**
 * POST /api/passport/create — generate the patient's Global Health ID +
 * emergency token (live mode). Idempotent: returns the existing passport if one
 * was already generated. In demo mode this is a no-op (fixtures already exist).
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user || !user.patientProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemoMode) {
    return NextResponse.json({ ok: true, demo: true, note: "Demo mode — sample passport already exists." });
  }

  const existing = await prisma.globalHealthId.findUnique({
    where: { patientId: user.patientProfileId },
  });
  if (existing) {
    return NextResponse.json({ ok: true, globalId: existing.globalId, existing: true });
  }

  const created = await prisma.globalHealthId.create({
    data: {
      patientId: user.patientProfileId,
      globalId: generateGlobalId("LK"),
      emergencyToken: generateEmergencyToken(),
    },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "PASSPORT_CREATED",
    entityType: "GlobalHealthId",
    entityId: created.id,
    subjectPatientId: user.patientProfileId,
  });

  return NextResponse.json({ ok: true, globalId: created.globalId }, { status: 201 });
}
