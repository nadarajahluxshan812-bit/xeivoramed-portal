import Link from "next/link";
import {
  CalendarDays,
  Pill,
  Droplets,
  CalendarClock,
  FileText,
  Activity,
  Video,
  Plus,
  ChevronRight,
  Heart,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPatientDashboard } from "@/lib/data/patient";
import { Card, SectionTitle, Badge, EmptyState, statusTone } from "@/components/ui";
import { formatDateTime, formatDate, relativeDay, formatTime } from "@/lib/format";
import { getLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

export const metadata = { title: "Dashboard · XeivoraMed" };

export default async function PatientDashboard() {
  const user = await requireUser();
  const data = await getPatientDashboard(user.patientProfileId ?? "demo-patient-profile");
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t(locale, "dbHello")} {data.patient.fullName.split(" ")[0]} 👋</h1>
          <p className="text-sm text-slate-500">
            {t(locale, "cBloodGroup")} {data.patient.bloodGroup} · {data.patient.district}
          </p>
        </div>
        <Link href="/dashboard/appointments" className="btn-primary">
          <Plus className="h-4 w-4" /> {t(locale, "bookAppointment")}
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickStat icon={<CalendarDays className="h-5 w-5" />} label={t(locale, "dbNextAppointment")} value={data.upcomingAppointments[0] ? relativeDay(data.upcomingAppointments[0].scheduledAt) : t(locale, "dbNone")} />
        <QuickStat icon={<Droplets className="h-5 w-5" />} label={t(locale, "dbNextDialysis")} value={data.dialysis?.nextSession ? relativeDay(data.dialysis.nextSession) : "—"} />
        <QuickStat icon={<Pill className="h-5 w-5" />} label={t(locale, "medications")} value={`${data.medications.length} ${t(locale, "dbActive")}`} />
        <QuickStat icon={<CalendarClock className="h-5 w-5" />} label={t(locale, "dbFollowUpsDue")} value={String(data.followUps.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming appointments */}
        <Card className="lg:col-span-2">
          <SectionTitle
            title={t(locale, "upcomingAppointments")}
            icon={<CalendarDays className="h-5 w-5 text-brand-600" />}
            action={<Link href="/dashboard/appointments" className="text-sm font-medium text-brand-700 hover:underline">{t(locale, "viewAll")}</Link>}
          />
          {data.upcomingAppointments.length === 0 ? (
            <EmptyState message={t(locale, "dbNoAppointments")} />
          ) : (
            <ul className="space-y-3">
              {data.upcomingAppointments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    {a.type === "VIDEO" ? <Video className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{a.doctorName} · {a.specialty}</p>
                    <p className="truncate text-sm text-slate-500">{a.reason || a.clinicName}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(a.scheduledAt)}</p>
                  </div>
                  <Badge tone={statusTone(a.status)}>{a.status.toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Medication reminders */}
        <Card>
          <SectionTitle title={t(locale, "medications")} icon={<Pill className="h-5 w-5 text-brand-600" />} />
          {data.medications.length === 0 ? (
            <EmptyState message={t(locale, "dbNoMeds")} />
          ) : (
            <ul className="space-y-3">
              {data.medications.map((m) => (
                <li key={m.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{m.drugName}</p>
                      <p className="text-xs text-slate-500">{m.dosage} · {m.times.join(", ")}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{m.adherencePct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${m.adherencePct >= 85 ? "bg-emerald-500" : m.adherencePct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${m.adherencePct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dialysis */}
        {data.dialysis && (
          <Card>
            <SectionTitle title={t(locale, "dbDialysisSchedule")} icon={<Droplets className="h-5 w-5 text-brand-600" />} />
            <p className="text-sm text-slate-500">{data.dialysis.centerName} · {data.dialysis.sessionsPerWeek}{t(locale, "dbPerWeek")}</p>
            <ul className="mt-3 space-y-2">
              {data.dialysis.upcoming.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-700">{formatDate(s.scheduledAt)} · {formatTime(s.scheduledAt)}</span>
                  <Badge tone={statusTone(s.status)}>{s.status.toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Follow-ups */}
        <Card>
          <SectionTitle title={t(locale, "dbFollowUps")} icon={<CalendarClock className="h-5 w-5 text-brand-600" />} />
          {data.followUps.length === 0 ? (
            <EmptyState message={t(locale, "dbNoFollowUps")} />
          ) : (
            <ul className="space-y-2">
              {data.followUps.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{f.reason}</p>
                    <p className="text-xs text-slate-400">{intervalLabel(f.interval, locale)}</p>
                  </div>
                  <span className="text-xs font-medium text-amber-700">{relativeDay(f.dueDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent reports */}
        <Card>
          <SectionTitle
            title={t(locale, "recentReports")}
            icon={<FileText className="h-5 w-5 text-brand-600" />}
            action={<Link href="/dashboard/records" className="text-sm font-medium text-brand-700 hover:underline">{t(locale, "dbAll")}</Link>}
          />
          <ul className="space-y-2">
            {data.recentRecords.map((r) => (
              <li key={r.id}>
                <Link href="/dashboard/records" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{r.title}</p>
                    <p className="text-xs text-slate-400">{categoryLabel(r.category)} · {formatDate(r.recordDate)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Health summary timeline preview */}
      <Card>
        <SectionTitle
          title={t(locale, "dbHealthTimeline")}
          icon={<Activity className="h-5 w-5 text-brand-600" />}
          action={<Link href="/dashboard/timeline" className="text-sm font-medium text-brand-700 hover:underline">{t(locale, "dbFullHistory")}</Link>}
        />
        <ol className="relative ml-3 space-y-4 border-l border-slate-200 pl-6">
          {data.timeline.slice(0, 4).map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-brand-100">
                <Heart className="h-3 w-3 text-brand-600" />
              </span>
              <p className="text-sm font-medium text-slate-800">{e.title}</p>
              <p className="text-xs text-slate-400">
                {formatDate(e.occurredAt)}{e.doctorName ? ` · ${e.doctorName}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{label}</p>
        <p className="truncate font-bold text-slate-900">{value}</p>
      </div>
    </Card>
  );
}

function intervalLabel(i: string, locale: Parameters<typeof t>[0]): string {
  const map: Record<string, Parameters<typeof t>[1]> = {
    ONE_MONTH: "dbInt1Month", THREE_MONTHS: "dbInt3Months", SIX_MONTHS: "dbInt6Months", ANNUAL: "dbIntAnnual", CUSTOM: "dbIntCustom",
  };
  return map[i] ? t(locale, map[i]) : i;
}
function categoryLabel(c: string): string {
  return c.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}
