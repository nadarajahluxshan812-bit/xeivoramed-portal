"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Check, Ban, Loader2 } from "lucide-react";

/**
 * Admin verification workflow controls:
 * REGISTERED → PENDING_VERIFICATION → VERIFIED → APPROVED (or REJECTED/SUSPENDED).
 */
export function ProviderVerifyControls({ providerId, status }: { providerId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(next: string) {
    setBusy(true);
    try {
      await fetch(`/api/providers/${providerId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "APPROVED") {
    return (
      <button onClick={() => act("SUSPENDED")} disabled={busy} className="btn-secondary px-2.5 py-1.5 text-xs">
        <Ban className="h-3.5 w-3.5" /> Suspend
      </button>
    );
  }

  const next = status === "VERIFIED" ? "APPROVED" : "VERIFIED";
  const label = status === "VERIFIED" ? "Approve" : "Verify";
  const Icon = status === "VERIFIED" ? Check : ShieldCheck;

  return (
    <div className="inline-flex gap-2">
      <button onClick={() => act(next)} disabled={busy} className="btn-primary px-2.5 py-1.5 text-xs">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />} {label}
      </button>
      <button onClick={() => act("REJECTED")} disabled={busy} className="btn-secondary px-2.5 py-1.5 text-xs">
        Reject
      </button>
    </div>
  );
}
