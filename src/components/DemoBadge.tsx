import { FlaskConical } from "lucide-react";
import { isDemoMode } from "@/lib/env";

/**
 * Honesty primitives. XeivoraMed clearly separates Demo / User / Provider /
 * Production data. In demo mode every screen is labelled so no number is ever
 * mistaken for real usage.
 */

/** Global pill rendered in the app shell when running on seeded demo data. */
export function DemoModeBadge({ className = "" }: { className?: string }) {
  if (!isDemoMode) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ${className}`}
      title="This environment runs on seeded demo data. No real users, hospitals or activity."
    >
      <FlaskConical className="h-3.5 w-3.5" /> Demo Data
    </span>
  );
}

/** Small inline tag for individual demo-sourced figures/cards. */
export function DemoTag({ className = "" }: { className?: string }) {
  if (!isDemoMode) return null;
  return (
    <span className={`rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ${className}`}>
      Demo Data
    </span>
  );
}

/** Empty state for production screens with no real records yet. */
export function NoData({ message = "No records yet", hint }: { message?: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
