"use server";

import { createHash, randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";
import { getBrandAssetFormat, brandAssetTemplates } from "@/lib/admin/brand-assets";
import { parseJamaicaDateTimeLocal } from "@/lib/admin/marketing";
import { seedMarketingOs } from "@/lib/admin/marketing-seed";
import {
  marketingAssetSchema,
  brandAssetDesignSchema,
  marketingCampaignSchema,
  marketingChannelProfileSchema,
  marketingContentSchema,
  marketingMetricSchema,
  marketingOutboundSchema,
  marketingLaunchChecklistSchema,
  marketingUtmPresetSchema,
} from "@/lib/admin/marketing-validation";
import { prisma } from "@/lib/prisma";
import { requestApproval } from "@/lib/coo/data";

const marketingPaths = [
  "/admin/marketing",
  "/admin/marketing/calendar",
  "/admin/marketing/content",
  "/admin/marketing/campaigns",
  "/admin/marketing/assets",
  "/admin/marketing/channels",
  "/admin/marketing/metrics",
  "/admin/marketing/utm",
  "/admin/marketing/launch-readiness",
];

function revalidateMarketing() {
  for (const path of marketingPaths) revalidatePath(path);
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function optional(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

function parseJsonObject(value: string): Prisma.InputJsonValue | undefined {
  if (!value.trim()) return undefined;
  const parsed: unknown = JSON.parse(value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("Metrics JSON must be an object.");
  }
  return parsed as Prisma.InputJsonValue;
}

async function audit(
  actorId: string,
  action: "CREATE" | "UPDATE" | "ARCHIVE",
  entityType: string,
  entityId: string,
  summary: string,
) {
  await prisma.adminAuditLog.create({
    data: { actorId, action, entityType, entityId, summary },
  });
}

type MarketingRemovalRecordType =
  | "MarketingContent"
  | "MarketingCampaign"
  | "MarketingAsset"
  | "MarketingWeeklyMetric"
  | "MarketingUtmPreset";

async function requestMarketingRemoval(input: {
  actorId: string;
  recordType: MarketingRemovalRecordType;
  recordId: string;
  operation: "archive" | "delete";
}) {
  const record =
    input.recordType === "MarketingContent"
      ? await prisma.marketingContent.findUnique({ where: { id: input.recordId }, select: { id: true, updatedAt: true, status: true } })
      : input.recordType === "MarketingCampaign"
        ? await prisma.marketingCampaign.findUnique({ where: { id: input.recordId }, select: { id: true, updatedAt: true, status: true } })
        : input.recordType === "MarketingAsset"
          ? await prisma.marketingAsset.findUnique({ where: { id: input.recordId }, select: { id: true, updatedAt: true, status: true } })
          : input.recordType === "MarketingWeeklyMetric"
            ? await prisma.marketingWeeklyMetric.findUnique({ where: { id: input.recordId }, select: { id: true, updatedAt: true } })
            : await prisma.marketingUtmPreset.findUnique({ where: { id: input.recordId }, select: { id: true, updatedAt: true } });
  if (!record) throw new Error("The marketing record no longer exists.");

  const payload = {
    recordType: input.recordType,
    recordId: input.recordId,
    operation: input.operation,
  };
  const digest = createHash("sha256")
    .update(JSON.stringify({ payload, updatedAt: record.updatedAt.toISOString() }))
    .digest("hex")
    .slice(0, 24);
  await requestApproval({
    actorId: input.actorId,
    correlationId: randomUUID(),
    idempotencyKey: `admin:marketing-removal:${input.recordType}:${input.recordId}:${digest}`,
    action: "DELETE_RECORD",
    risk: "DESTRUCTIVE",
    entityType: input.recordType,
    entityId: input.recordId,
    targetSnapshot: record,
    payload,
    evidence: { source: "admin-marketing" },
  });
  revalidatePath("/admin/approvals");
}

export async function saveMarketingContentAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const value = marketingContentSchema.parse({
    id: text(formData, "id"),
    title: text(formData, "title"),
    coreIdea: text(formData, "coreIdea"),
    contentType: text(formData, "contentType"),
    pillar: text(formData, "pillar"),
    status: text(formData, "status"),
    primaryChannel: text(formData, "primaryChannel"),
    secondaryChannels: formData.getAll("secondaryChannels").map(String),
    publishAt: text(formData, "publishAt"),
    owner: text(formData, "owner"),
    body: text(formData, "body"),
    shortCaption: text(formData, "shortCaption"),
    cta: text(formData, "cta"),
    destinationUrl: text(formData, "destinationUrl"),
    assetBrief: text(formData, "assetBrief"),
    sourceArticleId: text(formData, "sourceArticleId"),
    campaignId: text(formData, "campaignId"),
    parentContentId: text(formData, "parentContentId"),
    canonicalPostUrl: text(formData, "canonicalPostUrl"),
    notes: text(formData, "notes"),
  });

  if (value.id && value.parentContentId === value.id) {
    throw new Error("A content record cannot be its own parent.");
  }
  if (value.id && value.status === "ARCHIVED") {
    const existing = await prisma.marketingContent.findUnique({ where: { id: value.id }, select: { status: true } });
    if (existing?.status !== "ARCHIVED") {
      await requestMarketingRemoval({ actorId: session.id, recordType: "MarketingContent", recordId: value.id, operation: "archive" });
      revalidateMarketing();
      redirect("/admin/approvals?requested=1");
    }
  }

  const data = {
    title: value.title,
    coreIdea: value.coreIdea,
    contentType: value.contentType,
    pillar: value.pillar,
    status: value.status,
    primaryChannel: value.primaryChannel,
    secondaryChannels: value.secondaryChannels,
    publishAt: parseJamaicaDateTimeLocal(value.publishAt),
    owner: value.owner,
    body: value.body,
    shortCaption: optional(value.shortCaption),
    cta: optional(value.cta),
    destinationUrl: optional(value.destinationUrl),
    assetBrief: optional(value.assetBrief),
    sourceArticleId: optional(value.sourceArticleId),
    campaignId: optional(value.campaignId),
    parentContentId: optional(value.parentContentId),
    canonicalPostUrl: optional(value.canonicalPostUrl),
    notes: optional(value.notes),
    ...(value.status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
  };

  if (value.id) {
    await prisma.marketingContent.update({ where: { id: value.id }, data });
    await audit(session.id, "UPDATE", "MarketingContent", value.id, `Updated ${value.title}`);
  } else {
    const record = await prisma.marketingContent.create({ data });
    await audit(session.id, "CREATE", "MarketingContent", record.id, `Created ${value.title}`);
  }
  revalidateMarketing();
}

export async function archiveMarketingContentAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const id = text(formData, "id");
  await requestMarketingRemoval({ actorId: session.id, recordType: "MarketingContent", recordId: id, operation: "archive" });
  revalidateMarketing();
  redirect("/admin/approvals?requested=1");
}

export async function saveMarketingCampaignAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const value = marketingCampaignSchema.parse({
    id: text(formData, "id"),
    name: text(formData, "name"),
    objective: text(formData, "objective"),
    audience: text(formData, "audience"),
    message: text(formData, "message"),
    offer: text(formData, "offer"),
    startAt: text(formData, "startAt"),
    endAt: text(formData, "endAt"),
    status: text(formData, "status"),
    primaryCta: text(formData, "primaryCta"),
    landingPage: text(formData, "landingPage"),
    utmSource: text(formData, "utmSource"),
    utmMedium: text(formData, "utmMedium"),
    utmCampaign: text(formData, "utmCampaign"),
    targetAccountSegment: text(formData, "targetAccountSegment"),
    targetMetrics: text(formData, "targetMetrics"),
    actualMetrics: text(formData, "actualMetrics"),
    notes: text(formData, "notes"),
  });
  if (value.id && value.status === "ARCHIVED") {
    const existing = await prisma.marketingCampaign.findUnique({ where: { id: value.id }, select: { status: true } });
    if (existing?.status !== "ARCHIVED") {
      await requestMarketingRemoval({ actorId: session.id, recordType: "MarketingCampaign", recordId: value.id, operation: "archive" });
      revalidateMarketing();
      redirect("/admin/approvals?requested=1");
    }
  }
  const data = {
    name: value.name,
    objective: value.objective,
    audience: value.audience,
    message: value.message,
    offer: value.offer,
    startAt: parseJamaicaDateTimeLocal(value.startAt),
    endAt: parseJamaicaDateTimeLocal(value.endAt),
    status: value.status,
    primaryCta: value.primaryCta,
    landingPage: optional(value.landingPage),
    utmSource: optional(value.utmSource),
    utmMedium: optional(value.utmMedium),
    utmCampaign: optional(value.utmCampaign),
    targetAccountSegment: optional(value.targetAccountSegment),
    targetMetrics: parseJsonObject(value.targetMetrics),
    actualMetrics: parseJsonObject(value.actualMetrics),
    notes: optional(value.notes),
  };

  if (value.id) {
    await prisma.marketingCampaign.update({ where: { id: value.id }, data });
    await audit(session.id, "UPDATE", "MarketingCampaign", value.id, `Updated ${value.name}`);
  } else {
    const record = await prisma.marketingCampaign.create({ data });
    await audit(session.id, "CREATE", "MarketingCampaign", record.id, `Created ${value.name}`);
  }
  revalidateMarketing();
}

export async function archiveMarketingCampaignAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const id = text(formData, "id");
  await requestMarketingRemoval({ actorId: session.id, recordType: "MarketingCampaign", recordId: id, operation: "archive" });
  revalidateMarketing();
  redirect("/admin/approvals?requested=1");
}

