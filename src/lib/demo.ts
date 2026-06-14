import type { SessionUser } from "./auth";

/**
 * Demo fixtures used when the app runs without Postgres/Supabase (preview & local).
 * Mirrors the production data shapes consumed by the dashboards so the UI is identical.
 */

export const demoUsers: Record<"patient" | "doctor" | "staff" | "admin", SessionUser> = {
  patient: {
    id: "demo-patient",
    email: "nimal@example.lk",
    fullName: "Nimal Perera",
    role: "PATIENT",
    language: "EN",
    patientProfileId: "demo-patient-profile",
  },
  doctor: {
    id: "demo-doctor",
    email: "dr.silva@example.lk",
    fullName: "Dr. Anjali Silva",
    role: "DOCTOR",
    language: "EN",
    doctorProfileId: "demo-doctor-profile",
    clinicId: "demo-clinic",
  },
  staff: {
    id: "demo-staff",
    email: "reception@asiri.lk",
    fullName: "Kamala Fernando",
    role: "CLINIC_STAFF",
    language: "EN",
    clinicId: "demo-clinic",
  },
  admin: {
    id: "demo-admin",
    email: "admin@sehat.lk",
    fullName: "System Admin",
    role: "ADMIN",
    language: "EN",
  },
};

const now = new Date();
const inDays = (d: number, h = 9, m = 0) => {
  const x = new Date(now);
  x.setDate(x.getDate() + d);
  x.setHours(h, m, 0, 0);
  return x;
};
const agoDays = (d: number) => inDays(-d);

export const demoDashboard = {
  patient: { fullName: "Nimal Perera", bloodGroup: "O+", district: "Colombo" },
  upcomingAppointments: [
    {
      id: "a1",
      doctorName: "Dr. Anjali Silva",
      specialty: "Nephrology",
      clinicName: "Asiri Medical Hospital",
      type: "IN_PERSON" as const,
      status: "CONFIRMED" as const,
      scheduledAt: inDays(2, 10, 30).toISOString(),
      reason: "Kidney function review",
    },
    {
      id: "a2",
      doctorName: "Dr. Rohan Jayasuriya",
      specialty: "Cardiology",
      clinicName: "Nawaloka Hospital",
      type: "VIDEO" as const,
      status: "REQUESTED" as const,
      scheduledAt: inDays(6, 14, 0).toISOString(),
      reason: "Follow-up on BP medication",
    },
  ],
  medications: [
    { id: "m1", drugName: "Amlodipine", dosage: "5mg", times: ["08:00"], adherencePct: 92, nextDose: inDays(0, 8, 0).toISOString() },
    { id: "m2", drugName: "Erythropoietin", dosage: "4000 IU", times: ["20:00"], adherencePct: 78, nextDose: inDays(0, 20, 0).toISOString() },
    { id: "m3", drugName: "Calcium carbonate", dosage: "500mg", times: ["08:00", "20:00"], adherencePct: 85, nextDose: inDays(0, 20, 0).toISOString() },
  ],
  dialysis: {
    centerName: "Asiri Dialysis Unit",
    sessionsPerWeek: 3,
    nextSession: inDays(1, 8, 0).toISOString(),
    lastStatus: "COMPLETED" as const,
    upcoming: [
      { id: "d1", scheduledAt: inDays(1, 8, 0).toISOString(), status: "SCHEDULED" as const },
      { id: "d2", scheduledAt: inDays(3, 8, 0).toISOString(), status: "SCHEDULED" as const },
      { id: "d3", scheduledAt: inDays(5, 8, 0).toISOString(), status: "SCHEDULED" as const },
    ],
  },
  followUps: [
    { id: "f1", reason: "Nephrology review", interval: "THREE_MONTHS" as const, dueDate: inDays(20).toISOString() },
    { id: "f2", reason: "Annual health check", interval: "ANNUAL" as const, dueDate: inDays(120).toISOString() },
  ],
  recentRecords: [
    { id: "r1", title: "Serum Creatinine Panel", category: "LAB_REPORT" as const, recordDate: agoDays(4).toISOString(), mimeType: "application/pdf" },
    { id: "r2", title: "Renal Ultrasound", category: "SCAN" as const, recordDate: agoDays(18).toISOString(), mimeType: "image/jpeg" },
    { id: "r3", title: "Prescription — Mar 2026", category: "PRESCRIPTION" as const, recordDate: agoDays(30).toISOString(), mimeType: "application/pdf" },
  ],
  timeline: [
    { id: "t1", type: "LAB_TEST" as const, title: "Serum Creatinine: 4.2 mg/dL", occurredAt: agoDays(4).toISOString(), doctorName: "Dr. Anjali Silva" },
    { id: "t2", type: "TREATMENT" as const, title: "Hemodialysis session completed", occurredAt: agoDays(5).toISOString(), doctorName: null },
    { id: "t3", type: "DIAGNOSIS" as const, title: "Chronic Kidney Disease, Stage 4", occurredAt: agoDays(60).toISOString(), doctorName: "Dr. Anjali Silva" },
    { id: "t4", type: "VISIT" as const, title: "Cardiology consultation", occurredAt: agoDays(90).toISOString(), doctorName: "Dr. Rohan Jayasuriya" },
  ],
};

