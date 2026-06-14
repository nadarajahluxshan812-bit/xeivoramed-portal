import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Edge middleware: refreshes the Supabase auth session on every request and guards
 * authenticated areas. When Supabase isn't configured (demo mode) it no-ops so the
 * demo dashboards stay reachable.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/doctor", "/clinic", "/admin"];

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Demo mode — skip auth entirely. Mirrors lib/env.isDemoMode: explicit
  // DEMO_MODE wins; otherwise demo when DB or Supabase isn't configured. This
  // ensures protected routes stay reachable in demo even once Supabase keys are
  // present but the database (live mode) isn't wired up yet.
  const demoFlag = (process.env.DEMO_MODE ?? "").trim().toLowerCase();
  const isDemo =
    demoFlag === "true"
      ? true
      : demoFlag === "false"
        ? false
        : !process.env.DATABASE_URL || !supabaseUrl;
  if (isDemo || !supabaseUrl || !supabaseKey) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|.*\\.png$).*)"],
};
