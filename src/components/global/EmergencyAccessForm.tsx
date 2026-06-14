"use client";

import { useState } from "react";
import { Loader2, ArrowRight, ShieldAlert } from "lucide-react";

const REASONS = [
  { value: "UNCONSCIOUS_PATIENT", label: "Patient unconscious" },
  { value: "LIFE_THREATENING", label: "Life-threatening condition" },
  { value: "PATIENT_UNABLE_TO_CONSENT", label: "Patient unable to consent" },
  { value: "CRITICAL_CARE", label: "Critical care" },
  { value: "OTHER", label: "Other" },
];

const METHODS = [
  { value: "QR_CODE", label: "Scanned QR" },
  { value: "HEALTH_ID", label: "Health ID" },
  { value: "PASSPORT", label: "Passport (demo)" },
  { value: "NATIONAL_ID", label: "National ID (demo)" },
  { value: "FACE", label: "Face (demo)" },
  { value: "FINGERPRINT", label: "Fingerprint (demo)" },
];

export function EmergencyAccessForm({ actorName, demoId }: { actorName: string; demoId?: string }) {
  const [globalId, setGlobalId] = useState("");
  const [reason, setReason] = useState("UNCONSCIOUS_PATIENT");
  const [method, setMethod] = useState("QR_CODE");
  const [justification, setJustification] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; passportLink?: string; hash?: string; error?: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/emergency/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalId: globalId.trim(), reason, method, justification, location, actorName }),
      });
      const data = await res.json();
      setResult(res.ok ? { ok: true, ...data } : { ok: false, error: data.error ?? "Access denied" });
    } catch (err) {
      setResult({ ok: false, error: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (result?.ok) {
    return (
      <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="font-semibold text-emerald-800">Emergency access granted & logged.</p>
        <p className="mt-1 font-mono text-xs text-emerald-700">audit hash: {result.hash}</p>
        <a href={result.passportLink} target="_blank" rel="noreferrer" className="btn-primary mt-3 inline-flex">
          Open emergency passport <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-3">
      <div>
        <label className="label" htmlFor="gid">Patient Global Health ID</label>
        <input id="gid" value={globalId} onChange={(e) => setGlobalId(e.target.value)} required className="input font-mono" placeholder={demoId ?? "HLX-LK-XXXX-XXXX"} />
        {demoId && (
          <p className="mt-1 text-xs text-slate-400">Demo ID: <button type="button" onClick={() => setGlobalId(demoId)} className="font-mono text-brand-700 underline">{demoId}</button></p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="reason">Clinical reason</label>
          <select id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="input">
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="method">Verification method</label>
          <select id="method" value={method} onChange={(e) => setMethod(e.target.value)} className="input">
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="just">Justification</label>
        <input id="just" value={justification} onChange={(e) => setJustification(e.target.value)} className="input" placeholder="e.g. Unresponsive on arrival, no next of kin present" />
      </div>
      <div>
        <label className="label" htmlFor="loc">Location</label>
        <input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} className="input" placeholder="e.g. Emergency Dept, Dubai" />
      </div>

      {result?.error && (
        <p className="flex items-center gap-1.5 text-sm text-red-600"><ShieldAlert className="h-4 w-4" /> {result.error}</p>
      )}

      <button type="submit" disabled={busy} className="btn-danger w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
        Break-glass & access passport
      </button>
    </form>
  );
}
