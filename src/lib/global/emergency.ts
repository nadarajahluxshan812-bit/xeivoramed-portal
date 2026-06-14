import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { isDemoMode } from "@/lib/env";

/**
 * Module 5 — Emergency access immutable audit (break-glass).
 *
 * Every emergency access appends a tamper-evident row: each entry's `hash`
 * covers its own content PLUS the previous entry's hash, forming a chain. Any
 * later edit/deletion breaks the chain and is detectable by `verifyChain`.
 * (Append-only at the app layer; pair with WORM storage / row-level deny-delete
 * in production for full immutability — see SECURITY.md.)
 */

export type EmergencyEntryInput = {
  patientId: string;
  providerId?: string | null;
  actorUserId?: string | null;
  actorName: string;
  reason: "UNCONSCIOUS_PATIENT" | "LIFE_THREATENING" | "PATIENT_UNABLE_TO_CONSENT" | "CRITICAL_CARE" | "OTHER";
  justification?: string;
  scope?: "EMERGENCY_ONLY" | "SUMMARY" | "FULL_RECORDS";
  location?: string;
  verificationMethod?: string;
  ip?: string;
  userAgent?: string;
};

function computeHash(prevHash: string | null, payload: Record<string, unknown>, createdAt: string): string {
  return createHash("sha256")
    .update(`${prevHash ?? "GENESIS"}|${createdAt}|${JSON.stringify(payload)}`)
    .digest("hex");
}

/** Append an emergency-access entry to the patient's immutable chain. */
export async function recordEmergencyAccess(input: EmergencyEntryInput) {
  const createdAt = new Date();

  if (isDemoMode) {
    const payload = { ...input };
    const hash = computeHash(null, payload, createdAt.toISOString());
    return { id: `demo-${hash.slice(0, 8)}`, hash, prevHash: null, createdAt, ...input };
  }

  // Chain against the most recent entry for this patient.
  const last = await prisma.emergencyAccessLog.findFirst({
    where: { patientId: input.patientId },
    orderBy: { createdAt: "desc" },
    select: { hash: true },
  });

  const payload = {
    patientId: input.patientId,
    providerId: input.providerId ?? null,
    actorUserId: input.actorUserId ?? null,
    actorName: input.actorName,
    reason: input.reason,
    justification: input.justification ?? null,
    scope: input.scope ?? "EMERGENCY_ONLY",
    location: input.location ?? null,
  };
  const hash = computeHash(last?.hash ?? null, payload, createdAt.toISOString());

  return prisma.emergencyAccessLog.create({
    data: {
      ...payload,
      verificationMethod: input.verificationMethod ?? null,
      ip: input.ip,
      userAgent: input.userAgent,
      prevHash: last?.hash ?? null,
      hash,
      createdAt,
    },
  });
}

/** Recompute the chain and report the first point (if any) where it diverges. */
export async function verifyChain(patientId: string): Promise<{ valid: boolean; brokenAt?: string }> {
  if (isDemoMode) return { valid: true };
  const entries = await prisma.emergencyAccessLog.findMany({
    where: { patientId },
    orderBy: { createdAt: "asc" },
  });

  let prev: string | null = null;
  for (const e of entries) {
    const payload = {
      patientId: e.patientId,
      providerId: e.providerId,
      actorUserId: e.actorUserId,
      actorName: e.actorName,
      reason: e.reason,
      justification: e.justification,
      scope: e.scope,
      location: e.location,
    };
    const expected = computeHash(prev, payload, e.createdAt.toISOString());
    if (expected !== e.hash || e.prevHash !== prev) {
      return { valid: false, brokenAt: e.id };
    }
    prev = e.hash;
  }
  return { valid: true };
}
