import Link from "next/link";
import { Ambulance, ShieldAlert, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { requireRole } from "@/lib/auth";
import { homeForRole } from "@/lib/rbac";
import { isDemoMode } from "@/lib/env";
import { demoGlobalId } from "@/lib/global/demo";
import { EmergencyAccessForm } from "@/components/global/EmergencyAccessForm";

export const metadata = { title: "Emergency Access · XeivoraMed" };

/**
 * Module 5 — Emergency Access (break-glass) console for authorised providers.
 * A provider enters a patient's Global Health ID + clinical reason; the system
 * records who/when/why/where in the immutable audit log and opens the passport.
 */
export default async function EmergencyConsolePage() {
  const user = await requireRole(["DOCTOR", "CLINIC_STAFF", "ADMIN"]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Logo />
        <Link href={homeForRole(user.role)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </header>

      <div className="mx-auto max-w-xl px-5 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Ambulance className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Emergency Access</h1>
              <p className="text-sm text-slate-500">Break-glass access to a patient&apos;s critical health passport.</p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This action is recorded in an <strong>immutable audit log</strong> (who, when, why, where)
              and the patient is notified. Use only for genuine clinical emergencies where the patient
              cannot consent.
            </p>
          </div>

          <EmergencyAccessForm actorName={user.fullName} demoId={isDemoMode ? demoGlobalId.globalId : undefined} />
        </div>
      </div>
    </main>
  );
}
