import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { homeForRole } from "@/lib/rbac";
import { appOrigin } from "@/lib/http";

/**
 * OAuth / magic-link callback. Exchanges the code for a session, then ensures a
 * matching row exists in our `User` table (just-in-time provisioning for Google sign-ups).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = appOrigin(request);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const u = data.user;
      let dbUser = await prisma.user.findUnique({ where: { supabaseId: u.id } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            supabaseId: u.id,
            email: u.email ?? null,
            phone: u.phone ?? null,
            fullName: (u.user_metadata?.full_name as string) ?? u.email ?? "New patient",
            role: "PATIENT",
            patient: { create: {} },
            notificationPrefs: { create: {} },
          },
        });
      }
      await prisma.user.update({ where: { id: dbUser.id }, data: { lastLoginAt: new Date() } });
      return NextResponse.redirect(`${origin}${homeForRole(dbUser.role)}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
