CREATE TYPE "AdminCurrency" AS ENUM ('JMD', 'USD');
CREATE TYPE "AdminProspectClassification" AS ENUM ('UNCLASSIFIED', 'QUALIFIED', 'NURTURE', 'NOT_A_FIT');
CREATE TYPE "AdminProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AdminProjectHealth" AS ENUM ('ON_TRACK', 'ATTENTION', 'AT_RISK');
CREATE TYPE "AdminMilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AdminInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID');
CREATE TYPE "AdminPaymentStatus" AS ENUM ('PENDING', 'CLEARED', 'FAILED', 'REFUNDED');
CREATE TYPE "AdminPaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'MOBILE_MONEY', 'OTHER');
CREATE TYPE "AdminTaskSource" AS ENUM ('HUMAN', 'AUTOMATION', 'AI', 'MCP');
CREATE TYPE "CooAutomationMode" AS ENUM ('OFF', 'SHADOW', 'GUARDED');
CREATE TYPE "CooAutomationRunType" AS ENUM ('PROSPECTING', 'DAILY_BRIEF', 'RUN_OPERATIONS', 'APPROVAL_EXECUTION');
CREATE TYPE "CooAutomationStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'CANCELLED');
CREATE TYPE "CooAutomationStepStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'SKIPPED', 'FAILED');
CREATE TYPE "CooBriefStatus" AS ENUM ('READY', 'DEGRADED', 'FAILED');
CREATE TYPE "CooBriefItemKind" AS ENUM ('DECISION', 'ACTION', 'ALERT', 'COMPLETED');
CREATE TYPE "CooPrioritySeverity" AS ENUM ('INFO', 'ATTENTION', 'HIGH', 'CRITICAL');
CREATE TYPE "CooApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'EXECUTING', 'EXECUTED', 'FAILED');
CREATE TYPE "CooApprovalRisk" AS ENUM ('SENSITIVE', 'DESTRUCTIVE');
CREATE TYPE "CooInteractionChannel" AS ENUM ('ADMIN', 'MCP', 'WORKFLOW', 'CHAT');
CREATE TYPE "CooInteractionStatus" AS ENUM ('SUCCEEDED', 'PARTIAL', 'FAILED');

ALTER TABLE "AdminOpportunity"
  ALTER COLUMN "estimatedValue" TYPE DECIMAL(18,2),
  ADD COLUMN "currency" "AdminCurrency" NOT NULL DEFAULT 'USD';

ALTER TABLE "AdminCompany"
  ALTER COLUMN "lifetimeValue" TYPE DECIMAL(18,2),
  ADD COLUMN "lifetimeValueCurrency" "AdminCurrency" NOT NULL DEFAULT 'USD';

ALTER TABLE "AdminProposal"
  ALTER COLUMN "amount" TYPE DECIMAL(18,2),
  ADD COLUMN "currency" "AdminCurrency" NOT NULL DEFAULT 'USD';

ALTER TABLE "MarketingWeeklyMetric"
  ADD COLUMN "currency" "AdminCurrency" NOT NULL DEFAULT 'USD';

ALTER TABLE "AdminProspectResearch"
  ADD COLUMN "classification" "AdminProspectClassification" NOT NULL DEFAULT 'UNCLASSIFIED',
  ADD COLUMN "sourceUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "automationRunId" TEXT;

ALTER TABLE "AdminTask"
  ADD COLUMN "projectId" TEXT,
  ADD COLUMN "milestoneId" TEXT,
  ADD COLUMN "automationRunId" TEXT,
  ADD COLUMN "source" "AdminTaskSource" NOT NULL DEFAULT 'HUMAN',
  ADD COLUMN "idempotencyKey" TEXT;

ALTER TABLE "AdminAuditLog"
  ADD COLUMN "correlationId" TEXT,
  ADD COLUMN "idempotencyKey" TEXT;

CREATE TABLE "AdminProject" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "companyId" TEXT NOT NULL,
  "opportunityId" TEXT,
  "ownerId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "AdminProjectStatus" NOT NULL DEFAULT 'PLANNED',
  "healthOverride" "AdminProjectHealth",
  "healthOverrideReason" TEXT,
  "startAt" TIMESTAMP(3),
  "targetEndAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastProgressAt" TIMESTAMP(3),
  "activeBlocker" TEXT,
  "progressPercent" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "idempotencyKey" TEXT,
  CONSTRAINT "AdminProject_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminProject_progress_check" CHECK ("progressPercent" BETWEEN 0 AND 100),
  CONSTRAINT "AdminProject_version_check" CHECK ("version" > 0)
);

