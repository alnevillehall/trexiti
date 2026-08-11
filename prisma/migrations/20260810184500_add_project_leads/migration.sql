-- CreateEnum
CREATE TYPE "ProjectLeadStatus" AS ENUM (
  'NEW',
  'REVIEWING',
  'QUALIFIED',
  'DISCOVERY',
  'PROPOSAL',
  'WON',
  'LOST'
);

-- CreateTable
CREATE TABLE "ProjectLead" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "status" "ProjectLeadStatus" NOT NULL DEFAULT 'NEW',
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "role" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "companyWebsite" TEXT NOT NULL,
  "industry" TEXT NOT NULL,
  "companySize" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "projectType" TEXT NOT NULL,
  "objectives" TEXT[],
  "challenge" TEXT NOT NULL,
  "existingSystems" TEXT[],
  "budgetRange" TEXT NOT NULL,
  "timeline" TEXT NOT NULL,
  "consentedAt" TIMESTAMP(3) NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'trexiti_website',
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "requestFingerprint" TEXT,

  CONSTRAINT "ProjectLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectLeadRateLimit" (
  "fingerprint" TEXT NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "requestCount" INTEGER NOT NULL DEFAULT 1,
  "blockedUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProjectLeadRateLimit_pkey" PRIMARY KEY ("fingerprint")
);

-- CreateIndex
CREATE INDEX "ProjectLead_status_createdAt_idx" ON "ProjectLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectLead_email_createdAt_idx" ON "ProjectLead"("email", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectLead_requestFingerprint_createdAt_idx" ON "ProjectLead"("requestFingerprint", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectLeadRateLimit_updatedAt_idx" ON "ProjectLeadRateLimit"("updatedAt");