export async function saveMarketingAssetAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const value = marketingAssetSchema.parse({
    id: text(formData, "id"),
    name: text(formData, "name"),
    kind: text(formData, "kind"),
    status: text(formData, "status"),
    channel: text(formData, "channel"),
    dueAt: text(formData, "dueAt"),
    brief: text(formData, "brief"),
    assetUrl: text(formData, "assetUrl"),
    owner: text(formData, "owner"),
    notes: text(formData, "notes"),
    campaignId: text(formData, "campaignId"),
    contentId: text(formData, "contentId"),
  });
  if (value.id && value.status === "ARCHIVED") {
    const existing = await prisma.marketingAsset.findUnique({ where: { id: value.id }, select: { status: true } });
    if (existing?.status !== "ARCHIVED") {
      await requestMarketingRemoval({ actorId: session.id, recordType: "MarketingAsset", recordId: value.id, operation: "archive" });
      revalidateMarketing();
      redirect("/admin/approvals?requested=1");
    }
  }
  const data = {
    name: value.name,
    kind: value.kind,
    status: value.status,
    channel: value.channel || null,
    dueAt: value.dueAt ? parseJamaicaDateTimeLocal(value.dueAt) : null,
    brief: value.brief,
    assetUrl: optional(value.assetUrl),
    owner: optional(value.owner),
    notes: optional(value.notes),
    campaignId: optional(value.campaignId),
    contentId: optional(value.contentId),
  };
  if (value.id) {
    await prisma.marketingAsset.update({ where: { id: value.id }, data });
    await audit(session.id, "UPDATE", "MarketingAsset", value.id, `Updated ${value.name}`);
  } else {
    const record = await prisma.marketingAsset.create({ data });
    await audit(session.id, "CREATE", "MarketingAsset", record.id, `Created ${value.name}`);
  }
  revalidateMarketing();
}

