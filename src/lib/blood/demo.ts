import { rankDonors, type DonorInput } from "./matching";

/**
 * Emergency Blood Network demo fixtures (preview / no-DB mode).
 * Donor private fields (name, contact) are intentionally separated so the UI can
 * mirror production: hospitals only see them AFTER a donor accepts.
 */

const agoDays = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString();
};

// Colombo-centred coordinates for believable distances.
export const demoHospital = { id: "demo-clinic", name: "Asiri Medical Hospital", latitude: 6.9061, longitude: 79.8612, city: "Colombo" };

// Private donor directory (name/contact never sent to the client pre-acceptance).
export const demoDonors: (DonorInput & { name: string; phone: string; city: string })[] = [
  { id: "d1", name: "Tharindu Fernando", phone: "+94770100001", city: "Colombo 05", group: "O", rh: "NEGATIVE", latitude: 6.8890, longitude: 79.8650, searchRadius: 30, availabilityStatus: "AVAILABLE", eligibilityStatus: "ELIGIBLE", lastDonationDate: agoDays(120) },
  { id: "d2", name: "Ishara Gunawardena", phone: "+94770100002", city: "Dehiwala", group: "O", rh: "NEGATIVE", latitude: 6.8400, longitude: 79.8650, searchRadius: 25, availabilityStatus: "AVAILABLE", eligibilityStatus: "ELIGIBLE", lastDonationDate: agoDays(220) },
  { id: "d3", name: "Mohamed Hassan", phone: "+94770100003", city: "Colombo 03", group: "O", rh: "POSITIVE", latitude: 6.9100, longitude: 79.8500, searchRadius: 20, availabilityStatus: "AVAILABLE", eligibilityStatus: "ELIGIBLE", lastDonationDate: agoDays(90) },
  { id: "d4", name: "Nuwan Silva", phone: "+94770100004", city: "Nugegoda", group: "A", rh: "NEGATIVE", latitude: 6.8650, longitude: 79.8990, searchRadius: 25, availabilityStatus: "RECENTLY_DONATED", eligibilityStatus: "ELIGIBLE", lastDonationDate: agoDays(20) },
  { id: "d5", name: "Kavindi Rajapaksa", phone: "+94770100005", city: "Rajagiriya", group: "O", rh: "NEGATIVE", latitude: 6.9090, longitude: 79.8950, searchRadius: 15, availabilityStatus: "AVAILABLE", eligibilityStatus: "UNDER_REVIEW", lastDonationDate: null },
  { id: "d6", name: "Sanjeewa Perera", phone: "+94770100006", city: "Maharagama", group: "O", rh: "POSITIVE", latitude: 6.8480, longitude: 79.9270, searchRadius: 40, availabilityStatus: "AVAILABLE", eligibilityStatus: "ELIGIBLE", lastDonationDate: agoDays(300) },
  { id: "d7", name: "Dilini Jayawardena", phone: "+94770100007", city: "Galle", group: "O", rh: "NEGATIVE", latitude: 6.0535, longitude: 80.2210, searchRadius: 20, availabilityStatus: "AVAILABLE", eligibilityStatus: "ELIGIBLE", lastDonationDate: agoDays(400) },
];

// The demo patient (Nimal) is the donor's own profile when they enrol.
export const demoMyDonorProfile = {
  bloodGroup: "O",
  rhesusFactor: "POSITIVE" as const,
  city: "Colombo",
  searchRadius: 25,
  availabilityStatus: "AVAILABLE" as const,
  eligibilityStatus: "ELIGIBLE" as const,
  lastDonationDate: agoDays(140),
  verified: true,
};

export const demoBloodRequest = {
  id: "req1",
  hospitalName: demoHospital.name,
  bloodGroupNeeded: "O-",
  unitsRequired: 3,
  urgency: "CRITICAL" as const,
  reason: "Major trauma — RTA, theatre in 30 min",
  location: "Asiri ER, Colombo 05",
  radius: 30,
  status: "MATCHING" as const,
  createdAt: new Date().toISOString(),
};

/** Run the real matching engine over the demo donor pool for the demo request. */
export function demoMatches() {
  const ranked = rankDonors(
    { bloodGroupNeeded: demoBloodRequest.bloodGroupNeeded, latitude: demoHospital.latitude, longitude: demoHospital.longitude, radius: demoBloodRequest.radius, urgency: demoBloodRequest.urgency },
    demoDonors
  );
  // Attach a demo response status to the top matches to show the tracking board.
  const statuses = ["ACCEPTED", "NOTIFIED", "NOTIFIED", "DECLINED"];
  return ranked.map((m, i) => {
    const donor = demoDonors.find((d) => d.id === m.donorId)!;
    const status = statuses[i] ?? "NOTIFIED";
    const revealed = status === "ACCEPTED" || status === "ARRIVED" || status === "DONATED";
    return {
      ...m,
      status,
      // Donor identity is masked unless they've accepted (Part 10 trust & safety).
      donorLabel: revealed ? donor.name : `Donor #${donor.id.toUpperCase()}`,
      donorContact: revealed ? donor.phone : null,
      donorCity: donor.city,
    };
  });
}

export const demoIncomingAlerts = [
  { matchId: "m-incoming", hospitalName: demoHospital.name, bloodType: "O-", distanceKm: 8, urgency: "CRITICAL", status: "NOTIFIED", createdAt: new Date().toISOString() },
];