CREATE TABLE "AdminMilestone" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "projectId" TEXT NOT NULL,
  "dependencyMilestoneId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "AdminMilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "blockedAt" TIMESTAMP(3),
  "blocker" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "idempotencyKey" TEXT,
  CONSTRAINT "AdminMilestone_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminMilestone_no_self_dependency_check" CHECK ("dependencyMilestoneId" IS NULL OR "dependencyMilestoneId" <> "id"),
  CONSTRAINT "AdminMilestone_version_check" CHECK ("version" > 0)
);

CREATE TABLE "AdminProjectUpdate" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "projectId" TEXT NOT NULL,
  "authorId" TEXT,
  "summary" TEXT NOT NULL,
  "progressPercent" INTEGER,
  "blockers" JSONB,
  "metadata" JSONB,
  "idempotencyKey" TEXT,
  CONSTRAINT "AdminProjectUpdate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminProjectUpdate_progress_check" CHECK ("progressPercent" IS NULL OR "progressPercent" BETWEEN 0 AND 100)
);

CREATE TABLE "AdminInvoice" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "companyId" TEXT NOT NULL,
  "projectId" TEXT,
  "invoiceNumber" TEXT NOT NULL,
  "status" "AdminInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "currency" "AdminCurrency" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "issuedAt" TIMESTAMP(3),
  "dueAt" TIMESTAMP(3),
  "notes" TEXT,
  "externalReference" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "idempotencyKey" TEXT,
  CONSTRAINT "AdminInvoice_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminInvoice_positive_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "AdminInvoice_version_check" CHECK ("version" > 0)
);

CREATE TABLE "AdminPayment" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "companyId" TEXT NOT NULL,
  "status" "AdminPaymentStatus" NOT NULL DEFAULT 'CLEARED',
  "method" "AdminPaymentMethod" NOT NULL,
  "currency" "AdminCurrency" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "paidAt" TIMESTAMP(3) NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "idempotencyKey" TEXT,
  CONSTRAINT "AdminPayment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminPayment_positive_amount_check" CHECK ("amount" > 0),
  CONSTRAINT "AdminPayment_version_check" CHECK ("version" > 0)
);

CREATE TABLE "AdminPaymentAllocation" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentId" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "currency" "AdminCurrency" NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "idempotencyKey" TEXT,
  CONSTRAINT "AdminPaymentAllocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AdminPaymentAllocation_positive_amount_check" CHECK ("amount" > 0)
);

CREATE TABLE "CooPolicy" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT,
  "version" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "activatedAt" TIMESTAMP(3),
  "name" TEXT NOT NULL,
  "automationMode" "CooAutomationMode" NOT NULL DEFAULT 'SHADOW',
  "projectDeadlineHours" INTEGER NOT NULL DEFAULT 72,
  "staleProgressDays" INTEGER NOT NULL DEFAULT 7,
  "approvalExpiryHours" INTEGER NOT NULL DEFAULT 24,
  "safeBatchLimit" INTEGER NOT NULL DEFAULT 25,
  "prospectDailyMinimum" INTEGER NOT NULL DEFAULT 40,
  "prospectDailyMaximum" INTEGER NOT NULL DEFAULT 50,
  "maxFounderPriorities" INTEGER NOT NULL DEFAULT 5,
  "freshnessMinutes" INTEGER NOT NULL DEFAULT 90,
  "rules" JSONB,
  CONSTRAINT "CooPolicy_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CooPolicy_thresholds_check" CHECK (
    "version" > 0 AND
    "projectDeadlineHours" > 0 AND
    "staleProgressDays" > 0 AND
    "approvalExpiryHours" > 0 AND
    "safeBatchLimit" BETWEEN 1 AND 25 AND
    "prospectDailyMinimum" > 0 AND
    "prospectDailyMaximum" >= "prospectDailyMinimum" AND
    "maxFounderPriorities" BETWEEN 1 AND 5 AND
    "freshnessMinutes" > 0
  )
);

