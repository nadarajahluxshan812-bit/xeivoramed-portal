import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { isDemoMode } from "@/lib/env";

const run = promisify(execFile);

/**
 * POST /api/dev/reset — DEVELOPMENT ONLY.
 * Hard 403 in production. In demo mode (no DB) it's a no-op the client uses to
 * clear local demo state. When a database is configured it re-runs the seed
 * script to restore a known-good dataset.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }

  if (isDemoMode) {
    return NextResponse.json({
      ok: true,
      reseeded: false,
      note: "Demo mode — fixtures are static; local demo state cleared.",
    });
  }

  try {
    // Re-run the deterministic seed (it wipes + repopulates dev tables).
    await run("npm", ["run", "db:seed"], { cwd: process.cwd() });
    return NextResponse.json({ ok: true, reseeded: true });
  } catch (err) {
    return NextResponse.json({ ok: false, reseeded: false, error: (err as Error).message }, { status: 500 });
  }
}
