import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { generateNote, llmGenerate, type Specialty, type NoteType } from "@/lib/global/scribe";

const schema = z.object({
  transcript: z.string().min(1),
  specialty: z.enum(["CARDIOLOGY", "ONCOLOGY", "NEPHROLOGY", "NEUROLOGY", "GASTROENTEROLOGY", "ENDOCRINOLOGY", "GENERAL_PRACTICE"]),
  noteType: z.enum(["CONSULTATION", "SOAP", "DIAGNOSIS", "FOLLOW_UP_PLAN", "REFERRAL_LETTER", "DISCHARGE_SUMMARY"]),
  patientName: z.string().optional(),
  doctorName: z.string().optional(),
});

/**
 * Priority 2 — generate a specialty clinical note from an ambient transcript.
 * Tries the LLM engine if configured, else the deterministic specialty engine.
 * Output goes through human review before finalization (handled client-side +
 * persisted via the session/note models in production).
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  // AI Scribe is clinician-only: doctors + provider/hospital staff. Patients/public denied.
  if (!user || !can(user.role, "scribe:use")) {
    return NextResponse.json({ error: "Forbidden — AI Scribe is available to verified clinicians only" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten() }, { status: 400 });
  const { transcript, specialty, noteType, patientName, doctorName } = parsed.data;

  const note =
    (await llmGenerate(transcript, specialty as Specialty, noteType as NoteType)) ??
    generateNote(transcript, specialty as Specialty, noteType as NoteType, { patientName, doctorName: doctorName ?? user.fullName });

  await audit({
    actorId: user.id, actorRole: user.role, action: "SCRIBE_GENERATE",
    entityType: "ScribeNote", metadata: { specialty, noteType, engine: note.engine },
  });

  return NextResponse.json({ note });
}
