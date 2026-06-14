/**
 * Seed data for Sehat.lk.
 * Creates clinics, doctors, staff, an admin and patients with appointments,
 * medications, a dialysis plan, follow-ups, records, timeline events and reminders.
 *
 * Run:  npm run db:seed
 *
 * Note: in production, auth identities live in Supabase. This seed sets `supabaseId`
 * to deterministic placeholders so the rows are linkable; wire real Supabase users
 * via the Admin API for a live environment.
 */
import { PrismaClient } from "@prisma/client";
import { addDays, addHours, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

function at(daysFromNow: number, hour: number, minute = 0): Date {
  return setMinutes(setHours(addDays(new Date(), daysFromNow), hour), minute);
}

async function main() {
  console.log("🌱 Seeding Sehat.lk…");

  // Clean (dev only) — order respects FKs.
  await prisma.reminder.deleteMany();
  await prisma.medicationDose.deleteMany();
  await prisma.medicationPlan.deleteMany();
  await prisma.dialysisSession.deleteMany();
  await prisma.dialysisPlan.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.clinicPatient.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.staffProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.user.deleteMany();

  // ── Clinics ──
  const asiri = await prisma.clinic.create({
    data: { name: "Asiri Medical Hospital", type: "HOSPITAL", city: "Colombo", district: "Colombo", phone: "+94114665500", email: "info@asiri.lk" },
  });
  const dialysisCenter = await prisma.clinic.create({
    data: { name: "Asiri Dialysis Unit", type: "DIALYSIS_CENTER", city: "Colombo", district: "Colombo" },
  });

  // ── Admin ──
  await prisma.user.create({
    data: {
      supabaseId: "seed-admin", email: "admin@sehat.lk", fullName: "System Admin",
      role: "ADMIN", notificationPrefs: { create: {} },
    },
  });

  // ── Doctors ──
  const drSilva = await prisma.user.create({
    data: {
      supabaseId: "seed-dr-silva", email: "dr.silva@asiri.lk", phone: "+94771112233",
      fullName: "Dr. Anjali Silva", role: "DOCTOR",
      notificationPrefs: { create: {} },
      doctor: { create: { slmcNumber: "SLMC-21345", specialty: "Nephrology", qualifications: "MBBS, MD (Nephrology)", clinicId: asiri.id, consultationFee: 350000 } },
    },
    include: { doctor: true },
  });
  const drJay = await prisma.user.create({
    data: {
      supabaseId: "seed-dr-jay", email: "dr.jay@asiri.lk", phone: "+94772223344",
      fullName: "Dr. Rohan Jayasuriya", role: "DOCTOR",
      notificationPrefs: { create: {} },
      doctor: { create: { slmcNumber: "SLMC-19876", specialty: "Cardiology", qualifications: "MBBS, MD (Cardiology)", clinicId: asiri.id, consultationFee: 400000 } },
    },
    include: { doctor: true },
  });

  // Availability (Mon–Fri mornings)
  for (const doc of [drSilva.doctor!, drJay.doctor!]) {
    for (let d = 1; d <= 5; d++) {
      await prisma.availabilitySlot.create({
        data: { doctorId: doc.id, dayOfWeek: d, startTime: "09:00", endTime: "12:00", slotMins: 15 },
      });
    }
  }

  // ── Clinic staff ──
  await prisma.user.create({
    data: {
      supabaseId: "seed-staff", email: "reception@asiri.lk", phone: "+94773334455",
      fullName: "Kamala Fernando", role: "CLINIC_STAFF",
      notificationPrefs: { create: {} },
      staff: { create: { clinicId: asiri.id, jobTitle: "Front desk" } },
    },
  });

  // ── Patients ──
  const nimalUser = await prisma.user.create({
    data: {
      supabaseId: "seed-nimal", email: "nimal@example.lk", phone: "+94770000001",
      fullName: "Nimal Perera", role: "PATIENT", language: "EN",
      notificationPrefs: { create: { sms: true, whatsapp: true, push: true, leadTimeMins: 1440 } },
      patient: {
        create: {
          dateOfBirth: new Date("1968-03-12"), gender: "MALE", bloodGroup: "O+",
          city: "Colombo", district: "Colombo", emergencyName: "Kumari Perera", emergencyPhone: "+94770000099",
          chronicConditions: ["Chronic Kidney Disease", "Hypertension"], allergies: ["Penicillin"],
        },
      },
    },
    include: { patient: true },
  });
  const nimal = nimalUser.patient!;

  const priyaUser = await prisma.user.create({
    data: {
      supabaseId: "seed-priya", email: "priya@example.lk", phone: "+94770000002",
      fullName: "Priya Kandasamy", role: "PATIENT", language: "TA",
      notificationPrefs: { create: { sms: true, whatsapp: true } },
      patient: { create: { dateOfBirth: new Date("1987-07-20"), gender: "FEMALE", bloodGroup: "B+", city: "Jaffna", district: "Jaffna", chronicConditions: ["Anemia"] } },
    },
    include: { patient: true },
  });

  await prisma.clinicPatient.createMany({
    data: [
      { clinicId: asiri.id, patientId: nimal.id },
      { clinicId: asiri.id, patientId: priyaUser.patient!.id },
    ],
  });

  // ── Appointments for Nimal ──
  const appt1 = await prisma.appointment.create({
    data: {
      patientId: nimal.id, doctorId: drSilva.doctor!.id, clinicId: asiri.id,
      type: "IN_PERSON", status: "CONFIRMED", scheduledAt: at(2, 10, 30),
      reason: "Kidney function review",
    },
  });
  await prisma.appointment.create({
    data: {
      patientId: nimal.id, doctorId: drJay.doctor!.id, clinicId: asiri.id,
      type: "VIDEO", status: "REQUESTED", scheduledAt: at(6, 14, 0),
      reason: "Follow-up on BP medication",
    },
  });
  await prisma.appointment.create({
    data: {
      patientId: nimal.id, doctorId: drSilva.doctor!.id, clinicId: asiri.id,
      type: "IN_PERSON", status: "COMPLETED", scheduledAt: at(-30, 10, 0),
      reason: "Routine review", completedAt: at(-30, 10, 30),
    },
  });

  // ── Medications ──
  const meds = [
    { drugName: "Amlodipine", dosage: "5mg", times: ["08:00"] },
    { drugName: "Erythropoietin", dosage: "4000 IU", times: ["20:00"] },
    { drugName: "Calcium carbonate", dosage: "500mg", times: ["08:00", "20:00"] },
  ];
  for (const m of meds) {
    const plan = await prisma.medicationPlan.create({
      data: { patientId: nimal.id, drugName: m.drugName, dosage: m.dosage, times: m.times, startDate: at(-20, 8), isActive: true },
    });
    // Generate 14 days of doses with mostly-taken adherence.
    for (let d = -13; d <= 0; d++) {
      for (const time of m.times) {
        const [h, min] = time.split(":").map(Number);
        const taken = Math.random() > 0.12;
        await prisma.medicationDose.create({
          data: {
            planId: plan.id, scheduledAt: at(d, h, min),
            status: d === 0 ? "PENDING" : taken ? "TAKEN" : "MISSED",
            takenAt: d < 0 && taken ? at(d, h, min) : null,
          },
        });
      }
    }
  }

  // ── Dialysis plan + sessions (Mon/Wed/Fri 8am) ──
  const dialysis = await prisma.dialysisPlan.create({
    data: { patientId: nimal.id, centerName: "Asiri Dialysis Unit", sessionsPerWeek: 3, weekdays: [1, 3, 5], startTime: "08:00", durationMins: 240 },
  });
  for (const offset of [-4, -2, 1, 3, 5]) {
    await prisma.dialysisSession.create({
      data: {
        planId: dialysis.id, scheduledAt: at(offset, 8, 0),
        status: offset < 0 ? "COMPLETED" : "SCHEDULED",
        completedAt: offset < 0 ? addHours(at(offset, 8, 0), 4) : null,
      },
    });
  }

  // ── Follow-ups ──
  await prisma.followUp.create({
    data: { patientId: nimal.id, doctorId: drSilva.doctor!.id, interval: "THREE_MONTHS", dueDate: at(20, 9), reason: "Nephrology review" },
  });
  await prisma.followUp.create({
    data: { patientId: nimal.id, interval: "ANNUAL", dueDate: at(120, 9), reason: "Annual health check" },
  });

  // ── Records ──
  const rec = await prisma.medicalRecord.create({
    data: {
      patientId: nimal.id, uploadedById: drSilva.id, title: "Serum Creatinine Panel",
      category: "LAB_REPORT", s3Key: "patients/seed/records/creatinine.pdf",
      mimeType: "application/pdf", sizeBytes: 240_000, recordDate: at(-4, 9), tags: ["renal", "bloodwork"],
    },
  });
  await prisma.medicalRecord.create({
    data: {
      patientId: nimal.id, uploadedById: drSilva.id, title: "Renal Ultrasound",
      category: "SCAN", s3Key: "patients/seed/records/ultrasound.jpg",
      mimeType: "image/jpeg", sizeBytes: 1_200_000, recordDate: at(-18, 11),
    },
  });

  // ── Timeline + diagnosis ──
  const dxEvent = await prisma.timelineEvent.create({
    data: {
      patientId: nimal.id, type: "DIAGNOSIS", title: "Chronic Kidney Disease, Stage 4",
      occurredAt: at(-60, 10), doctorId: drSilva.doctor!.id, authorId: drSilva.id,
    },
  });
  await prisma.diagnosis.create({
    data: { timelineEventId: dxEvent.id, doctorId: drSilva.doctor!.id, icd10Code: "N18.4", condition: "CKD Stage 4", severity: "Severe" },
  });
  await prisma.timelineEvent.create({
    data: { patientId: nimal.id, type: "LAB_TEST", title: "Serum Creatinine: 4.2 mg/dL", occurredAt: at(-4, 9), doctorId: drSilva.doctor!.id, recordId: rec.id },
  });
  await prisma.timelineEvent.create({
    data: { patientId: nimal.id, type: "TREATMENT", title: "Hemodialysis session completed", occurredAt: at(-4, 8) },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // GLOBAL HEALTH IDENTITY NETWORK seed (additive)
  // Self-contained (no @/ alias imports) so `tsx` runs it without path config.
  // ══════════════════════════════════════════════════════════════════════════
  const { randomBytes, randomUUID, createHash } = await import("node:crypto");
  const grp = (n: number) => Array.from(randomBytes(n)).map((b) => "0123456789ABCDEFGHJKMNPQRSTVWXYZ"[b % 32]).join("");
  const generateGlobalId = (cc = "LK") => `HLX-${cc}-${grp(4)}-${grp(4)}`;
  const generateEmergencyToken = () => `${randomUUID()}.${randomBytes(16).toString("base64url")}`;

  // Module 1 — Global Health ID + passport extras for Nimal
  await prisma.globalHealthId.create({
    data: {
      patientId: nimal.id,
      globalId: generateGlobalId("LK"),
      emergencyToken: generateEmergencyToken(),
      organDonor: true,
      implants: ["AV fistula (left forearm)"],
    },
  });
  await prisma.emergencyContact.createMany({
    data: [
      { patientId: nimal.id, name: "Kumari Perera", relationship: "Wife", phone: "+94770000099", isPrimary: true },
      { patientId: nimal.id, name: "Dr. Anjali Silva", relationship: "Nephrologist", phone: "+94771112233" },
    ],
  });
  await prisma.surgery.createMany({
    data: [
      { patientId: nimal.id, name: "AV fistula creation (left arm)", performedAt: at(-420, 9), hospital: "Asiri Medical Hospital" },
      { patientId: nimal.id, name: "Appendectomy", performedAt: at(-5200, 9), hospital: "National Hospital Colombo" },
    ],
  });

  // Module 4 — Provider network (mix of countries + verification states)
  const asiriProvider = await prisma.provider.create({
    data: { name: "Asiri Medical Hospital", type: "HOSPITAL", status: "APPROVED", country: "LK", city: "Colombo", licenseNumber: "MOH-COL-1182", clinicId: asiri.id, verifiedAt: at(-200, 9) },
  });
  const gulf = await prisma.provider.create({
    data: { name: "Gulf Emergency Center", type: "EMERGENCY_CENTER", status: "PENDING_VERIFICATION", country: "AE", city: "Dubai", licenseNumber: "DHA-EC-7781" },
  });
  await prisma.provider.create({
    data: { name: "St. Thomas Clinic", type: "CLINIC", status: "REGISTERED", country: "GB", city: "London", licenseNumber: "CQC-19922" },
  });

  // Module 3 — consent grants
  await prisma.providerAccessGrant.create({
    data: { patientId: nimal.id, providerId: asiriProvider.id, scope: "FULL_RECORDS", status: "APPROVED", grantedAt: at(-120, 9) },
  });

  // Module 5 — one immutable emergency-access entry (hash-chain genesis)
  const genesisPayload = {
    patientId: nimal.id, providerId: gulf.id, actorName: "Dr. Sara Al Mansoori",
    reason: "UNCONSCIOUS_PATIENT" as const, scope: "EMERGENCY_ONLY" as const, location: "Dubai, AE",
  };
  const genesisAt = at(-15, 9);
  const genesisHash = createHash("sha256").update(`GENESIS|${genesisAt.toISOString()}|${JSON.stringify(genesisPayload)}`).digest("hex");
  await prisma.emergencyAccessLog.create({
    data: { ...genesisPayload, prevHash: null, hash: genesisHash, createdAt: genesisAt },
  });

  // Module 6 — international / cross-provider standardized events
  await prisma.standardizedHealthEvent.createMany({
    data: [
      { patientId: nimal.id, source: "NHS", type: "CONDITION", title: "Hypertension (essential)", occurredAt: at(-900, 9), originName: "NHS Summary Care Record", originCountry: "GB" },
      { patientId: nimal.id, source: "HL7_FHIR", type: "IMMUNIZATION", title: "Influenza vaccine", occurredAt: at(-200, 9), originName: "Gulf Emergency Center", originCountry: "AE" },
      { patientId: nimal.id, source: "HL7_FHIR", type: "OBSERVATION", title: "eGFR 18 mL/min/1.73m²", occurredAt: at(-20, 9), originName: "Asiri Labs", originCountry: "LK" },
    ],
  });

  // ── A couple of scheduled reminders (the cron worker would send these) ──
  await prisma.reminder.create({
    data: {
      patientId: nimal.id, kind: "APPOINTMENT", channel: "WHATSAPP", status: "SCHEDULED",
      sendAt: at(1, 10, 30), appointmentId: appt1.id,
      message: "Hi Nimal, reminder: Nephrology review tomorrow 10:30 AM at Asiri. — Sehat.lk",
    },
  });
  await prisma.reminder.create({
    data: {
      patientId: nimal.id, kind: "DIALYSIS", channel: "SMS", status: "SCHEDULED",
      sendAt: at(0, 20, 0),
      message: "Dialysis session reminder: tomorrow 8:00 AM at Asiri Dialysis Unit. — Sehat.lk",
    },
  });

  // ── Announcement ──
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  await prisma.announcement.create({
    data: { authorId: admin!.id, title: "Free renal screening camp", body: "Free kidney screening this Saturday at Asiri. Walk in 8am–1pm.", channel: "WHATSAPP", audience: "ALL", sentCount: 12480, sentAt: at(-9, 9) },
  });

  console.log("✅ Seed complete.");
  console.log("   Patients: Nimal Perera (CKD), Priya Kandasamy (Anemia)");
  console.log("   Doctors:  Dr. Anjali Silva (Nephrology), Dr. Rohan Jayasuriya (Cardiology)");
  console.log("   Admin:    admin@sehat.lk   Staff: reception@asiri.lk");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
