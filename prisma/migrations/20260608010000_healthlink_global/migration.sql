-- ════════════════════════════════════════════════════════════════════════════
-- Migration: HealthLink Global (Memory, Scribe, Language, Identity, Wallet, …)
-- Purely ADDITIVE. For an existing DB prefer:
--   npx prisma migrate dev --name healthlink_global
-- ════════════════════════════════════════════════════════════════════════════

-- ── Additive enum VALUES on existing enums ──────────────────────────────────
ALTER TYPE "ProviderType"      ADD VALUE IF NOT EXISTS 'INSURANCE';
ALTER TYPE "HealthEventSource" ADD VALUE IF NOT EXISTS 'DICOM';
ALTER TYPE "AISummaryKind"     ADD VALUE IF NOT EXISTS 'RISK';
ALTER TYPE "AISummaryKind"     ADD VALUE IF NOT EXISTS 'BRIEFING';

-- ── New enums ───────────────────────────────────────────────────────────────
CREATE TYPE "MemoryNodeType" AS ENUM ('CONDITION','MEDICATION','PROCEDURE','SURGERY','ENCOUNTER','LAB','ALLERGY','RISK_FACTOR','ADMISSION','IMMUNIZATION');
CREATE TYPE "MemoryEdgeType" AS ENUM ('CAUSED','TREATS','PROGRESSED_TO','COMPLICATION_OF','FOLLOWS','RELATED_TO','PRESCRIBED_FOR');
CREATE TYPE "ScribeSpecialty" AS ENUM ('CARDIOLOGY','ONCOLOGY','NEPHROLOGY','NEUROLOGY','GASTROENTEROLOGY','ENDOCRINOLOGY','GENERAL_PRACTICE');
CREATE TYPE "ScribeNoteType" AS ENUM ('CONSULTATION','SOAP','DIAGNOSIS','FOLLOW_UP_PLAN','REFERRAL_LETTER','DISCHARGE_SUMMARY');
CREATE TYPE "ScribeStatus" AS ENUM ('RECORDING','TRANSCRIBED','DRAFTED','UNDER_REVIEW','FINALIZED');
CREATE TYPE "IdentityDocType" AS ENUM ('NIC','PASSPORT','DRIVING_LICENSE','RESIDENCE_PERMIT','NATIONAL_HEALTH_NUMBER','VACCINATION_PASSPORT');
CREATE TYPE "CareRelationship" AS ENUM ('CHILD','PARENT','SPOUSE','ELDER','DEPENDENT','GUARDIAN');
CREATE TYPE "WalletItemType" AS ENUM ('INSURANCE','VACCINATION','CERTIFICATE','PRESCRIPTION','TRAVEL_DOCUMENT','HEALTH_PASSPORT','LAB_RESULT');

-- ── Additive columns on Provider (trust score / cross-border) ───────────────
ALTER TABLE "Provider" ADD COLUMN "trustScore" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "Provider" ADD COLUMN "crossBorder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Provider" ADD COLUMN "lastAuditAt" TIMESTAMP(3);

