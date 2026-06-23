import { ShieldCheck, Building2, FlaskConical, Pill, Ambulance, Hospital, History, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAccessCenter } from "@/lib/global/data";
import { Card, SectionTitle, Badge, statusTone } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { ConsentControls } from "@/components/global/ConsentControls";

export const metadata = { title: "Access Center · XeivoraMed" };

const typeIcon: Record<string, React.ReactNode> = {
  HOSPITAL: <Hospital className="h-5 w-5" />,
  CLINIC: <Building2 className="h-5 w-5" />,
  LABORATORY: <FlaskConical className="h-5 w-5" />,
  PHARMACY: <Pill className="h-5 w-5" />,
  EMERGENCY_CENTER: <Ambulance className="h-5 w-5" />,
};

export default async function AccessCenterPage() {
  const user = await requireUser();
  const { grants, emergencyLog } = await getAccessCenter(user.patientProfileId ?? "demo-patient-profile");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          <ShieldCheck className="h-6 w-6 text-brand-600" /> Access Center
        </h1>
        <p className="text-sm text-slate-500">You own your records. Approve, revoke and audit who can see them.</p>
      </div>

      {/* Provider access grants */}
      <Card>
        <SectionTitle title="Providers with access" icon={<Lock className="h-5 w-5 text-brand-600" />} />
        <ul className="divide-y divide-slate-100">
          {grants.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {typeIcon[g.provider.type] ?? <Building2 className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{g.provider.name}</p>
                <p className="text-xs text-slate-500">
                  {g.provider.city ? `${g.provider.city}, ` : ""}{g.provider.country} · {g.provider.type.replace(/_/g, " ").toLowerCase()} · scope: {g.scope.replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
              <Badge tone={statusTone(g.status)}>{g.status.toLowerCase()}</Badge>
              <ConsentControls grantId={g.id} status={g.status} />
            </li>
          ))}
        </ul>
      </Card>

      {/* Immutable emergency access audit */}
      <Card>
        <SectionTitle
          title="Emergency access audit"
          icon={<History className="h-5 w-5 text-brand-600" />}
          action={<Badge tone="green">tamper-evident</Badge>}
        />
        {emergencyLog.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">No emergency access has occurred.</p>
        ) : (
          <ol className="relative ml-3 space-y-4 border-l-2 border-slate-100 pl-6">
            {emergencyLog.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-red-100">
                  <Ambulance className="h-3 w-3 text-red-600" />
                </span>
                <p className="text-sm font-medium text-slate-800">{e.actorName} · {e.provider}</p>
                <p className="text-xs text-slate-500">
                  {e.reason.replace(/_/g, " ").toLowerCase()} · {e.location ?? "location n/a"} · {formatDateTime(e.createdAt)}
                </p>
                {e.verificationMethod && (
                  <p className="mt-0.5 text-[11px] font-medium text-brand-600">verified via {e.verificationMethod.replace(/_/g, " ").toLowerCase()}</p>
                )}
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">hash {e.hash} ← {e.prevHash}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
