"use client";

import { useState } from "react";
import { RotateCcw, Loader2 } from "lucide-react";

/**
 * Development-only "reset demo data" control.
 * Renders nothing in production builds (NODE_ENV is statically inlined here).
 * Clears client-side demo state (e.g. records added in demo mode) and asks the
 * server to re-seed when a database is configured.
 */
export function DevReset() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (process.env.NODE_ENV === "production") return null;

  async function reset() {
    setBusy(true);
    setDone(null);
    try {
      // Clear any demo records stored locally by the uploader.
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sehat:demo:"))
        .forEach((k) => localStorage.removeItem(k));

      const res = await fetch("/api/dev/reset", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { note?: string; reseeded?: boolean };
      setDone(data.reseeded ? "Database re-seeded" : data.note ?? "Demo state cleared");
      setTimeout(() => window.location.reload(), 600);
    } catch {
      setDone("Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {done && <span className="text-xs text-slate-400">{done}</span>}
      <button
        onClick={reset}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
        title="Development only — resets demo data"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
        Reset demo data
      </button>
    </div>
  );
}
