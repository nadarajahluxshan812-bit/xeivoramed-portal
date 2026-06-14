import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processDueReminders, flagMissedDialysis } from "@/lib/reminders/worker";

/**
 * GET/POST /api/cron/reminders
 * Invoked on a schedule (Vercel Cron, GitHub Actions, or any external scheduler).
 * Protected by a bearer secret so it can't be triggered publicly.
 *
 * Vercel Cron example (vercel.json):
 *   { "crons": [{ "path": "/api/cron/reminders", "schedule": "* * * * *" }] }
 */
async function handle(request: Request) {
  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const tokenOk =
    auth === `Bearer ${env.cronSecret}` || url.searchParams.get("secret") === env.cronSecret;

  if (env.cronSecret && !tokenOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [reminders, missedDialysis] = await Promise.all([
    processDueReminders(),
    flagMissedDialysis(),
  ]);

  return NextResponse.json({ ok: true, reminders, missedDialysis, ranAt: new Date().toISOString() });
}

export const GET = handle;
export const POST = handle;
export const dynamic = "force-dynamic";