export async function saveBrandAssetDesignAction(input: unknown) {
  const session = await requireAdminSession("marketing:manage");
  const value = brandAssetDesignSchema.parse(input);
  if (value.id && value.status === "ARCHIVED") {
    const existing = await prisma.marketingAsset.findUnique({ where: { id: value.id }, select: { status: true } });
    if (existing?.status !== "ARCHIVED") {
      await requestMarketingRemoval({ actorId: session.id, recordType: "MarketingAsset", recordId: value.id, operation: "archive" });
      revalidateMarketing();
      return { id: value.id, approvalRequested: true };
    }
  }
  const dimensions = getBrandAssetFormat(value.format);
  const templateLabel = brandAssetTemplates.find((template) => template.id === value.template)?.label ?? "Brand asset";
  const data = {
    name: value.name,
    kind: templateLabel,
    status: value.status,
    brief: `Structured ${templateLabel} generated inside Trexiti Marketing OS.`,
    template: value.template,
    format: value.format,
    variant: value.variant,
    title: value.title,
    eyebrow: optional(value.eyebrow),
    body: optional(value.body),
    cta: optional(value.cta),
    altText: optional(value.altText),
    slideCount: value.template === "CAROUSEL" ? value.slideCount : 1,
    slides: value.template === "CAROUSEL" ? value.slides as Prisma.InputJsonValue : undefined,
    systemNodes: value.systemNodes,
    destinationUrl: optional(value.destinationUrl),
    exportWidth: dimensions.width,
    exportHeight: dimensions.height,
    campaignId: optional(value.campaignId),
    contentId: optional(value.contentId),
    notes: optional(value.notes),
  };

  if (value.id) {
    await prisma.marketingAsset.update({ where: { id: value.id }, data });
    await audit(session.id, "UPDATE", "MarketingAsset", value.id, `Updated ${value.name}`);
    revalidateMarketing();
    revalidatePath(`/admin/marketing/assets/${value.id}`);
    return { id: value.id, approvalRequested: false };
  }

  const record = await prisma.marketingAsset.create({ data });
  await audit(session.id, "CREATE", "MarketingAsset", record.id, `Created ${value.name}`);
  revalidateMarketing();
  return { id: record.id, approvalRequested: false };
}

