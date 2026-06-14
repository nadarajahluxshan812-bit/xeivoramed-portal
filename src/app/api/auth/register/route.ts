import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { appOrigin } from "@/lib/http";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(8),
  language: z.enum(["EN", "SI", "TA"]).default("EN"),
});

/**
 * Patient self-registration. Creates the Supabase auth user + our domain User and
 * PatientProfile in one flow, with default notification preferences.
 */
export async function POST(request: Request) {
  const origin = appOrigin(request);
  const form = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(form));

  if (!parsed.success) {
    return NextResponse.redirect(`${origin}/register?error=invalid`, { status: 303 });
  }
  const { fullName, email, phone, password, language } = parsed.data;

  if (!env.supabaseUrl) {
    // Demo mode: nothing to persist; send them into the demo dashboard.
    return NextResponse.redirect(`${origin}/dashboard`, { status: 303 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    phone,
    options: { data: { full_name: fullName } },
  });

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/register?error=${encodeURIComponent(error?.message ?? "signup")}`, { status: 303 });
  }

  const user = await prisma.user.create({
    data: {
      supabaseId: data.user.id,
      email,
      phone,
      fullName,
      language,
      role: "PATIENT",
      patient: { create: {} },
      notificationPrefs: { create: {} },
    },
  });

  await audit({ actorId: user.id, actorRole: "PATIENT", action: "USER_REGISTER", entityType: "User", entityId: user.id });

  // New patients land in the guided setup journey, not the full dashboard.
  return NextResponse.redirect(`${origin}/dashboard/start`, { status: 303 });
}
