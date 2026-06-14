import { generateBriefings, type ContinuityInput } from "./ai-summary";

/**
 * Demo fixtures for the Global Health Identity Network (preview / no-DB mode).
 * Built around the existing demo patient "Nimal Perera" (CKD Stage 4).
 */

const agoDays = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString();
};
const inDays = (d: number) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString();
};

export const demoGlobalId = {
  globalId: "HLX-LK-7F3A-9KQ2",
  emergencyToken: "demo-emergency-token",
  organDonor: true,
  passportVersion: 3,
};

export const demoPassport = {
  fullName: "Nimal Perera",
  dateOfBirth: "1968-03-12",
  age: 58,
  bloodGroup: "O+",
  organDonor: true,
  district: "Colombo",
  allergies: ["Penicillin", "Contrast dye (iodine)"],
  chronicConditions: ["Chronic Kidney Disease — Stage 4", "Hypertension"],
  medications: [
    { drugName: "Amlodipine", dosage: "5mg", times: ["08:00"] },
    { drugName: "Erythropoietin", dosage: "4000 IU", times: ["20:00"] },
    { drugName: "Calcium carbonate", dosage: "500mg", times: ["08:00", "20:00"] },
  ],
  surgeries: [
    { name: "AV fistula creation (left arm)", performedAt: agoDays(420), hospital: "Asiri Medical Hospital" },
    { name: "Appendectomy", performedAt: agoDays(5200), hospital: "National Hospital Colombo" },
  ],
  implants: ["AV fistula (left forearm)"],
  dialysis: { centerName: "Asiri Dialysis Unit", sessionsPerWeek: 3, nextSession: inDays(1), status: "ACTIVE" as const },
  emergencyContacts: [
    { name: "Kumari Perera", relationship: "Wife", phone: "+94770000099", isPrimary: true },
    { name: "Dr. Anjali Silva", relationship: "Nephrologist", phone: "+94771112233", isPrimary: false },
  ],
  insurance: [
    { insurer: "Ceylinco Health", policy: "••••••  4821", coverage: "In-patient + dialysis", validUntil: inDays(210) },
  ],
};

export const demoProviders = [
  { id: "pr1", name: "Asiri Medical Hospital", type: "HOSPITAL" as const, status: "APPROVED" as const, country: "LK", city: "Colombo", licenseNumber: "MOH-COL-1182" },
  { id: "pr2", name: "Nawaloka Pharmacy", type: "PHARMACY" as const, status: "APPROVED" as const, country: "LK", city: "Colombo", licenseNumber: "NMRA-PH-4471" },
  { id: "pr3", name: "Lanka Diagnostics Lab", type: "LABORATORY" as const, status: "VERIFIED" as const, country: "LK", city: "Kandy", licenseNumber: "MOH-LAB-2290" },
  { id: "pr4", name: "Gulf Emergency Center", type: "EMERGENCY_CENTER" as const, status: "PENDING_VERIFICATION" as const, country: "AE", city: "Dubai", licenseNumber: "DHA-EC-7781" },
  { id: "pr5", name: "St. Thomas Clinic", type: "CLINIC" as const, status: "REGISTERED" as const, country: "GB", city: "London", licenseNumber: "CQC-19922" },
];

export const demoGrants = [
  { id: "g1", provider: demoProviders[0], scope: "FULL_RECORDS" as const, status: "APPROVED" as const, grantedAt: agoDays(120) },
  { id: "g2", provider: demoProviders[1], scope: "SUMMARY" as const, status: "APPROVED" as const, grantedAt: agoDays(40) },
  { id: "g3", provider: demoProviders[2], scope: "SUMMARY" as const, status: "PENDING" as const, grantedAt: null },
  { id: "g4", provider: demoProviders[3], scope: "EMERGENCY_ONLY" as const, status: "REVOKED" as const, grantedAt: agoDays(15) },
];

export const demoEmergencyLog = [
  { id: "e1", actorName: "Dr. Sara Al Mansoori", provider: "Gulf Emergency Center", reason: "UNCONSCIOUS_PATIENT", verificationMethod: "FACE", scope: "EMERGENCY_ONLY", location: "Dubai, AE", createdAt: agoDays(15), hash: "9af1c0e2b7d4…", prevHash: "GENESIS" },
  { id: "e2", actorName: "Paramedic Unit 7", provider: "Colombo Ambulance Service", reason: "LIFE_THREATENING", verificationMethod: "QR_CODE", scope: "EMERGENCY_ONLY", location: "Colombo, LK", createdAt: agoDays(220), hash: "1b77de93aa02…", prevHash: "9af1c0e2b7d4…" },
];

