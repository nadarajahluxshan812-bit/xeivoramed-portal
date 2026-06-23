import {
  LayoutDashboard,
  Users,
  Droplet,
  HeartHandshake,
  Clock,
  ShieldAlert,
  Hourglass,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requirePermissionPage } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { getHospitalBloodBoard } from "@/lib/blood/data";
import { getBloodNetworkAnalytics } from "@/lib/analytics";
import { Card, SectionTitle, StatTile } from "@/components/ui";
import { DemoTag, NoData } from "@/components/DemoBadge";
import { BloodEmergencyConsole } from "@/components/blood/BloodEmergencyConsole";

export const metadata = { title: "Blood Emergency · XeivoraMed" };

export default async function ClinicBloodPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>;
}) {
  const [user, locale, { need }] = await Promise.all([
    requirePermissionPage("blood:request", "/clinic/blood"),
    getLocale(),
    searchParams,
  ]);
  const hospitalId = user.clinicId ?? "demo-clinic";
  const [board, a] = await Promise.all([
    getHospitalBloodBoard(hospitalId),
    getBloodNetworkAnalytics(hospitalId),
  ]);

  const nav = [
    { href: "/clinic", label: t(locale, "dashboard"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/clinic/blood", label: t(locale, "bloodNetwork"), icon: <Droplet className="h-5 w-5" /> },
    { href: "/clinic", label: t(locale, "patients"), icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel="Hospital portal" locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
            <Droplet className="h-6 w-6 text-red-500" /> Emergency Blood Network
          </h1>
          <p className="text-sm text-slate-500">Locate compatible donors in seconds — create a request and the AI matching engine alerts the best matches first.</p>
        </div>

        {/* Live network status — only counts that actually exist (Part 9) */}
        <Card>
          <SectionTitle
            title="Network status"
            icon={<Droplet className="h-5 w-5 text-red-500" />}
            action={a.demo ? <DemoTag /> : <span className="text-xs text-slate-400">Live</span>}
          />
          {a.hasData ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile label="Active requests" value={a.activeRequests} icon={<Droplet className="h-5 w-5" />} tone="red" />
              <StatTile label="Pending responses" value={a.pendingResponses} icon={<Hourglass className="h-5 w-5" />} tone="amber" />
              <StatTile label="Accepted donors" value={a.acceptedDonors} tone="green" icon={<HeartHandshake className="h-5 w-5" />} />
              <StatTile label="Best ETA" value={a.bestEtaMinutes != null ? `${a.bestEtaMinutes} min` : "—"} icon={<Clock className="h-5 w-5" />} />
            </div>
          ) : (
            <NoData message="No usage data available yet." hint="Counts appear here once real blood requests are created." />
          )}
        </Card>

        <BloodEmergencyConsole initialRequest={board.request} initialMatches={board.matches} prefillNeed={need} />

        {/* Trust & safety (Part 10) */}
        <Card>
          <SectionTitle title="Trust & safety" icon={<ShieldAlert className="h-5 w-5 text-amber-500" />} />
          <p className="text-sm text-slate-600">
            XeivoraMed does not determine donor eligibility. Final donation decisions must be made by
            licensed healthcare professionals and blood-collection organizations. Donor private
            information is never exposed publicly, and is shown to a hospital only after the donor accepts.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
