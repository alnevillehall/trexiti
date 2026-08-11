-- Extend lead attribution without changing existing first-touch values.
ALTER TABLE "ProjectLead"
ADD COLUMN "firstTouchContent" TEXT,
ADD COLUMN "firstTouchTerm" TEXT,
ADD COLUMN "firstTouchAt" TIMESTAMP(3),
ADD COLUMN "lastTouchContent" TEXT,
ADD COLUMN "lastTouchTerm" TEXT,
ADD COLUMN "lastTouchAt" TIMESTAMP(3),
ADD COLUMN "isReturning" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "ProjectLead_firstTouchSource_createdAt_idx"
ON "ProjectLead"("firstTouchSource", "createdAt");

-- Anonymous, consent-gated marketing events. No IP address, user agent,
-- contact detail, form answer, or free-text field is stored here.
CREATE TABLE "MarketingEvent" (
  "id" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "name" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "properties" JSONB,
  "firstTouchSource" TEXT NOT NULL,
  "firstTouchMedium" TEXT NOT NULL,
  "firstTouchCampaign" TEXT,
  "firstTouchContent" TEXT,
  "firstTouchTerm" TEXT,
  "firstTouchAt" TIMESTAMP(3) NOT NULL,
  "lastTouchSource" TEXT NOT NULL,
  "lastTouchMedium" TEXT NOT NULL,
  "lastTouchCampaign" TEXT,
  "lastTouchContent" TEXT,
  "lastTouchTerm" TEXT,
  "lastTouchAt" TIMESTAMP(3) NOT NULL,
  "landingPage" TEXT NOT NULL,
  "referrer" TEXT,
  "isReturning" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "MarketingEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MarketingEvent_name_occurredAt_idx"
ON "MarketingEvent"("name", "occurredAt");

CREATE INDEX "MarketingEvent_sessionId_occurredAt_idx"
ON "MarketingEvent"("sessionId", "occurredAt");

CREATE INDEX "MarketingEvent_firstTouchSource_occurredAt_idx"
ON "MarketingEvent"("firstTouchSource", "occurredAt");

CREATE INDEX "MarketingEvent_route_occurredAt_idx"
ON "MarketingEvent"("route", "occurredAt");
