import Link from "next/link";
import {
  ScanLine,
  ShieldCheck,
  FileLock2,
  Droplet,
  AlertTriangle,
  Pill,
  ArrowRight,
  History,
  Activity,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DisclaimerGrid, LegalStrip } from "@/components/Disclaimers";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { isDemoMode } from "@/lib/env";
import { demoGlobalId } from "@/lib/global/demo";

export const metadata = {
  title: "XeivoraMed — Verified patient data for clinics & labs",
  description:
    "XeivoraMed is a trusted-data layer that links a patient's government-verified identity to verified records from certified labs and clinics — so the right information reaches the right provider, with consent, in seconds.",
};

const STEPS = [
  { icon: ShieldCheck, titleKey: "lpStep1Title", bodyKey: "lpStep1Body" },
  { icon: FileLock2, titleKey: "lpStep2Title", bodyKey: "lpStep2Body" },
  { icon: History, titleKey: "lpStep3Title", bodyKey: "lpStep3Body" },
] as const;

export default async function LandingPage() {
  const locale = await getLocale();
  const emergencyLink = `/passport/${demoGlobalId.globalId}?t=${demoGlobalId.emergencyToken}&demo=1`;
  const demoLink = "/emergency-demo";

  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4 sm:gap-3 sm:px-5">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher current={locale} variant="compact" />
          <Link href="/for-healthcare-leaders" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline">
            {t(locale, "navLeaders")}
          </Link>
          <Link href="/login" className="btn-secondary hidden sm:inline-flex">{t(locale, "login")}</Link>
          {isDemoMode ? (
            <Link href={demoLink} className="btn-primary whitespace-nowrap px-3 sm:px-4">
              <span className="sm:hidden">{t(locale, "navDemoShort")}</span>
              <span className="hidden sm:inline">{t(locale, "navTryDemo")}</span>
            </Link>
          ) : (
            <Link href="/register" className="btn-primary whitespace-nowrap px-3 sm:px-4">
              {t(locale, "navCreatePassport")}
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-10 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="badge bg-amber-50 text-amber-700">
              {isDemoMode ? t(locale, "lpBadgeDemo") : t(locale, "lpBadge")}
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
              {t(locale, "lpHeroTitle1")} <span className="text-brand-600">{t(locale, "lpHeroTitle2")}</span>
            </h1>
            <p className="mt-3 text-lg font-semibold text-brand-700">
              {t(locale, "lpHeroLead")}
            </p>
            <p className="mt-3 max-w-md text-lg text-slate-600">
              {t(locale, "lpHeroBody")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className="btn-primary text-base">
                <FileLock2 className="h-5 w-5" /> {t(locale, "lpHeroCtaPrimary")}
              </Link>
              <Link href="#how" className="btn-secondary text-base">
                <ScanLine className="h-5 w-5" /> {t(locale, "lpSeeHow")}
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-brand-600" /> {t(locale, "lpTrustChips")}</span>
              <span className="inline-flex items-center gap-1.5"><History className="h-4 w-4 text-brand-600" /> {t(locale, "lpAuditChip")}</span>
            </div>
          </div>

          {/* Verified patient record preview */}
          <div className="rounded-3xl border border-slate-200/70 bg-white shadow-card">
            <div className="rounded-t-3xl bg-brand-600 px-5 py-2 text-center text-xs font-semibold tracking-wide text-white">
              {t(locale, "lpCardHeader")}
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">{t(locale, "lpCardIdLabel")}</p>
                  <p className="text-lg font-bold text-slate-900">Nimal Perera · 58y</p>
                  <p className="text-xs text-slate-500 font-mono">{demoGlobalId.globalId}</p>
                </div>
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-red-50">
                  <Droplet className="h-5 w-5 text-red-500" />
                  <span className="font-bold text-red-600">O+</span>
                </div>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-red-700"><AlertTriangle className="h-4 w-4" /> {t(locale, "lpCardAllergies")}</p>
                <p className="mt-1 text-sm font-semibold text-red-700">Penicillin · Contrast dye (iodine)</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500"><Pill className="h-4 w-4" /> {t(locale, "lpCardMeds")}</p>
                <p className="mt-1 text-sm text-slate-700">Amlodipine 5mg · Erythropoietin · Calcium carbonate</p>
              </div>
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500"><Activity className="h-4 w-4" /> {t(locale, "lpCardLabs")}</p>
                <p className="mt-1 text-sm text-slate-700">eGFR 14 · Hb 9.8 · K⁺ 5.1 <span className="text-slate-400">· verified · 12 Jun</span></p>
              </div>
              {isDemoMode ? (
                <Link href={emergencyLink} className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                  {t(locale, "lpCardOpenLive")} <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="text-center text-xs text-slate-400">{t(locale, "lpCardIllustration")}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-2xl font-bold text-slate-900">{t(locale, "lpHowTitle")}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            {t(locale, "lpHowBody")}
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.titleKey} className="card relative">
                <span className="absolute right-4 top-4 text-3xl font-bold text-slate-100">{i + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <s.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{t(locale, s.titleKey)}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{t(locale, s.bodyKey)}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/dashboard/access" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
              {t(locale, "lpSeeAudit")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust levels — the core differentiator */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-bold text-slate-900">{t(locale, "lpTrustTitle")}</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          {t(locale, "lpTrustBody")}
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <Pillar icon={ShieldCheck} title={t(locale, "lpPillarVerifiedTitle")} body={t(locale, "lpPillarVerifiedBody")} />
          <Pillar icon={FileLock2} title={t(locale, "lpPillarDocTitle")} body={t(locale, "lpPillarDocBody")} />
          <Pillar icon={AlertTriangle} title={t(locale, "lpPillarSelfTitle")} body={t(locale, "lpPillarSelfBody")} />
        </div>

        {/* Future roadmap — listed, not marketed */}
        <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-700">{t(locale, "lpRoadmapLabel")}</p>
          <ol className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <li>{t(locale, "lpRoadmap1")} <span className="text-emerald-600">{t(locale, "lpRoadmapNow")}</span></li>
            <li>{t(locale, "lpRoadmap2")}</li>
            <li>{t(locale, "lpRoadmap3")}</li>
            <li>{t(locale, "lpRoadmap4")}</li>
            <li>{t(locale, "lpRoadmap5")}</li>
          </ol>
        </div>
      </section>

      {/* Trust / disclaimers */}
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-xl font-bold text-slate-900">{t(locale, "lpWhatTitle")}</h2>
          <p className="mt-2 max-w-2xl text-slate-600">{t(locale, "lpWhatBody")}</p>
          <div className="mt-6"><DisclaimerGrid /></div>
        </div>
      </section>

      {/* Healthcare leaders CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="overflow-hidden rounded-3xl bg-brand-700 px-6 py-10 text-white sm:px-10">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <span className="badge bg-white/15 text-white">{t(locale, "lpLeadersBadge")}</span>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{t(locale, "lpLeadersTitle")}</h2>
              <p className="mt-3 max-w-xl text-brand-50">
                {t(locale, "lpLeadersBody")}
              </p>
            </div>
            <Link href="/for-healthcare-leaders" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold text-brand-700 transition hover:bg-brand-50">
              {t(locale, "lpLeadersCta")} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col gap-4 border-t border-slate-200 pt-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <Logo />
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <Link href="/for-healthcare-leaders" className="hover:text-slate-900">{t(locale, "navLeaders")}</Link>
              <Link href="/login" className="hover:text-slate-900">{t(locale, "login")}</Link>
              {isDemoMode && <Link href={emergencyLink} className="hover:text-slate-900">{t(locale, "navTryDemo")}</Link>}
            </div>
          </div>
          <LegalStrip />
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} XeivoraMed · {t(locale, "lpFooterTagline")}</p>
        </div>
      </footer>
    </main>
  );
}

function Pillar({ icon: Icon, title, body }: { icon: typeof ShieldCheck; title: string; body: string }) {
  return (
    <div className="card">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600">{body}</p>
    </div>
  );
}
