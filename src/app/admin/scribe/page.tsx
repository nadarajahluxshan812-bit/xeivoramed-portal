import { LayoutDashboard, Network, Megaphone, Users, History, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requirePermissionPage } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { getScribeUsage } from "@/lib/global/scribe-usage";
import { Card, SectionTitle, Badge, statusTone } from "@/components/ui";
import { DemoTag, NoData } from "@/components/DemoBadge";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Scribe Audit · Admin · XeivoraMed" };

/**
 * Admin AI Scribe AUDIT (read-only). Admins hold `scribe:audit` only — they can
 * review usage but cannot use / review / finalize notes.
 */
export default async function AdminScribeAuditPage() {
  const [user, locale, usage] = await Promise.all([
    requirePermissionPage("scribe:audit", "/admin/scribe"),
    getLocale(),
    getScribeUsage(),
  ]);

  const nav = [
    { href: "/admin", label: t(locale, "analytics"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/admin/providers", label: t(locale, "providerNetwork"), icon: <Network className="h-5 w-5" /> },
    { href: "/admin/scribe", label: t(locale, "scribe"), icon: <History className="h-5 w-5" /> },
    { href: "/admin", label: t(locale, "notifications"), icon: <Megaphone className="h-5 w-5" /> },
    { href: "/admin", label: t(locale, "users"), icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel={t(locale, "adminRole")} locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <History className="h-6 w-6 text-brand-600" /> AI Scribe — audit
            </h1>
            <p className="text-sm text-slate-500">Read-only oversight of scribe usage across the network.</p>
          </div>
          <Badge tone="amber"><Lock className="mr-1 h-3 w-3" /> Audit only — no edit/finalize</Badge>
        </div>

        <Card>
          <SectionTitle
            title="Scribe usage"
            icon={<History className="h-5 w-5 text-brand-600" />}
            action={usage.demo ? <DemoTag /> : <span className="text-xs text-slate-400">Live · from database</span>}
          />
          {usage.rows.length === 0 ? (
            <NoData message="No records yet" hint="Scribe activity appears here once clinicians create notes." />
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
