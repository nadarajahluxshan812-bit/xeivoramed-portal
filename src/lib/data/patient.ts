import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { demoDashboard } from "@/lib/demo";

/**
 * Patient dashboard aggregate. Returns the demo fixture when the DB isn't configured;
 * otherwise assembles the same shape from live Prisma queries.
 */
export async function getPatientDashboard(patientProfileId: string) {
  if (isDemoMode) return demoDashboard;

  const now = new Date();
  const [profile, appointments, medications, dialysisPlan, followUps, records, timeline] =
    await Promise.all([
      prisma.patientProfile.findUnique({
        where: { id: patientProfileId },
        include: { user: true },
      }),
      prisma.appointment.findMany({
        where: { patientId: patientProfileId, scheduledAt: { gte: now }, status: { in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"] } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        include: { doctor: { include: { user: true } }, clinic: true },
      }),
      prisma.medicationPlan.findMany({
        where: { patientId: patientProfileId, isActive: true },
        include: { doses: { take: 30, orderBy: { scheduledAt: "desc" } } },
      }),
      prisma.dialysisPlan.findUnique({
        where: { patientId: patientProfileId },
        include: { sessions: { where: { scheduledAt: { gte: now } }, orderBy: { scheduledAt: "asc" }, take: 3 } },
      }),
      prisma.followUp.findMany({
        where: { patientId: patientProfileId, completed: false },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.medicalRecord.findMany({
        where: { patientId: patientProfileId },
        orderBy: { recordDate: "desc" },
        take: 4,
      }),
      prisma.timelineEvent.findMany({
        where: { patientId: patientProfileId },
        orderBy: { occurredAt: "desc" },
        take: 6,
        include: { doctor: { include: { user: true } } },
      }),
    ]);

  return {
    patient: {
      fullName: profile?.user.fullName ?? "Patient",
      bloodGroup: profile?.bloodGroup ?? "—",
      district: profile?.district ?? "—",
    },
    upcomingAppointments: appointments.map((a) => ({
      id: a.id,
      doctorName: a.doctor?.user.fullName ?? "Unassigned",
      specialty: a.doctor?.specialty ?? "",
      clinicName: a.clinic?.name ?? "",
      type: a.type,
      status: a.status,
      scheduledAt: a.scheduledAt.toISOString(),
      reason: a.reason ?? "",
    })),
    medications: medications.map((m) => {
      const recent = m.doses.slice(0, 14);
      const taken = recent.filter((d) => d.status === "TAKEN").length;
      const adherencePct = recent.length ? Math.round((taken / recent.length) * 100) : 100;
      return {
        id: m.id,
        drugName: m.drugName,
        dosage: m.dosage,
        times: m.times,
        adherencePct,
        nextDose: m.doses.find((d) => d.status === "PENDING")?.scheduledAt.toISOString() ?? null,
      };
    }),
    dialysis: dialysisPlan
      ? {
          centerName: dialysisPlan.centerName ?? "Dialysis center",
          sessionsPerWeek: dialysisPlan.sessionsPerWeek,
          nextSession: dialysisPlan.sessions[0]?.scheduledAt.toISOString() ?? null,
          lastStatus: "COMPLETED" as const,
          upcoming: dialysisPlan.sessions.map((s) => ({
            id: s.id,
            scheduledAt: s.scheduledAt.toISOString(),
            status: s.status,
          })),
        }
      : null,
    followUps: followUps.map((f) => ({
      id: f.id,
      reason: f.reason ?? "Follow-up",
      interval: f.interval,
      dueDate: f.dueDate.toISOString(),
    })),
    recentRecords: records.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      recordDate: r.recordDate.toISOString(),
      mimeType: r.mimeType,
    })),
    timeline: timeline.map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      occurredAt: e.occurredAt.toISOString(),
      doctorName: e.doctor?.user.fullName ?? null,
    })),
  };
}

export type PatientDashboard = Awaited<ReturnType<typeof getPatientDashboard>>;
