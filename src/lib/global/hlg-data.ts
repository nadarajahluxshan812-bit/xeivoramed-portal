import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { ContinuityInput } from "./ai-summary";
import { deriveGraph, diseaseProgression, doctorBriefing, riskSummary } from "./memory";
import {
  demoMemoryGraph,
  demoDoctorBriefing,
  demoRiskSummary,
  demoContinuityInput,
  demoWallet,
  demoFamily,
  demoIdentityDocs,
  demoTravelProfile,
} from "./demo";

/**
 * Read models for XeivoraMed modules (Memory, Wallet, Family, Identity,
 * Travel). Demo fixtures in preview; live Prisma queries otherwise.
 */

async function continuityInput(patientProfileId: string): Promise<ContinuityInput | null> {
  const p = await prisma.patientProfile.findUnique({
    where: { id: patientProfileId },
    include: {
      user: true,
      medications: { where: { isActive: true } },
      surgeries: { orderBy: { performedAt: "desc" } },
      globalHealthId: true,
      dialysisPlan: { include: { sessions: { where: { scheduledAt: { gte: new Date() } }, take: 1, orderBy: { scheduledAt: "asc" } } } },
      standardizedEvents: { orderBy: { occurredAt: "desc" }, take: 10 },
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

export async function getMemoryView(patientProfileId: string) {
  if (isDemoMode) {
    const input = demoContinuityInput();
    return {
      input,
      graph: demoMemoryGraph,
      briefing: demoDoctorBriefing,
      risk: demoRiskSummary,
      progression: diseaseProgression(demoMemoryGraph),
    };
  }
  const input = await continuityInput(patientProfileId);
  if (!input) return null;
  const graph = deriveGraph(input);
  return { input, graph, briefing: doctorBriefing(input), risk: riskSummary(input), progression: diseaseProgression(graph) };
}

export async function getWallet(patientProfileId: string) {
  if (isDemoMode) return demoWallet;
  const items = await prisma.walletItem.findMany({ where: { patientId: patientProfileId }, orderBy: { createdAt: "desc" } });
  return items.map((w) => ({ id: w.id, type: w.type, title: w.title, issuer: w.issuer, verified: w.verified, validUntil: w.validUntil?.toISOString() ?? null }));
}

export async function getFamily(patientProfileId: string) {
  if (isDemoMode) return demoFamily;
  const members = await prisma.familyMember.findMany({ where: { guardianId: patientProfileId }, orderBy: { createdAt: "asc" } });
  return members.map((m) => ({ id: m.id, name: m.name, relationship: m.relationship, dateOfBirth: m.dateOfBirth?.toISOString() ?? null, notes: m.notes }));
}

export async function getIdentityDocs(patientProfileId: string) {
  if (isDemoMode) return demoIdentityDocs;
  const docs = await prisma.identityDocument.findMany({ where: { patientId: patientProfileId } });
  // Numbers stay encrypted at rest; surface a masked placeholder only.
  return docs.map((d) => ({ id: d.id, type: d.type, country: d.country, number: "••••••", verified: d.verified, validUntil: d.validUntil?.toISOString() ?? null }));
}

export async function getTravelProfile(patientProfileId: string) {
  if (isDemoMode) return demoTravelProfile;
  const t = await prisma.travelHealthProfile.findUnique({ where: { patientId: patientProfileId } });
  if (!t) return null;
  return { bloodGroup: t.bloodGroup, conditions: t.conditions, destinations: t.destinations, vaccinations: t.vaccinations, emergencyNotes: t.emergencyNotes };
}
