import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { getMemoryView } from "@/lib/global/hlg-data";

/**
 * Priority 1 — patient memory graph + AI briefing + risk summary.
 * GET /api/memory/graph?patientId=…  (defaults to caller's own profile)
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = new URL(request.url).searchParams.get("patientId") ?? user.patientProfileId;
  if (!patientId) return NextResponse.json({ error: "No patient" }, { status: 400 });

  // Patients read their own; clinicians need patient:read:any.
  if (patientId !== user.patientProfileId && !can(user.role, "patient:read:any")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const view = await getMemoryView(patientId);
  if (!view) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await audit({
    actorId: user.id, actorRole: user.role, action: "MEMORY_GRAPH_READ",
    entityType: "PatientProfile", entityId: patientId, subjectPatientId: patientId,
  });

  return NextResponse.json({ briefing: view.briefing, risk: view.risk, graph: view.graph });
}
