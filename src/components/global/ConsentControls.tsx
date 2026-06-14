"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

/** Patient consent toggle: approve a pending grant or revoke an active one. */
export function ConsentControls({ grantId, status }: { grantId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "revoke") {
    setBusy(true);
    try {
      await fetch("/api/global/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grantId, action }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "REVOKED" || status === "EXPIRED") {
    return (
      <button onClick={() => act("approve")} disabled={busy} className="btn-secondary px-3 py-1.5 text-xs">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Re-approve
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      {status === "PENDING" && (
        <button onClick={() => act("approve")} disabled={busy} className="btn-primary px-3 py-1.5 text-xs">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
        </button>
      )}
      <button onClick={() => act("revoke")} disabled={busy} className="btn-danger px-3 py-1.5 text-xs">
        <X className="h-4 w-4" /> Revoke
      </button>
    </div>
  );
}
