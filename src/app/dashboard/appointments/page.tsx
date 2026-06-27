import { CalendarDays, Video, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPatientDashboard } from "@/lib/data/patient";
import { Card, SectionTitle, Badge, statusTone } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Appointments · XeivoraMed" };

export default async function AppointmentsPage() {
  const user = await requireUser();
  const data = await getPatientDashboard(user.patientProfileId ?? "demo-patient-profile");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">Appointments</h1>
        <button className="btn-primary"><Plus className="h-4 w-4" /> Book new</button>
      </div>

      {/* Booking widget (static demo — POSTs to /api/appointments in production) */}
      <Card>
        <SectionTitle title="Book an appointment" icon={<CalendarDays className="h-5 w-5 text-brand-600" />} />
        <form action="/api/appointments" method="post" className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Specialty</label>
            <select name="specialty" className="input" defaultValue="">
              <option value="" disabled>Choose…</option>
              <option>Nephrology</option>
              <option>Cardiology</option>
              <option>General Medicine</option>
              <option>Endocrinology</option>
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="IN_PERSON">
              <option value="IN_PERSON">In person</option>
              <option value="VIDEO">Video consultation</option>
            </select>
          </div>
          <div>
            <label className="label">Preferred date & time</label>
            <input name="scheduledAt" type="datetime-local" className="input" />
          </div>
          <div>
            <label className="label">Reason</label>
            <input name="reason" className="input" placeholder="e.g. Kidney function review" />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary w-full sm:w-auto">Request appointment</button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionTitle title="Upcoming" icon={<CalendarDays className="h-5 w-5 text-brand-600" />} />
        <ul className="divide-y divide-slate-100">
          {data.upcomingAppointments.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {a.type === "VIDEO" ? <Video className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{a.doctorName} · {a.specialty}</p>
                <p className="text-sm text-slate-500">{a.clinicName} · {formatDateTime(a.scheduledAt)}</p>
              </div>
              <Badge tone={statusTone(a.status)}>{a.status.toLowerCase()}</Badge>
              <div className="flex gap-2">
                <button className="btn-secondary px-3 py-1.5 text-xs">Reschedule</button>
                <button className="btn-danger px-3 py-1.5 text-xs">Cancel</button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
