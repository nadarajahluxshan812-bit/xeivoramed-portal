-- ════════════════════════════════════════════════════════════════════════════
-- Migration: Global Patient-Controlled Health Identity Network
-- Purely ADDITIVE — no existing table or column is dropped or altered destructively.
-- For an existing database prefer:  npx prisma migrate dev --name global_health_identity
-- (Prisma will generate an equivalent script from the schema diff.)
-- ════════════════════════════════════════════════════════════════════════════

-- ── New enums ───────────────────────────────────────────────────────────────
CREATE TYPE "ProviderType" AS ENUM ('HOSPITAL', 'CLINIC', 'LABORATORY', 'PHARMACY', 'EMERGENCY_CENTER');
CREATE TYPE "ProviderVerificationStatus" AS ENUM ('REGISTERED', 'PENDING_VERIFICATION', 'VERIFIED', 'APPROVED', 'SUSPENDED', 'REJECTED');
CREATE TYPE "AccessGrantStatus" AS ENUM ('PENDING', 'APPROVED', 'REVOKED', 'EXPIRED');
CREATE TYPE "AccessScope" AS ENUM ('EMERGENCY_ONLY', 'SUMMARY', 'FULL_RECORDS');
CREATE TYPE "EmergencyAccessReason" AS ENUM ('UNCONSCIOUS_PATIENT', 'LIFE_THREATENING', 'PATIENT_UNABLE_TO_CONSENT', 'CRITICAL_CARE', 'OTHER');
CREATE TYPE "HealthEventSource" AS ENUM ('HL7_FHIR', 'CDA', 'NHS', 'PDF_UPLOAD', 'INTERNAL');
CREATE TYPE "StandardEventType" AS ENUM ('ENCOUNTER', 'CONDITION', 'MEDICATION', 'PROCEDURE', 'IMMUNIZATION', 'OBSERVATION', 'ALLERGY', 'SURGERY');
CREATE TYPE "AISummaryKind" AS ENUM ('EMERGENCY', 'CHRONIC', 'MEDICATION', 'RECENT_TREATMENT');

-- ── Module 1: Global Health Identity ────────────────────────────────────────
CREATE TABLE "GlobalHealthId" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "globalId" TEXT NOT NULL,
  "emergencyToken" TEXT NOT NULL,
  "organDonor" BOOLEAN NOT NULL DEFAULT false,
  "implants" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sensitiveEncrypted" TEXT,
  "passportVersion" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GlobalHealthId_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GlobalHealthId_patientId_key" ON "GlobalHealthId"("patientId");
CREATE UNIQUE INDEX "GlobalHealthId_globalId_key" ON "GlobalHealthId"("globalId");
CREATE UNIQUE INDEX "GlobalHealthId_emergencyToken_key" ON "GlobalHealthId"("emergencyToken");
CREATE INDEX "GlobalHealthId_globalId_idx" ON "GlobalHealthId"("globalId");

CREATE TABLE "EmergencyContact" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "relationship" TEXT,
  "phone" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EmergencyContact_patientId_idx" ON "EmergencyContact"("patientId");

CREATE TABLE "Surgery" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3),
  "hospital" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Surgery_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Surgery_patientId_performedAt_idx" ON "Surgery"("patientId", "performedAt");

CREATE TABLE "InsurancePolicy" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "insurer" TEXT NOT NULL,
  "policyEncrypted" TEXT NOT NULL,
  "coverage" TEXT,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InsurancePolicy_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InsurancePolicy_patientId_idx" ON "InsurancePolicy"("patientId");

-- ── Module 4: Global Provider Network ───────────────────────────────────────
CREATE TABLE "Provider" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "ProviderType" NOT NULL,
  "status" "ProviderVerificationStatus" NOT NULL DEFAULT 'REGISTERED',
  "country" TEXT NOT NULL DEFAULT 'LK',
  "city" TEXT,
  "licenseNumber" TEXT,
  "registrationEmail" TEXT,
  "registrationPhone" TEXT,
  "clinicId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "verifiedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Provider_type_status_idx" ON "Provider"("type", "status");
