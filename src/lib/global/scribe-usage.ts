import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { demoScribeUsage } from "./demo";

export type ScribeUsageRow = {
  id: string;
  doctorName: string;
  patientName: string;
  specialty: string;
  noteType: string;
  status: string;
  createdAt: string;
};

/**
 * AI Scribe usage rows from REAL records (ScribeNote ← ScribeSession). In demo
 * mode the seeded sample is returned flagged `demo: true`; in production it's the
 * actual notes, or an empty list → the UI shows "No records yet".
 */
export async function getScribeUsage(): Promise<{ demo: boolean; rows: ScribeUsageRow[] }> {
  if (isDemoMode) return { demo: true, rows: demoScribeUsage as ScribeUsageRow[] };

  const notes = await prisma.scribeNote.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      session: {
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } },
        },
      },
    },
  });

  const rows = notes.map((n) => ({
    id: n.id,
    doctorName: n.session.doctor.user.fullName,
    patientName: n.session.patient.user.fullName,
    specialty: n.session.specialty,
    noteType: n.type,
    status: n.finalized ? "FINALIZED" : n.session.status,
    createdAt: n.createdAt.toISOString(),
  }));

  return { demo: false, rows };
}