CREATE TABLE "CooAutomationRun" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "type" "CooAutomationRunType" NOT NULL,
  "status" "CooAutomationStatus" NOT NULL DEFAULT 'QUEUED',
  "mode" "CooAutomationMode" NOT NULL,
  "policyId" TEXT,
  "requestedById" TEXT,
  "correlationId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "scheduledFor" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "model" TEXT,
  "input" JSONB,
  "outputSummary" JSONB,
  "error" TEXT,
  "usage" JSONB,
  "estimatedCostUsd" DECIMAL(18,6),
  CONSTRAINT "CooAutomationRun_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CooAutomationRun_cost_check" CHECK ("estimatedCostUsd" IS NULL OR "estimatedCostUsd" >= 0)
);

CREATE TABLE "CooBrief" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "businessDate" DATE NOT NULL,
  "status" "CooBriefStatus" NOT NULL,
  "headline" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "asOf" TIMESTAMP(3) NOT NULL,
  "dataAsOf" TIMESTAMP(3),
  "degradedReason" TEXT,
  "model" TEXT,
  "policyId" TEXT NOT NULL,
  "automationRunId" TEXT,
  "evidence" JSONB,
  CONSTRAINT "CooBrief_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CooBriefItem" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "briefId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "kind" "CooBriefItemKind" NOT NULL,
  "severity" "CooPrioritySeverity" NOT NULL,
  "title" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "nextAction" TEXT,
  "recordType" TEXT,
  "recordId" TEXT,
  "recordUrl" TEXT,
  "evidence" JSONB,
  "currency" "AdminCurrency",
  "amount" DECIMAL(18,2),
  CONSTRAINT "CooBriefItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CooBriefItem_rank_check" CHECK ("rank" BETWEEN 1 AND 5),
  CONSTRAINT "CooBriefItem_amount_check" CHECK ("amount" IS NULL OR "amount" >= 0)
);

CREATE TABLE "CooAutomationStep" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "runId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "status" "CooAutomationStepStatus" NOT NULL DEFAULT 'QUEUED',
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "input" JSONB,
  "output" JSONB,
  "error" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  CONSTRAINT "CooAutomationStep_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CooAutomationStep_attempt_check" CHECK ("attempt" > 0)
);

CREATE TABLE "CooApprovalRequest" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "status" "CooApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "risk" "CooApprovalRisk" NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "targetVersion" INTEGER,
  "targetSnapshot" JSONB,
  "payload" JSONB NOT NULL,
  "evidence" JSONB,
  "requestedById" TEXT,
  "decidedById" TEXT,
  "decidedAt" TIMESTAMP(3),
  "decisionReason" TEXT,
  "executedAt" TIMESTAMP(3),
  "executionResult" JSONB,
  "executionError" TEXT,
  "safeBatchKey" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "policyId" TEXT,
  "automationRunId" TEXT,
  CONSTRAINT "CooApprovalRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CooApprovalRequest_version_check" CHECK ("version" > 0)
);

CREATE TABLE "CooInteractionSummary" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "channel" "CooInteractionChannel" NOT NULL,
  "status" "CooInteractionStatus" NOT NULL,
  "actorId" TEXT,
  "automationRunId" TEXT,
  "correlationId" TEXT NOT NULL,
  "model" TEXT,
  "summary" TEXT NOT NULL,
  "conclusions" JSONB,
  "citations" JSONB,
  "toolCalls" JSONB,
  "outcomes" JSONB,
  CONSTRAINT "CooInteractionSummary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminProject_idempotencyKey_key" ON "AdminProject"("idempotencyKey");