export const demoDoctor = {
  todayAppointments: [
    { id: "a1", patientName: "Nimal Perera", time: inDays(0, 10, 30).toISOString(), reason: "Kidney function review", status: "CONFIRMED" as const, type: "IN_PERSON" as const },
    { id: "a3", patientName: "Sunethra Bandara", time: inDays(0, 11, 15).toISOString(), reason: "Post-op follow-up", status: "CHECKED_IN" as const, type: "IN_PERSON" as const },
    { id: "a4", patientName: "Mohamed Rizwan", time: inDays(0, 14, 0).toISOString(), reason: "Lab results discussion", status: "CONFIRMED" as const, type: "VIDEO" as const },
  ],
  upcoming: [
    { id: "a5", patientName: "Priya Kandasamy", time: inDays(1, 9, 0).toISOString(), reason: "Routine review", status: "REQUESTED" as const, type: "IN_PERSON" as const },
    { id: "a6", patientName: "Nimal Perera", time: inDays(2, 10, 30).toISOString(), reason: "Dialysis adequacy", status: "CONFIRMED" as const, type: "IN_PERSON" as const },
  ],
  patients: [
    { id: "p1", name: "Nimal Perera", age: 58, condition: "CKD Stage 4", lastVisit: agoDays(5).toISOString() },
    { id: "p2", name: "Sunethra Bandara", age: 64, condition: "Hypertension", lastVisit: agoDays(12).toISOString() },
    { id: "p3", name: "Mohamed Rizwan", age: 47, condition: "Type 2 Diabetes", lastVisit: agoDays(20).toISOString() },
    { id: "p4", name: "Priya Kandasamy", age: 39, condition: "Anemia", lastVisit: agoDays(33).toISOString() },
  ],
};

export const demoClinic = {
  name: "Asiri Medical Hospital",
  stats: { today: 28, waiting: 6, missed: 3, doctorsOnDuty: 9 },
  queue: [
    { number: 1, patientName: "Sunethra Bandara", doctor: "Dr. Anjali Silva", status: "IN_ROOM" as const, waitMins: 0 },
    { number: 2, patientName: "Nimal Perera", doctor: "Dr. Anjali Silva", status: "WAITING" as const, waitMins: 12 },
    { number: 3, patientName: "Arun Thomas", doctor: "Dr. Rohan Jayasuriya", status: "WAITING" as const, waitMins: 18 },
    { number: 4, patientName: "Fathima Nazeer", doctor: "Dr. Rohan Jayasuriya", status: "CALLED" as const, waitMins: 25 },
  ],
  missed: [
    { patientName: "Gamini Wickrama", time: agoDays(0).toISOString(), doctor: "Dr. Anjali Silva" },
    { patientName: "Saman Kumara", time: agoDays(1).toISOString(), doctor: "Dr. Rohan Jayasuriya" },
  ],
};

export const demoAdmin = {
  // No fabricated usage stats or simulated growth — admin analytics are computed
  // from real database rows (see lib/analytics.ts). Only sample announcements remain.
  recentAnnouncements: [
    { id: "an1", title: "Dengue prevention drive", channel: "SMS" as const, audience: "DISTRICT:Colombo", sentCount: 0, sentAt: agoDays(2).toISOString() },
    { id: "an2", title: "Free renal screening camp", channel: "WHATSAPP" as const, audience: "ALL", sentCount: 0, sentAt: agoDays(9).toISOString() },
  ],
};