-- ── Priority 1: Memory graph ────────────────────────────────────────────────
CREATE TABLE "MemoryNode" (
  "id" TEXT NOT NULL, "patientId" TEXT NOT NULL, "type" "MemoryNodeType" NOT NULL,
  "label" TEXT NOT NULL, "codeSystem" TEXT, "code" TEXT, "occurredAt" TIMESTAMP(3),
  "severity" TEXT, "status" TEXT, "sourceEventId" TEXT, "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemoryNode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MemoryNode_patientId_type_idx" ON "MemoryNode"("patientId","type");
CREATE INDEX "MemoryNode_patientId_occurredAt_idx" ON "MemoryNode"("patientId","occurredAt");

CREATE TABLE "MemoryEdge" (
  "id" TEXT NOT NULL, "patientId" TEXT NOT NULL, "fromNodeId" TEXT NOT NULL,
  "toNodeId" TEXT NOT NULL, "type" "MemoryEdgeType" NOT NULL, "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "note" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemoryEdge_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MemoryEdge_patientId_idx" ON "MemoryEdge"("patientId");
CREATE INDEX "MemoryEdge_fromNodeId_idx" ON "MemoryEdge"("fromNodeId");
CREATE INDEX "MemoryEdge_toNodeId_idx" ON "MemoryEdge"("toNodeId");

-- ── Priority 2: Specialist scribe ───────────────────────────────────────────
CREATE TABLE "ScribeSession" (
  "id" TEXT NOT NULL, "patientId" TEXT NOT NULL, "doctorId" TEXT NOT NULL,
  "specialty" "ScribeSpecialty" NOT NULL, "status" "ScribeStatus" NOT NULL DEFAULT 'RECORDING',
  "transcript" TEXT, "audioS3Key" TEXT, "language" TEXT NOT NULL DEFAULT 'EN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScribeSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ScribeSession_doctorId_createdAt_idx" ON "ScribeSession"("doctorId","createdAt");
CREATE INDEX "ScribeSession_patientId_idx" ON "ScribeSession"("patientId");

CREATE TABLE "ScribeNote" (
  "id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "type" "ScribeNoteType" NOT NULL,
  "content" TEXT NOT NULL, "engine" TEXT NOT NULL DEFAULT 'rules-v1', "reviewedByUserId" TEXT,
  "finalized" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScribeNote_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ScribeNote_sessionId_idx" ON "ScribeNote"("sessionId");

-- ── Priority 3: Terminology ─────────────────────────────────────────────────
CREATE TABLE "TerminologyConcept" (
  "id" TEXT NOT NULL, "system" TEXT NOT NULL, "code" TEXT NOT NULL, "display" TEXT NOT NULL,
  "translations" JSONB NOT NULL, "category" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TerminologyConcept_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TerminologyConcept_system_code_key" ON "TerminologyConcept"("system","code");
CREATE INDEX "TerminologyConcept_category_idx" ON "TerminologyConcept"("category");

-- ── Priority 4: Identity / family / travel ──────────────────────────────────
CREATE TABLE "IdentityDocument" (
  "id" TEXT NOT NULL, "patientId" TEXT NOT NULL, "type" "IdentityDocType" NOT NULL,
  "country" TEXT NOT NULL, "numberEncrypted" TEXT NOT NULL, "issuedAt" TIMESTAMP(3),
  "validUntil" TIMESTAMP(3), "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IdentityDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "IdentityDocument_patientId_type_idx" ON "IdentityDocument"("patientId","type");

CREATE TABLE "TravelHealthProfile" (
  "id" TEXT NOT NULL, "patientId" TEXT NOT NULL, "bloodGroup" TEXT,
  "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[], "destinations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "emergencyNotes" TEXT, "vaccinations" TEXT[] DEFAULT ARRAY[]::TEXT[], "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TravelHealthProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TravelHealthProfile_patientId_key" ON "TravelHealthProfile"("patientId");

CREATE TABLE "FamilyMember" (
  "id" TEXT NOT NULL, "guardianId" TEXT NOT NULL, "dependentPatientId" TEXT,
  "name" TEXT NOT NULL, "relationship" "CareRelationship" NOT NULL, "dateOfBirth" TIMESTAMP(3),
  "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FamilyMember_guardianId_idx" ON "FamilyMember"("guardianId");

-- ── Priority 8: Wallet ──────────────────────────────────────────────────────
CREATE TABLE "WalletItem" (
  "id" TEXT NOT NULL, "patientId" TEXT NOT NULL, "type" "WalletItemType" NOT NULL,
  "title" TEXT NOT NULL, "issuer" TEXT, "s3Key" TEXT, "dataEncrypted" TEXT,
  "validUntil" TIMESTAMP(3), "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WalletItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WalletItem_patientId_type_idx" ON "WalletItem"("patientId","type");

-- ── Foreign keys ────────────────────────────────────────────────────────────
ALTER TABLE "MemoryNode" ADD CONSTRAINT "MemoryNode_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryEdge" ADD CONSTRAINT "MemoryEdge_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryEdge" ADD CONSTRAINT "MemoryEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "MemoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemoryEdge" ADD CONSTRAINT "MemoryEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "MemoryNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScribeSession" ADD CONSTRAINT "ScribeSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScribeSession" ADD CONSTRAINT "ScribeSession_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScribeNote" ADD CONSTRAINT "ScribeNote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScribeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdentityDocument" ADD CONSTRAINT "IdentityDocument_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelHealthProfile" ADD CONSTRAINT "TravelHealthProfile_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_dependentPatientId_fkey" FOREIGN KEY ("dependentPatientId") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WalletItem" ADD CONSTRAINT "WalletItem_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
