import { createHash } from "node:crypto";

/**
 * Module 8 — AI Healthcare Continuity Engine.
 *
 * Produces four provider-facing briefings: EMERGENCY, CHRONIC, MEDICATION and
 * RECENT_TREATMENT. The default engine ("rules-v1") is deterministic and runs
 * fully offline so the network works without external AI dependencies and never
 * leaks PHI to a third party by accident.
 *
 * To use a real LLM (e.g. Claude), implement `llmSummarize` and set engine to
 * the model id — the call site already passes structured, minimised inputs.
 */

export type ContinuityInput = {
  fullName: string;
  age?: number | null;
  bloodGroup?: string | null;
  allergies: string[];
  chronicConditions: string[];
  medications: { drugName: string; dosage: string; times?: string[] }[];
  surgeries: { name: string; performedAt?: string | null }[];
  dialysis?: { centerName?: string | null; sessionsPerWeek?: number; nextSession?: string | null } | null;
  recentEvents: { title: string; occurredAt: string; type?: string }[];
  organDonor?: boolean;
};

export type AISummaryKind = "EMERGENCY" | "CHRONIC" | "MEDICATION" | "RECENT_TREATMENT";

export type Briefing = {
  kind: AISummaryKind;
  content: string;
  engine: string;
  inputsHash: string;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function emergency(i: ContinuityInput): string {
  const lines: string[] = [];
  const who = `${i.fullName}${i.age ? `, ${i.age}y` : ""}`;
  lines.push(`${who}. Blood group ${i.bloodGroup || "unknown"}.`);
  lines.push(
    i.allergies.length
      ? `⚠ Allergies: ${i.allergies.join(", ")}.`
      : "No known drug allergies on record."
  );
  if (i.chronicConditions.length) lines.push(`Chronic: ${i.chronicConditions.join(", ")}.`);
  if (i.dialysis) lines.push(`On dialysis (${i.dialysis.sessionsPerWeek ?? "?"}×/week) — fluid/electrolyte caution.`);
  if (i.medications.length) lines.push(`Current meds: ${i.medications.map((m) => `${m.drugName} ${m.dosage}`).join(", ")}.`);
  if (i.organDonor) lines.push("Registered organ donor.");
  return lines.join(" ");
}

function chronic(i: ContinuityInput): string {
  if (!i.chronicConditions.length && !i.dialysis) return "No chronic conditions recorded.";
  const parts: string[] = [];
  if (i.chronicConditions.length) parts.push(`Managing ${i.chronicConditions.join(", ")}.`);
  if (i.dialysis) {
    parts.push(
      `Maintenance haemodialysis at ${i.dialysis.centerName ?? "their center"}, ${i.dialysis.sessionsPerWeek ?? "?"}×/week` +
        (i.dialysis.nextSession ? `; next session ${fmt(i.dialysis.nextSession)}.` : ".")
    );
  }
  if (i.surgeries.length) {
    parts.push(`Relevant surgical history: ${i.surgeries.map((s) => s.name + (s.performedAt ? ` (${fmt(s.performedAt)})` : "")).join(", ")}.`);
  }
  return parts.join(" ");
}

function medication(i: ContinuityInput): string {
  if (!i.medications.length) return "No active medications recorded.";
  const list = i.medications
    .map((m) => `• ${m.drugName} ${m.dosage}${m.times?.length ? ` — ${m.times.join(", ")}` : ""}`)
    .join("\n");
  const interactions = i.allergies.length
    ? `\nCheck against documented allergies: ${i.allergies.join(", ")}.`
    : "";
  return `Active regimen:\n${list}${interactions}`;
}

function recentTreatment(i: ContinuityInput): string {
  if (!i.recentEvents.length) return "No recent treatment events recorded.";
  const recent = i.recentEvents.slice(0, 5).map((e) => `• ${fmt(e.occurredAt)} — ${e.title}`).join("\n");
  return `Most recent care events:\n${recent}`;
}

function hashInputs(i: ContinuityInput): string {
  return createHash("sha256").update(JSON.stringify(i)).digest("hex").slice(0, 16);
}

/** Generate all four briefings for a patient. */
export function generateBriefings(input: ContinuityInput, engine = "rules-v1"): Briefing[] {
  const inputsHash = hashInputs(input);
  return [
    { kind: "EMERGENCY", content: emergency(input), engine, inputsHash },
    { kind: "CHRONIC", content: chronic(input), engine, inputsHash },
    { kind: "MEDICATION", content: medication(input), engine, inputsHash },
    { kind: "RECENT_TREATMENT", content: recentTreatment(input), engine, inputsHash },
  ];
}

/**
 * Extension point — swap in Claude/an LLM here. Keep inputs minimised (no raw
 * identifiers beyond what a clinician needs) and sign a BAA with the provider.
 */
export async function llmSummarize(_input: ContinuityInput): Promise<Briefing[] | null> {
  // Not configured by default. Return null so callers fall back to rules-v1.
  return null;
}
