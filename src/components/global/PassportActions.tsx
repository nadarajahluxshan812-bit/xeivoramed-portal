"use client";

import { Download, Printer, Copy, Check } from "lucide-react";
import { useState } from "react";

/**
 * Patient-ownership actions on the passport: export records (JSON), download a
 * PDF summary (via print-to-PDF), and copy the Global Health ID.
 */
export function PassportActions({ globalId, passportLink }: { globalId: string; passportLink: string }) {
  const [copied, setCopied] = useState(false);

  async function exportJson() {
    const res = await fetch("/api/global/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xeivoramed-${globalId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    // Open the print-optimised emergency view; the browser's print dialog → "Save as PDF".
    const w = window.open(`${passportLink}&print=1`, "_blank");
    w?.addEventListener("load", () => setTimeout(() => w.print(), 400));
  }

  async function copyId() {
    // The async Clipboard API can be blocked (insecure context, iframe without
    // permission). Try it, then fall back to a temporary textarea + execCommand.
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(globalId);
        ok = true;
      }
    } catch {
      /* fall through to legacy copy */
    }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = globalId;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={copyId} className="btn-secondary px-3 py-2 text-xs">
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy ID"}
      </button>
      <button onClick={exportJson} className="btn-secondary px-3 py-2 text-xs">
        <Download className="h-4 w-4" /> Export records
      </button>
      <button onClick={downloadPdf} className="btn-primary px-3 py-2 text-xs">
        <Printer className="h-4 w-4" /> Download PDF
      </button>
    </div>
  );
}
