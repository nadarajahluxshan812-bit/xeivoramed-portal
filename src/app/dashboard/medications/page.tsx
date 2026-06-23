import { Pill, Droplets, Check, X, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPatientDashboard } from "@/lib/data/patient";
import { Card, SectionTitle, Badge, statusTone } from "@/components/ui";
import { formatDate, formatTime } from "@/lib/format";

export const metadata = { title: "Medications & treatments · XeivoraMed" };

export default async function MedicationsPage() {
  const user = await requireUser();
  const data = await getPatientDashboard(user.patientProfileId ?? "demo-patient-profile");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Medications & treatments</h1>
        <button className="btn-primary"><Plus className="h-4 w-4" /> Add medication</button>
      </div>

      {/* Today's doses */}
      <Card>
        <SectionTitle title="Today's doses" icon={<Pill className="h-5 w-5 text-brand-600" />} />
        <ul className="space-y-3">
          {data.medications.map((m) =>
            m.times.map((time) => (
              <li key={`${m.id}-${time}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Pill className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{m.drugName} {m.dosage}</p>
                  <p className="text-xs text-slate-500">Scheduled {time}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600" aria-label="Mark taken"><Check className="h-4 w-4" /></button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500" aria-label="Mark skipped"><X className="h-4 w-4" /></button>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>

      {/* Adherence */}
      <Card>
        <SectionTitle title="Adherence tracking" icon={<Pill className="h-5 w-5 text-brand-600" />} />
        <div className="space-y-4">
          {data.medications.map((m) => (
            <div key={m.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{m.drugName} {m.dosage}</span>
                <span className="font-semibold text-slate-600">{m.adherencePct}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${m.adherencePct >= 85 ? "bg-emerald-500" : m.adherencePct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${m.adherencePct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Dialysis */}
      {data.dialysis && (
        <Card>
          <SectionTitle title="Dialysis treatment schedule" icon={<Droplets className="h-5 w-5 text-brand-600" />} />
          <p className="text-sm text-slate-500">{data.dialysis.centerName} · {data.dialysis.sessionsPerWeek} sessions/week</p>
          <ul className="mt-3 space-y-2">
            {data.dialysis.upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                <span className="font-medium text-slate-700">{formatDate(s.scheduledAt)} · {formatTime(s.scheduledAt)}</span>
                <Badge tone={statusTone(s.status)}>{s.status.toLowerCase()}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-400">Missed sessions trigger an automatic SMS alert to you and your center.</p>
        </Card>
      )}
    </div>
  );
}
