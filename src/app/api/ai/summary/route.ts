import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { generateBriefings, llmSummarize, type ContinuityInput } from "@/lib/global/ai-summary";
import { demoBriefings } from "@/lib/global/demo";

/**
 * Module 8 — AI continuity briefings for a patient.
 * GET /api/ai/summary?patientId=...  (defaults to the caller's own profile)
 * Tries the LLM engine if configured, else the deterministic rules engine.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "ai:summary:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const patientId = new URL(request.url).searchParams.get("patientId") ?? user.patientProfileId;

  if (isDemoMode) return NextResponse.json({ briefings: demoBriefings, engine: "rules-v1", demo: true });
  if (!patientId) return NextResponse.json({ error: "No patient" }, { status: 400 });

  // Clinicians reading another patient must have access; patients read their own.
  if (patientId !== user.patientProfileId && !can(user.role, "patient:read:any")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const input = await buildInput(patientId);
  if (!input) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const briefings = (await llmSummarize(input)) ?? generateBriefings(input);

  // Cache for provenance / quick re-reads.
  await Promise.all(
    briefings.map((b) =>
      prisma.aISummary.upsert({
        where: { patientId_kind: { patientId, kind: b.kind } },
        create: { patientId, kind: b.kind, content: b.content, engine: b.engine, inputsHash: b.inputsHash },
        update: { content: b.content, engine: b.engine, inputsHash: b.inputsHash, createdAt: new Date() },
      })
    )
  );

  await audit({
    actorId: user.id, actorRole: user.role, action: "AI_SUMMARY_READ",
    entityType: "PatientProfile", entityId: patientId, subjectPatientId: patientId,
  });

  return NextResponse.json({ briefings, engine: briefings[0]?.engine });
}

async function buildInput(patientId: string): Promise<ContinuityInput | null> {
  const p = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    include: {
      user: true,
      medications: { where: { isActive: true } },
      surgeries: { orderBy: { performedAt: "desc" } },
      globalHealthId: true,
      dialysisPlan: { include: { sessions: { where: { scheduledAt: { gte: new Date() } }, take: 1, orderBy: { scheduledAt: "asc" } } } },
      standardizedEvents: { orderBy: { occurredAt: "desc" }, take: 8 },
    },
  });
  if (!p) return null;
  return {
    fullName: p.user.fullName,
    age: p.dateOfBirth ? Math.floor((Date.now() - p.dateOfBirth.getTime()) / 3.15576e10) : null,
    bloodGroup: p.bloodGroup,
    allergies: p.allergies,
    chronicConditions: p.chronicConditions,
    medications: p.medications.map((m) => ({ drugName: m.drugName, dosage: m.dosage, times: m.times })),
    surgeries: p.surgeries.map((s) => ({ name: s.name, performedAt: s.performedAt?.toISOString() ?? null })),
    dialysis: p.dialysisPlan ? { centerName: p.dialysisPlan.centerName, sessionsPerWeek: p.dialysisPlan.sessionsPerWeek, nextSession: p.dialysisPlan.sessions[0]?.scheduledAt.toISOString() ?? null } : null,
    recentEvents: p.standardizedEvents.map((e) => ({ title: e.title, occurredAt: e.occurredAt.toISOString(), type: e.type })),
    organDonor: p.globalHealthId?.organDonor ?? false,
  };
}