export async function markBrandAssetExportedAction(id: string) {
  const session = await requireAdminSession("marketing:manage");
  const record = await prisma.marketingAsset.update({
    where: { id },
    data: { lastExportedAt: new Date() },
    select: { name: true },
  });
  await audit(session.id, "UPDATE", "MarketingAsset", id, `Exported ${record.name}`);
  revalidateMarketing();
  revalidatePath(`/admin/marketing/assets/${id}`);
}

export async function archiveMarketingAssetAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const id = text(formData, "id");
  await requestMarketingRemoval({ actorId: session.id, recordType: "MarketingAsset", recordId: id, operation: "archive" });
  revalidateMarketing();
  redirect("/admin/approvals?requested=1");
}

export async function updateMarketingChannelAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const value = marketingChannelProfileSchema.parse({
    id: text(formData, "id"),
    profileUrl: text(formData, "profileUrl"),
    status: text(formData, "status"),
    bioComplete: checked(formData, "bioComplete"),
    logoComplete: checked(formData, "logoComplete"),
    bannerComplete: checked(formData, "bannerComplete"),
    ctaLinkComplete: checked(formData, "ctaLinkComplete"),
    verificationStatus: text(formData, "verificationStatus"),
    lastReviewedAt: text(formData, "lastReviewedAt"),
    notes: text(formData, "notes"),
  });
  await prisma.marketingChannelProfile.update({
    where: { id: value.id },
    data: {
      profileUrl: optional(value.profileUrl),
      status: value.status,
      bioComplete: value.bioComplete,
      logoComplete: value.logoComplete,
      bannerComplete: value.bannerComplete,
      ctaLinkComplete: value.ctaLinkComplete,
      verificationStatus: value.verificationStatus,
      lastReviewedAt: value.lastReviewedAt
        ? new Date(`${value.lastReviewedAt}T12:00:00-05:00`)
        : null,
      notes: optional(value.notes),
    },
  });
  await audit(session.id, "UPDATE", "MarketingChannelProfile", value.id, "Updated channel setup");
  revalidateMarketing();
}

export async function saveMarketingMetricAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const value = marketingMetricSchema.parse({
    id: text(formData, "id"),
    weekStarting: text(formData, "weekStarting"),
    channel: text(formData, "channel"),
    campaignId: text(formData, "campaignId"),
    source: text(formData, "source"),
    impressions: text(formData, "impressions"),
    reach: text(formData, "reach"),
    profileViews: text(formData, "profileViews"),
    websiteClicks: text(formData, "websiteClicks"),
    comments: text(formData, "comments"),
    saves: text(formData, "saves"),
    directMessages: text(formData, "directMessages"),
    emailReplies: text(formData, "emailReplies"),
    qualifiedConversations: text(formData, "qualifiedConversations"),
    discoveryCalls: text(formData, "discoveryCalls"),
    opportunities: text(formData, "opportunities"),
    currency: text(formData, "currency"),
    wonRevenue: text(formData, "wonRevenue"),
    notes: text(formData, "notes"),
  });
  const data = {
    weekStarting: new Date(`${value.weekStarting}T00:00:00-05:00`),
    channel: value.channel || null,
    campaignId: optional(value.campaignId),
    source: value.source,
    impressions: value.impressions,
    reach: value.reach,
    profileViews: value.profileViews,
    websiteClicks: value.websiteClicks,
    comments: value.comments,
    saves: value.saves,
    directMessages: value.directMessages,
    emailReplies: value.emailReplies,
    qualifiedConversations: value.qualifiedConversations,
    discoveryCalls: value.discoveryCalls,
    opportunities: value.opportunities,
    currency: value.currency,
    wonRevenue: value.wonRevenue,
    notes: optional(value.notes),
  };
  if (value.id) {
    await prisma.marketingWeeklyMetric.update({ where: { id: value.id }, data });
    await audit(session.id, "UPDATE", "MarketingWeeklyMetric", value.id, "Updated weekly metrics");
  } else {
    const record = await prisma.marketingWeeklyMetric.create({ data });
    await audit(session.id, "CREATE", "MarketingWeeklyMetric", record.id, "Created weekly metrics");
  }
  revalidateMarketing();
}

