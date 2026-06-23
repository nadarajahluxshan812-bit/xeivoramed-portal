import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Mic,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requirePermissionPage } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { isDemoMode } from "@/lib/env";
import { demoScribeSession } from "@/lib/global/demo";
import { ScribeConsole } from "@/components/global/ScribeConsole";

export const metadata = { title: "AI Scribe · XeivoraMed" };

export default async function ScribePage() {
  // AI Scribe is clinician-only (scribe:use). Patients, public and audit-only admins are blocked.
  const [user, locale] = await Promise.all([requirePermissionPage("scribe:use", "/doctor/scribe"), getLocale()]);

  const nav = [
    { href: "/doctor", label: t(locale, "dashboard"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/doctor/scribe", label: t(locale, "scribe"), icon: <Mic className="h-5 w-5" /> },
    { href: "/doctor", label: t(locale, "schedule"), icon: <CalendarDays className="h-5 w-5" /> },
    { href: "/doctor", label: t(locale, "patients"), icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel={t(locale, "doctorRole")} locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
            <Mic className="h-6 w-6 text-brand-600" /> AI Specialist Scribe
          </h1>
          <p className="text-sm text-slate-500">
            Speak naturally during the consult — XeivoraMed drafts specialty notes, diagnoses,
            referrals and discharge summaries for your review.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>AI-generated documentation must be reviewed and approved by a licensed healthcare professional before it becomes part of the medical record.</p>
        </div>

        <ScribeConsole doctorName={user.fullName} demoTranscript={isDemoMode ? demoScribeSession.transcript : ""} />
      </div>
    </AppShell>
  );
}
