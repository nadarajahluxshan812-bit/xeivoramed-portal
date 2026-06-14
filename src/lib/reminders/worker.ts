import { prisma } from "@/lib/prisma";
import { sendVia } from "@/lib/notifications";

const MAX_ATTEMPTS = 3;

/**
 * Process due reminders. Called by the cron route (/api/cron/reminders) on a schedule
 * (e.g. every minute via Vercel Cron or an external scheduler).
 *
 * - Picks SCHEDULED reminders whose sendAt has passed.
 * - Sends via the channel's provider.
 * - Records provider ref + delivery status, with bounded retries.
 */
export async function processDueReminders(batchSize = 100): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const now = new Date();
  const due = await prisma.reminder.findMany({
    where: { status: "SCHEDULED", sendAt: { lte: now } },
    orderBy: { sendAt: "asc" },
    take: batchSize,
    include: { patient: { include: { user: true } } },
  });

  let sent = 0;
  let failed = 0;

  for (const reminder of due) {
    const user = reminder.patient.user;
    const result = await sendVia(reminder.channel, {
      userId: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
    }, reminder.message);

    if (result.ok) {
      sent++;
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: "SENT",
          sentAt: now,
          providerRef: result.providerRef,
          attempts: { increment: 1 },
        },
      });
    } else {
      const attempts = reminder.attempts + 1;
      failed++;
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: attempts >= MAX_ATTEMPTS ? "FAILED" : "SCHEDULED",
          failureReason: result.error,
          attempts: { increment: 1 },
        },
      });
    }
  }

  return { processed: due.length, sent, failed };
}

/**
 * Detect missed dialysis sessions (scheduled, in the past, not completed) and alert.
 * Also called from the cron route.
 */
export async function flagMissedDialysis(): Promise<number> {
  const now = new Date();
  const missed = await prisma.dialysisSession.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lt: now } },
    include: { plan: { include: { patient: { include: { user: true } } } } },
  });

  for (const session of missed) {
    await prisma.dialysisSession.update({ where: { id: session.id }, data: { status: "MISSED" } });
    const user = session.plan.patient.user;
    await prisma.reminder.create({
      data: {
        patientId: session.plan.patientId,
        kind: "DIALYSIS",
        channel: "SMS",
        sendAt: now,
        message: `Missed dialysis alert: ${user.fullName}, you missed your session. Please contact your center to reschedule. — XeivoraMed`,
        dialysisSessionId: session.id,
      },
    });
  }
  return missed.length;
}
