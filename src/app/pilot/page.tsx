import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Request a pilot · XeivoraMed" };

/** Lightweight lead-capture for clinics & doctors. No new module/service — posts to /api/pilot. */
export default async function PilotPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Logo />
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </header>

      <div className="mx-auto max-w-xl px-5 py-8">
        {submitted ? (
          <div className="card text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Thank you!</h1>
            <p className="mt-2 text-slate-600">
              We&apos;ve received your pilot request. Our team will reach out within 2 working days to
              set up XeivoraMed for your clinic or practice.
            </p>
            <Link href="/" className="btn-primary mt-6 inline-flex">Back to home</Link>
          </div>
        ) : (
          <div className="card">
            <span className="badge bg-brand-50 text-brand-700">For clinics &amp; doctors</span>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Request a pilot</h1>
            <p className="mt-2 text-sm text-slate-600">
              Run XeivoraMed at your clinic. Tell us a bit about your practice and we&apos;ll help you
              onboard doctors, import patients and cut missed appointments.
            </p>

            <form action="/api/pilot" method="post" className="mt-6 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="contactName">Your name</label>
                  <input id="contactName" name="contactName" required className="input" placeholder="Dr. / Mr. / Ms." />
                </div>
                <div>
                  <label className="label" htmlFor="role">Your role</label>
                  <select id="role" name="role" className="input" defaultValue="DOCTOR">
                    <option value="DOCTOR">Doctor</option>
                    <option value="CLINIC_MANAGER">Clinic manager</option>
                    <option value="HOSPITAL_ADMIN">Hospital administrator</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="organisation">Clinic / hospital name</label>
                <input id="organisation" name="organisation" required className="input" placeholder="e.g. Asiri Medical Hospital" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="district">District</label>
                  <input id="district" name="district" className="input" placeholder="e.g. Colombo" />
                </div>
                <div>
                  <label className="label" htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" required className="input" placeholder="+9477XXXXXXX" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required className="input" placeholder="you@clinic.lk" />
              </div>
              <div>
                <label className="label" htmlFor="notes">What would you like to solve? (optional)</label>
                <textarea id="notes" name="notes" rows={3} className="input" placeholder="e.g. Too many missed dialysis sessions and follow-ups." />
              </div>
              <button type="submit" className="btn-primary w-full">Request a pilot</button>
              <p className="text-center text-xs text-slate-400">
                We&apos;ll only use your details to contact you about a XeivoraMed pilot.
              </p>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
