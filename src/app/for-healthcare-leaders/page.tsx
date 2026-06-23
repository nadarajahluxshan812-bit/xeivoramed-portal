import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  HeartPulse,
  Clock,
  Globe,
  ShieldCheck,
  HelpCircle,
  ScanLine,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { DisclaimerGrid } from "@/components/Disclaimers";
import { isDemoMode } from "@/lib/env";

export const metadata = {
  title: "For Healthcare Leaders · XeivoraMed",
  description:
    "We're validating a Verified Emergency Medical Passport. We'd value your perspective.",
};

const PROBLEM = [
  { icon: Clock, title: "Critical history is unreachable in an emergency", body: "When a patient can't speak — unconscious, abroad, or far from their usual hospital — clinicians act on incomplete information. Allergies, dialysis status and current medications are often unknown at exactly the wrong moment." },
  { icon: Globe, title: "Records don't cross borders or providers", body: "Health data is locked in silos and national systems. A Sri Lankan patient in Dubai, or a traveller anywhere, has no reliable way to share their critical record." },
  { icon: ShieldCheck, title: "Sharing usually means giving up control", body: "Existing approaches force a trade-off between access and privacy. Patients rarely know who saw their record, or can revoke it." },
];

const QUESTIONS = [
  "When a patient arrives unable to give a history, how do your teams obtain their allergies, medications and key conditions today — and how long does it take?",
  "What would have to be true for your clinicians to trust and act on an externally-sourced emergency summary?",
  "How do you currently verify that someone requesting patient data is a legitimate provider?",
  "What are the blockers — legal, technical, workflow — to accessing a visiting/foreign patient's record?",
  "If patients owned and could audit their record, would that make data-sharing easier or harder to approve in your organisation?",
];

export default async function HealthcareLeadersPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const { joined } = await searchParams;
  // Emergency demo exists only in DEMO_MODE; in live mode point leaders to login.
  const emergencyLink = isDemoMode ? "/emergency-demo" : "/login";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </header>

      <div className="mx-auto max-w-4xl space-y-10 px-5 py-8">
        {/* Intro */}
        <section>
          <span className="badge bg-amber-50 text-amber-700">Research / pilot · seeking design partners</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">For healthcare leaders</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            We&apos;re building a <strong>Verified Emergency Medical Passport</strong>: patients upload
            medical documents, we verify identity and extract emergency information, and a provider can
            access <strong>verified</strong> emergency data — with every field showing its source and
            trust level, and every access audited. We want to validate it with the people who&apos;d
            actually rely on it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={emergencyLink} className="btn-primary"><ScanLine className="h-4 w-4" /> See the 30-second demo</Link>
            <a href="#waitlist" className="btn-secondary">Join the discovery list</a>
          </div>
        </section>

        {/* Problem */}
        <section>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><HeartPulse className="h-5 w-5 text-brand-600" /> The problem we&apos;re testing</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {PROBLEM.map((p) => (
              <div key={p.title} className="card">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><p.icon className="h-5 w-5" /></span>
                <h3 className="mt-3 font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Discovery questions */}
        <section>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><HelpCircle className="h-5 w-5 text-brand-600" /> Five questions we&apos;d love your view on</h2>
          <ol className="mt-4 space-y-3">
            {QUESTIONS.map((q, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                <p className="text-sm text-slate-700">{q}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Honesty */}
        <section>
          <h2 className="text-xl font-bold text-slate-900">What this is — and isn&apos;t</h2>
          <div className="mt-4"><DisclaimerGrid /></div>
        </section>

        {/* Waitlist */}
        <section id="waitlist" className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          {joined ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h2 className="mt-4 text-2xl font-semibold text-ink">Thank you — you&apos;re on the list.</h2>
              <p className="mt-2 text-slate-600">We&apos;ll reach out to set up a short discovery conversation. No sales pitch.</p>
              <Link href="/" className="btn-secondary mt-6 inline-flex">Back to home</Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-ink">Join the discovery list</h2>
              <p className="mt-2 text-sm text-slate-600">For doctors, hospital CIOs, insurers and digital-health leaders. We&apos;ll only use your details to contact you about XeivoraMed.</p>
              <form action="/api/waitlist" method="post" className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="name">Name</label>
                  <input id="name" name="name" required className="input" placeholder="Dr. / Mr. / Ms." />
                </div>
                <div>
                  <label className="label" htmlFor="role">Role</label>
                  <select id="role" name="role" className="input" defaultValue="DOCTOR">
                    <option value="DOCTOR">Doctor / clinician</option>
                    <option value="HOSPITAL_CIO">Hospital CIO / CMIO</option>
                    <option value="INSURER">Insurer</option>
                    <option value="DIGITAL_HEALTH">Digital-health leader</option>
                    <option value="INVESTOR">Investor</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="organisation">Organisation</label>
                  <input id="organisation" name="organisation" className="input" placeholder="Hospital / company" />
                </div>
                <div>
                  <label className="label" htmlFor="country">Country</label>
                  <input id="country" name="country" className="input" placeholder="e.g. Sri Lanka" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" required className="input" placeholder="you@org.com" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="interest">What&apos;s your interest? (optional)</label>
                  <textarea id="interest" name="interest" rows={3} className="input" placeholder="e.g. We see many foreign patients in our ED and struggle to get their history." />
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className="btn-primary w-full sm:w-auto">Join the discovery list</button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
