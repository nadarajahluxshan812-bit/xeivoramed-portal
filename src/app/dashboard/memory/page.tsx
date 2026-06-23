import {
  BrainCircuit,
  AlertTriangle,
  Activity,
  Hospital,
  Pill,
  Scissors,
  Stethoscope,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMemoryView } from "@/lib/global/hlg-data";
import { getPreferredLocale } from "@/lib/i18n/locale";
import { renderConcept } from "@/lib/i18n/concepts";
import { Card, SectionTitle, Badge } from "@/components/ui";

export const metadata = { title: "Health Memory · XeivoraMed" };

const nodeColor: Record<string, string> = {
  CONDITION: "bg-red-50 text-red-700",
  MEDICATION: "bg-brand-50 text-brand-700",
  SURGERY: "bg-purple-50 text-purple-700",
  PROCEDURE: "bg-amber-50 text-amber-700",
  ALLERGY: "bg-orange-50 text-orange-700",
  ENCOUNTER: "bg-slate-100 text-slate-600",
  IMMUNIZATION: "bg-emerald-50 text-emerald-700",
  LAB: "bg-sky-50 text-sky-700",
};

export default async function MemoryPage() {
  const user = await requireUser();
  const [view, locale] = await Promise.all([
    getMemoryView(user.patientProfileId ?? "demo-patient-profile"),
    getPreferredLocale(),
  ]);
  if (!view) return <p className="p-6 text-slate-500">No memory available.</p>;

  const { briefing, risk, graph } = view;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink">
          <BrainCircuit className="h-6 w-6 text-brand-600" /> Health Memory
        </h1>
        <p className="text-sm text-slate-500">
          The patient&apos;s lifelong healthcare journey — understood, not just stored.
        </p>
      </div>

      {/* One-glance doctor briefing — "instead of 500 pages" */}
      <Card className="border-brand-200 bg-brand-50/40">
        <SectionTitle title="Patient summary — one glance" icon={<Stethoscope className="h-5 w-5 text-brand-600" />} action={<Badge tone="brand">AI · rules-v1</Badge>} />
        <p className="text-lg font-semibold text-slate-900">{briefing.headline}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Mini icon={<Activity className="h-4 w-4" />} label="Conditions" value={String(briefing.conditions.length)} />
          <Mini icon={<Hospital className="h-4 w-4" />} label="Admissions" value={String(briefing.admissions)} />
          <Mini icon={<Scissors className="h-4 w-4" />} label="Procedures" value={String(briefing.procedures)} />
          <Mini icon={<Pill className="h-4 w-4" />} label="Medications" value={String(briefing.currentMedications.length)} />
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
          {briefing.conditions.map((c) => (
            <li key={c} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {renderConcept(c, locale)}
              {locale !== "EN" && <span className="text-xs text-slate-400">({c})</span>}
            </li>
          ))}
          {briefing.lastDialysis && (
            <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Next dialysis scheduled</li>
          )}
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {briefing.allergies.length ? `Allergies: ${briefing.allergies.map((a) => renderConcept(a, locale)).join(", ")}` : "No known allergies"}
          </li>
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Risk Summary */}
        <Card>
          <SectionTitle title="AI risk summary" icon={<ShieldAlert className="h-5 w-5 text-danger-500" />} />
          <div className="space-y-2">
            {risk.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className={`text-sm ${line.startsWith("•") ? "flex gap-2 text-slate-700" : "font-medium text-slate-900"}`}>
                {line.startsWith("•") && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                {line.replace(/^•\s*/, "")}
              </p>
            ))}
          </div>
        </Card>

        {/* Current medications (translated) */}
        <Card>
          <SectionTitle title="Active regimen" icon={<Pill className="h-5 w-5 text-brand-600" />} />
          <ul className="space-y-2 text-sm">
            {briefing.currentMedications.map((m) => (
              <li key={m} className="rounded-lg bg-slate-50 px-3 py-2 font-medium text-slate-800">
                {renderConcept(m.split(" ")[0], locale)} {m.split(" ").slice(1).join(" ")}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Memory graph */}
      <Card>
        <SectionTitle title="Patient memory graph" icon={<BrainCircuit className="h-5 w-5 text-brand-600" />} action={<Badge tone="slate">{graph.nodes.length} nodes · {graph.edges.length} links</Badge>} />
        <div className="flex flex-wrap gap-2">
          {graph.nodes.map((n) => (
            <span key={n.id} className={`badge ${nodeColor[n.type] ?? "bg-slate-100 text-slate-600"}`} title={n.type}>
              {renderConcept(n.label, locale)}
            </span>
          ))}
        </div>
        <div className="mt-4 space-y-1.5 text-xs text-slate-500">
          {graph.edges.slice(0, 10).map((e, i) => {
            const from = graph.nodes.find((n) => n.id === e.from)?.label ?? "?";
            const to = graph.nodes.find((n) => n.id === e.to)?.label ?? "?";
            return (
              <p key={i} className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-brand-400" />
                <span className="font-medium text-slate-700">{from}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{e.type.replace(/_/g, " ").toLowerCase()}</span>
                <span className="font-medium text-slate-700">{to}</span>
                {e.note && <span className="text-slate-400">· {e.note}</span>}
              </p>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