export const demoStandardEvents = [
  { id: "s1", source: "HL7_FHIR" as const, type: "OBSERVATION" as const, title: "eGFR 18 mL/min/1.73m²", occurredAt: agoDays(20), originName: "Asiri Labs", originCountry: "LK" },
  { id: "s2", source: "NHS" as const, type: "CONDITION" as const, title: "Hypertension (essential)", occurredAt: agoDays(900), originName: "NHS Summary Care Record", originCountry: "GB" },
  { id: "s3", source: "HL7_FHIR" as const, type: "IMMUNIZATION" as const, title: "Influenza vaccine", occurredAt: agoDays(200), originName: "Gulf Emergency Center", originCountry: "AE" },
  { id: "s4", source: "CDA" as const, type: "PROCEDURE" as const, title: "Haemodialysis session", occurredAt: agoDays(2), originName: "Asiri Dialysis Unit", originCountry: "LK" },
  { id: "s5", source: "PDF_UPLOAD" as const, type: "ENCOUNTER" as const, title: "Discharge summary — nephrology", occurredAt: agoDays(60), originName: "Asiri Medical Hospital", originCountry: "LK" },
];

/** Build the engine input for the demo patient and run the real summary engine. */
export function demoContinuityInput(): ContinuityInput {
  return {
    fullName: demoPassport.fullName,
    age: demoPassport.age,
    bloodGroup: demoPassport.bloodGroup,
    allergies: demoPassport.allergies,
    chronicConditions: demoPassport.chronicConditions,
    medications: demoPassport.medications,
    surgeries: demoPassport.surgeries.map((s) => ({ name: s.name, performedAt: s.performedAt })),
    dialysis: demoPassport.dialysis,
    recentEvents: demoStandardEvents.map((e) => ({ title: e.title, occurredAt: e.occurredAt, type: e.type })),
    organDonor: demoPassport.organDonor,
  };
}

export const demoBriefings = generateBriefings(demoContinuityInput());

export const demoAdminProviderStats = {
  total: 5,
  approved: 2,
  pending: 2,
  countries: 3,
};

// ── XeivoraMed demo fixtures ──────────────────────────────────────────
import { deriveGraph, doctorBriefing, riskSummary } from "./memory";

const _input = demoContinuityInput();
export const demoMemoryGraph = deriveGraph(_input);
export const demoDoctorBriefing = doctorBriefing(_input);
export const demoRiskSummary = riskSummary(_input);

const ago = (d: number) => { const x = new Date(); x.setDate(x.getDate() - d); return x.toISOString(); };
const ahead = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString(); };

export const demoWallet = [
  { id: "w1", type: "HEALTH_PASSPORT" as const, title: "XeivoraMed Passport", issuer: "XeivoraMed", verified: true, validUntil: null },
  { id: "w2", type: "INSURANCE" as const, title: "Ceylinco Health — In-patient + dialysis", issuer: "Ceylinco", verified: true, validUntil: ahead(210) },
  { id: "w3", type: "VACCINATION" as const, title: "COVID-19 (3 doses) + Influenza", issuer: "Ministry of Health", verified: true, validUntil: null },
  { id: "w4", type: "TRAVEL_DOCUMENT" as const, title: "Yellow Fever certificate", issuer: "WHO", verified: true, validUntil: ahead(3000) },
  { id: "w5", type: "PRESCRIPTION" as const, title: "Active prescription — Mar 2026", issuer: "Dr. Anjali Silva", verified: true, validUntil: ahead(20) },
  { id: "w6", type: "CERTIFICATE" as const, title: "Fitness-to-travel certificate", issuer: "Asiri Medical", verified: false, validUntil: ahead(45) },
];

export const demoFamily = [
  { id: "f1", name: "Sanduni Perera", relationship: "CHILD" as const, dateOfBirth: "2014-05-02", notes: "Asthma — inhaler PRN" },
  { id: "f2", name: "Wimal Perera", relationship: "ELDER" as const, dateOfBirth: "1942-11-20", notes: "Parkinson's; primary caregiver: Nimal" },
];

export const demoIdentityDocs = [
  { id: "i1", type: "NIC" as const, country: "LK", number: "••••••  1968V", verified: true, validUntil: null },
  { id: "i2", type: "PASSPORT" as const, country: "LK", number: "N••••••72", verified: true, validUntil: ahead(1400) },
  { id: "i3", type: "VACCINATION_PASSPORT" as const, country: "LK", number: "WHO-LK-••••", verified: true, validUntil: null },
];

