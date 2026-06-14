import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";

const schema = z.object({ action: z.enum(["export", "erase"]) });

/**
 * Priority 9 — GDPR data-subject rights.
 *  - export: machine-readable copy of the patient's data (Art. 20 portability)
 *  - erase:  right-to-erasure REQUEST → flags the account for review (we cannot
 *            hard-delete legally-retained clinical records without a workflow,
 *            so this records the request and de-activates non-essential data).
 * Both actions are audited.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !user.patientProfileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { action } = parsed.data;

  if (action === "export") {
    await audit({ actorId: user.id, actorRole: user.role, action: "GDPR_EXPORT_REQUEST", entityType: "PatientProfile", subjectPatientId: user.patientProfileId });
    // The full machine-readable bundle is served by /api/global/export.
    return NextResponse.json({ ok: true, downloadUrl: "/api/global/export" });
  }

  // erase
  await audit({ actorId: user.id, actorRole: user.role, action: "GDPR_ERASURE_REQUEST", entityType: "PatientProfile", subjectPatientId: user.patientProfileId });
  if (isDemoMode) {
    return NextResponse.json({ ok: true, status: "REQUEST_RECORDED", note: "Erasure requests enter a review workflow; legally-retained records are handled per policy." });
  }
  await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true, status: "REQUEST_RECORDED" });
}
