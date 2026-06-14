-- ════════════════════════════════════════════════════════════════════════════
-- Migration: Emergency Blood Network (additive)
-- For an existing DB prefer:  npx prisma migrate dev --name emergency_blood_network
-- ════════════════════════════════════════════════════════════════════════════

CREATE TYPE "RhesusFactor" AS ENUM ('POSITIVE','NEGATIVE');
CREATE TYPE "DonorAvailabilityStatus" AS ENUM ('AVAILABLE','UNAVAILABLE','TEMPORARILY_INELIGIBLE','RECENTLY_DONATED');
CREATE TYPE "DonorEligibilityStatus" AS ENUM ('ELIGIBLE','INELIGIBLE','UNDER_REVIEW');
CREATE TYPE "BloodUrgency" AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
CREATE TYPE "BloodRequestStatus" AS ENUM ('OPEN','MATCHING','DONOR_FOUND','COMPLETED','CANCELLED');
CREATE TYPE "BloodMatchStatus" AS ENUM ('PENDING','NOTIFIED','ACCEPTED','DECLINED','ARRIVED','DONATED','EXPIRED');

CREATE TABLE "BloodDonorProfile" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "bloodGroup" TEXT NOT NULL,
  "rhesusFactor" "RhesusFactor" NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'LK',
  "city" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "searchRadius" INTEGER NOT NULL DEFAULT 25,
  "availabilityStatus" "DonorAvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
  "lastDonationDate" TIMESTAMP(3),
  "eligibilityStatus" "DonorEligibilityStatus" NOT NULL DEFAULT 'ELIGIBLE',
  "emergencyContact" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BloodDonorProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BloodDonorProfile_patientId_key" ON "BloodDonorProfile"("patientId");
CREATE INDEX "BloodDonorProfile_bloodGroup_rhesusFactor_availabilityStatus_idx" ON "BloodDonorProfile"("bloodGroup","rhesusFactor","availabilityStatus");
CREATE INDEX "BloodDonorProfile_country_city_idx" ON "BloodDonorProfile"("country","city");

CREATE TABLE "BloodRequest" (
  "id" TEXT NOT NULL,
  "hospitalId" TEXT NOT NULL,
  "patientId" TEXT,
  "bloodGroupNeeded" TEXT NOT NULL,
  "unitsRequired" INTEGER NOT NULL DEFAULT 1,
  "urgency" "BloodUrgency" NOT NULL DEFAULT 'HIGH',
  "reason" TEXT,
  "location" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "radius" INTEGER NOT NULL DEFAULT 25,
  "status" "BloodRequestStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BloodRequest_status_urgency_idx" ON "BloodRequest"("status","urgency");
CREATE INDEX "BloodRequest_hospitalId_createdAt_idx" ON "BloodRequest"("hospitalId","createdAt");

CREATE TABLE "BloodMatch" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "donorId" TEXT NOT NULL,
  "matchScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "distanceKm" DOUBLE PRECISION,
  "etaMinutes" INTEGER,
  "status" "BloodMatchStatus" NOT NULL DEFAULT 'PENDING',
  "notifiedAt" TIMESTAMP(3),
  "respondedAt" TIMESTAMP(3),
  "arrivedAt" TIMESTAMP(3),
  "donatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BloodMatch_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BloodMatch_requestId_donorId_key" ON "BloodMatch"("requestId","donorId");
CREATE INDEX "BloodMatch_requestId_status_idx" ON "BloodMatch"("requestId","status");
CREATE INDEX "BloodMatch_donorId_status_idx" ON "BloodMatch"("donorId","status");

ALTER TABLE "BloodDonorProfile" ADD CONSTRAINT "BloodDonorProfile_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "PatientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BloodMatch" ADD CONSTRAINT "BloodMatch_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BloodMatch" ADD CONSTRAINT "BloodMatch_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "BloodDonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
