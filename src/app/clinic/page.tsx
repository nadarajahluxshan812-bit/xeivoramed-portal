import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  CalendarX,
  UserCheck,
  Clock,
  Stethoscope,
  Ambulance,
  Mic,
  Droplet,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getClinicBoard } from "@/lib/data/boards";
import { Card, SectionTitle, Badge, StatTile, statusTone } from "@/components/ui";
import { NoData } from "@/components/DemoBadge";
import { formatDateTime } from "@/lib/format";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export const metadata = { title: "Clinic · XeivoraMed" };

export default async function ClinicDashboard() {
  const [user, locale] = await Promise.all([requireRole(["CLINIC_STAFF", "ADMIN"]), getLocale()]);
  // Demo fixtures only in DEMO_MODE; otherwise live DB rows (empty → "No records yet").
  const data = await getClinicBoard(user.clinicId);

  const nav = [
    { href: "/clinic", label: t(locale, "dashboard"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/clinic", label: t(locale, "queue"), icon: <ListChecks className="h-5 w-5" /> },
    { href: "/clinic", label: t(locale, "patients"), icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel={t(locale, "clinicRole")} locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{data.name}</h1>
            <p className="text-sm text-slate-500">Verified patient records on lookup · today&rsquo;s operations</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/provider/scribe" className="btn-primary px-3 py-2 text-sm">
              <Mic className="h-4 w-4" /> AI Scribe
            </Link>
            <Link href="/clinic/blood" className="btn-secondary px-3 py-2 text-sm">
              <Droplet className="h-4 w-4" /> Blood emergency
            </Link>
            <Link href="/emergency" className="btn-secondary px-3 py-2 text-sm">
              <Ambulance className="h-4 w-4" /> Emergency access
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Appointments today" value={data.stats.today} icon={<LayoutDashboard className="h-5 w-5" />} />
          <StatTile label="Waiting now" value={data.stats.waiting} tone="amber" icon={<Clock className="h-5 w-5" />} />
          <StatTile label="Missed today" value={data.stats.missed} tone="red" icon={<CalendarX className="h-5 w-5" />} />
          <StatTile label="Doctors on duty" value={data.stats.doctorsOnDuty} tone="green" icon={<Stethoscope className="h-5 w-5" />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Live queue */}
          <Card className="lg:col-span-2">
            <SectionTitle
              title="Live appointment queue"
              icon={<ListChecks className="h-5 w-5 text-brand-600" />}
              action={<Badge tone="green">● Live</Badge>}
            />
            {data.queue.length === 0 && <NoData message="No patients in the queue" hint="Checked-in patients appear here in real time." />}
            <ul className="space-y-2">
              {data.queue.map((q) => (
                <li key={q.number} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                    #{q.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{q.patientName}</p>
                    <p className="truncate text-xs text-slate-500">{q.doctor} · waiting {q.waitMins}m</p>
                  </div>
                  <Badge tone={statusTone(q.status)}>{q.status.replace(/_/g, " ").toLowerCase()}</Badge>
                  <button className="btn-secondary px-3 py-1.5 text-xs">Call next</button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Check-in */}
          <Card>
            <SectionTitle title="Check-in" icon={<UserCheck className="h-5 w-5 text-brand-600" />} />
            <form className="space-y-3">
              <input className="input" placeholder="Search patient or appointment #" />
              <button className="btn-primary w-full">Check in patient</button>
            </form>
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Missed appointments</h3>
              {data.missed.length === 0 && <p className="text-sm text-slate-400">None today.</p>}
              <ul className="space-y-2">
                {data.missed.map((m, i) => (
                  <li key={i} className="rounded-lg bg-red-50 px-3 py-2 text-sm">
                    <p className="font-medium text-red-800">{m.patientName}</p>
                    <p className="text-xs text-red-500">{m.doctor} · {formatDateTime(m.time)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
