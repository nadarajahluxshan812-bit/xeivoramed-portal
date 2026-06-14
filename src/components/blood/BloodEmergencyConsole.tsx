"use client";

import { useEffect, useState } from "react";
import { Droplet, Plus, Loader2, MapPin, Clock, Phone, Lock, Gauge, X, Radio } from "lucide-react";

type Match = {
  donorId: string;
  matchScore: number;
  distanceKm: number | null;
  etaMinutes: number | null;
  donorBloodType: string;
  status: string;
  donorLabel: string;
  donorContact: string | null;
  donorCity: string;
};

type Req = {
  id?: string;
  bloodGroupNeeded: string;
  unitsRequired: number;
  urgency: string;
  reason?: string | null;
  location?: string | null;
  radius: number;
  status: string;
};

const statusTone: Record<string, string> = {
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  ARRIVED: "bg-emerald-100 text-emerald-700",
  DONATED: "bg-emerald-100 text-emerald-700",
  NOTIFIED: "bg-amber-100 text-amber-700",
  PENDING: "bg-slate-100 text-slate-600",
  DECLINED: "bg-red-100 text-red-700",
};

const VALID_TYPES = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

export function BloodEmergencyConsole({ initialRequest, initialMatches, prefillNeed }: { initialRequest: Req | null; initialMatches: Match[]; prefillNeed?: string }) {
  const [request, setRequest] = useState<Req | null>(initialRequest);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    bloodGroupNeeded: prefillNeed && VALID_TYPES.includes(prefillNeed) ? prefillNeed : "O-",
    unitsRequired: 2,
    urgency: "CRITICAL",
    reason: "",
    radius: 30,
  });
  const [notified, setNotified] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  // Live updates via Server-Sent Events: as donors accept/decline/arrive the
  // board refreshes without a page reload.
  useEffect(() => {
    const id = request?.id;
    if (!id || request?.status === "COMPLETED") {
      setLive(false);
      return;
    }
    const es = new EventSource(`/api/blood/stream?requestId=${encodeURIComponent(id)}`);
    es.addEventListener("hello", () => setLive(true));
    es.addEventListener("status", (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as { status: string; matches: Match[] };
        if (Array.isArray(data.matches)) setMatches(data.matches);
        if (data.status) setRequest((r) => (r ? { ...r, status: data.status } : r));
      } catch { /* ignore malformed frame */ }
    });
    es.onerror = () => setLive(false);
    return () => { es.close(); setLive(false); };
  }, [request?.id, request?.status]);

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/blood/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setRequest({ ...form, status: "MATCHING", id: data.request?.id ?? data.requestId ?? request?.id });
        setMatches(data.matches ?? []);
        setNotified(data.notified ?? null);
      }
    } finally {
      setBusy(false);
    }
  }

  function closeRequest() {
    setRequest((r) => (r ? { ...r, status: "COMPLETED" } : r));
  }

  const accepted = matches.filter((m) => ["ACCEPTED", "ARRIVED", "DONATED"].includes(m.status)).length;

  return (
    <div className="space-y-6">
      {/* Create request */}
      <div className="card">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900"><Plus className="h-5 w-5 text-red-500" /> Create blood request</h2>
        <form onSubmit={createRequest} className="grid gap-3 sm:grid-cols-5">
          <div>
            <label className="label">Blood needed</label>
            <select value={form.bloodGroupNeeded} onChange={(e) => setForm({ ...form, bloodGroupNeeded: e.target.value })} className="input">
              {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Units</label>
            <input type="number" min={1} value={form.unitsRequired} onChange={(e) => setForm({ ...form, unitsRequired: +e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Urgency</label>
            <select value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })} className="input">
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Radius (km)</label>
            <input type="number" min={1} value={form.radius} onChange={(e) => setForm({ ...form, radius: +e.target.value })} className="input" />
          </div>
          <div className="flex items-end">
            <button disabled={busy} className="btn-primary w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplet className="h-4 w-4" />} Find donors
            </button>
          </div>
          <div className="sm:col-span-5">
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input" placeholder="Reason (e.g. major trauma — theatre in 30 min)" />
          </div>
        </form>
        {notified != null && <p className="mt-2 text-xs text-emerald-600">Matching engine ran — {matches.length} compatible donors found, {notified} alerted first.</p>}
      </div>

      {/* Active request + matches */}
      {request && (
        <div className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-red-50">
                <Droplet className="h-5 w-5 text-red-500" />
                <span className="text-sm font-bold text-red-600">{request.bloodGroupNeeded}</span>
              </span>
              <div>
                <p className="font-semibold text-slate-900">{request.unitsRequired} units · {request.urgency.toLowerCase()} urgency</p>
                <p className="text-xs text-slate-500">{request.reason || "Emergency request"} · {request.radius} km radius</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {live && request.status !== "COMPLETED" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700" title="Live updates via Server-Sent Events">
                  <Radio className="h-3 w-3 animate-pulse" /> Live
                </span>
              )}
              <span className={`badge ${request.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{request.status.toLowerCase()}</span>
              {request.status !== "COMPLETED" && (
                <button onClick={closeRequest} className="btn-secondary px-3 py-1.5 text-xs"><X className="h-3.5 w-3.5" /> Close request</button>
              )}
            </div>
          </div>

          {/* Tracking summary */}
          <div className="mb-4 grid grid-cols-3 gap-3 text-center">
            <Stat label="Matched" value={matches.length} />
            <Stat label="Accepted" value={accepted} tone="text-emerald-600" />
            <Stat label="Best ETA" value={matches.find((m) => m.etaMinutes != null)?.etaMinutes != null ? `${matches.find((m) => m.etaMinutes != null)!.etaMinutes} min` : "—"} />
          </div>

          {/* Match board */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="py-2">Donor</th><th>Type</th><th>Score</th><th>Distance</th><th>ETA</th><th>Status</th><th>Contact</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matches.map((m) => (
                  <tr key={m.donorId}>
                    <td className="py-3 font-medium text-slate-900">{m.donorLabel} <span className="text-xs font-normal text-slate-400">· {m.donorCity}</span></td>
                    <td><span className="font-semibold text-red-600">{m.donorBloodType}</span></td>
                    <td><span className="inline-flex items-center gap-1 text-slate-600"><Gauge className="h-3.5 w-3.5" />{m.matchScore}</span></td>
                    <td className="text-slate-600"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.distanceKm != null ? `${m.distanceKm} km` : "—"}</span></td>
                    <td className="text-slate-600"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{m.etaMinutes != null ? `${m.etaMinutes} min` : "—"}</span></td>
                    <td><span className={`badge ${statusTone[m.status] ?? "bg-slate-100 text-slate-600"}`}>{m.status.toLowerCase()}</span></td>
                    <td>
                      {m.donorContact ? (
                        <a href={`tel:${m.donorContact}`} className="inline-flex items-center gap-1 text-brand-700"><Phone className="h-3.5 w-3.5" />{m.donorContact}</a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Lock className="h-3 w-3" /> hidden until accept</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">Donor identity &amp; contact are revealed to the hospital only after the donor accepts.</p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "text-slate-900" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
