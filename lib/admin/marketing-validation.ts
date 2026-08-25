import {
  MarketingAssetFormat,
  MarketingAssetStatus,
  MarketingAssetTemplate,
  MarketingAssetVariant,
  MarketingCampaignStatus,
  MarketingChannel,
  MarketingChannelProfileStatus,
  MarketingContentStatus,
  MarketingContentType,
  MarketingMetricEntrySource,
  MarketingLaunchChecklistStatus,
  MarketingPillar,
  MarketingVerificationStatus,
} from "@prisma/client";
import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.string().url().max(1000)]);
const optionalText = (maximum: number) => z.string().trim().max(maximum).default("");

export const marketingContentSchema = z.object({
  id: optionalText(120),
  title: z.string().trim().min(3).max(220),
  coreIdea: z.string().trim().min(10).max(2000),
  contentType: z.enum(MarketingContentType),
  pillar: z.enum(MarketingPillar),
  status: z.enum(MarketingContentStatus),
  primaryChannel: z.enum(MarketingChannel),
  secondaryChannels: z.array(z.enum(MarketingChannel)).max(7).default([]),
  publishAt: z.string().trim().min(16).max(16),
  owner: z.string().trim().min(2).max(120),
  body: z.string().trim().min(1).max(60_000),
  shortCaption: optionalText(10_000),
  cta: optionalText(500),
  destinationUrl: optionalUrl,
  assetBrief: optionalText(5000),
  sourceArticleId: optionalText(240),
  campaignId: optionalText(120),
  parentContentId: optionalText(120),
  canonicalPostUrl: optionalUrl,
  notes: optionalText(10_000),
});

export const marketingCampaignSchema = z
  .object({
    id: optionalText(120),
    name: z.string().trim().min(3).max(220),
    objective: z.string().trim().min(10).max(5000),
    audience: z.string().trim().min(5).max(5000),
    message: z.string().trim().min(5).max(5000),
    offer: z.string().trim().min(3).max(5000),
    startAt: z.string().trim().min(16).max(16),
    endAt: z.string().trim().min(16).max(16),
    status: z.enum(MarketingCampaignStatus),
    primaryCta: z.string().trim().min(2).max(500),
    landingPage: optionalUrl,
    utmSource: optionalText(120),
    utmMedium: optionalText(120),
    utmCampaign: optionalText(160),
    targetAccountSegment: optionalText(5000),
    targetMetrics: optionalText(10_000),
    actualMetrics: optionalText(10_000),
    notes: optionalText(10_000),
  })
  .refine((value) => value.endAt >= value.startAt, {
    path: ["endAt"],
    message: "End must be after start.",
  });

export const marketingAssetSchema = z.object({
  id: optionalText(120),
  name: z.string().trim().min(3).max(220),
  kind: z.string().trim().min(2).max(120),
  status: z.enum(MarketingAssetStatus),
  channel: z.union([z.literal(""), z.enum(MarketingChannel)]),
  dueAt: z.union([z.literal(""), z.string().trim().min(16).max(16)]),
  brief: z.string().trim().min(5).max(10_000),
  assetUrl: optionalUrl,
  owner: optionalText(120),
  notes: optionalText(10_000),
  campaignId: optionalText(120),
  contentId: optionalText(120),
});

export const brandAssetDesignSchema = z
  .object({
    id: optionalText(120),
    name: z.string().trim().min(3).max(220),
    status: z.enum(MarketingAssetStatus),
    template: z.enum(MarketingAssetTemplate),
    format: z.enum(MarketingAssetFormat),
    variant: z.enum(MarketingAssetVariant),
    title: z.string().trim().min(1).max(220),
    eyebrow: optionalText(120),
    body: optionalText(2000),
    cta: optionalText(160),
    altText: optionalText(1000),
    slideCount: z.number().int().min(1).max(12),
    slides: z.array(z.object({
      title: z.string().trim().min(1).max(220),
      body: optionalText(2000),
      copy: optionalText(4000).optional(),
    })).max(12),
    systemNodes: z.array(z.string().trim().min(1).max(80)).min(1).max(8),
    destinationUrl: optionalUrl,
    campaignId: optionalText(120),
    contentId: optionalText(120),
    notes: optionalText(10_000),
  })
  .superRefine((value, context) => {
    if (value.status === "READY" && !value.altText) {
      context.addIssue({ code: "custom", path: ["altText"], message: "Alt text is required before an asset can be READY." });
    }
    if (value.template === "CAROUSEL") {
      if (value.slideCount < 2) {
        context.addIssue({ code: "custom", path: ["slideCount"], message: "Carousels require at least two slides." });
      }
      if (value.slides.length !== value.slideCount) {
        context.addIssue({ code: "custom", path: ["slides"], message: "Slide data must match the selected slide count." });
      }
    }
    if (value.template === "SYSTEM_FLOW" && value.systemNodes.length < 2) {
      context.addIssue({ code: "custom", path: ["systemNodes"], message: "System Flow requires at least two nodes." });
    }
  });

export const marketingChannelProfileSchema = z.object({
  id: z.string().trim().min(1).max(120),
  profileUrl: optionalUrl,
  status: z.enum(MarketingChannelProfileStatus),
  bioComplete: z.boolean(),
  logoComplete: z.boolean(),
  bannerComplete: z.boolean(),
  ctaLinkComplete: z.boolean(),
  verificationStatus: z.enum(MarketingVerificationStatus),
  lastReviewedAt: z.union([z.literal(""), z.string().trim().min(10).max(10)]),
  notes: optionalText(10_000),
});

const metricCount = z.coerce.number().int().min(0).max(1_000_000_000);

export const marketingMetricSchema = z.object({
  id: optionalText(120),
  weekStarting: z.string().trim().min(10).max(10),
  channel: z.union([z.literal(""), z.enum(MarketingChannel)]),
  campaignId: optionalText(120),
  source: z.enum(MarketingMetricEntrySource),
  impressions: metricCount,
  reach: metricCount,
  profileViews: metricCount,
  websiteClicks: metricCount,
  comments: metricCount,
  saves: metricCount,
  directMessages: metricCount,
  emailReplies: metricCount,
  qualifiedConversations: metricCount,
  discoveryCalls: metricCount,
  opportunities: metricCount,
  currency: z.enum(["JMD", "USD"]),
  wonRevenue: z.coerce.number().min(0).max(1_000_000_000),
  notes: optionalText(10_000),
});

export const marketingUtmPresetSchema = z.object({
  id: optionalText(120),
  name: z.string().trim().min(2).max(120),
  destination: z.string().url().max(1000),
  source: z.string().trim().min(1).max(120),
  medium: z.string().trim().min(1).max(120),
  campaign: z.string().trim().min(1).max(160),
  content: optionalText(160),
  term: optionalText(160),
});

export const marketingOutboundSchema = z.object({
  campaignId: z.string().trim().min(1).max(120),
  occurredAt: z.string().trim().min(16).max(16),
  channel: z.enum(MarketingChannel),
  activity: z.string().trim().min(3).max(220),
  quantity: z.coerce.number().int().min(1).max(100_000),
  notes: optionalText(5000),
});

export const marketingLaunchChecklistSchema = z.object({
  id: z.string().trim().min(1).max(120),
  status: z.enum(MarketingLaunchChecklistStatus),
  evidenceUrl: optionalUrl,
  notes: optionalText(5000),
});
