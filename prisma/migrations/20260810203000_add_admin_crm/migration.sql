CREATE TYPE "AdminRole" AS ENUM ('OWNER', 'ADMIN', 'SALES');
CREATE TYPE "AdminCompanyStatus" AS ENUM ('TARGET', 'ACTIVE', 'CLIENT', 'DORMANT', 'ARCHIVED');
CREATE TYPE "AdminOpportunityDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "AdminOpportunityStage" AS ENUM ('RESEARCHING', 'CONTACTED', 'REPLIED', 'QUALIFIED', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
CREATE TYPE "AdminOpportunityType" AS ENUM ('WEBSITE_REDESIGN', 'PROPERTY_PLATFORM', 'CUSTOMER_PORTAL', 'BUSINESS_SYSTEM', 'OPERATIONS_PLATFORM', 'CRM', 'AUTOMATION', 'INTEGRATION', 'CUSTOM_SOFTWARE', 'OTHER');
CREATE TYPE "AdminTaskType" AS ENUM ('CALL', 'EMAIL', 'LINKEDIN', 'RESEARCH', 'PROPOSAL', 'FOLLOW_UP', 'MEETING');
CREATE TYPE "AdminTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "AdminTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE "AdminActivityKind" AS ENUM ('CREATED', 'UPDATED', 'STAGE_CHANGED', 'NOTE_ADDED', 'MESSAGE_LOGGED', 'TASK_CREATED', 'PROPOSAL_UPDATED', 'ASSIGNED', 'ARCHIVED', 'RESTORED');
CREATE TYPE "AdminOutreachChannel" AS ENUM ('EMAIL', 'LINKEDIN', 'INSTAGRAM', 'PHONE', 'WHATSAPP', 'REFERRAL', 'OTHER');
CREATE TYPE "AdminMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');
CREATE TYPE "AdminProposalStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');
CREATE TYPE "AdminAuditAction" AS ENUM ('CREATE', 'UPDATE', 'ARCHIVE', 'RESTORE');

CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSignedInAt" TIMESTAMP(3),
    "externalAuthId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'SALES',
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminCompany" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "status" "AdminCompanyStatus" NOT NULL DEFAULT 'TARGET',
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "estimatedSize" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "lifetimeValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    CONSTRAINT "AdminCompany_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminContact" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedInUrl" TEXT,
    "isDecisionMaker" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AdminContact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminOpportunity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "reference" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "primaryContactId" TEXT,
    "projectLeadId" TEXT,
    "assignedOwnerId" TEXT,
    "direction" "AdminOpportunityDirection" NOT NULL,
    "stage" "AdminOpportunityStage" NOT NULL DEFAULT 'RESEARCHING',
    "type" "AdminOpportunityType" NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "identifiedProblem" TEXT NOT NULL,
    "opportunity" TEXT NOT NULL,
    "estimatedValue" DECIMAL(14,2) NOT NULL,
    "budget" TEXT,
    "timeline" TEXT,
    "probability" INTEGER NOT NULL DEFAULT 10,
    "nextAction" TEXT,
    "nextFollowUp" TIMESTAMP(3),
    "reasonForContact" TEXT,
    "personalizationNotes" TEXT,
    CONSTRAINT "AdminOpportunity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminOpportunity_probability_check" CHECK ("probability" BETWEEN 0 AND 100)
);

