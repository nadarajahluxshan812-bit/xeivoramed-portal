import type { ReactNode } from "react";

/** Tiny presentational design-system primitives shared across dashboards. */

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionTitle({
  title,
  action,
  icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}

type Tone = "brand" | "green" | "amber" | "red" | "slate";
const toneClasses: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`badge ${toneClasses[tone]}`}>{children}</span>;
}

export function StatTile({
  label,
  value,
  sub,
  tone = "brand",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
      {icon && (
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </span>
      )}
    </Card>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-slate-400">{message}</p>;
}

/** Status → badge tone mapper used across appointment lists. */
export function statusTone(status: string): Tone {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
    case "TAKEN":
    case "IN_ROOM":
      return "green";
    case "REQUESTED":
    case "WAITING":
    case "SCHEDULED":
    case "CALLED":
      return "amber";
    case "CANCELLED":
    case "NO_SHOW":
    case "MISSED":
    case "FAILED":
      return "red";
    default:
      return "brand";
  }
}
