import { ShieldCheck, FileCheck2, Pencil } from "lucide-react";

/**
 * Verification trust levels for passport data. Doctors must see, at a glance,
 * how trustworthy each field is — data is never displayed equally.
 *   VERIFIED          → confirmed at the source (hospital / lab / doctor)
 *   DOCUMENT_VERIFIED → extracted from an uploaded medical report
 *   SELF_REPORTED     → entered by the patient
 */
export type TrustLevel = "VERIFIED" | "DOCUMENT_VERIFIED" | "SELF_REPORTED";

const STYLES: Record<TrustLevel, { label: string; cls: string; icon: typeof ShieldCheck }> = {
  VERIFIED: { label: "Verified", cls: "bg-verifiedsoft text-verified", icon: ShieldCheck },
  DOCUMENT_VERIFIED: { label: "Document Verified", cls: "bg-brand-50 text-brand-700", icon: FileCheck2 },
  SELF_REPORTED: { label: "Self Reported", cls: "bg-selfsoft text-selfr", icon: Pencil },
};

export function TrustBadge({ level }: { level: TrustLevel }) {
  const s = STYLES[level];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}

/** A single verified passport fact: value + trust badge + source + date. */
export function VerifiedItem({
  label,
  value,
  level,
  source,
  dateVerified,
  danger,
}: {
  label: string;
  value: string;
  level: TrustLevel;
  source: string;
  dateVerified?: string | null;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className={`font-semibold ${danger ? "text-danger-600" : "text-slate-900"}`}>{value}</p>
        </div>
        <TrustBadge level={level} />
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">
        Source: {source}{dateVerified ? ` · Verified ${dateVerified}` : ""}
      </p>
    </div>
  );
}
