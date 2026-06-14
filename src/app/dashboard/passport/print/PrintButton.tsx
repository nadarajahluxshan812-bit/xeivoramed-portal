"use client";

import { Printer } from "lucide-react";

/** Triggers the browser print dialog (Save as PDF works too). Hidden when printing. */
export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-primary print:hidden">
      <Printer className="h-4 w-4" /> Print / Save as PDF
    </button>
  );
}