export const demoTravelProfile = {
  bloodGroup: "O+",
  conditions: ["Chronic Kidney Disease — Stage 4", "Hypertension"],
  destinations: ["United Arab Emirates", "United Kingdom"],
  vaccinations: ["COVID-19", "Influenza", "Yellow Fever"],
  emergencyNotes: "On dialysis 3×/week — arrange visitor dialysis at destination.",
};

export const demoScribeSession = {
  id: "sc1",
  specialty: "NEPHROLOGY" as const,
  patientName: "Nimal Perera",
  doctorName: "Dr. Anjali Silva",
  status: "DRAFTED" as const,
  transcript:
    "Doctor: Good morning Nimal, how have you been since your last dialysis?\n" +
    "Patient: A bit tired, and my ankles have been swelling in the evenings.\n" +
    "Patient: I have been taking the amlodipine 5mg every morning.\n" +
    "Doctor: On exam there is mild pedal oedema, blood pressure 148 over 90.\n" +
    "Doctor: Plan is to review fluid removal at next dialysis and recheck potassium.\n" +
    "Doctor: I will refer to cardiology to assess the oedema and arrange follow-up in two weeks.",
};

export const demoScribeUsage = [
  { id: "su1", doctorName: "Dr. Anjali Silva", patientName: "Nimal Perera", specialty: "NEPHROLOGY", noteType: "SOAP", status: "FINALIZED", createdAt: ago(0) },
  { id: "su2", doctorName: "Dr. Rohan Jayasuriya", patientName: "Sunethra Bandara", specialty: "CARDIOLOGY", noteType: "CONSULTATION", status: "UNDER_REVIEW", createdAt: ago(1) },
  { id: "su3", doctorName: "Dr. Anjali Silva", patientName: "Mohamed Rizwan", specialty: "ENDOCRINOLOGY", noteType: "REFERRAL_LETTER", status: "FINALIZED", createdAt: ago(2) },
  { id: "su4", doctorName: "Dr. Rohan Jayasuriya", patientName: "Priya Kandasamy", specialty: "GENERAL_PRACTICE", noteType: "DISCHARGE_SUMMARY", status: "DRAFTED", createdAt: ago(3) },
];

export const demoBiometricCredentials = [
  { id: "bc1", type: "FACE" as const, provider: "demo-sdk", status: "VERIFIED" as const },
  { id: "bc2", type: "FINGERPRINT" as const, provider: "demo-sdk", status: "VERIFIED" as const },
];

// ── Verified Emergency Medical Passport: per-item provenance (demo) ──────────
// Critical-first ordering; mixed trust levels to show how data is distinguished.
export const demoVerifiedItems = [
  { label: "Blood Group", value: "O+", level: "VERIFIED" as const, source: "National Blood Centre report", dateVerified: "12 Mar 2026", critical: true },
  { label: "Allergy", value: "Penicillin", level: "VERIFIED" as const, source: "Asiri Medical Hospital", dateVerified: "04 Feb 2026", critical: true },
  { label: "Allergy", value: "Contrast dye (iodine)", level: "DOCUMENT_VERIFIED" as const, source: "Radiology report (uploaded)", dateVerified: "18 Jan 2026", critical: true },
  { label: "Current medication", value: "Amlodipine 5mg", level: "DOCUMENT_VERIFIED" as const, source: "Prescription — Mar 2026 (uploaded)", dateVerified: "02 Mar 2026", critical: true },
  { label: "Current medication", value: "Erythropoietin 4000 IU", level: "VERIFIED" as const, source: "Asiri Dialysis Unit", dateVerified: "06 Jun 2026", critical: true },
  { label: "Chronic condition", value: "Chronic Kidney Disease — Stage 4", level: "VERIFIED" as const, source: "Nephrology — Dr. Anjali Silva", dateVerified: "10 Apr 2026", critical: true },
  { label: "Chronic condition", value: "Hypertension", level: "DOCUMENT_VERIFIED" as const, source: "Discharge summary (uploaded)", dateVerified: "09 Apr 2026", critical: false },
  { label: "Previous surgery", value: "AV fistula creation (left arm)", level: "VERIFIED" as const, source: "Asiri Medical Hospital", dateVerified: "14 Apr 2025", critical: false },
  { label: "Previous surgery", value: "Appendectomy", level: "SELF_REPORTED" as const, source: "Entered by patient", dateVerified: null, critical: false },
];
