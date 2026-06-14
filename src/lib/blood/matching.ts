/**
 * Emergency Blood Network — BloodMatchingService (Part 3).
 *
 * Pure, deterministic ranking logic so it runs offline and is testable. Given a
 * blood request and a pool of donors, it filters by ABO/Rh compatibility,
 * distance, availability, eligibility and recent-donation history, then ranks the
 * remaining donors and returns a match score, distance and estimated arrival time.
 *
 * IMPORTANT: this assists triage only. XeivoraMed does NOT determine donor
 * eligibility — final decisions rest with licensed professionals and blood banks.
 */

export type BloodType = { group: "A" | "B" | "AB" | "O"; rh: "POSITIVE" | "NEGATIVE" };

export type DonorInput = {
  id: string;
  name?: string; // never exposed before acceptance
  group: string; // "A" | "B" | "AB" | "O"
  rh: "POSITIVE" | "NEGATIVE";
  latitude?: number | null;
  longitude?: number | null;
  searchRadius?: number;
  availabilityStatus: "AVAILABLE" | "UNAVAILABLE" | "TEMPORARILY_INELIGIBLE" | "RECENTLY_DONATED";
  eligibilityStatus: "ELIGIBLE" | "INELIGIBLE" | "UNDER_REVIEW";
  lastDonationDate?: string | null;
};

export type RequestInput = {
  bloodGroupNeeded: string; // e.g. "O-"
  latitude?: number | null;
  longitude?: number | null;
  radius?: number; // km
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type MatchResult = {
  donorId: string;
  matchScore: number; // 0–100
  distanceKm: number | null;
  etaMinutes: number | null;
  donorBloodType: string;
};

// Minimum days between whole-blood donations (clinical guideline ~56 days).
const MIN_DONATION_INTERVAL_DAYS = 56;
// Average ground speed assumption for ETA (km/h) — urban emergency travel.
const AVG_SPEED_KMH = 35;

/** Donor → recipient ABO/Rh compatibility for red cells. */
export function isCompatible(donor: BloodType, recipient: BloodType): boolean {
  // Rh-negative recipients cannot receive Rh-positive blood.
  if (recipient.rh === "NEGATIVE" && donor.rh === "POSITIVE") return false;
  // ABO: O is universal donor; AB recipient accepts any ABO.
  if (donor.group === "O") return true;
  if (recipient.group === "AB") return true;
  return donor.group === recipient.group;
}

export function parseBloodType(text: string): BloodType | null {
  const m = text.trim().toUpperCase().match(/^(AB|A|B|O)\s*([+-]|POS|NEG|POSITIVE|NEGATIVE)?$/);
  if (!m) return null;
  const group = m[1] as BloodType["group"];
  const rhRaw = m[2] ?? "+";
  const rh = /(-|NEG)/.test(rhRaw) ? "NEGATIVE" : "POSITIVE";
  return { group, rh };
}

export function formatBloodType(group: string, rh: "POSITIVE" | "NEGATIVE"): string {
  return `${group}${rh === "POSITIVE" ? "+" : "-"}`;
}

/** Haversine great-circle distance in km. */
export function distanceKm(aLat?: number | null, aLng?: number | null, bLat?: number | null, bLng?: number | null): number | null {
  if (aLat == null || aLng == null || bLat == null || bLng == null) return null;
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

export function etaMinutes(distance: number | null): number | null {
  if (distance == null) return null;
  return Math.max(2, Math.round((distance / AVG_SPEED_KMH) * 60) + 4); // +4 min mobilisation
}

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Core service: filter + rank donors for a request.
 * Returns matches sorted best-first.
 */
export function rankDonors(request: RequestInput, donors: DonorInput[]): MatchResult[] {
  const recipient = parseBloodType(request.bloodGroupNeeded);
  if (!recipient) return [];
  const radius = request.radius ?? 25;

  const results: MatchResult[] = [];

  for (const d of donors) {
    const donorType: BloodType = { group: d.group as BloodType["group"], rh: d.rh };

    // 1. Blood-type compatibility (hard filter)
    if (!isCompatible(donorType, recipient)) continue;

    // 2. Availability + eligibility (hard filter)
    if (d.availabilityStatus !== "AVAILABLE") continue;
    if (d.eligibilityStatus !== "ELIGIBLE") continue;

    // 3. Recent-donation history (hard filter)
    const since = daysSince(d.lastDonationDate);
    if (since != null && since < MIN_DONATION_INTERVAL_DAYS) continue;

    // 4. Distance (filter to request radius ∩ donor willingness)
    const dist = distanceKm(request.latitude, request.longitude, d.latitude, d.longitude);
    const donorWilling = d.searchRadius ?? 25;
    if (dist != null && (dist > radius || dist > donorWilling)) continue;

    // ── Scoring (0–100) ──
    let score = 0;
    // Exact ABO/Rh match is preferred over universal-but-scarce O-negative.
    const exact = donorType.group === recipient.group && donorType.rh === recipient.rh;
    score += exact ? 45 : 30;
    // Proximity (closer = better). Unknown distance gets a neutral mid score.
    if (dist == null) score += 20;
    else score += Math.max(0, 30 * (1 - dist / Math.max(radius, 1)));
    // Donation recency (longer since last donation = fresher eligibility)
    if (since == null) score += 15;
    else score += Math.min(15, ((since - MIN_DONATION_INTERVAL_DAYS) / 120) * 15 + 7.5);
    // Universal O-negative donors get a small bonus for flexibility
    if (donorType.group === "O" && donorType.rh === "NEGATIVE") score += 5;

    results.push({
      donorId: d.id,
      matchScore: Math.round(Math.min(100, Math.max(0, score)) * 10) / 10,
      distanceKm: dist,
      etaMinutes: etaMinutes(dist),
      donorBloodType: formatBloodType(d.group, d.rh),
    });
  }

  // Rank: score desc, then distance asc.
  return results.sort((a, b) => b.matchScore - a.matchScore || (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
}

/** How many donors to alert first, scaled by urgency. */
export function notifyBatchSize(urgency: RequestInput["urgency"]): number {
  return { LOW: 3, MEDIUM: 5, HIGH: 8, CRITICAL: 15 }[urgency];
}
