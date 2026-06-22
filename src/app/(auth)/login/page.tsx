import Link from "next/link";
import { ScanLine } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";
import { DemoRoleButtons } from "./DemoRoleButtons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { isDemoMode } from "@/lib/env";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export const metadata = { title: "Log in · XeivoraMed" };

export default async function LoginPage() {
  const locale = await getLocale();

  const demoLabels = {
    PATIENT: t(locale, "continuePatient"),
    DOCTOR: t(locale, "continueDoctor"),
    CLINIC_STAFF: t(locale, "continueClinic"),
    ADMIN: t(locale, "continueAdmin"),
  };

  return (
    <main className="min-h-screen bg-[#F6F7FB] md:grid md:grid-cols-[44fr_56fr]">
      {/* LEFT — deep-navy brand panel (desktop only) */}
      <aside className="relative hidden overflow-hidden bg-navy text-white md:flex md:flex-col md:justify-between md:p-12">
        {/* Subtle depth — soft brand glows, no flashy gradients */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-700/40 blur-3xl" />
        </div>

        <div className="relative">
          <Logo light />
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 ring-1 ring-white/15">
            {isDemoMode ? t(locale, "lpBadgeDemo") : t(locale, "lpBadge")}
          </span>
          <p className="mt-6 font-serif text-3xl font-medium leading-[1.2] text-white lg:text-[2.5rem]">
            {t(locale, "lpHeroTitle1")} {t(locale, "lpHeroTitle2")}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-blue-100/80">
            {t(locale, "lpHeroBody")}
          </p>

          {/* Coral ECG pulse line */}
          <svg
            viewBox="0 0 480 60"
            className="mt-8 h-12 w-full max-w-sm"
            fill="none"
            aria-hidden
          >
            <path
              d="M0 30 H118 L138 30 L150 11 L166 49 L180 30 L198 30 L212 6 L228 54 L242 30 H480"
              stroke="#FF6B5E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} XeivoraMed · Pilot
        </p>
      </aside>

      {/* RIGHT — clean form panel */}
      <div className="flex min-h-screen flex-col px-5 py-8 sm:px-8 md:min-h-0 md:justify-center md:px-14 md:py-12">
        {/* Mobile: compact brand header (the navy panel collapses to this) */}
        <div className="mb-8 flex items-center justify-between md:hidden">
          <Logo />
          <LanguageSwitcher current={locale} variant="compact" />
        </div>
        {/* Desktop: language switcher top-right */}
        <div className="mb-8 hidden justify-end md:flex">
          <LanguageSwitcher current={locale} variant="compact" />
        </div>

        <div className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">{t(locale, "welcome")}</h1>
          <p className="mt-1.5 text-[15px] text-slatebody">{t(locale, "loginSub")}</p>

          {isDemoMode && (
            <>
              <div className="mt-5 rounded-xl border border-amber-200/70 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                Demo mode — Supabase isn’t configured, so you can explore each role without
                signing in. Set env vars to enable real auth.
              </div>

              {/* Headline demo: emergency access */}
              <Link
                href="/emergency-demo"
                className="mt-4 flex items-center gap-3 rounded-xl bg-coral-600 px-4 py-3 text-white shadow-soft transition hover:-translate-y-px hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-600 focus-visible:ring-offset-2"
              >
                <ScanLine className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Try the Emergency Demo</p>
                  <p className="text-xs text-white/80">Scan → critical info in &lt; 3s → audited</p>
                </div>
              </Link>

              {/* Demo role-switch shortcuts */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t(locale, "exploreDemo")}
                </p>
                <DemoRoleButtons labels={demoLabels} />
              </div>

              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-line" /> or sign in <span className="h-px flex-1 bg-line" />
              </div>
            </>
          )}

          <LoginForm />

          <p className="mt-6 text-center text-sm text-slatebody">
            New patient?{" "}
            <Link href="/register" className="font-semibold text-brand-700 hover:underline">
              {t(locale, "createAccount")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
