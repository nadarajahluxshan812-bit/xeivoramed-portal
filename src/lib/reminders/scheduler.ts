import { addDays, addMinutes } from "date-fns";
import type { FollowUpInterval, ReminderChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Reminder scheduling helpers. These create rows in the `Reminder` table with a
 * future `sendAt`; the cron worker (lib/reminders/worker.ts) does the actual delivery.
 * This separation makes reminders durable, auditable and retry-able.
 */

const INTERVAL_DAYS: Record<FollowUpInterval, number> = {
  ONE_MONTH: 30,
  THREE_MONTHS: 90,
  SIX_MONTHS: 180,
  ANNUAL: 365,
  CUSTOM: 0,
};

export function followUpDueDate(interval: FollowUpInterval, from = new Date()): Date {
  return addDays(from, INTERVAL_DAYS[interval] || 0);
}

/** Channels the patient has opted into, in priority order. */
async function channelsForPatient(userId: string): Promise<ReminderChannel[]> {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!prefs) return ["SMS"];
  const out: ReminderChannel[] = [];
  if (prefs.push) out.push("PUSH");
  if (prefs.whatsapp) out.push("WHATSAPP");
  if (prefs.sms) out.push("SMS");
  if (prefs.email) out.push("EMAIL");
  if (prefs.phoneCall) out.push("PHONE_CALL");
  return out.length ? out : ["SMS"];
}

/** Lead time (minutes before event) from the patient's prefs. Default 24h. */
async function leadTime(userId: string): Promise<number> {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  return prefs?.leadTimeMins ?? 1440;
}

type ScheduleArgs = {
  patientId: string;
  userId: string;
  kind: "APPOINTMENT" | "MEDICATION" | "DIALYSIS" | "FOLLOW_UP" | "TREATMENT" | "ANNUAL_CHECKUP";
  message: string;
  eventAt: Date;
  links?: {
    appointmentId?: string;
    medicationPlanId?: string;
    dialysisSessionId?: string;
    followUpId?: string;
  };
};

/**
 * Schedule reminders for an event across all opted-in channels.
 * Returns the number of reminder rows created.
 */
export async function scheduleReminders(args: ScheduleArgs): Promise<number> {
  const [channels, lead] = await Promise.all([
    channelsForPatient(args.userId),
    leadTime(args.userId),
  ]);
  const sendAt = addMinutes(args.eventAt, -lead);

  // Don't schedule reminders in the past.
  const effectiveSendAt = sendAt < new Date() ? new Date() : sendAt;

  const created = await prisma.reminder.createMany({
    data: channels.map((channel) => ({
      patientId: args.patientId,
      kind: args.kind,
      channel,
      sendAt: effectiveSendAt,
      message: args.message,
      ...args.links,
    })),
  });
  return created.count;
}

/** Cancel pending reminders attached to an entity (e.g. when an appointment is cancelled). */
export async function cancelRemindersFor(where: {
  appointmentId?: string;
  followUpId?: string;
  dialysisSessionId?: string;
  medicationPlanId?: string;
}): Promise<number> {
  const res = await prisma.reminder.updateMany({
    where: { ...where, status: "SCHEDULED" },
    data: { status: "CANCELLED" },
  });
  return res.count;
}
