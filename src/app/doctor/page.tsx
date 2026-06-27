import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Video,
  Stethoscope,
  Check,
  Clock,
  Ambulance,
  Mic,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getDoctorBoard } from "@/lib/data/boards";
import { Card, SectionTitle, Badge, StatTile, statusTone } from "@/components/ui";
import { NoData } from "@/components/DemoBadge";
import { formatTime, relativeDay } from "@/lib/format";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export const metadata = { title: "Doctor · XeivoraMed" };

export default async function DoctorDashboard() {
  const [user, locale] = await Promise.all([requireRole(["DOCTOR", "ADMIN"]), getLocale()]);
  // Demo fixtures only in DEMO_MODE; otherwise live DB rows (empty → "No records yet").
  const data = await getDoctorBoard(user.doctorProfileId);

  const nav = [
    { href: "/doctor", label: t(locale, "dashboard"), icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/doctor", label: t(locale, "schedule"), icon: <CalendarDays className="h-5 w-5" /> },
    { href: "/doctor", label: t(locale, "patients"), icon: <Users className="h-5 w-5" /> },
  ];

  return (
    <AppShell nav={nav} userName={user.fullName} roleLabel={t(locale, "doctorRole")} locale={locale}>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-ink">Good morning, {user.fullName.split(" ").slice(-1)[0]}</h1>
          <div className="flex gap-2">
            <Link href="/doctor/scribe" className="btn-primary px-3 py-2 text-sm">
              <Mic className="h-4 w-4" /> AI Scribe
            </Link>
            <Link href="/emergency" className="btn-danger px-3 py-2 text-sm">
              <Ambulance className="h-4 w-4" /> Emergency access
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile label="Today" value={data.todayAppointments.length} sub="appointments" icon={<CalendarDays className="h-5 w-5" />} />
          <StatTile label="Checked in" value={data.todayAppointments.filter((a) => a.status === "CHECKED_IN").length} sub="waiting now" tone="amber" icon={<Clock className="h-5 w-5" />} />
          <StatTile label="Video consults" value={data.todayAppointments.filter((a) => a.type === "VIDEO").length} tone="brand" icon={<Video className="h-5 w-5" />} />
          <StatTile label="Patients" value={data.patients.length} sub="under care" tone="green" icon={<Users className="h-5 w-5" />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionTitle title="Today's appointments" icon={<CalendarDays className="h-5 w-5 text-brand-600" />} />
            {data.todayAppointments.length === 0 && <NoData message="No appointments today" />}
            <ul className="divide-y divide-slate-100">
              {data.todayAppointments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    {a.type === "VIDEO" ? <Video className="h-5 w-5" /> : <Stethoscope className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{a.patientName}</p>
                    <p className="truncate text-xs text-slate-500">{a.reason}</p>
                  </div>
                  <span className="text-sm font-medium text-slate-600">{formatTime(a.time)}</span>
                  <Badge tone={statusTone(a.status)}>{a.status.toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle title="Pending approvals & upcoming" icon={<Check className="h-5 w-5 text-brand-600" />} />
            {data.upcoming.length === 0 && <NoData message="No upcoming appointments" />}
            <ul className="divide-y divide-slate-100">
              {data.upcoming.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{a.patientName}</p>
                    <p className="truncate text-xs text-slate-500">{a.reason} · {relativeDay(a.time)}</p>
                  </div>
                  {a.status === "REQUESTED" ? (
                    <div className="flex gap-2">
                      <button className="btn-primary px-3 py-1.5 text-xs">Approve</button>
                      <button className="btn-secondary px-3 py-1.5 text-xs">Reschedule</button>
                    </div>
                  ) : (
                    <Badge tone={statusTone(a.status)}>{a.status.toLowerCase()}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card>
          <SectionTitle title="My patients" icon={<Users className="h-5 w-5 text-brand-600" />} />
          {data.patients.length === 0 && <NoData message="No patients yet" hint="Patients appear here after their first appointment with you." />}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="py-2">Patient</th><th>Age</th><th>Condition</th><th>Last visit</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.patients.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="text-slate-600">{p.age}</td>
                    <td><Badge tone="brand">{p.condition}</Badge></td>
                    <td className="text-slate-500">{relativeDay(p.lastVisit)}</td>
                    <td className="text-right"><button className="text-brand-700 hover:underline">View records</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
