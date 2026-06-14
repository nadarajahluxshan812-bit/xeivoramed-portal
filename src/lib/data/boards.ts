import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { demoDoctor, demoClinic } from "@/lib/demo";

/**
 * Live read models for the doctor and clinic operational boards.
 * Demo fixtures only when DEMO_MODE is on; otherwise real Prisma queries with
 * genuinely-empty lists when no data exists (UI renders "No records yet").
 * Shapes mirror the demo fixtures so the pages render identically.
 */

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getDoctorBoard(doctorProfileId?: string) {
  if (isDemoMode) return { demo: true as const, ...demoDoctor };
  if (!doctorProfileId) return { demo: false as const, todayAppointments: [], upcoming: [], patients: [] };

  const [today, upcoming, recentPatients] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId: doctorProfileId, scheduledAt: { gte: startOfToday(), lte: endOfToday() } },
      orderBy: { scheduledAt: "asc" },
      include: { patient: { include: { user: true } } },
    }),
    prisma.appointment.findMany({
      where: { doctorId: doctorProfileId, scheduledAt: { gt: endOfToday() }, status: { in: ["REQUESTED", "CONFIRMED"] } },
      orderBy: { scheduledAt: "asc" },
      take: 10,
      include: { patient: { include: { user: true } } },
    }),
    prisma.appointment.findMany({
      where: { doctorId: doctorProfileId },
      orderBy: { scheduledAt: "desc" },
      take: 50,
      include: { patient: { include: { user: true } } },
    }),
  ]);

  const mapAppt = (a: (typeof today)[number]) => ({
    id: a.id,
    patientName: a.patient.user.fullName,
    time: a.scheduledAt.toISOString(),
    reason: a.reason ?? "",
    status: a.status,
    type: a.type,
  });

  // Distinct patients from recent appointments.
  const seen = new Set<string>();
  const patients = recentPatients
    .filter((a) => (seen.has(a.patientId) ? false : (seen.add(a.patientId), true)))
    .slice(0, 10)
    .map((a) => ({
      id: a.patientId,
      name: a.patient.user.fullName,
      age: a.patient.dateOfBirth ? Math.floor((Date.now() - a.patient.dateOfBirth.getTime()) / 3.15576e10) : 0,
      condition: a.patient.chronicConditions[0] ?? "—",
      lastVisit: a.scheduledAt.toISOString(),
    }));

  return { demo: false as const, todayAppointments: today.map(mapAppt), upcoming: upcoming.map(mapAppt), patients };
}

export async function getClinicBoard(clinicId?: string) {
  if (isDemoMode) return { demo: true as const, ...demoClinic };
  if (!clinicId) {
    return {
      demo: false as const,
      name: "Your clinic",
      stats: { today: 0, waiting: 0, missed: 0, doctorsOnDuty: 0 },
      queue: [],
      missed: [],
    };
  }

  const [clinic, todayCount, queueEntries, missedToday, doctorsOnDuty] = await Promise.all([
    prisma.clinic.findUnique({ where: { id: clinicId } }),
    prisma.appointment.count({ where: { clinicId, scheduledAt: { gte: startOfToday(), lte: endOfToday() } } }),
    prisma.queueEntry.findMany({
      where: { clinicId, status: { in: ["WAITING", "CALLED", "IN_ROOM"] } },
      orderBy: { number: "asc" },
      include: { appointment: { include: { patient: { include: { user: true } }, doctor: { include: { user: true } } } } },
    }),
    prisma.appointment.findMany({
      where: { clinicId, status: "NO_SHOW", scheduledAt: { gte: startOfToday() } },
      orderBy: { scheduledAt: "desc" },
      take: 10,
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    }),
    prisma.doctorProfile.count({ where: { clinicId } }),
  ]);

  return {
    demo: false as const,
    name: clinic?.name ?? "Your clinic",
    stats: {
      today: todayCount,
      waiting: queueEntries.filter((q) => q.status === "WAITING").length,
      missed: missedToday.length,
      doctorsOnDuty,
    },
    queue: queueEntries.map((q) => ({
      number: q.number,
      patientName: q.appointment.patient.user.fullName,
      doctor: q.appointment.doctor?.user.fullName ?? "Unassigned",
      status: q.status as "WAITING" | "CALLED" | "IN_ROOM",
      waitMins: Math.max(0, Math.round((Date.now() - q.checkedInAt.getTime()) / 60000)),
    })),
    missed: missedToday.map((a) => ({
      patientName: a.patient.user.fullName,
      time: a.scheduledAt.toISOString(),
      doctor: a.doctor?.user.fullName ?? "Unassigned",
    })),
  };
}
