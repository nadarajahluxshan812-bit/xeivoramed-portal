-- ════════════════════════════════════════════════════════════════════════════
-- Migration: XeivoraMed — biometric-ready emergency verification (DEMO architecture)
-- Purely ADDITIVE. Stores only template HASHES — never raw biometric data.
-- For an existing DB prefer:  npx prisma migrate dev --name biometric_verification
-- ════════════════════════════════════════════════════════════════════════════

CREATE TYPE "BiometricType" AS ENUM ('FACE','FINGERPRINT','PALM','IRIS');
CREATE TYPE "VerificationMethod" AS ENUM ('QR_CODE','HEALTH_ID','PASSPORT','NATIONAL_ID','FACE','FINGERPRINT','PALM','IRIS');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING','VERIFIED','FAILED','EXPIRED');

-- Record which verification method produced an emergency access.
ALTER TABLE "EmergencyAccessLog" ADD COLUMN "verificationMethod" TEXT;

CREATE TABLE "BiometricCredential" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "type" "BiometricType" NOT NULL,
  "provider" TEXT NOT NULL,
  "templateHash" TEXT NOT NULL,
  "status" "VerificationStatus" NOT NULL DEFAULT 'VERIFIED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "BiometricCredential_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BiometricCredential_patientId_type_idx" ON "BiometricCredential"("patientId","type");

CREATE TABLE "BiometricVerificationAttempt" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "providerUserId" TEXT,
  "credentialId" TEXT,
  "method" "VerificationMethod" NOT NULL,
  "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "location" TEXT,
  "auditLogId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BiometricVerificationAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BiometricVerificationAttempt_patientId_createdAt_idx" ON "BiometricVerificationAttempt"("patientId","createdAt");
CREATE INDEX "BiometricVerificationAttempt_providerUserId_createdAt_idx" ON "BiometricVerificationAttempt"("providerUserId","createdAt");

ALTER TABLE "BiometricCredential" ADD CONSTRAINT "BiometricCredential_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BiometricVerificationAttempt" ADD CONSTRAINT "BiometricVerificationAttempt_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BiometricVerificationAttempt" ADD CONSTRAINT "BiometricVerificationAttempt_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BiometricVerificationAttempt" ADD CONSTRAINT "BiometricVerificationAttempt_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "BiometricCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BiometricVerificationAttempt" ADD CONSTRAINT "BiometricVerificationAttempt_auditLogId_fkey" FOREIGN KEY ("auditLogId") REFERENCES "EmergencyAccessLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
