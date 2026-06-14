"use client";

import { useState } from "react";
import { Droplet, MapPin, Check, X, Loader2, Navigation } from "lucide-react";

type Alert = {
  matchId: string;
  hospitalName: string;
  bloodType: string;
  distanceKm: number | null;
  urgency: string;
  status: string;
};

/**
 * Donor-facing emergency alert (Part 4/5). Accept reveals the donor to the
 * hospital, calculates ETA and opens navigation; Decline closes it.
 */
export function DonorAlertCard({ alert }: { alert: Alert }) {
  const [status, setStatus] = useState(alert.status);
  const [busy, setBusy] = useState<string | null>(null);

  async function respond(action: "accept" | "decline" | "arrived" | "donated") {
    setBusy(action);
    try {
      const res = await fetch(`/api/blood/matches/${alert.matchId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) setStatus(data.status);
    } finally {
      setBusy(null);
    }
  }

  const accepted = status === "ACCEPTED" || status === "ARRIVED" || status === "DONATED";
  const eta = alert.distanceKm != null ? Math.max(2, Math.round((alert.distanceKm / 35) * 60) + 4) : null;

  return (
    <div className={`rounded-2xl border p-5 ${accepted ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-white"}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-red-600">
        🩸 Emergency Blood Request {alert.urgency === "CRITICAL" && <span className="rounded-full bg-red-600 px-2 py-0.5 text-white">critical</span>}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-red-50">
          <Droplet className="h-5 w-5 text-red-500" />
          <span className="font-bold text-red-600">{alert.bloodType}</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900">{alert.hospitalName}</p>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-3.5 w-3.5" /> {alert.distanceKm != null ? `${alert.distanceKm} km away` : "nearby"}
            {eta != null && <> · ETA ~{eta} min</>}
          </p>
        </div>
      </div>

      {status === "DECLINED" ? (
        <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">You declined this request. Thank you.</p>
      ) : accepted ? (
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" /> You accepted — the hospital has been notified with your ETA.</p>
          <div className="flex flex-wrap gap-2">
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(alert.hospitalName)}`} target="_blank" rel="noreferrer" className="btn-primary px-3 py-1.5 text-xs">
              <Navigation className="h-4 w-4" /> Open navigation
            </a>
            {status === "ACCEPTED" && <button onClick={() => respond("arrived")} disabled={busy === "arrived"} className="btn-secondary px-3 py-1.5 text-xs">I&apos;ve arrived</button>}
            {status === "ARRIVED" && <button onClick={() => respond("donated")} disabled={busy === "donated"} className="btn-secondary px-3 py-1.5 text-xs">Mark donated</button>}
            {status === "DONATED" && <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">Donated 🙏 thank you</span>}
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <button onClick={() => respond("accept")} disabled={busy != null} className="btn-primary flex-1">
            {busy === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept
          </button>
          <button onClick={() => respond("decline")} disabled={busy != null} className="btn-secondary flex-1">
            <X className="h-4 w-4" /> Decline
          </button>
        </div>
      )}
    </div>
  );
}
