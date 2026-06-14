import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { appOrigin } from "@/lib/http";

export async function POST(request: Request) {
  const origin = appOrigin(request);
  if (env.supabaseUrl) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}
