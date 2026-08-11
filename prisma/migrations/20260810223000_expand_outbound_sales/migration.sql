CREATE TYPE "AdminOutreachStepStatus" AS ENUM ('PENDING', 'READY', 'COMPLETED', 'SKIPPED');

ALTER TYPE "AdminActivityKind" ADD VALUE 'RESEARCH_COMPLETED';
ALTER TYPE "AdminActivityKind" ADD VALUE 'OUTREACH_STEP_COMPLETED';
ALTER TYPE "AdminActivityKind" ADD VALUE 'REPLY_ACTIONED';

ALTER TABLE "AdminProspectResearch"
  RENAME COLUMN "businessValueScore" TO "financialCapacityScore";
ALTER TABLE "AdminProspectResearch"
  RENAME COLUMN "visibleDigitalProblemScore" TO "problemSeverityScore";
ALTER TABLE "AdminProspectResearch"
  RENAME COLUMN "operationalProblemScore" TO "strategicFitScore";
ALTER TABLE "AdminOpportunity"
  RENAME COLUMN "personalizationNotes" TO "personalizationAngle";
ALTER TABLE "AdminProspectResearch"
  ADD COLUMN "notes" TEXT;

ALTER TABLE "AdminMessage"
  ADD COLUMN "sequenceStepId" TEXT,
  ADD COLUMN "needsAction" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "actionedAt" TIMESTAMP(3);

CREATE TABLE "AdminContactMethod" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "contactId" TEXT NOT NULL,
  "channel" "AdminOutreachChannel" NOT NULL,
  "value" TEXT NOT NULL,
  "label" TEXT,
  "preferred" BOOLEAN NOT NULL DEFAULT false,
  "verifiedAt" TIMESTAMP(3),
  CONSTRAINT "AdminContactMethod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminOutreachSequence" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "opportunityId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "pausedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "AdminOutreachSequence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminOutreachStep" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "sequenceId" TEXT NOT NULL,
  "stepNumber" INTEGER NOT NULL,
  "dayOffset" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status" "AdminOutreachStepStatus" NOT NULL DEFAULT 'PENDING',
  "completedAt" TIMESTAMP(3),
  "channel" "AdminOutreachChannel",
  "notes" TEXT,
  CONSTRAINT "AdminOutreachStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminDailyTargetConfig" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  "researchTarget" INTEGER NOT NULL DEFAULT 10,
  "personalizedOutreachTarget" INTEGER NOT NULL DEFAULT 20,
  "followUpTarget" INTEGER NOT NULL DEFAULT 10,
  CONSTRAINT "AdminDailyTargetConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminDailyTargetConfig_positive_targets_check" CHECK (
    "researchTarget" BETWEEN 1 AND 100 AND
    "personalizedOutreachTarget" BETWEEN 1 AND 100 AND
    "followUpTarget" BETWEEN 1 AND 100
  )
);

CREATE UNIQUE INDEX "AdminContactMethod_contactId_channel_value_key" ON "AdminContactMethod"("contactId", "channel", "value");
CREATE INDEX "AdminContactMethod_channel_value_idx" ON "AdminContactMethod"("channel", "value");
CREATE INDEX "AdminContactMethod_contactId_preferred_idx" ON "AdminContactMethod"("contactId", "preferred");
CREATE UNIQUE INDEX "AdminMessage_sequenceStepId_key" ON "AdminMessage"("sequenceStepId");
CREATE INDEX "AdminMessage_needsAction_occurredAt_idx" ON "AdminMessage"("needsAction", "occurredAt");
CREATE UNIQUE INDEX "AdminOutreachSequence_opportunityId_key" ON "AdminOutreachSequence"("opportunityId");
CREATE INDEX "AdminOutreachSequence_startedAt_completedAt_idx" ON "AdminOutreachSequence"("startedAt", "completedAt");
CREATE UNIQUE INDEX "AdminOutreachStep_sequenceId_stepNumber_key" ON "AdminOutreachStep"("sequenceId", "stepNumber");
CREATE INDEX "AdminOutreachStep_status_scheduledFor_idx" ON "AdminOutreachStep"("status", "scheduledFor");
CREATE UNIQUE INDEX "AdminDailyTargetConfig_userId_key" ON "AdminDailyTargetConfig"("userId");

ALTER TABLE "AdminContactMethod" ADD CONSTRAINT "AdminContactMethod_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "AdminContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminOutreachSequence" ADD CONSTRAINT "AdminOutreachSequence_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "AdminOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminOutreachStep" ADD CONSTRAINT "AdminOutreachStep_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "AdminOutreachSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminMessage" ADD CONSTRAINT "AdminMessage_sequenceStepId_fkey" FOREIGN KEY ("sequenceStepId") REFERENCES "AdminOutreachStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminDailyTargetConfig" ADD CONSTRAINT "AdminDailyTargetConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
