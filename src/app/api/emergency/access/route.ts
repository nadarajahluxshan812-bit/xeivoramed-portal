import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { isDemoMode } from "@/lib/env";
import { recordEmergencyAccess } from "@/lib/global/emergency";
import { demoGlobalId } from "@/lib/global/demo";

const schema = z.object({
  globalId: z.string().min(1),
  reason: z.enum(["UNCONSCIOUS_PATIENT", "LIFE_THREATENING", "PATIENT_UNABLE_TO_CONSENT", "CRITICAL_CARE", "OTHER"]),
  justification: z.string().optional(),
  location: z.string().optional(),
  actorName: z.string().min(1),
  // How the provider proved identity/intent (QR, Health ID, biometric demo, …)
  method: z.enum(["QR_CODE", "HEALTH_ID", "PASSPORT", "NATIONAL_ID", "FACE", "FINGERPRINT", "PALM", "IRIS"]).optional(),
});

/**
 * Module 5 — Break-glass emergency access.
 * Authorised providers obtain immediate access to a patient's passport; the act
 * is written to the immutable, hash-chained audit log.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "emergency:access")) {
    return NextResponse.json({ error: "Forbidden — provider authorisation required" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { globalId, reason, justification, location, actorName, method } = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = h.get("user-agent") ?? undefined;

  if (isDemoMode) {
    if (globalId !== demoGlobalId.globalId) {
      return NextResponse.json({ error: "Global Health ID not found" }, { status: 404 });
    }
    const entry = await recordEmergencyAccess({
      patientId: "demo-patient-profile",
      actorUserId: user.id,
      actorName,
      reason,
      justification,
      location,
      verificationMethod: method,
      ip,
      userAgent,
    });
    return NextResponse.json({
      ok: true,
      method: method ?? "QR_CODE",
      hash: entry.hash.slice(0, 16) + "…",
      passportLink: `/passport/${globalId}?t=${demoGlobalId.emergencyToken}&demo=1`,
    });
  }

  const gid = await prisma.globalHealthId.findUnique({ where: { globalId }, include: { patient: true } });
  if (!gid || !gid.isActive) return NextResponse.json({ error: "Global Health ID not found" }, { status: 404 });

  // Associate the provider org if the acting user belongs to one.
  const membership = await prisma.providerMember.findFirst({ where: { userId: user.id }, select: { providerId: true } });

  const entry = await recordEmergencyAccess({
    patientId: gid.patientId,
    providerId: membership?.providerId ?? null,
    actorUserId: user.id,
    actorName,
    reason,
    justification,
    location,
    verificationMethod: method,
    ip,
    userAgent,
  });

  // Record the verification attempt, linked to the immutable audit entry.
  if (method) {
    await prisma.biometricVerificationAttempt.create({
      data: {
        patientId: gid.patientId,
        providerUserId: user.id,
        method,
        status: "VERIFIED",
        reason: justification,
        location,
        auditLogId: entry.id,
      },
    }).catch(() => {});
  }

  // TODO: notify patient via existing reminder/notification channels (SMS/WhatsApp/push).

  return NextResponse.json({
    ok: true,
    method: method ?? "QR_CODE",
    hash: entry.hash.slice(0, 16) + "…",
    passportLink: `/passport/${globalId}?t=${gid.emergencyToken}&demo=1`,
  });
}
