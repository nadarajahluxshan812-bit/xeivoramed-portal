import { Users, Baby, UserCog, Heart, Plane, IdCard, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getFamily, getIdentityDocs, getTravelProfile } from "@/lib/global/hlg-data";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Family Care · XeivoraMed" };

const relIcon: Record<string, React.ReactNode> = {
  CHILD: <Baby className="h-5 w-5" />,
  ELDER: <UserCog className="h-5 w-5" />,
  PARENT: <UserCog className="h-5 w-5" />,
  SPOUSE: <Heart className="h-5 w-5" />,
  DEPENDENT: <Users className="h-5 w-5" />,
  GUARDIAN: <ShieldCheck className="h-5 w-5" />,
};

function age(dob?: string | null) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / 3.15576e10);
}

export default async function FamilyPage() {
  const user = await requireUser();
  const pid = user.patientProfileId ?? "demo-patient-profile";
  const [family, ids, travel] = await Promise.all([getFamily(pid), getIdentityDocs(pid), getTravelProfile(pid)]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Users className="h-6 w-6 text-brand-600" /> Family Care & Identity
        </h1>
        <p className="text-sm text-slate-500">Manage dependents, identity documents and travel health — one profile for the whole family.</p>
      </div>

      {/* Family members */}
      <Card>
        <SectionTitle title="Dependents & care profiles" icon={<Users className="h-5 w-5 text-brand-600" />} action={<button className="btn-secondary px-3 py-1.5 text-xs">Add member</button>} />
        <ul className="grid gap-3 sm:grid-cols-2">
          {family.map((m) => (
            <li key={m.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{relIcon[m.relationship] ?? <Users className="h-5 w-5" />}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{m.name}</p>
                <p className="text-xs text-slate-500">{m.relationship.toLowerCase()}{age(m.dateOfBirth) != null ? ` · ${age(m.dateOfBirth)}y` : ""}</p>
                {m.notes && <p className="mt-1 text-xs text-slate-600">{m.notes}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Identity documents */}
        <Card>
          <SectionTitle title="Identity documents" icon={<IdCard className="h-5 w-5 text-brand-600" />} />
          <ul className="space-y-2">
            {ids.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{d.type.replace(/_/g, " ").toLowerCase()} · {d.country}</p>
                  <p className="font-mono text-xs text-slate-400">{d.number}</p>
                </div>
                {d.verified ? <Badge tone="green">verified</Badge> : <Badge tone="amber">unverified</Badge>}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-400">Numbers are encrypted at rest; only masked values are shown.</p>
        </Card>

        {/* Travel health profile */}
        {travel && (
          <Card>
            <SectionTitle title="Emergency travel profile" icon={<Plane className="h-5 w-5 text-brand-600" />} />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Blood group</dt><dd className="font-medium">{travel.bloodGroup}</dd></div>
              <div><dt className="text-slate-500">Conditions</dt><dd className="mt-1 flex flex-wrap gap-1">{travel.conditions.map((c) => <Badge key={c} tone="red">{c}</Badge>)}</dd></div>
              <div><dt className="text-slate-500">Vaccinations</dt><dd className="mt-1 flex flex-wrap gap-1">{travel.vaccinations.map((v) => <Badge key={v} tone="green">{v}</Badge>)}</dd></div>
              <div><dt className="text-slate-500">Destinations</dt><dd className="mt-1 text-slate-700">{travel.destinations.join(", ")}</dd></div>
              {travel.emergencyNotes && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{travel.emergencyNotes}</p>}
            </dl>
          </Card>
        )}
      </div>
    </div>
  );
}
