import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Create account · XeivoraMed" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="card">
          <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">For patients. Clinics & doctors are onboarded by an administrator.</p>

          <form action="/api/auth/register" method="post" className="mt-5 space-y-3">
            <div>
              <label className="label" htmlFor="fullName">Full name</label>
              <input id="fullName" name="fullName" required className="input" placeholder="Nimal Perera" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="input" placeholder="you@example.lk" />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone (for SMS/WhatsApp reminders)</label>
              <input id="phone" name="phone" type="tel" required className="input" placeholder="+9477XXXXXXX" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
            </div>
            <div>
              <label className="label" htmlFor="language">Preferred language</label>
              <select id="language" name="language" className="input" defaultValue="EN">
                <option value="EN">English</option>
                <option value="SI">සිංහල (Sinhala)</option>
                <option value="TA">தமிழ் (Tamil)</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">Create account</button>
          </form>
          <p className="mt-3 text-center text-xs text-slate-400">
            By continuing you agree to our care-data handling policy (see SECURITY.md).
          </p>
        </div>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link>
        </p>
      </div>
    </main>
  );
}