CREATE INDEX "MarketingWeeklyMetric_weekStarting_currency_idx" ON "MarketingWeeklyMetric"("weekStarting", "currency");
CREATE INDEX "AdminProject_status_targetEndAt_idx" ON "AdminProject"("status", "targetEndAt");
CREATE INDEX "AdminProject_companyId_status_idx" ON "AdminProject"("companyId", "status");
CREATE INDEX "AdminProject_ownerId_status_idx" ON "AdminProject"("ownerId", "status");
CREATE INDEX "AdminProject_archivedAt_idx" ON "AdminProject"("archivedAt");
CREATE UNIQUE INDEX "AdminMilestone_idempotencyKey_key" ON "AdminMilestone"("idempotencyKey");
CREATE INDEX "AdminMilestone_projectId_status_dueAt_idx" ON "AdminMilestone"("projectId", "status", "dueAt");
CREATE INDEX "AdminMilestone_dependencyMilestoneId_idx" ON "AdminMilestone"("dependencyMilestoneId");
CREATE UNIQUE INDEX "AdminProjectUpdate_idempotencyKey_key" ON "AdminProjectUpdate"("idempotencyKey");
CREATE INDEX "AdminProjectUpdate_projectId_createdAt_idx" ON "AdminProjectUpdate"("projectId", "createdAt");
CREATE INDEX "AdminProjectUpdate_authorId_createdAt_idx" ON "AdminProjectUpdate"("authorId", "createdAt");
CREATE UNIQUE INDEX "AdminInvoice_invoiceNumber_key" ON "AdminInvoice"("invoiceNumber");
CREATE UNIQUE INDEX "AdminInvoice_idempotencyKey_key" ON "AdminInvoice"("idempotencyKey");
CREATE INDEX "AdminInvoice_status_dueAt_idx" ON "AdminInvoice"("status", "dueAt");
CREATE INDEX "AdminInvoice_companyId_status_idx" ON "AdminInvoice"("companyId", "status");
CREATE INDEX "AdminInvoice_projectId_idx" ON "AdminInvoice"("projectId");
CREATE INDEX "AdminInvoice_currency_status_dueAt_idx" ON "AdminInvoice"("currency", "status", "dueAt");
CREATE INDEX "AdminInvoice_archivedAt_idx" ON "AdminInvoice"("archivedAt");
CREATE UNIQUE INDEX "AdminPayment_idempotencyKey_key" ON "AdminPayment"("idempotencyKey");
CREATE INDEX "AdminPayment_companyId_status_paidAt_idx" ON "AdminPayment"("companyId", "status", "paidAt");
CREATE INDEX "AdminPayment_currency_status_paidAt_idx" ON "AdminPayment"("currency", "status", "paidAt");
CREATE INDEX "AdminPayment_reference_idx" ON "AdminPayment"("reference");
CREATE UNIQUE INDEX "AdminPaymentAllocation_idempotencyKey_key" ON "AdminPaymentAllocation"("idempotencyKey");
CREATE UNIQUE INDEX "AdminPaymentAllocation_paymentId_invoiceId_key" ON "AdminPaymentAllocation"("paymentId", "invoiceId");
CREATE INDEX "AdminPaymentAllocation_invoiceId_createdAt_idx" ON "AdminPaymentAllocation"("invoiceId", "createdAt");
CREATE INDEX "AdminPaymentAllocation_paymentId_createdAt_idx" ON "AdminPaymentAllocation"("paymentId", "createdAt");
CREATE INDEX "AdminPaymentAllocation_currency_createdAt_idx" ON "AdminPaymentAllocation"("currency", "createdAt");
CREATE UNIQUE INDEX "CooPolicy_version_key" ON "CooPolicy"("version");
CREATE UNIQUE INDEX "CooPolicy_single_active_key" ON "CooPolicy"("active") WHERE "active" = true;
CREATE INDEX "CooPolicy_active_version_idx" ON "CooPolicy"("active", "version");
CREATE INDEX "CooPolicy_createdById_createdAt_idx" ON "CooPolicy"("createdById", "createdAt");
CREATE UNIQUE INDEX "CooAutomationRun_correlationId_key" ON "CooAutomationRun"("correlationId");
CREATE UNIQUE INDEX "CooAutomationRun_idempotencyKey_key" ON "CooAutomationRun"("idempotencyKey");
CREATE INDEX "CooAutomationRun_type_status_createdAt_idx" ON "CooAutomationRun"("type", "status", "createdAt");
CREATE INDEX "CooAutomationRun_status_scheduledFor_idx" ON "CooAutomationRun"("status", "scheduledFor");
CREATE INDEX "CooAutomationRun_requestedById_createdAt_idx" ON "CooAutomationRun"("requestedById", "createdAt");
CREATE INDEX "CooAutomationRun_policyId_createdAt_idx" ON "CooAutomationRun"("policyId", "createdAt");
CREATE UNIQUE INDEX "CooBrief_businessDate_key" ON "CooBrief"("businessDate");
CREATE UNIQUE INDEX "CooBrief_automationRunId_key" ON "CooBrief"("automationRunId");
CREATE INDEX "CooBrief_status_businessDate_idx" ON "CooBrief"("status", "businessDate");
CREATE INDEX "CooBrief_policyId_businessDate_idx" ON "CooBrief"("policyId", "businessDate");
CREATE UNIQUE INDEX "CooBriefItem_briefId_rank_key" ON "CooBriefItem"("briefId", "rank");
CREATE INDEX "CooBriefItem_kind_severity_idx" ON "CooBriefItem"("kind", "severity");
CREATE INDEX "CooBriefItem_recordType_recordId_idx" ON "CooBriefItem"("recordType", "recordId");
CREATE UNIQUE INDEX "CooAutomationStep_idempotencyKey_key" ON "CooAutomationStep"("idempotencyKey");
CREATE UNIQUE INDEX "CooAutomationStep_runId_key_attempt_key" ON "CooAutomationStep"("runId", "key", "attempt");
CREATE INDEX "CooAutomationStep_runId_status_idx" ON "CooAutomationStep"("runId", "status");
CREATE UNIQUE INDEX "CooApprovalRequest_idempotencyKey_key" ON "CooApprovalRequest"("idempotencyKey");
CREATE INDEX "CooApprovalRequest_status_expiresAt_idx" ON "CooApprovalRequest"("status", "expiresAt");
CREATE INDEX "CooApprovalRequest_entityType_entityId_createdAt_idx" ON "CooApprovalRequest"("entityType", "entityId", "createdAt");
CREATE INDEX "CooApprovalRequest_safeBatchKey_status_idx" ON "CooApprovalRequest"("safeBatchKey", "status");
CREATE INDEX "CooApprovalRequest_correlationId_idx" ON "CooApprovalRequest"("correlationId");
CREATE INDEX "CooApprovalRequest_requestedById_createdAt_idx" ON "CooApprovalRequest"("requestedById", "createdAt");
CREATE INDEX "CooApprovalRequest_decidedById_decidedAt_idx" ON "CooApprovalRequest"("decidedById", "decidedAt");
CREATE UNIQUE INDEX "CooInteractionSummary_correlationId_key" ON "CooInteractionSummary"("correlationId");
CREATE INDEX "CooInteractionSummary_channel_createdAt_idx" ON "CooInteractionSummary"("channel", "createdAt");
CREATE INDEX "CooInteractionSummary_actorId_createdAt_idx" ON "CooInteractionSummary"("actorId", "createdAt");
CREATE INDEX "CooInteractionSummary_automationRunId_createdAt_idx" ON "CooInteractionSummary"("automationRunId", "createdAt");
CREATE INDEX "AdminOpportunity_currency_stage_idx" ON "AdminOpportunity"("currency", "stage");
CREATE INDEX "AdminCompany_lifetimeValueCurrency_idx" ON "AdminCompany"("lifetimeValueCurrency");
CREATE INDEX "AdminProposal_currency_status_idx" ON "AdminProposal"("currency", "status");
CREATE INDEX "AdminProspectResearch_automationRunId_idx" ON "AdminProspectResearch"("automationRunId");
CREATE INDEX "AdminProspectResearch_classification_idx" ON "AdminProspectResearch"("classification");
CREATE UNIQUE INDEX "AdminTask_idempotencyKey_key" ON "AdminTask"("idempotencyKey");
CREATE INDEX "AdminTask_projectId_status_dueAt_idx" ON "AdminTask"("projectId", "status", "dueAt");
CREATE INDEX "AdminTask_milestoneId_status_idx" ON "AdminTask"("milestoneId", "status");
CREATE INDEX "AdminTask_automationRunId_idx" ON "AdminTask"("automationRunId");
CREATE UNIQUE INDEX "AdminAuditLog_idempotencyKey_key" ON "AdminAuditLog"("idempotencyKey");
CREATE INDEX "AdminAuditLog_correlationId_createdAt_idx" ON "AdminAuditLog"("correlationId", "createdAt");

