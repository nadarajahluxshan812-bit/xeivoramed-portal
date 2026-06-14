"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScanLine, IdCard, BookUser, CreditCard, ScanFace, Fingerprint, Hand, Eye,
  Loader2, CheckCircle2, ShieldAlert, ArrowRight,
} from "lucide-react";

/**
 * Public, guided emergency-verification demo (provider's point of view).
 * Step A: choose a verification method (credential or biometric demo).
 * Step B: enter a clinical reason.
 * Step C: simulated verification → opens the Emergency Passport (which logs access).
 *
 * Biometric capture here is SIMULATED. No camera/sensor data is read or stored.
 */

type Method = { key: string; label: string; group: "credential" | "biometric"; status: "live" | "demo" | "future"; icon: typeof IdCard };

const METHODS: Method[] = [
  { key: "QR_CODE", label: "Scan QR code", group: "credential", status: "live", icon: ScanLine },
  { key: "HEALTH_ID", label: "Enter Health ID", group: "credential", status: "live", icon: IdCard },
  { key: "PASSPORT", label: "Passport", group: "credential", status: "demo", icon: BookUser },
  { key: "NATIONAL_ID", label: "National ID", group: "credential", status: "demo", icon: CreditCard },
  { key: "FACE", label: "Face verification", group: "biometric", status: "demo", icon: ScanFace },
  { key: "FINGERPRINT", label: "Fingerprint", group: "biometric", status: "demo", icon: Fingerprint },
  { key: "PALM", label: "Palm", group: "biometric", status: "future", icon: Hand },
  { key: "IRIS", label: "Iris", group: "biometric", status: "future", icon: Eye },
];

const DISCLAIMER =
  "Biometric verification is demonstration-only and would require certified biometric providers, explicit consent, and jurisdiction-specific regulatory approval in production.";

export function EmergencyVerifyFlow({ passportLink }: { passportLink: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<string>("FACE");
  const [reason, setReason] = useState("UNCONSCIOUS_PATIENT");
  const [phase, setPhase] = useState<"select" | "verifying" | "done">("select");

  const selected = METHODS.find((m) => m.key === method)!;
  const isFuture = selected.status === "future";

  function verify() {
    if (isFuture) return;
    setPhase("verifying");
    // Simulated capture + match. No real biometric data is touched.
    setTimeout(() => setPhase("done"), 1600);
  }

  function openPassport() {
    router.push(`${passportLink}&via=${method}`);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
        Demo · Step 1 of 3 — Provider verification
      </div>
      <h2 className="text-lg font-bold text-slate-900">Verify before access</h2>
      <p className="mt-1 text-sm text-slate-500">An authorized provider proves identity/intent before the passport opens.</p>

      {phase === "select" && (
        <>
          {/* Method grid */}
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Credential</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METHODS.filter((m) => m.group === "credential").map((m) => (
                <MethodBtn key={m.key} m={m} active={method === m.key} onClick={() => setMethod(m.key)} />
              ))}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Biometric</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {METHODS.filter((m) => m.group === "biometric").map((m) => (
                <MethodBtn key={m.key} m={m} active={method === m.key} onClick={() => setMethod(m.key)} />
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="mt-4">
            <label className="label" htmlFor="reason">Clinical reason</label>
            <select id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="input">
              <option value="UNCONSCIOUS_PATIENT">Patient unconscious</option>
              <option value="LIFE_THREATENING">Life-threatening condition</option>
              <option value="PATIENT_UNABLE_TO_CONSENT">Patient unable to consent</option>
              <option value="CRITICAL_CARE">Critical care</option>
            </select>
          </div>

          {isFuture ? (
            <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">
              {selected.label} verification is planned for a future release.
            </p>
          ) : (
            <button onClick={verify} className="btn-danger mt-4 w-full">
              <selected.icon className="h-4 w-4" /> Verify with {selected.label.toLowerCase()}
            </button>
          )}

          {selected.group === "biometric" && (
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {DISCLAIMER}
            </p>
          )}
        </>
      )}

      {phase === "verifying" && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-50">
            <selected.icon className="h-12 w-12 text-brand-600" />
            <span className="absolute inset-x-0 top-0 h-1 animate-[scan_1.4s_ease-in-out_infinite] rounded bg-brand-500/70" />
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying {selected.label.toLowerCase()}…
          </p>
          <p className="text-xs text-slate-400">Simulated — no sensor data is read</p>
        </div>
      )}

      {phase === "done" && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 font-semibold text-emerald-800">
            <CheckCircle2 className="h-5 w-5" /> Verified via {selected.label} (demo)
          </p>
          <p className="mt-1 text-sm text-emerald-700">Provider authorized. Opening the emergency passport — this access will be logged.</p>
          <button onClick={openPassport} className="btn-primary mt-3">
            Open Emergency Passport <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function MethodBtn({ m, active, onClick }: { m: Method; active: boolean; onClick: () => void }) {
  const Icon = m.icon;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center text-xs font-medium transition ${
        active ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{m.label}</span>
      {m.status === "future" && <span className="rounded-full bg-slate-200 px-1.5 text-[9px] uppercase text-slate-500">soon</span>}
      {m.status === "demo" && <span className="rounded-full bg-amber-100 px-1.5 text-[9px] uppercase text-amber-700">demo</span>}
    </button>
  );
}
