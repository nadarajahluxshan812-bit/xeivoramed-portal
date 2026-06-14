import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";

const schema = z.object({
  status: z.enum(["PENDING_VERIFICATION", "VERIFIED", "APPROVED", "SUSPENDED", "REJECTED"]),
});

/**
 * Module 4 — provider verification workflow (admin only).
 * Advances a provider through REGISTERED → VERIFIED → APPROVED (or REJECT/SUSPEND).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user || !can(user.role, "provider:verify")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { status } = parsed.data;

  if (isDemoMode) return NextResponse.json({ ok: true, demo: true, status });

  const provider = await prisma.provider.update({
    where: { id },
    data: {
      status,
      verifiedAt: status === "VERIFIED" || status === "APPROVED" ? new Date() : undefined,
      verifiedByUserId: user.id,
    },
  });

  await audit({
    actorId: user.id, actorRole: user.role, action: `PROVIDER_${status}`,
    entityType: "Provider", entityId: id,
  });

  return NextResponse.json({ ok: true, status: provider.status });
}