ALTER TABLE "AdminProject" ADD CONSTRAINT "AdminProject_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AdminCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminProject" ADD CONSTRAINT "AdminProject_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "AdminOpportunity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminProject" ADD CONSTRAINT "AdminProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminMilestone" ADD CONSTRAINT "AdminMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AdminProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminMilestone" ADD CONSTRAINT "AdminMilestone_dependencyMilestoneId_fkey" FOREIGN KEY ("dependencyMilestoneId") REFERENCES "AdminMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminProjectUpdate" ADD CONSTRAINT "AdminProjectUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AdminProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminProjectUpdate" ADD CONSTRAINT "AdminProjectUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminInvoice" ADD CONSTRAINT "AdminInvoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AdminCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminInvoice" ADD CONSTRAINT "AdminInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AdminProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminPayment" ADD CONSTRAINT "AdminPayment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AdminCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminPaymentAllocation" ADD CONSTRAINT "AdminPaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "AdminPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminPaymentAllocation" ADD CONSTRAINT "AdminPaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "AdminInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CooPolicy" ADD CONSTRAINT "CooPolicy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooAutomationRun" ADD CONSTRAINT "CooAutomationRun_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "CooPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooAutomationRun" ADD CONSTRAINT "CooAutomationRun_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooBrief" ADD CONSTRAINT "CooBrief_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "CooPolicy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CooBrief" ADD CONSTRAINT "CooBrief_automationRunId_fkey" FOREIGN KEY ("automationRunId") REFERENCES "CooAutomationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooBriefItem" ADD CONSTRAINT "CooBriefItem_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "CooBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CooAutomationStep" ADD CONSTRAINT "CooAutomationStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "CooAutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CooApprovalRequest" ADD CONSTRAINT "CooApprovalRequest_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "CooPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooApprovalRequest" ADD CONSTRAINT "CooApprovalRequest_automationRunId_fkey" FOREIGN KEY ("automationRunId") REFERENCES "CooAutomationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooApprovalRequest" ADD CONSTRAINT "CooApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooApprovalRequest" ADD CONSTRAINT "CooApprovalRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooInteractionSummary" ADD CONSTRAINT "CooInteractionSummary_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CooInteractionSummary" ADD CONSTRAINT "CooInteractionSummary_automationRunId_fkey" FOREIGN KEY ("automationRunId") REFERENCES "CooAutomationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminProspectResearch" ADD CONSTRAINT "AdminProspectResearch_automationRunId_fkey" FOREIGN KEY ("automationRunId") REFERENCES "CooAutomationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "AdminProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "AdminMilestone"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_automationRunId_fkey" FOREIGN KEY ("automationRunId") REFERENCES "CooAutomationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION enforce_admin_payment_allocation()
RETURNS TRIGGER AS $$
DECLARE
  payment_currency "AdminCurrency";
  payment_company TEXT;
  payment_amount DECIMAL(18,2);
  payment_status "AdminPaymentStatus";
  invoice_currency "AdminCurrency";
  invoice_company TEXT;
  invoice_amount DECIMAL(18,2);
  allocated_to_payment DECIMAL(18,2);
  cleared_on_invoice DECIMAL(18,2);