CREATE TABLE "AdminProspectResearch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "currentWebsiteQuality" INTEGER,
    "operationalMaturity" INTEGER,
    "observedProblems" TEXT,
    "recentBusinessActivity" TEXT,
    "businessValueScore" INTEGER NOT NULL DEFAULT 1,
    "visibleDigitalProblemScore" INTEGER NOT NULL DEFAULT 1,
    "operationalProblemScore" INTEGER NOT NULL DEFAULT 1,
    "urgencyScore" INTEGER NOT NULL DEFAULT 1,
    "decisionMakerAccessScore" INTEGER NOT NULL DEFAULT 1,
    "totalScore" INTEGER NOT NULL DEFAULT 5,
    "websiteReviewed" BOOLEAN NOT NULL DEFAULT false,
    "mobileReviewed" BOOLEAN NOT NULL DEFAULT false,
    "businessModelUnderstood" BOOLEAN NOT NULL DEFAULT false,
    "decisionMakerIdentified" BOOLEAN NOT NULL DEFAULT false,
    "specificProblemIdentified" BOOLEAN NOT NULL DEFAULT false,
    "personalizationPrepared" BOOLEAN NOT NULL DEFAULT false,
    "contactMethodFound" BOOLEAN NOT NULL DEFAULT false,
    "readyForOutreachAt" TIMESTAMP(3),
    CONSTRAINT "AdminProspectResearch_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AdminProspectResearch_score_check" CHECK (
      "businessValueScore" BETWEEN 1 AND 5 AND
      "visibleDigitalProblemScore" BETWEEN 1 AND 5 AND
      "operationalProblemScore" BETWEEN 1 AND 5 AND
      "urgencyScore" BETWEEN 1 AND 5 AND
      "decisionMakerAccessScore" BETWEEN 1 AND 5 AND
      "totalScore" BETWEEN 5 AND 25
    )
);

CREATE TABLE "AdminTask" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "opportunityId" TEXT,
    "companyId" TEXT,
    "contactId" TEXT,
    "ownerId" TEXT NOT NULL,
    "type" "AdminTaskType" NOT NULL,
    "priority" "AdminTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "AdminTaskStatus" NOT NULL DEFAULT 'TODO',
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "AdminTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminOpportunityNote" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    CONSTRAINT "AdminOpportunityNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminActivity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opportunityId" TEXT NOT NULL,
    "actorId" TEXT,
    "kind" "AdminActivityKind" NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    CONSTRAINT "AdminActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "recordedById" TEXT,
    "channel" "AdminOutreachChannel" NOT NULL,
    "direction" "AdminMessageDirection" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "response" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextAction" TEXT,
    "provider" TEXT,
    "externalMessageId" TEXT,
    "deliveryStatus" TEXT,
    "rawMetadata" JSONB,
    CONSTRAINT "AdminMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminProposal" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "createdById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "AdminProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "documentUrl" TEXT,
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    CONSTRAINT "AdminProposal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "action" "AdminAuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminUser_externalAuthId_key" ON "AdminUser"("externalAuthId");
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE INDEX "AdminUser_active_role_idx" ON "AdminUser"("active", "role");
CREATE UNIQUE INDEX "AdminCompany_domain_key" ON "AdminCompany"("domain");
CREATE INDEX "AdminCompany_industry_country_idx" ON "AdminCompany"("industry", "country");
CREATE INDEX "AdminCompany_status_createdAt_idx" ON "AdminCompany"("status", "createdAt");
CREATE INDEX "AdminCompany_archivedAt_idx" ON "AdminCompany"("archivedAt");
CREATE UNIQUE INDEX "AdminContact_companyId_email_key" ON "AdminContact"("companyId", "email");
CREATE INDEX "AdminContact_companyId_isDecisionMaker_idx" ON "AdminContact"("companyId", "isDecisionMaker");
CREATE INDEX "AdminContact_email_idx" ON "AdminContact"("email");
CREATE INDEX "AdminContact_archivedAt_idx" ON "AdminContact"("archivedAt");
CREATE UNIQUE INDEX "AdminOpportunity_reference_key" ON "AdminOpportunity"("reference");
CREATE UNIQUE INDEX "AdminOpportunity_projectLeadId_key" ON "AdminOpportunity"("projectLeadId");
CREATE INDEX "AdminOpportunity_stage_nextFollowUp_idx" ON "AdminOpportunity"("stage", "nextFollowUp");
CREATE INDEX "AdminOpportunity_assignedOwnerId_stage_idx" ON "AdminOpportunity"("assignedOwnerId", "stage");
CREATE INDEX "AdminOpportunity_companyId_stage_idx" ON "AdminOpportunity"("companyId", "stage");
CREATE INDEX "AdminOpportunity_direction_createdAt_idx" ON "AdminOpportunity"("direction", "createdAt");
CREATE INDEX "AdminOpportunity_estimatedValue_idx" ON "AdminOpportunity"("estimatedValue");
CREATE INDEX "AdminOpportunity_archivedAt_idx" ON "AdminOpportunity"("archivedAt");
CREATE UNIQUE INDEX "AdminProspectResearch_opportunityId_key" ON "AdminProspectResearch"("opportunityId");
CREATE INDEX "AdminProspectResearch_totalScore_idx" ON "AdminProspectResearch"("totalScore");
CREATE INDEX "AdminProspectResearch_readyForOutreachAt_idx" ON "AdminProspectResearch"("readyForOutreachAt");
CREATE INDEX "AdminTask_ownerId_status_dueAt_idx" ON "AdminTask"("ownerId", "status", "dueAt");
CREATE INDEX "AdminTask_opportunityId_status_idx" ON "AdminTask"("opportunityId", "status");
CREATE INDEX "AdminTask_companyId_idx" ON "AdminTask"("companyId");
CREATE INDEX "AdminTask_priority_dueAt_idx" ON "AdminTask"("priority", "dueAt");
CREATE INDEX "AdminTask_archivedAt_idx" ON "AdminTask"("archivedAt");
CREATE INDEX "AdminOpportunityNote_opportunityId_createdAt_idx" ON "AdminOpportunityNote"("opportunityId", "createdAt");
CREATE INDEX "AdminOpportunityNote_authorId_idx" ON "AdminOpportunityNote"("authorId");
CREATE INDEX "AdminActivity_opportunityId_occurredAt_idx" ON "AdminActivity"("opportunityId", "occurredAt");
CREATE INDEX "AdminActivity_actorId_occurredAt_idx" ON "AdminActivity"("actorId", "occurredAt");
CREATE INDEX "AdminMessage_opportunityId_occurredAt_idx" ON "AdminMessage"("opportunityId", "occurredAt");
CREATE INDEX "AdminMessage_externalMessageId_idx" ON "AdminMessage"("externalMessageId");
CREATE INDEX "AdminMessage_provider_deliveryStatus_idx" ON "AdminMessage"("provider", "deliveryStatus");
CREATE UNIQUE INDEX "AdminProposal_opportunityId_version_key" ON "AdminProposal"("opportunityId", "version");
CREATE INDEX "AdminProposal_status_sentAt_idx" ON "AdminProposal"("status", "sentAt");
CREATE INDEX "AdminProposal_createdById_idx" ON "AdminProposal"("createdById");
CREATE INDEX "AdminAuditLog_entityType_entityId_createdAt_idx" ON "AdminAuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX "AdminAuditLog_actorId_createdAt_idx" ON "AdminAuditLog"("actorId", "createdAt");

