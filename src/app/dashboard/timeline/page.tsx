import { Activity, Stethoscope, FlaskConical, FileHeart, Syringe, Pill, Globe, Hospital } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getPatientDashboard } from "@/lib/data/patient";
import { getCrossProviderEvents } from "@/lib/global/data";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Health timeline · XeivoraMed" };

const icons: Record<string, React.ReactNode> = {
  VISIT: <Stethoscope className="h-4 w-4" />,
  ENCOUNTER: <Stethoscope className="h-4 w-4" />,
  LAB_TEST: <FlaskConical className="h-4 w-4" />,
  OBSERVATION: <FlaskConical className="h-4 w-4" />,
  DIAGNOSIS: <FileHeart className="h-4 w-4" />,
  CONDITION: <FileHeart className="h-4 w-4" />,
  TREATMENT: <Activity className="h-4 w-4" />,
  PROCEDURE: <Activity className="h-4 w-4" />,
  SURGERY: <Activity className="h-4 w-4" />,
  PRESCRIPTION: <Pill className="h-4 w-4" />,
  MEDICATION: <Pill className="h-4 w-4" />,
  VACCINATION: <Syringe className="h-4 w-4" />,
  IMMUNIZATION: <Syringe className="h-4 w-4" />,
};

/** Country code → flag emoji for international provenance. */
function flag(cc?: string): string {
  if (!cc || cc.length !== 2) return "🌐";
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}

type Item = {
  id: string;
  title: string;
  occurredAt: string;
  type: string;
  doctorName?: string | null;
  source?: string;
  originName?: string;
  originCountry?: string;
  international?: boolean;
};

export default async function TimelinePage() {
  const user = await requireUser();
  const pid = user.patientProfileId ?? "demo-patient-profile";
  const [data, cross] = await Promise.all([getPatientDashboard(pid), getCrossProviderEvents(pid)]);

  // Merge internal timeline + cross-provider/international standardized events.
  const items: Item[] = [
    ...data.timeline.map((e) => ({ id: e.id, title: e.title, occurredAt: e.occurredAt, type: e.type, doctorName: e.doctorName })),
    ...cross.map((e) => ({
      id: e.id,
      title: e.title,
      occurredAt: e.occurredAt,
      type: e.type,
      source: e.source,
      originName: e.originName,
      originCountry: e.originCountry,
      international: Boolean(e.originCountry && e.originCountry !== "LK"),
    })),
  ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const intlCount = items.filter((i) => i.international).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          <Activity className="h-6 w-6 text-brand-600" /> Lifelong health timeline
        </h1>
        <p className="text-sm text-slate-500">
          Your complete cross-provider history — local and international visits, tests, diagnoses,
          treatments, prescriptions and vaccinations.
        </p>
        <div className="mt-2 flex gap-2">
          <Badge tone="brand">{items.length} events</Badge>
          {intlCount > 0 && <Badge tone="green"><Globe className="mr-1 h-3 w-3" /> {intlCount} international</Badge>}
        </div>
      </div>

      <Card>
        <ol className="relative ml-3 space-y-6 border-l-2 border-slate-100 pl-7">
          {items.map((e) => (
            <li key={e.id} className="relative">
              <span className={`absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-sm ${e.international ? "bg-emerald-100 text-emerald-600" : "bg-brand-100 text-brand-600"}`}>
                {icons[e.type] ?? <Activity className="h-4 w-4" />}
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-semibold text-slate-900">{e.title}</p>
                <time className="text-xs text-slate-400">{formatDate(e.occurredAt)}</time>
              </div>
              <p className="text-xs uppercase tracking-wide text-brand-600">{e.type.replace(/_/g, " ").toLowerCase()}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                {e.doctorName && <span className="inline-flex items-center gap-1"><Hospital className="h-3.5 w-3.5" /> {e.doctorName}</span>}
                {e.originName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                    {flag(e.originCountry)} {e.originName}{e.source ? ` · ${e.source.replace(/_/g, " ")}` : ""}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
