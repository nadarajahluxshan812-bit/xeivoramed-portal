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
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <LanguageSwitcher current={locale} variant="compact" />
        </div>
        <div className="card">
          <h1 className="text-xl font-bold text-slate-900">{t(locale, "welcome")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t(locale, "loginSub")}</p>

          {isDemoMode && (
            <>
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                Demo mode — Supabase isn’t configured, so you can explore each role without
                signing in. Set env vars to enable real auth.
              </div>

              {/* Headline demo: emergency access */}
              <Link
                href="/emergency-demo"
                className="mt-4 flex items-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-white transition hover:bg-red-700"
              >
                <ScanLine className="h-5 w-5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Try the Emergency Demo</p>
                  <p className="text-xs text-red-100">Scan → critical info in &lt; 3s → audited</p>
                </div>
              </Link>

              {/* Demo role-switch shortcuts */}
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t(locale, "exploreDemo")}
                </p>
                <DemoRoleButtons labels={demoLabels} />
              </div>

              <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> or sign in <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          )}

          <LoginForm />
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          New patient?{" "}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">
            {t(locale, "createAccount")}
          </Link>
        </p>
      </div>
    </main>
  );
}