ALTER TABLE "AdminContact" ADD CONSTRAINT "AdminContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AdminCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminOpportunity" ADD CONSTRAINT "AdminOpportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AdminCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminOpportunity" ADD CONSTRAINT "AdminOpportunity_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "AdminContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminOpportunity" ADD CONSTRAINT "AdminOpportunity_projectLeadId_fkey" FOREIGN KEY ("projectLeadId") REFERENCES "ProjectLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminOpportunity" ADD CONSTRAINT "AdminOpportunity_assignedOwnerId_fkey" FOREIGN KEY ("assignedOwnerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminProspectResearch" ADD CONSTRAINT "AdminProspectResearch_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "AdminOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "AdminOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "AdminCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "AdminContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminTask" ADD CONSTRAINT "AdminTask_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminOpportunityNote" ADD CONSTRAINT "AdminOpportunityNote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "AdminOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminOpportunityNote" ADD CONSTRAINT "AdminOpportunityNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminActivity" ADD CONSTRAINT "AdminActivity_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "AdminOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminActivity" ADD CONSTRAINT "AdminActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminMessage" ADD CONSTRAINT "AdminMessage_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "AdminOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminMessage" ADD CONSTRAINT "AdminMessage_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminProposal" ADD CONSTRAINT "AdminProposal_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "AdminOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminProposal" ADD CONSTRAINT "AdminProposal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
