import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { getPassportView } from "@/lib/global/data";

/**
 * Module 3 — patient data export (ownership / portability).
 * Returns a downloadable JSON bundle of the patient's passport + AI briefings.
 * (A signed FHIR Bundle export can be layered on top using lib/global/fhir.ts.)
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user || !user.patientProfileId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const view = await getPassportView(user.patientProfileId);
  if (!view || !view.globalId) {
    return NextResponse.json({ error: "No passport yet — create one first." }, { status: 404 });
  }

  await audit({
    actorId: user.id, actorRole: user.role, action: "RECORDS_EXPORT",
    entityType: "PatientProfile", subjectPatientId: user.patientProfileId,
  });

  const bundle = {
    exportedAt: new Date().toISOString(),
    standard: "XeivoraMed/1.0",
    globalHealthId: view.globalId.globalId,
    passport: view.passport,
    aiBriefings: view.briefings,
  };

  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="xeivoramed-${view.globalId.globalId}.json"`,
    },
  });
}
