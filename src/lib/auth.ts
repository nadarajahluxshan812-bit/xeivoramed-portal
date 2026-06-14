import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { createSupabaseServerClient } from "./supabase/server";
import { isDemoMode } from "./env";
import { demoUsers } from "./demo";
import { can, type Permission } from "./rbac";

/** Demo session role is held in a cookie so the role-switch buttons drive a
 *  consistent session across both pages AND API routes in demo mode. */
export const DEMO_ROLE_COOKIE = "demo_role";

async function demoSessionUser(): Promise<SessionUser> {
  const store = await cookies();
  const role = store.get(DEMO_ROLE_COOKIE)?.value;
  switch (role) {
    case "DOCTOR":
      return demoUsers.doctor;
    case "CLINIC_STAFF":
      return demoUsers.staff;
    case "ADMIN":
      return demoUsers.admin;
    default:
      return demoUsers.patient;
  }
}

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string;
  role: Role;
  language: "EN" | "SI" | "TA";
  patientProfileId?: string;
  doctorProfileId?: string;
  clinicId?: string;
};

/**
 * Resolve the current app user from the Supabase session, joining to our `User` table.
 * In demo mode (no DB/Supabase configured) returns a fixed demo patient so the UI renders.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (isDemoMode) {
    return demoSessionUser();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: { patient: true, doctor: true, staff: true },
  });
  if (!dbUser || !dbUser.isActive) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    role: dbUser.role,
    language: dbUser.language,
    patientProfileId: dbUser.patient?.id,
    doctorProfileId: dbUser.doctor?.id,
    clinicId: dbUser.doctor?.clinicId ?? dbUser.staff?.clinicId ?? undefined,
  };
}

/** Require a logged-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Require a specific role (or one of several). */
export async function requireRole(roles: Role | Role[]): Promise<SessionUser> {
  const allowed = Array.isArray(roles) ? roles : [roles];

  // In demo mode, honor the demo-role cookie if it already matches; otherwise
  // return the demo user for the first allowed role so every dashboard stays
  // explorable without real auth.
  if (isDemoMode) {
    const current = await demoSessionUser();
    if (allowed.includes(current.role)) return current;
    const map: Record<Role, SessionUser> = {
      PATIENT: demoUsers.patient,
      DOCTOR: demoUsers.doctor,
      CLINIC_STAFF: demoUsers.staff,
      ADMIN: demoUsers.admin,
    };
    return map[allowed[0]];
  }

  const user = await requireUser();
  if (!allowed.includes(user.role)) redirect("/login?error=forbidden");
  return user;
}

/**
 * Page-friendly capability guard. Resolves the REAL session role (the demo-role
 * cookie in demo mode — no auto-elevation), and redirects to /login?error=forbidden
 * if the capability is missing. Used to enforce e.g. scribe:use so patients/public
 * (and admins who only have scribe:audit) are blocked from the scribe console.
 */
export async function requirePermissionPage(permission: Permission, next?: string): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    redirect(`/login?error=forbidden${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }
  return user;
}

/** Require a capability. Throws (for API routes) when missing. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    throw new Response("Forbidden", { status: 403 }) as unknown as Error;
  }
  return user;
}