BEGIN
  SELECT "currency", "companyId", "amount", "status"
    INTO payment_currency, payment_company, payment_amount, payment_status
    FROM "AdminPayment" WHERE "id" = NEW."paymentId" FOR UPDATE;
  SELECT "currency", "companyId", "amount"
    INTO invoice_currency, invoice_company, invoice_amount
    FROM "AdminInvoice" WHERE "id" = NEW."invoiceId" FOR UPDATE;

  IF NEW."currency" <> payment_currency OR NEW."currency" <> invoice_currency THEN
    RAISE EXCEPTION 'Payment allocation currency must match payment and invoice currency';
  END IF;
  IF payment_company <> invoice_company THEN
    RAISE EXCEPTION 'Payment and invoice company must match';
  END IF;

  SELECT COALESCE(SUM("amount"), 0) INTO allocated_to_payment
    FROM "AdminPaymentAllocation"
    WHERE "paymentId" = NEW."paymentId" AND "id" <> NEW."id";
  IF allocated_to_payment + NEW."amount" > payment_amount THEN
    RAISE EXCEPTION 'Payment allocations cannot exceed payment amount';
  END IF;

  IF payment_status = 'CLEARED' THEN
    SELECT COALESCE(SUM(a."amount"), 0) INTO cleared_on_invoice
      FROM "AdminPaymentAllocation" a
      JOIN "AdminPayment" p ON p."id" = a."paymentId"
      WHERE a."invoiceId" = NEW."invoiceId"
        AND a."id" <> NEW."id"
        AND p."status" = 'CLEARED';
    IF cleared_on_invoice + NEW."amount" > invoice_amount THEN
      RAISE EXCEPTION 'Cleared allocations cannot exceed invoice amount';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AdminPaymentAllocation_validate_trigger"
BEFORE INSERT OR UPDATE ON "AdminPaymentAllocation"
FOR EACH ROW EXECUTE FUNCTION enforce_admin_payment_allocation();
