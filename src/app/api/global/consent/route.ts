import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";

const schema = z.object({
  grantId: z.string().min(1),
  action: z.enum(["approve", "revoke"]),
});

/**
 * Module 3 — Patient ownership / consent management.
 * Patient approves or revokes a provider's access to their records.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "consent:manage:own")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { grantId, action } = parsed.data;

  if (isDemoMode) return NextResponse.json({ ok: true, demo: true });

  const grant = await prisma.providerAccessGrant.findUnique({ where: { id: grantId } });
  if (!grant || grant.patientId !== user.patientProfileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.providerAccessGrant.update({
    where: { id: grantId },
    data:
      action === "approve"
        ? { status: "APPROVED", grantedAt: new Date(), revokedAt: null }
        : { status: "REVOKED", revokedAt: new Date() },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: action === "approve" ? "CONSENT_APPROVE" : "CONSENT_REVOKE",
    entityType: "ProviderAccessGrant",
    entityId: grantId,
    subjectPatientId: user.patientProfileId,
    metadata: { providerId: grant.providerId },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}
