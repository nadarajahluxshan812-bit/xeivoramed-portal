import { headers } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { isDemoMode } from "./env";

type AuditInput = {
  actorId?: string | null;
  actorRole?: Role | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  subjectPatientId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Append-only audit log. Every PHI access and mutation should call this.
 * Captures actor, action, the patient whose data was touched, IP and UA.
 * Failures are swallowed (logging must never break the request) but reported.
 */
export async function audit(input: AuditInput): Promise<void> {
  if (isDemoMode) return; // no DB in demo mode

  try {
    let ip: string | undefined;
    let userAgent: string | undefined;
    try {
      const h = await headers();
      ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;
      userAgent = h.get("user-agent") ?? undefined;
    } catch {
      // headers() unavailable outside request scope (e.g. cron) — fine.
    }

    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        subjectPatientId: input.subjectPatientId ?? null,
        ip,
        userAgent,
        metadata: input.metadata as object | undefined,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", err);
  }
}
