CREATE TYPE "MarketingLaunchChecklistStatus" AS ENUM (
  'NOT_STARTED',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETE'
);

ALTER TABLE "AdminOpportunity"
ADD COLUMN "outcomeReason" TEXT;

CREATE TABLE "MarketingLaunchChecklistItem" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "seedKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" "MarketingLaunchChecklistStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "dueAt" TIMESTAMP(3),
  "evidenceUrl" TEXT,
  "notes" TEXT,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "MarketingLaunchChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarketingLaunchSource" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "seedKey" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "sha256" TEXT NOT NULL,
  "notes" TEXT,
  CONSTRAINT "MarketingLaunchSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketingLaunchChecklistItem_seedKey_key"
ON "MarketingLaunchChecklistItem"("seedKey");

CREATE INDEX "MarketingLaunchChecklistItem_status_dueAt_idx"
ON "MarketingLaunchChecklistItem"("status", "dueAt");

CREATE INDEX "MarketingLaunchChecklistItem_category_status_idx"
ON "MarketingLaunchChecklistItem"("category", "status");

CREATE UNIQUE INDEX "MarketingLaunchSource_seedKey_key"
ON "MarketingLaunchSource"("seedKey");

CREATE UNIQUE INDEX "MarketingLaunchSource_path_key"
ON "MarketingLaunchSource"("path");

CREATE INDEX "MarketingLaunchSource_updatedAt_idx"
ON "MarketingLaunchSource"("updatedAt");
