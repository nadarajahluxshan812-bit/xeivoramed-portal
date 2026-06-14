import { NextResponse } from "next/server";
import { isConfigured, isDemoMode } from "@/lib/env";

/** Liveness/readiness probe + integration status (no secrets leaked). */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    demoMode: isDemoMode,
    integrations: {
      database: isConfigured.database,
      supabase: isConfigured.supabase,
      twilioSms: isConfigured.twilioSms,
      whatsapp: isConfigured.whatsapp,
      push: isConfigured.push,
      s3: isConfigured.s3,
    },
    time: new Date().toISOString(),
  });
}
