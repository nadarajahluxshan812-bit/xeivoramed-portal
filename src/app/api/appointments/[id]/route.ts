import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { cancelRemindersFor, scheduleReminders } from "@/lib/reminders/scheduler";
import { renderReminder } from "@/lib/reminders/templates";
import { formatDateTime } from "@/lib/format";

const patchSchema = z.object({
  action: z.enum(["reschedule", "cancel", "approve", "checkin", "complete", "no_show"]),
  scheduledAt: z.string().optional(),
  reason: z.string().optional(),
});

/** PATCH /api/appointments/:id — reschedule / cancel / approve / check-in / complete. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isDemoMode) return NextResponse.json({ ok: true, demo: true });

  const body = patchSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const { action, scheduledAt, reason } = body.data;

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: { include: { user: true } } },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Authorization: patients act on their own; staff/doctors need the capability.
  const isOwner = appt.patientId === user.patientProfileId;
  const staffAction = ["approve", "checkin", "complete", "no_show"].includes(action);
  if (staffAction && !can(user.role, "appointment:approve")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!staffAction && !isOwner && !can(user.role, "appointment:read:any")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  switch (action) {
    case "cancel": {
      await prisma.appointment.update({
        where: { id },
        data: { status: "CANCELLED", cancelledReason: reason },
      });
      await cancelRemindersFor({ appointmentId: id });
      break;
    }
    case "reschedule": {
      if (!scheduledAt) return NextResponse.json({ error: "scheduledAt required" }, { status: 400 });
      const newAt = new Date(scheduledAt);
      await cancelRemindersFor({ appointmentId: id });
      const newAppt = await prisma.appointment.create({
        data: {
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          clinicId: appt.clinicId,
          type: appt.type,
          status: "CONFIRMED",
          scheduledAt: newAt,
          reason: appt.reason,
          rescheduledFromId: appt.id,
        },
      });
      await prisma.appointment.update({ where: { id }, data: { status: "RESCHEDULED" } });
      const msg = renderReminder("APPOINTMENT", appt.patient.user.language, {
        name: appt.patient.user.fullName.split(" ")[0],
        when: formatDateTime(newAt.toISOString()),
        detail: appt.reason ?? "",
      });
      await scheduleReminders({
        patientId: appt.patientId,
        userId: appt.patient.userId,
        kind: "APPOINTMENT",
        message: msg,
        eventAt: newAt,
        links: { appointmentId: newAppt.id },
      });
      break;
    }
    case "approve":
      await prisma.appointment.update({ where: { id }, data: { status: "CONFIRMED" } });
      break;
    case "checkin":
      await prisma.appointment.update({ where: { id }, data: { status: "CHECKED_IN", checkedInAt: new Date() } });
      break;
    case "complete":
      await prisma.appointment.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date() } });
      break;
    case "no_show":
      await prisma.appointment.update({ where: { id }, data: { status: "NO_SHOW" } });
      break;
  }

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: `APPOINTMENT_${action.toUpperCase()}`,
    entityType: "Appointment",
    entityId: id,
    subjectPatientId: appt.patientId,
  });

  return NextResponse.json({ ok: true });
}
