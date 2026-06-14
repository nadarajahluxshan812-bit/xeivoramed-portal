/**
 * Standalone reminder runner for non-Vercel deployments (cron/systemd/k8s CronJob).
 * Usage:  npm run cron:reminders
 */
import { processDueReminders, flagMissedDialysis } from "../src/lib/reminders/worker";

(async () => {
  const reminders = await processDueReminders();
  const missed = await flagMissedDialysis();
  console.log(`[reminders] ${JSON.stringify(reminders)} missedDialysis=${missed}`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
