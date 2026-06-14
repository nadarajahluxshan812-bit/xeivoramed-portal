import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  demoGlobalId,
  demoPassport,
  demoGrants,
  demoEmergencyLog,
  demoProviders,
  demoBriefings,
  demoStandardEvents,
  demoContinuityInput,
} from "./demo";
import { generateBriefings } from "./ai-summary";
import { qrDataUrl } from "./id";

/**
 * Read models for the Global Health Identity Network.
 * Demo fixtures in preview mode; live Prisma queries otherwise. Shapes match so
 * the UI is identical in both.
 */

export async function getPassportView(patientProfileId: string) {
  if (isDemoMode) {
    const qr = await qrDataUrl(demoGlobalId.globalId, demoGlobalId.emergencyToken).catch(() => null);
    return { globalId: demoGlobalId, passport: demoPassport, briefings: demoBriefings, qr };
  }

  const profile = await prisma.patientProfile.findUnique({
    where: { id: patientProfileId },
    include: {
      user: true,
      globalHealthId: true,
      emergencyContacts: true,
      surgeries: { orderBy: { performedAt: "desc" } },
      insurancePolicies: true,
      medications: { where: { isActive: true } },
      dialysisPlan: { include: { sessions: { where: { scheduledAt: { gte: new Date() } }, take: 1, orderBy: { scheduledAt: "asc" } } } },
      standardizedEvents: { orderBy: { occurredAt: "desc" }, take: 10 },
    },
  });
  if (!profile) return null;

  const passport = {
    fullName: profile.user.fullName,
    dateOfBirth: profile.dateOfBirth?.toISOString() ?? null,
    age: profile.dateOfBirth ? Math.floor((Date.now() - profile.dateOfBirth.getTime()) / 3.15576e10) : null,
    bloodGroup: profile.bloodGroup ?? "—",
    organDonor: profile.globalHealthId?.organDonor ?? false,
    district: profile.district ?? "—",
    allergies: profile.allergies,
    chronicConditions: profile.chronicConditions,
    medications: profile.medications.map((m) => ({ drugName: m.drugName, dosage: m.dosage, times: m.times })),
    surgeries: profile.surgeries.map((s) => ({ name: s.name, performedAt: s.performedAt?.toISOString() ?? null, hospital: s.hospital })),
    implants: profile.globalHealthId?.implants ?? [],
    dialysis: profile.dialysisPlan
      ? { centerName: profile.dialysisPlan.centerName, sessionsPerWeek: profile.dialysisPlan.sessionsPerWeek, nextSession: profile.dialysisPlan.sessions[0]?.scheduledAt.toISOString() ?? null, status: "ACTIVE" as const }
      : null,
    emergencyContacts: profile.emergencyContacts.map((c) => ({ name: c.name, relationship: c.relationship, phone: c.phone, isPrimary: c.isPrimary })),
    insurance: profile.insurancePolicies.map((p) => ({ insurer: p.insurer, policy: "••••••", coverage: p.coverage, validUntil: p.validUntil?.toISOString() ?? null })),
  };

  const input = {
    fullName: passport.fullName, age: passport.age, bloodGroup: passport.bloodGroup,
    allergies: passport.allergies, chronicConditions: passport.chronicConditions,
    medications: passport.medications, surgeries: passport.surgeries,
    dialysis: passport.dialysis, organDonor: passport.organDonor,
    recentEvents: profile.standardizedEvents.map((e) => ({ title: e.title, occurredAt: e.occurredAt.toISOString(), type: e.type })),
  };
  const briefings = generateBriefings(input);
  const gid = profile.globalHealthId;
  const qr = gid ? await qrDataUrl(gid.globalId, gid.emergencyToken).catch(() => null) : null;

  return {
    // Live mode: never fall back to demo identity. A patient without a generated
    // passport gets null → the UI shows the "Create passport" empty state.
    globalId: gid
      ? { globalId: gid.globalId, emergencyToken: gid.emergencyToken, organDonor: gid.organDonor, passportVersion: gid.passportVersion }
      : null,
    passport,
    briefings,
    qr,
  };
}

export async function getAccessCenter(patientProfileId: string) {
  if (isDemoMode) {
    return { grants: demoGrants, emergencyLog: demoEmergencyLog };
  }
  const [grants, emergencyLog] = await Promise.all([
    prisma.providerAccessGrant.findMany({
      where: { patientId: patientProfileId },
      include: { provider: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.emergencyAccessLog.findMany({
      where: { patientId: patientProfileId },
      include: { provider: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return {
    grants: grants.map((g) => ({
      id: g.id,
      provider: { id: g.provider.id, name: g.provider.name, type: g.provider.type, status: g.provider.status, country: g.provider.country, city: g.provider.city, licenseNumber: g.provider.licenseNumber },
      scope: g.scope,
      status: g.status,
      grantedAt: g.grantedAt?.toISOString() ?? null,
    })),
    emergencyLog: emergencyLog.map((e) => ({
      id: e.id, actorName: e.actorName, provider: e.provider?.name ?? "Off-network responder",
      reason: e.reason, verificationMethod: e.verificationMethod ?? null, scope: e.scope, location: e.location, createdAt: e.createdAt.toISOString(),
      hash: e.hash.slice(0, 12) + "…", prevHash: e.prevHash ? e.prevHash.slice(0, 12) + "…" : "GENESIS",
    })),
  };
}

/** Module 7 — Timeline 2.0: cross-provider & international standardized events. */
export async function getCrossProviderEvents(patientProfileId: string) {
  if (isDemoMode) return demoStandardEvents;
  const events = await prisma.standardizedHealthEvent.findMany({
    where: { patientId: patientProfileId },
    orderBy: { occurredAt: "desc" },
    take: 30,
  });
  return events.map((e) => ({
    id: e.id,
    source: e.source,
    type: e.type,
    title: e.title,
    occurredAt: e.occurredAt.toISOString(),
    originName: e.originName ?? undefined,
    originCountry: e.originCountry ?? undefined,
  }));
}

export async function getProviderRegistry() {
  if (isDemoMode) return demoProviders;
  const providers = await prisma.provider.findMany({ orderBy: { createdAt: "desc" } });
  return providers.map((p) => ({ id: p.id, name: p.name, type: p.type, status: p.status, country: p.country, city: p.city, licenseNumber: p.licenseNumber }));
}

export type PassportView = NonNullable<Awaited<ReturnType<typeof getPassportView>>>;
