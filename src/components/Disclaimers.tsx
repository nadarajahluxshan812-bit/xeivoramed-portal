import { FlaskConical, ShieldCheck, Stethoscope, UserCheck } from "lucide-react";

/**
 * Trust + legal disclaimers shown across the product. Intentionally honest:
 * this is a pilot/research platform, not a certified medical or compliance tool.
 */
export const DISCLAIMERS = [
  { icon: FlaskConical, text: "Research / pilot platform — not for production clinical use yet." },
  { icon: Stethoscope, text: "Not a medical diagnosis tool. Information supports clinicians; it does not replace them." },
  { icon: UserCheck, text: "Emergency access requires verified provider authorization and is fully logged." },
  { icon: ShieldCheck, text: "Patient-owned data with consent controls — patients approve, revoke and audit access." },
];

/** Full disclaimer grid (landing / validation pages). */
export function DisclaimerGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DISCLAIMERS.map((d) => (
        <div key={d.text} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <d.icon className="h-4 w-4" />
          </span>
          <p className="text-sm text-slate-600">{d.text}</p>
        </div>
      ))}
    </div>
  );
}

/** Compact one-line legal strip for footers / emergency views. */
export function LegalStrip({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-slate-400 ${className}`}>
      Research / pilot platform · Not a medical diagnosis tool · Emergency access requires verified
      provider authorization · Patient-owned data &amp; consent controls. XeivoraMed makes no
      claim of regulatory certification (HIPAA/GDPR) at this stage.
    </p>
  );
}
