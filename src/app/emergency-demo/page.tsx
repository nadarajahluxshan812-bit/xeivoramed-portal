import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Plane, AlertTriangle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LegalStrip } from "@/components/Disclaimers";
import { EmergencyVerifyFlow } from "@/components/global/EmergencyVerifyFlow";
import { isDemoMode } from "@/lib/env";
import { demoGlobalId } from "@/lib/global/demo";

export const metadata = {
  title: "Emergency Demo · XeivoraMed",
  description: "A patient is unconscious abroad. Watch a verified provider gain emergency access to critical medical information in seconds.",
};

/**
 * Public guided demo entry: Landing → (here) Provider verification → Passport → Audit.
 * Available only in DEMO_MODE — live mode has no sample patient to demonstrate on.
 */
export default function EmergencyDemoPage() {
  if (!isDemoMode) redirect("/");
  const passportLink = `/passport/${demoGlobalId.globalId}?t=${demoGlobalId.emergencyToken}&demo=1`;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-6">
        {/* Scenario */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white">
          <span className="badge bg-white/10 text-white"><Plane className="mr-1 h-3 w-3" /> The scenario</span>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">A patient collapses, unconscious, abroad.</h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            No wallet, no records, no way to give a history. A foreign emergency team needs to know:
            blood group, allergies, current medications, conditions. With XeivoraMed, a verified provider
            gets it in seconds — and the patient can see exactly who looked.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
            <AlertTriangle className="h-4 w-4" /> Sample patient: <strong>Nimal Perera</strong> · allergic to penicillin &amp; contrast dye · on dialysis.
          </div>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Verification flow */}
          <EmergencyVerifyFlow passportLink={passportLink} />

          {/* Steps overview */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">The 4 steps</h2>
            <ol className="mt-3 space-y-3 text-sm">
              <Step n={1} title="Provider verification" body="QR, Health ID, or a biometric demo (face / fingerprint)." active />
              <Step n={2} title="Reason + break-glass" body="A clinical reason is required and recorded." />
              <Step n={3} title="Emergency Passport opens" body="Critical info in under 3 seconds." />
              <Step n={4} title="Patient audits access" body="Who, when, why and which method — immutable." />
            </ol>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <LegalStrip />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Step({ n, title, body, active }: { n: number; title: string; body: string; active?: boolean }) {
  return (
    <li className="flex gap-3">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"}`}>{n}</span>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{body}</p>
      </div>
    </li>
  );
}
