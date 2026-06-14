import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * Analytics computed from real database rows only. In demo mode we return the
 * seeded demo figures flagged `demo: true` so the UI can label them "Demo Data".
 * In production, counts come straight from the database — if there is no data,
 * the numbers are genuinely 0 and the UI shows "No usage data available yet".
 */

export type AdminAnalytics = {
  demo: boolean;
  hasData: boolean;
  activePatients: number;
  activeDoctors: number;
  appointmentsThisMonth: number;
  missedRatePct: number | null;
  providersApproved: number;
  providersPending: number;
};

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  if (isDemoMode) {
    // Clearly-labelled demo figures (UI tags them "Demo Data"). Not real usage.
    return {
      demo: true, hasData: true,
      activePatients: 2, activeDoctors: 2, appointmentsThisMonth: 3, missedRatePct: 0,
      providersApproved: 2, providersPending: 3,
    };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [activePatients, activeDoctors, appointmentsThisMonth, completedThisMonth, noShowThisMonth, providersApproved, providersPending] =
    await Promise.all([
      prisma.patientProfile.count({ where: { user: { isActive: true } } }),
      prisma.doctorProfile.count({ where: { user: { isActive: true } } }),
      prisma.appointment.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.appointment.count({ where: { status: "COMPLETED", scheduledAt: { gte: startOfMonth } } }),
      prisma.appointment.count({ where: { status: "NO_SHOW", scheduledAt: { gte: startOfMonth } } }),
      prisma.provider.count({ where: { status: "APPROVED" } }),
      prisma.provider.count({ where: { status: { in: ["REGISTERED", "PENDING_VERIFICATION", "VERIFIED"] } } }),
    ]);

  const finished = completedThisMonth + noShowThisMonth;
  const missedRatePct = finished > 0 ? Math.round((noShowThisMonth / finished) * 1000) / 10 : null;
  const hasData = activePatients + activeDoctors + appointmentsThisMonth + providersApproved + providersPending > 0;

  return { demo: false, hasData, activePatients, activeDoctors, appointmentsThisMonth, missedRatePct, providersApproved, providersPending };
}

export type BloodAnalytics = {
  demo: boolean;
  hasData: boolean;
  activeRequests: number;
  pendingResponses: number;
  acceptedDonors: number;
  bestEtaMinutes: number | null;
  registeredDonors: number;
};

/** Blood network analytics — only counts that actually exist. */
export async function getBloodNetworkAnalytics(hospitalId?: string): Promise<BloodAnalytics> {
  if (isDemoMode) {
    return { demo: true, hasData: true, activeRequests: 1, pendingResponses: 1, acceptedDonors: 1, bestEtaMinutes: 7, registeredDonors: 1 };
  }

  const where = hospitalId ? { hospitalId } : {};
  const [activeRequests, pendingResponses, acceptedDonors, registeredDonors, soonest] = await Promise.all([
    prisma.bloodRequest.count({ where: { ...where, status: { in: ["OPEN", "MATCHING", "DONOR_FOUND"] } } }),
    prisma.bloodMatch.count({ where: { status: "NOTIFIED", request: where } }),
    prisma.bloodMatch.count({ where: { status: { in: ["ACCEPTED", "ARRIVED", "DONATED"] }, request: where } }),
    prisma.bloodDonorProfile.count(),
    prisma.bloodMatch.findFirst({
      where: { status: { in: ["NOTIFIED", "ACCEPTED"] }, etaMinutes: { not: null }, request: where },
      orderBy: { etaMinutes: "asc" },
      select: { etaMinutes: true },
    }),
  ]);

  const hasData = activeRequests + pendingResponses + acceptedDonors + registeredDonors > 0;
  return { demo: false, hasData, activeRequests, pendingResponses, acceptedDonors, bestEtaMinutes: soonest?.etaMinutes ?? null, registeredDonors };
}
