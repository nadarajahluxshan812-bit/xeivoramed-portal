import { isDemoMode } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { formatBloodType } from "./matching";
import {
  demoBloodRequest,
  demoMatches,
  demoMyDonorProfile,
  demoIncomingAlerts,
} from "./demo";

/**
 * Live match snapshot for one request — used by the SSE stream so the hospital
 * board updates as donors accept/decline/arrive. Returns the same shape the
 * console renders, applying the same trust-and-safety masking (identity revealed
 * only after the donor accepts).
 */
export async function getMatchesForRequest(requestId: string) {
  if (isDemoMode) {
    return { status: demoBloodRequest.status as string, matches: demoMatches() };
  }
  const request = await prisma.bloodRequest.findUnique({
    where: { id: requestId },
    include: { matches: { include: { donor: { include: { patient: { include: { user: true } } } } }, orderBy: { matchScore: "desc" } } },
  });
  if (!request) return { status: "CANCELLED", matches: [] };
  const matches = request.matches.map((m) => {
    const revealed = ["ACCEPTED", "ARRIVED", "DONATED"].includes(m.status);
    const donorUser = m.donor.patient.user;
    return {
      donorId: m.donorId,
      matchScore: m.matchScore,
      distanceKm: m.distanceKm,
      etaMinutes: m.etaMinutes,
      donorBloodType: formatBloodType(m.donor.bloodGroup, m.donor.rhesusFactor),
      status: m.status,
      donorLabel: revealed ? donorUser.fullName : `Donor #${m.donorId.slice(-6).toUpperCase()}`,
      donorContact: revealed ? donorUser.phone : null,
      donorCity: m.donor.city ?? "",
    };
  });
  return { status: request.status as string, matches };
}

/** Hospital Blood Emergency Dashboard data. */
export async function getHospitalBloodBoard(hospitalId: string) {
  if (isDemoMode) {
    return { request: demoBloodRequest, matches: demoMatches() };
  }

  const request = await prisma.bloodRequest.findFirst({
    where: { hospitalId, status: { in: ["OPEN", "MATCHING", "DONOR_FOUND"] } },
    orderBy: { createdAt: "desc" },
    include: { hospital: true, matches: { include: { donor: { include: { patient: { include: { user: true } } } } }, orderBy: { matchScore: "desc" } } },
  });

  const matches = (request?.matches ?? []).map((m) => {
    const revealed = ["ACCEPTED", "ARRIVED", "DONATED"].includes(m.status);
    const donorUser = m.donor.patient.user;
    return {
      donorId: m.donorId,
      matchScore: m.matchScore,
      distanceKm: m.distanceKm,
      etaMinutes: m.etaMinutes,
      donorBloodType: formatBloodType(m.donor.bloodGroup, m.donor.rhesusFactor),
      status: m.status,
      // Trust & safety: hospital sees identity/contact ONLY after acceptance.
      donorLabel: revealed ? donorUser.fullName : `Donor #${m.donorId.slice(-6).toUpperCase()}`,
      donorContact: revealed ? donorUser.phone : null,
      donorCity: m.donor.city ?? "",
    };
  });

  return {
    request: request
      ? {
          id: request.id, hospitalName: request.hospital.name, bloodGroupNeeded: request.bloodGroupNeeded,
          unitsRequired: request.unitsRequired, urgency: request.urgency, reason: request.reason,
          location: request.location, radius: request.radius, status: request.status, createdAt: request.createdAt.toISOString(),
        }
      : null,
    matches,
  };
}

/** The patient's own donor profile + any incoming alerts. */
export async function getMyDonorView(patientProfileId: string) {
  if (isDemoMode) {
    return { profile: demoMyDonorProfile, alerts: demoIncomingAlerts };
  }
  const profile = await prisma.bloodDonorProfile.findUnique({ where: { patientId: patientProfileId } });
  const matches = await prisma.bloodMatch.findMany({
    where: { donor: { patientId: patientProfileId }, status: { in: ["NOTIFIED", "ACCEPTED"] } },
    include: { request: { include: { hospital: true } } },
    orderBy: { createdAt: "desc" },
  });
  return {
    profile: profile
      ? {
          bloodGroup: profile.bloodGroup, rhesusFactor: profile.rhesusFactor, city: profile.city,
          searchRadius: profile.searchRadius, availabilityStatus: profile.availabilityStatus,
          eligibilityStatus: profile.eligibilityStatus, lastDonationDate: profile.lastDonationDate?.toISOString() ?? null,
          verified: profile.verified,
        }
      : null,
    alerts: matches.map((m) => ({
      matchId: m.id, hospitalName: m.request.hospital.name, bloodType: m.request.bloodGroupNeeded,
      distanceKm: m.distanceKm, urgency: m.request.urgency, status: m.status, createdAt: m.createdAt.toISOString(),
    })),
  };
}
