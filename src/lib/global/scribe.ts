/**
 * Priority 2 — AI Specialist Medical Scribe.
 *
 * Architecture (see SCRIBE_ARCHITECTURE.md):
 *   ambient audio → real-time transcription (Whisper/Deepgram) → speaker diarization
 *   → this note-generation layer (specialty-aware) → human review → finalize.
 *
 * This module implements the **note-generation + specialty template** layer with a
 * deterministic engine so the workflow runs offline. `llmGenerate` is the extension
 * point for Claude/a specialist LLM; the per-specialty prompt + template are passed
 * to it so the same structure is preserved.
 */

export type Specialty =
  | "CARDIOLOGY" | "ONCOLOGY" | "NEPHROLOGY" | "NEUROLOGY"
  | "GASTROENTEROLOGY" | "ENDOCRINOLOGY" | "GENERAL_PRACTICE";

export type NoteType =
  | "CONSULTATION" | "SOAP" | "DIAGNOSIS" | "FOLLOW_UP_PLAN" | "REFERRAL_LETTER" | "DISCHARGE_SUMMARY";

type SpecialtyConfig = {
  label: string;
  focus: string[]; // review-of-systems focus areas
  terminology: string[]; // common coded concepts the model should prefer
  prompt: string; // system prompt fragment for the LLM path
};

export const SPECIALTIES: Record<Specialty, SpecialtyConfig> = {
  CARDIOLOGY: {
    label: "Cardiology",
    focus: ["chest pain", "dyspnoea", "palpitations", "oedema", "syncope"],
    terminology: ["ACS", "NYHA class", "ejection fraction", "ECG", "troponin", "statin"],
    prompt: "You are a cardiology scribe. Emphasise cardiovascular risk, ECG/echo findings, NYHA class and guideline-directed therapy.",
  },
  ONCOLOGY: {
    label: "Oncology",
    focus: ["staging", "performance status", "tumour markers", "treatment response", "toxicity"],
    terminology: ["TNM stage", "ECOG", "chemotherapy cycle", "RECIST", "biopsy"],
    prompt: "You are an oncology scribe. Capture TNM staging, ECOG status, regimen/cycle, response (RECIST) and toxicity grading.",
  },
  NEPHROLOGY: {
    label: "Nephrology",
    focus: ["eGFR", "fluid status", "electrolytes", "dialysis adequacy", "access"],
    terminology: ["CKD stage", "eGFR", "Kt/V", "AV fistula", "potassium", "EPO"],
    prompt: "You are a nephrology scribe. Emphasise CKD stage, eGFR trend, dialysis adequacy (Kt/V), fluid/electrolyte status and access.",
  },
  NEUROLOGY: {
    label: "Neurology",
    focus: ["headache", "weakness", "seizures", "cognition", "gait"],
    terminology: ["GCS", "NIHSS", "MRI brain", "EEG", "anticonvulsant"],
    prompt: "You are a neurology scribe. Capture neuro exam, GCS/NIHSS where relevant, imaging and seizure/headache characterisation.",
  },
  GASTROENTEROLOGY: {
    label: "Gastroenterology",
    focus: ["abdominal pain", "bowel habit", "GI bleeding", "jaundice", "weight loss"],
    terminology: ["endoscopy", "LFT", "H. pylori", "IBD", "colonoscopy"],
    prompt: "You are a gastroenterology scribe. Emphasise GI symptoms, endoscopy/LFT findings and red-flag features.",
  },
  ENDOCRINOLOGY: {
    label: "Endocrinology",
    focus: ["glycaemic control", "thyroid", "weight", "bone health", "adrenal"],
    terminology: ["HbA1c", "TSH", "insulin regimen", "DKA", "T-score"],
    prompt: "You are an endocrinology scribe. Emphasise HbA1c/glycaemic trend, thyroid function and medication titration.",
  },
  GENERAL_PRACTICE: {
    label: "General Practice",
    focus: ["presenting complaint", "comorbidities", "medications", "preventive care"],
    terminology: ["BP", "BMI", "screening", "vaccination", "referral"],
    prompt: "You are a primary-care scribe. Produce a concise, holistic note covering the presenting complaint and preventive care.",
  },
};

export type GeneratedNote = { type: NoteType; content: string; engine: string };

/** Pull rough "Doctor:" / "Patient:" turns out of an ambient transcript. */
function parseTurns(transcript: string): { speaker: string; text: string }[] {
  return transcript
    .split(/\n+/)
    .map((line) => {
      const m = line.match(/^\s*(doctor|dr|patient|pt|nurse)\s*[:\-]\s*(.+)$/i);
      if (m) return { speaker: /pat|pt/i.test(m[1]) ? "Patient" : "Clinician", text: m[2].trim() };
      return { speaker: "Note", text: line.trim() };
    })
    .filter((t) => t.text.length > 0);
}

