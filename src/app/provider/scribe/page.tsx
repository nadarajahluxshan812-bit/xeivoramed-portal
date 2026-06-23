import {
  Mic,
  Search,
  History,
  ShieldAlert,
  Building2,
  LayoutDashboard,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requirePermissionPage } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { isDemoMode } from "@/lib/env";
import { demoScribeSession } from "@/lib/global/demo";
import { getScribeUsage } from "@/lib/global/scribe-usage";
import { Card, SectionTitle, Badge, statusTone } from "@/components/ui";
import { DemoTag, NoData } from "@/components/DemoBadge";
import { formatDateTime } from "@/lib/format";
import { ScribeConsole } from "@/components/global/ScribeConsole";

export const metadata = { title: "AI Scribe · Provider Portal · XeivoraMed" };

/**
 * Provider / Hospital Portal — AI Scribe.
 * Gated to `scribe:use` (doctors + provider/hospital staff). Patients, public and
 * audit-only admins are blocked. Includes patient lookup, the ambient scribe
 * console (draft → review → finalize) and scribe usage logs.
 */
export default async function ProviderScribePage() {
  const [user, locale, usage] = await Promise.all([
    requirePermissionPage("scribe:use", "/provider/scribe"),
    getLocale(),
    getScribeUsage(),
  ]);

  const nav = [
    { href: "/clinic", label: t(locale, "dashboard"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/provider/scribe", label: t(locale, "scribe"), icon: <Mic className="h-5 w-5" /> },
    { href: "/clinic", label: t(locale, "patients"), icon: <Building2 className="h-5 w-5" /> },
  ];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel="Provider portal" locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
            <Mic className="h-6 w-6 text-brand-600" /> AI Specialist Scribe
          </h1>
          <p className="text-sm text-slate-500">Provider / hospital documentation — draft, review and finalize specialty notes.</p>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>AI-generated documentation must be reviewed and approved by a licensed healthcare professional before it becomes part of the medical record.</p>
        </div>

        {/* Patient lookup */}
        <Card>
          <SectionTitle title="Patient lookup" icon={<Search className="h-5 w-5 text-brand-600" />} />
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate-400"
              placeholder="Search by XeivoraMed ID, name or national ID…"
              defaultValue={isDemoMode ? "Nimal Perera · HLX-LK-7F3A-9KQ2" : ""}
            />
          </div>
        </Card>

        <ScribeConsole doctorName={user.fullName} demoTranscript={isDemoMode ? demoScribeSession.transcript : ""} />

        {/* Usage logs */}
        <Card>
          <SectionTitle
            title="Scribe usage logs"
            icon={<History className="h-5 w-5 text-brand-600" />}
            action={usage.demo ? <DemoTag /> : <span className="text-xs text-slate-400">Live · from database</span>}
          />
          {usage.rows.length === 0 ? (
            <NoData message="No records yet" hint="Notes you draft and finalize will be listed here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr><th className="py-2">Clinician</th><th>Patient</th><th>Specialty</th><th>Note</th><th>Status</th><th>When</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usage.rows.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 font-medium text-slate-900">{u.doctorName}</td>
                      <td className="text-slate-600">{u.patientName}</td>
                      <td className="text-slate-600">{u.specialty.replace(/_/g, " ").toLowerCase()}</td>
                      <td className="text-slate-600">{u.noteType.replace(/_/g, " ").toLowerCase()}</td>
                      <td><Badge tone={statusTone(u.status === "FINALIZED" ? "COMPLETED" : u.status === "UNDER_REVIEW" ? "REQUESTED" : "SCHEDULED")}>{u.status.replace(/_/g, " ").toLowerCase()}</Badge></td>
                      <td className="text-slate-500">{formatDateTime(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