export async function deleteMarketingMetricAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const id = text(formData, "id");
  await requestMarketingRemoval({ actorId: session.id, recordType: "MarketingWeeklyMetric", recordId: id, operation: "delete" });
  revalidateMarketing();
  redirect("/admin/approvals?requested=1");
}

export async function saveMarketingUtmPresetAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const value = marketingUtmPresetSchema.parse({
    id: text(formData, "id"),
    name: text(formData, "name"),
    destination: text(formData, "destination"),
    source: text(formData, "source"),
    medium: text(formData, "medium"),
    campaign: text(formData, "campaign"),
    content: text(formData, "content"),
    term: text(formData, "term"),
  });
  const data = {
    name: value.name,
    destination: value.destination,
    source: value.source,
    medium: value.medium,
    campaign: value.campaign,
    content: optional(value.content),
    term: optional(value.term),
  };
  if (value.id) {
    await prisma.marketingUtmPreset.update({ where: { id: value.id }, data });
    await audit(session.id, "UPDATE", "MarketingUtmPreset", value.id, `Updated ${value.name}`);
  } else {
    const record = await prisma.marketingUtmPreset.create({ data });
    await audit(session.id, "CREATE", "MarketingUtmPreset", record.id, `Created ${value.name}`);
  }
  revalidateMarketing();
}

export async function deleteMarketingUtmPresetAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const id = text(formData, "id");
  await requestMarketingRemoval({ actorId: session.id, recordType: "MarketingUtmPreset", recordId: id, operation: "delete" });
  revalidateMarketing();
  redirect("/admin/approvals?requested=1");
}

export async function logMarketingOutboundAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const value = marketingOutboundSchema.parse({
    campaignId: text(formData, "campaignId"),
    occurredAt: text(formData, "occurredAt"),
    channel: text(formData, "channel"),
    activity: text(formData, "activity"),
    quantity: text(formData, "quantity"),
    notes: text(formData, "notes"),
  });
  const record = await prisma.marketingOutboundActivity.create({
    data: {
      campaignId: value.campaignId,
      occurredAt: parseJamaicaDateTimeLocal(value.occurredAt),
      channel: value.channel,
      activity: value.activity,
      quantity: value.quantity,
      notes: optional(value.notes),
    },
  });
  await audit(session.id, "CREATE", "MarketingOutboundActivity", record.id, value.activity);
  revalidateMarketing();
}

export async function refreshWeekOneMarketingSeedAction() {
  const session = await requireAdminSession("marketing:manage");
  await seedMarketingOs(prisma);
  await audit(session.id, "UPDATE", "MarketingSeed", "week-1-2026", "Refreshed approved Week 1 seed");
  revalidateMarketing();
}

export async function updateMarketingLaunchChecklistAction(formData: FormData) {
  const session = await requireAdminSession("marketing:manage");
  const value = marketingLaunchChecklistSchema.parse({
    id: text(formData, "id"),
    status: text(formData, "status"),
    evidenceUrl: text(formData, "evidenceUrl"),
    notes: text(formData, "notes"),
  });
  const record = await prisma.marketingLaunchChecklistItem.update({
    where: { id: value.id },
    data: {
      status: value.status,
      evidenceUrl: optional(value.evidenceUrl),
      notes: optional(value.notes),
      completedAt: value.status === "COMPLETE" ? new Date() : null,
    },
    select: { title: true },
  });
  await audit(
    session.id,
    "UPDATE",
    "MarketingLaunchChecklistItem",
    value.id,
    `Updated ${record.title}`,
  );
  revalidateMarketing();
}
