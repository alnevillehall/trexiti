-- CreateEnum
CREATE TYPE "MarketingContentStatus" AS ENUM ('IDEA', 'DRAFTING', 'REVIEW', 'READY', 'SCHEDULED', 'PUBLISHED', 'REPURPOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MarketingContentType" AS ENUM ('TEXT_POST', 'CAROUSEL', 'VIDEO', 'ARTICLE', 'CASE_STUDY', 'EMAIL', 'WHATSAPP_STATUS', 'PROFILE_UPDATE', 'LANDING_PAGE');

-- CreateEnum
CREATE TYPE "MarketingPillar" AS ENUM ('BUSINESS_SYSTEMS', 'OPERATIONAL_DESIGN', 'DIGITAL_EXPERIENCE', 'BUILD_VS_BUY', 'AUTOMATION', 'BEHIND_THE_WORK', 'SMALL_BUSINESS');

-- CreateEnum
CREATE TYPE "MarketingChannel" AS ENUM ('LINKEDIN_FOUNDER', 'LINKEDIN_COMPANY', 'INSTAGRAM', 'WEBSITE_INSIGHTS', 'EMAIL', 'WHATSAPP', 'GOOGLE_BUSINESS_PROFILE');

-- CreateEnum
CREATE TYPE "MarketingCampaignStatus" AS ENUM ('PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MarketingAssetStatus" AS ENUM ('REQUESTED', 'IN_PRODUCTION', 'REVIEW', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MarketingChannelProfileStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'READY', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "MarketingVerificationStatus" AS ENUM ('UNCHECKED', 'PENDING', 'VERIFIED', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "MarketingMetricEntrySource" AS ENUM ('MANUAL', 'IMPORTED');

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seedKey" TEXT,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "offer" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'PLANNED',
    "primaryCta" TEXT NOT NULL,
    "landingPage" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "targetAccountSegment" TEXT,
    "targetMetrics" JSONB,
    "actualMetrics" JSONB,
    "notes" TEXT,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingContent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seedKey" TEXT,
    "title" TEXT NOT NULL,
    "coreIdea" TEXT NOT NULL,
    "contentType" "MarketingContentType" NOT NULL,
    "pillar" "MarketingPillar" NOT NULL,
    "status" "MarketingContentStatus" NOT NULL DEFAULT 'IDEA',
    "primaryChannel" "MarketingChannel" NOT NULL,
    "secondaryChannels" "MarketingChannel"[] NOT NULL,
    "publishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "owner" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "shortCaption" TEXT,
    "cta" TEXT,
    "destinationUrl" TEXT,
    "assetBrief" TEXT,
    "sourceArticleId" TEXT,
    "campaignId" TEXT,
    "parentContentId" TEXT,
    "canonicalPostUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "MarketingContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingAsset" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seedKey" TEXT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "MarketingAssetStatus" NOT NULL DEFAULT 'REQUESTED',
    "channel" "MarketingChannel",
    "dueAt" TIMESTAMP(3),
    "brief" TEXT NOT NULL,
    "assetUrl" TEXT,
    "owner" TEXT,
    "notes" TEXT,
    "campaignId" TEXT,
    "contentId" TEXT,

    CONSTRAINT "MarketingAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingChannelProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "profileUrl" TEXT,
    "status" "MarketingChannelProfileStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "bioComplete" BOOLEAN NOT NULL DEFAULT false,
    "logoComplete" BOOLEAN NOT NULL DEFAULT false,
    "bannerComplete" BOOLEAN NOT NULL DEFAULT false,
    "ctaLinkComplete" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "MarketingVerificationStatus" NOT NULL DEFAULT 'UNCHECKED',
    "lastReviewedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "MarketingChannelProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingWeeklyMetric" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seedKey" TEXT,
    "weekStarting" TIMESTAMP(3) NOT NULL,
    "channel" "MarketingChannel",
    "campaignId" TEXT,
    "source" "MarketingMetricEntrySource" NOT NULL DEFAULT 'MANUAL',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "websiteClicks" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "directMessages" INTEGER NOT NULL DEFAULT 0,
    "emailReplies" INTEGER NOT NULL DEFAULT 0,
    "qualifiedConversations" INTEGER NOT NULL DEFAULT 0,
    "discoveryCalls" INTEGER NOT NULL DEFAULT 0,
    "opportunities" INTEGER NOT NULL DEFAULT 0,
    "wonRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "MarketingWeeklyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingOutboundActivity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,
    "channel" "MarketingChannel" NOT NULL,
    "activity" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "MarketingOutboundActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingUtmPreset" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seedKey" TEXT,
    "name" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "campaign" TEXT NOT NULL,
    "content" TEXT,
    "term" TEXT,

    CONSTRAINT "MarketingUtmPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingCampaign_seedKey_key" ON "MarketingCampaign"("seedKey");
CREATE INDEX "MarketingCampaign_status_startAt_endAt_idx" ON "MarketingCampaign"("status", "startAt", "endAt");
CREATE UNIQUE INDEX "MarketingContent_seedKey_key" ON "MarketingContent"("seedKey");
CREATE INDEX "MarketingContent_status_publishAt_idx" ON "MarketingContent"("status", "publishAt");
CREATE INDEX "MarketingContent_primaryChannel_publishAt_idx" ON "MarketingContent"("primaryChannel", "publishAt");
CREATE INDEX "MarketingContent_pillar_publishAt_idx" ON "MarketingContent"("pillar", "publishAt");
CREATE INDEX "MarketingContent_campaignId_publishAt_idx" ON "MarketingContent"("campaignId", "publishAt");
CREATE INDEX "MarketingContent_parentContentId_idx" ON "MarketingContent"("parentContentId");
CREATE UNIQUE INDEX "MarketingAsset_seedKey_key" ON "MarketingAsset"("seedKey");
CREATE INDEX "MarketingAsset_status_dueAt_idx" ON "MarketingAsset"("status", "dueAt");
CREATE INDEX "MarketingAsset_campaignId_idx" ON "MarketingAsset"("campaignId");
CREATE INDEX "MarketingAsset_contentId_idx" ON "MarketingAsset"("contentId");
CREATE UNIQUE INDEX "MarketingChannelProfile_channel_key" ON "MarketingChannelProfile"("channel");
CREATE INDEX "MarketingChannelProfile_status_lastReviewedAt_idx" ON "MarketingChannelProfile"("status", "lastReviewedAt");
CREATE UNIQUE INDEX "MarketingWeeklyMetric_seedKey_key" ON "MarketingWeeklyMetric"("seedKey");
CREATE INDEX "MarketingWeeklyMetric_weekStarting_channel_idx" ON "MarketingWeeklyMetric"("weekStarting", "channel");
CREATE INDEX "MarketingWeeklyMetric_campaignId_weekStarting_idx" ON "MarketingWeeklyMetric"("campaignId", "weekStarting");
CREATE INDEX "MarketingOutboundActivity_campaignId_occurredAt_idx" ON "MarketingOutboundActivity"("campaignId", "occurredAt");
CREATE INDEX "MarketingOutboundActivity_channel_occurredAt_idx" ON "MarketingOutboundActivity"("channel", "occurredAt");
CREATE UNIQUE INDEX "MarketingUtmPreset_seedKey_key" ON "MarketingUtmPreset"("seedKey");
CREATE UNIQUE INDEX "MarketingUtmPreset_name_key" ON "MarketingUtmPreset"("name");
CREATE INDEX "MarketingUtmPreset_campaign_idx" ON "MarketingUtmPreset"("campaign");

-- AddForeignKey
ALTER TABLE "MarketingContent" ADD CONSTRAINT "MarketingContent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketingContent" ADD CONSTRAINT "MarketingContent_parentContentId_fkey" FOREIGN KEY ("parentContentId") REFERENCES "MarketingContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketingAsset" ADD CONSTRAINT "MarketingAsset_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketingAsset" ADD CONSTRAINT "MarketingAsset_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "MarketingContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketingWeeklyMetric" ADD CONSTRAINT "MarketingWeeklyMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MarketingOutboundActivity" ADD CONSTRAINT "MarketingOutboundActivity_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
