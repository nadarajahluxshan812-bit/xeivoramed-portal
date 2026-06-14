"use client";

import { useState } from "react";
import Link from "next/link";
import { Apple, Wallet, QrCode, Printer, Loader2, Info, ExternalLink } from "lucide-react";

/**
 * "Add your Medical Passport" actions. Apple/Google buttons stay visible even
 * without issuer credentials — they then show a setup-required state and make no
 * false production claims. QR card + print always work (demo-safe).
 */
export function WalletActions({
  appleConfigured,
  googleConfigured,
}: {
  appleConfigured: boolean;
  googleConfigured: boolean;
}) {
  const [busy, setBusy] = useState<"apple" | "google" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function wallet(provider: "apple" | "google") {
    setBusy(provider);
    setNote(null);
    try {
      const res = await fetch(provider === "apple" ? "/api/wallet/apple/pass" : "/api/wallet/google/save");
      const data = await res.json().catch(() => ({}));
      if (res.status === 501) {
        setNote("Wallet integration ready — issuer setup required.");
      } else if (res.ok && provider === "google" && data.saveUrl) {
        window.open(data.saveUrl, "_blank");
      } else if (res.ok) {
        setNote("Pass generated. (Signed .pkpass download enabled once issuer certificates are configured.)");
      } else {
        setNote(data.error ?? "Could not create the pass.");
      }
    } catch {
      setNote("Could not reach the wallet service.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Apple Wallet */}
        <button onClick={() => wallet("apple")} disabled={busy === "apple"} className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
          {busy === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Apple className="h-4 w-4" />}
          Add to Apple Wallet
        </button>

        {/* Google Wallet */}
        <button onClick={() => wallet("google")} disabled={busy === "google"} className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
          {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
          Add to Google Wallet
        </button>

        {/* QR card download — always works */}
        <a href="/api/wallet/qr-card" download className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          <QrCode className="h-4 w-4" /> Download QR Card
        </a>

        {/* Print card — always works */}
        <Link href="/dashboard/passport/print" className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          <Printer className="h-4 w-4" /> Print Emergency Card
        </Link>
      </div>

      {/* Honest wallet status */}
      {(!appleConfigured || !googleConfigured) && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
          <Info className="h-3.5 w-3.5 shrink-0" />
          Wallet integration ready — issuer setup required for {!appleConfigured && !googleConfigured ? "Apple & Google Wallet" : !appleConfigured ? "Apple Wallet" : "Google Wallet"}. QR card &amp; printable card work now.
        </p>
      )}
      {note && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" /> {note}
        </p>
      )}
    </div>
  );
}