function bullets(lines: string[]): string {
  return lines.filter(Boolean).map((l) => `• ${l}`).join("\n");
}

/**
 * Deterministic specialty-aware note generation from a transcript.
 * Returns a structured note for the requested type.
 */
export function generateNote(
  transcript: string,
  specialty: Specialty,
  type: NoteType,
  ctx?: { patientName?: string; doctorName?: string; date?: string }
): GeneratedNote {
  const cfg = SPECIALTIES[specialty];
  const turns = parseTurns(transcript);
  const patientSays = turns.filter((t) => t.speaker === "Patient").map((t) => t.text);
  const clinicianSays = turns.filter((t) => t.speaker === "Clinician").map((t) => t.text);
  const all = turns.map((t) => t.text).join(" ");
  const date = ctx?.date ?? new Date().toLocaleDateString("en-GB");
  const who = ctx?.patientName ?? "the patient";

  // Heuristic extraction
  const symptoms = cfg.focus.filter((f) => new RegExp(f.replace(/\s+/g, "\\s+"), "i").test(all));
  const meds = (all.match(/\b[\w-]+(?:\s\d+\s?mg)\b/gi) ?? []).slice(0, 6);

  let content = "";
  switch (type) {
    case "SOAP":
      content = [
        `SOAP NOTE — ${cfg.label} · ${date}`,
        `Patient: ${who}${ctx?.doctorName ? ` · Clinician: ${ctx.doctorName}` : ""}`,
        "",
        "S (Subjective):",
        bullets(patientSays.length ? patientSays : ["History captured from ambient transcript."]),
        symptoms.length ? `Focus findings: ${symptoms.join(", ")}.` : "",
        "",
        "O (Objective):",
        bullets(clinicianSays.filter((t) => /exam|bp|pulse|temp|sat|finding|noted/i.test(t))),
        meds.length ? `Medications mentioned: ${meds.join(", ")}.` : "",
        "",
        "A (Assessment):",
        bullets([`Working impression in ${cfg.label.toLowerCase()} context`, ...symptoms.map((s) => `Relevant to: ${s}`)]),
        "",
        "P (Plan):",
        bullets(clinicianSays.filter((t) => /plan|start|refer|review|follow|order|prescribe/i.test(t)).slice(0, 6) || []),
      ].filter((l) => l !== "").join("\n");
      break;
    case "REFERRAL_LETTER":
      content = [
        `Dear Colleague,`,
        "",
        `Re: ${who} — ${date}`,
        "",
        `Thank you for seeing this patient regarding ${symptoms[0] ?? "the presenting complaint"}. ` +
          `In summary: ${patientSays.slice(0, 2).join(" ") || all.slice(0, 200)}`,
        "",
        `I would be grateful for your ${cfg.label} opinion. Relevant background and current medications are attached via the XeivoraMed ID.`,
        "",
        `Kind regards,`,
        ctx?.doctorName ?? "Referring clinician",
      ].join("\n");
      break;
    case "DISCHARGE_SUMMARY":
      content = [
        `DISCHARGE SUMMARY — ${cfg.label} · ${date}`,
        `Patient: ${who}`,
        "",
        `Reason for admission: ${symptoms[0] ?? patientSays[0] ?? "see notes"}.`,
        `Course: ${clinicianSays.slice(0, 3).join(" ") || "Stable, managed per protocol."}`,
        `Discharge medications: ${meds.join(", ") || "see prescription"}.`,
        `Follow-up: arrange ${cfg.label} review; safety-net advice given.`,
      ].join("\n");
      break;
    case "FOLLOW_UP_PLAN":
      content = bullets([
        `Review interval: per ${cfg.label} protocol`,
        ...cfg.terminology.slice(0, 3).map((t) => `Monitor: ${t}`),
        "Auto-reminder scheduled via XeivoraMed reminders",
      ]);
      break;
    case "DIAGNOSIS":
      content = bullets([
        `Primary impression (${cfg.label}): ${symptoms[0] ?? "to be confirmed"}`,
        ...symptoms.slice(1).map((s) => `Differential: ${s}`),
      ]);
      break;
    default: // CONSULTATION
      content = [
        `CONSULTATION NOTE — ${cfg.label} · ${date}`,
        `Patient: ${who}`,
        "",
        "Presenting complaint:",
        bullets(patientSays.slice(0, 3)),
        "",
        "Assessment & plan:",
        bullets(clinicianSays.slice(0, 5)),
      ].join("\n");
  }

  return { type, content: content.trim(), engine: "rules-v1" };
}

/** Extension point — route to Claude/a specialist LLM with the specialty prompt. */
export async function llmGenerate(
  _transcript: string,
  _specialty: Specialty,
  _type: NoteType
): Promise<GeneratedNote | null> {
  return null; // not configured by default → caller falls back to generateNote
}
