import { Droplet, HeartHandshake, ShieldAlert, MapPin, CalendarClock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMyDonorView } from "@/lib/blood/data";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { DonorAlertCard } from "@/components/blood/DonorAlertCard";

export const metadata = { title: "Blood Donor · XeivoraMed" };

export default async function DonorPage() {
  const user = await requireUser();
  const { profile, alerts } = await getMyDonorView(user.patientProfileId ?? "demo-patient-profile");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          <HeartHandshake className="h-6 w-6 text-red-500" /> Blood Donor
        </h1>
        <p className="text-sm text-slate-500">Opt in to help patients in an emergency — you stay in control and can opt out anytime.</p>
      </div>

      {/* Incoming alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Emergency requests near you</h2>
          {alerts.map((a) => <DonorAlertCard key={a.matchId} alert={a} />)}
        </div>
      )}

      {/* Donor profile */}
      <Card>
        <SectionTitle title="Your donor profile" icon={<Droplet className="h-5 w-5 text-red-500" />} action={profile?.verified ? <Badge tone="green">verified</Badge> : <Badge tone="amber">unverified</Badge>} />
        <form action="/api/blood/donor" method="post" className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Blood group</label>
            <select name="bloodGroup" className="input" defaultValue={profile?.bloodGroup ?? "O"}>
              {["O", "A", "B", "AB"].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Rhesus factor</label>
            <select name="rhesusFactor" className="input" defaultValue={profile?.rhesusFactor ?? "POSITIVE"}>
              <option value="POSITIVE">Positive (+)</option>
              <option value="NEGATIVE">Negative (−)</option>
            </select>
          </div>
          <div>
            <label className="label">City</label>
            <input name="city" className="input" defaultValue={profile?.city ?? "Colombo"} />
          </div>
          <div>
            <label className="label">Willing to travel (km)</label>
            <input name="searchRadius" type="number" className="input" defaultValue={profile?.searchRadius ?? 25} />
          </div>
          <div>
            <label className="label">Availability</label>
            <select name="availabilityStatus" className="input" defaultValue={profile?.availabilityStatus ?? "AVAILABLE"}>
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
              <option value="TEMPORARILY_INELIGIBLE">Temporarily ineligible</option>
            </select>
          </div>
          <div>
            <label className="label">Emergency contact (private)</label>
            <input name="emergencyContact" type="tel" className="input" placeholder="+9477XXXXXXX" />
          </div>
          <div className="sm:col-span-2">
            <button className="btn-primary">Save donor profile</button>
          </div>
        </form>

        {profile && (
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {profile.city} · {profile.searchRadius} km</span>
            <span className="inline-flex items-center gap-1.5"><Droplet className="h-4 w-4 text-red-400" /> {profile.bloodGroup}{profile.rhesusFactor === "POSITIVE" ? "+" : "−"}</span>
            {profile.lastDonationDate && <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> last donated {formatDate(profile.lastDonationDate)}</span>}
            <Badge tone={profile.eligibilityStatus === "ELIGIBLE" ? "green" : "amber"}>{profile.eligibilityStatus.replace(/_/g, " ").toLowerCase()}</Badge>
          </div>
        )}
      </Card>

      {/* Family network (Part 8) */}
      <Card>
        <SectionTitle title="Family alerts" icon={<HeartHandshake className="h-5 w-5 text-brand-600" />} />
        <p className="text-sm text-slate-500">Let family members optionally receive blood request alerts, your donor status updates, and emergency notifications.</p>
        <ul className="mt-3 space-y-2">
          {[
            { name: "Kumari Perera", relation: "Wife", on: true },
            { name: "Sanduni Perera", relation: "Daughter", on: false },
          ].map((f) => (
            <li key={f.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span><span className="font-medium text-slate-800">{f.name}</span> <span className="text-xs text-slate-400">({f.relation})</span></span>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-500">
                <input type="checkbox" defaultChecked={f.on} className="h-4 w-4 accent-brand-600" /> Alerts
              </label>
            </li>
          ))}
        </ul>
      </Card>

      {/* Trust & safety */}
      <div className="flex items-start gap-2 rounded-xl bg-slate-100 p-4 text-xs text-slate-500">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          XeivoraMed does not determine donor eligibility. Final donation decisions must be made by
          licensed healthcare professionals and blood-collection organizations. Your name and contact
          are shared with a hospital only after you accept a request.
        </p>
      </div>
    </div>
  );
}
