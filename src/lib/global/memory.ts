import { createHash } from "node:crypto";
import type { ContinuityInput } from "./ai-summary";

/**
 * Priority 1 — Global Health Memory Engine.
 *
 * Turns a patient's structured history into a lifelong **memory graph** (nodes +
 * relationships), tracks disease progression, and produces a one-glance doctor
 * briefing + AI risk summary. Deterministic ("rules-v1") so it runs offline; a
 * real LLM/graph store can replace `deriveGraph`/`riskSummary` behind this API.
 */

export type MemoryNodeType =
  | "CONDITION" | "MEDICATION" | "PROCEDURE" | "SURGERY" | "ENCOUNTER"
  | "LAB" | "ALLERGY" | "RISK_FACTOR" | "ADMISSION" | "IMMUNIZATION";

export type MemoryEdgeType =
  | "CAUSED" | "TREATS" | "PROGRESSED_TO" | "COMPLICATION_OF" | "FOLLOWS" | "RELATED_TO" | "PRESCRIBED_FOR";

export type GraphNode = {
  id: string;
  type: MemoryNodeType;
  label: string;
  occurredAt?: string | null;
  severity?: string;
  status?: string;
};

export type GraphEdge = { from: string; to: string; type: MemoryEdgeType; note?: string };

export type MemoryGraph = { nodes: GraphNode[]; edges: GraphEdge[] };

export type DoctorBriefing = {
  headline: string;
  conditions: string[];
  admissions: number;
  procedures: number;
  allergies: string[];
  lastDialysis?: string | null;
  currentMedications: string[];
  riskFactors: string[];
};

const id = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 10);

/** Build the memory graph + derived relationships from structured history. */
export function deriveGraph(input: ContinuityInput): MemoryGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const add = (n: GraphNode) => {
    if (!nodes.find((x) => x.id === n.id)) nodes.push(n);
    return n.id;
  };

  // Conditions
  const condIds = input.chronicConditions.map((c) =>
    add({ id: id("cond:" + c), type: "CONDITION", label: c, status: "chronic" })
  );
  // Medications, linked to conditions they likely treat (heuristic: all chronic)
  for (const m of input.medications) {
    const mid = add({ id: id("med:" + m.drugName), type: "MEDICATION", label: `${m.drugName} ${m.dosage}`, status: "active" });
    for (const cid of condIds) edges.push({ from: mid, to: cid, type: "PRESCRIBED_FOR" });
  }
  // Allergies
  for (const a of input.allergies) add({ id: id("allergy:" + a), type: "ALLERGY", label: a, severity: "documented" });
  // Surgeries / procedures
  for (const s of input.surgeries) {
    add({ id: id("surg:" + s.name), type: "SURGERY", label: s.name, occurredAt: s.performedAt ?? null });
  }
  // Dialysis as a procedure related to renal conditions
  if (input.dialysis) {
    const did = add({ id: id("proc:dialysis"), type: "PROCEDURE", label: "Maintenance haemodialysis", status: "active" });
    const renal = condIds.find((_, i) => /kidney|renal|ckd/i.test(input.chronicConditions[i]));
    if (renal) edges.push({ from: did, to: renal, type: "TREATS", note: `${input.dialysis.sessionsPerWeek}×/week` });
  }
  // Recent events → encounters/labs, chained in time (FOLLOWS)
  const evNodes = input.recentEvents.map((e) =>
    add({ id: id("ev:" + e.title + e.occurredAt), type: (e.type as MemoryNodeType) || "ENCOUNTER", label: e.title, occurredAt: e.occurredAt })
  );
  for (let i = 1; i < evNodes.length; i++) edges.push({ from: evNodes[i - 1], to: evNodes[i], type: "FOLLOWS" });

  // Disease progression heuristic: CKD stage mentions
  const ckd = input.chronicConditions.find((c) => /stage/i.test(c) && /kidney|ckd|renal/i.test(c));
  if (ckd) {
    const earlier = add({ id: id("cond:ckd-earlier"), type: "CONDITION", label: "Chronic Kidney Disease — earlier stage", status: "resolved" });
    const current = condIds[input.chronicConditions.indexOf(ckd)];
    edges.push({ from: earlier, to: current, type: "PROGRESSED_TO", note: "disease progression" });
  }

  return { nodes, edges };
}

/** Disease progression timeline (ordered condition/lab nodes). */
export function diseaseProgression(graph: MemoryGraph): GraphNode[] {
  return graph.nodes
    .filter((n) => n.type === "CONDITION" || n.type === "LAB")
    .sort((a, b) => new Date(a.occurredAt ?? 0).getTime() - new Date(b.occurredAt ?? 0).getTime());
}

/** The "instead of 500 pages" one-glance doctor briefing. */
export function doctorBriefing(input: ContinuityInput): DoctorBriefing {
  const admissions = input.recentEvents.filter((e) => /admiss|discharge|hospital/i.test(e.title)).length;
  const procedures = input.surgeries.length + (input.dialysis ? 1 : 0);
  const riskFactors = computeRiskFactors(input);
  const lastDialysis = input.dialysis?.nextSession ?? null;

  return {
    headline: `${input.fullName}${input.age ? `, ${input.age}y` : ""} · ${input.bloodGroup || "blood group unknown"}`,
    conditions: input.chronicConditions,
    admissions,
    procedures,
    allergies: input.allergies,
    lastDialysis,
    currentMedications: input.medications.map((m) => `${m.drugName} ${m.dosage}`),
    riskFactors,
  };
}

function computeRiskFactors(input: ContinuityInput): string[] {
  const risks: string[] = [];
  const conds = input.chronicConditions.join(" ").toLowerCase();
  if (/diabet/.test(conds)) risks.push("Diabetes — infection, wound healing & nephropathy risk");
  if (/hypertension/.test(conds)) risks.push("Hypertension — cardiovascular & stroke risk");
  if (/kidney|ckd|renal/.test(conds)) risks.push("Renal impairment — drug dosing & contrast caution");
  if (input.dialysis) risks.push("On dialysis — fluid/electrolyte & vascular-access risk");
  if (input.allergies.length) risks.push(`Allergy alerts: ${input.allergies.join(", ")}`);
  if (input.medications.length >= 4) risks.push("Polypharmacy — interaction review advised");
  return risks;
}

export function riskSummary(input: ContinuityInput): string {
  const risks = computeRiskFactors(input);
  if (!risks.length) return "No major risk factors identified from the available record.";
  return `Key risks for ${input.fullName.split(" ")[0]}:\n` + risks.map((r) => `• ${r}`).join("\n");
}