CREATE INDEX "Provider_country_idx" ON "Provider"("country");

CREATE TABLE "ProviderMember" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "jobTitle" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProviderMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProviderMember_providerId_userId_key" ON "ProviderMember"("providerId", "userId");

-- ── Module 3: Patient ownership / consent ───────────────────────────────────
CREATE TABLE "ProviderAccessGrant" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "scope" "AccessScope" NOT NULL DEFAULT 'SUMMARY',
  "status" "AccessGrantStatus" NOT NULL DEFAULT 'PENDING',
  "grantedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProviderAccessGrant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProviderAccessGrant_patientId_providerId_key" ON "ProviderAccessGrant"("patientId", "providerId");
CREATE INDEX "ProviderAccessGrant_providerId_status_idx" ON "ProviderAccessGrant"("providerId", "status");

-- ── Module 5: Emergency access — immutable, hash-chained ─────────────────────
CREATE TABLE "EmergencyAccessLog" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "providerId" TEXT,
  "actorUserId" TEXT,
  "actorName" TEXT NOT NULL,
  "reason" "EmergencyAccessReason" NOT NULL,
  "justification" TEXT,
  "scope" "AccessScope" NOT NULL DEFAULT 'EMERGENCY_ONLY',
  "location" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "prevHash" TEXT,
  "hash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmergencyAccessLog_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmergencyAccessLog_hash_key" ON "EmergencyAccessLog"("hash");
CREATE INDEX "EmergencyAccessLog_patientId_createdAt_idx" ON "EmergencyAccessLog"("patientId", "createdAt");
CREATE INDEX "EmergencyAccessLog_providerId_createdAt_idx" ON "EmergencyAccessLog"("providerId", "createdAt");

-- ── Module 6: International record sharing / normalization ───────────────────
CREATE TABLE "StandardizedHealthEvent" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "source" "HealthEventSource" NOT NULL,
  "type" "StandardEventType" NOT NULL,
  "codeSystem" TEXT,
  "code" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "originName" TEXT,
  "originCountry" TEXT,
  "raw" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StandardizedHealthEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StandardizedHealthEvent_patientId_occurredAt_idx" ON "StandardizedHealthEvent"("patientId", "occurredAt");
CREATE INDEX "StandardizedHealthEvent_type_idx" ON "StandardizedHealthEvent"("type");
CREATE INDEX "StandardizedHealthEvent_source_idx" ON "StandardizedHealthEvent"("source");

-- ── Module 8: AI continuity briefings ───────────────────────────────────────
CREATE TABLE "AISummary" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "kind" "AISummaryKind" NOT NULL,
  "content" TEXT NOT NULL,
  "engine" TEXT NOT NULL DEFAULT 'rules-v1',
  "inputsHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AISummary_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AISummary_patientId_kind_key" ON "AISummary"("patientId", "kind");
CREATE INDEX "AISummary_patientId_idx" ON "AISummary"("patientId");

-- ── Foreign keys ────────────────────────────────────────────────────────────
ALTER TABLE "GlobalHealthId" ADD CONSTRAINT "GlobalHealthId_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InsurancePolicy" ADD CONSTRAINT "InsurancePolicy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProviderMember" ADD CONSTRAINT "ProviderMember_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderMember" ADD CONSTRAINT "ProviderMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderAccessGrant" ADD CONSTRAINT "ProviderAccessGrant_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderAccessGrant" ADD CONSTRAINT "ProviderAccessGrant_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyAccessLog" ADD CONSTRAINT "EmergencyAccessLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmergencyAccessLog" ADD CONSTRAINT "EmergencyAccessLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmergencyAccessLog" ADD CONSTRAINT "EmergencyAccessLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StandardizedHealthEvent" ADD CONSTRAINT "StandardizedHealthEvent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AISummary" ADD CONSTRAINT "AISummary_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
