import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { isDemoMode } from "@/lib/env";
import { scheduleReminders } from "@/lib/reminders/scheduler";
import { renderReminder } from "@/lib/reminders/templates";
import { formatDateTime } from "@/lib/format";

const createSchema = z.object({
  doctorId: z.string().optional(),
  clinicId: z.string().optional(),
  specialty: z.string().optional(),
  type: z.enum(["IN_PERSON", "VIDEO", "CHAT", "HOME_VISIT"]).default("IN_PERSON"),
  scheduledAt: z.string().min(1),
  reason: z.string().optional(),
});

/** GET /api/appointments — list the current patient's appointments. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isDemoMode) return NextResponse.json({ appointments: [], demo: true });

  const appointments = await prisma.appointment.findMany({
    where: { patientId: user.patientProfileId },
    orderBy: { scheduledAt: "desc" },
    include: { doctor: { include: { user: true } }, clinic: true },
  });
  return NextResponse.json({ appointments });
}

/**
 * POST /api/appointments — book an appointment (status REQUESTED) and schedule
 * cross-channel reminders. Accepts JSON or form-encoded bodies.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !user.patientProfileId) {
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login`, { status: 303 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const raw = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries(await request.formData());
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const origin = new URL(request.url).origin;

  if (isDemoMode) {
    // No DB — acknowledge and bounce back to the appointments page.
    return NextResponse.redirect(`${origin}/dashboard/appointments?booked=demo`, { status: 303 });
  }

  const scheduledAt = new Date(input.scheduledAt);
  const appointment = await prisma.appointment.create({
    data: {
      patientId: user.patientProfileId,
      doctorId: input.doctorId,
      clinicId: input.clinicId,
      type: input.type,
      status: "REQUESTED",
      scheduledAt,
      reason: input.reason,
    },
  });

  // Schedule reminders in the patient's language.
  const message = renderReminder("APPOINTMENT", user.language, {
    name: user.fullName.split(" ")[0],
    when: formatDateTime(scheduledAt.toISOString()),
    detail: input.specialty ?? input.reason ?? "",
  });
  await scheduleReminders({
    patientId: user.patientProfileId,
    userId: user.id,
    kind: "APPOINTMENT",
    message,
    eventAt: scheduledAt,
    links: { appointmentId: appointment.id },
  });

  await audit({
    actorId: user.id,
    actorRole: user.role,
    action: "APPOINTMENT_CREATE",
    entityType: "Appointment",
    entityId: appointment.id,
    subjectPatientId: user.patientProfileId,
  });

  if (contentType.includes("application/json")) {
    return NextResponse.json({ appointment }, { status: 201 });
  }
  return NextResponse.redirect(`${origin}/dashboard/appointments?booked=1`, { status: 303 });
}
