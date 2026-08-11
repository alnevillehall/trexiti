import "server-only";

import type {
  MarketingCampaignStatus,
  MarketingChannel,
  MarketingContentStatus,
  MarketingPillar,
  Prisma,
} from "@prisma/client";

import { requireAdminSession } from "@/lib/admin/auth";
import {
  getJamaicaDayRange,
  getMarketingCalendarRange,
  type MarketingCalendarView,
} from "@/lib/admin/marketing";
import { prisma } from "@/lib/prisma";

export type MarketingContentFilters = {
  query?: string;
  channel?: MarketingChannel;
  pillar?: MarketingPillar;
  campaignId?: string;
  status?: MarketingContentStatus;
};

const FORM_START_EVENTS = new Set([
  "project_form_started",
  "systems_review_form_started",
]);
const FORM_COMPLETION_EVENTS = new Set([
  "project_form_submitted",
  "systems_review_submitted",
]);
const PRIMARY_CTA_EVENTS = new Set([
  "primary_cta_clicked",
  "email_link_clicked",
  "whatsapp_link_clicked",
]);
const QUALIFIED_LEAD_STATUSES = new Set([
  "QUALIFIED",
  "DISCOVERY",
  "PROPOSAL",
  "WON",
]);
const DISCOVERY_LEAD_STATUSES = new Set(["DISCOVERY", "PROPOSAL", "WON"]);
const QUALIFIED_OPPORTUNITY_STAGES = new Set([
  "QUALIFIED",
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
]);
const DISCOVERY_OPPORTUNITY_STAGES = new Set([
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
]);

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function getMarketingDashboard() {
  await requireAdminSession("marketing:view");
  const now = new Date();
  const today = getJamaicaDayRange();
  const upcomingEnd = new Date(today.start.getTime() + 14 * 86_400_000);
  const launchStart = new Date("2026-08-11T00:00:00-05:00");
  const launchEnd = new Date("2026-08-18T00:00:00-05:00");
  const analyticsStart = new Date(now.getTime() - 30 * 86_400_000);

  const [
    dueToday,
    awaitingProduction,
    scheduledCount,
    activeCampaigns,
    systemsReviewConversions,
    metricTotals,
    outboundActivity,
    profileTasks,
    assetTasks,
    launchContent,
    analyticsEvents,
    attributedLeads,
  ] = await Promise.all([
    prisma.marketingContent.findMany({
      where: { publishAt: { gte: today.start, lt: today.end }, status: { not: "ARCHIVED" } },
      orderBy: { publishAt: "asc" },
      include: { campaign: { select: { name: true } } },
    }),
    prisma.marketingContent.count({
      where: { status: { in: ["IDEA", "DRAFTING", "REVIEW"] } },
    }),
    prisma.marketingContent.count({
      where: { status: "SCHEDULED", publishAt: { gte: now } },
    }),
    prisma.marketingCampaign.findMany({
      where: { status: "ACTIVE" },
      orderBy: { endAt: "asc" },
      include: { _count: { select: { content: true, outboundActivities: true } } },
    }),
    prisma.projectLead.count({ where: { source: "systems_review_page" } }),
    prisma.marketingWeeklyMetric.aggregate({
      _sum: {
        websiteClicks: true,
        qualifiedConversations: true,
        discoveryCalls: true,
        opportunities: true,
        wonRevenue: true,
      },
    }),
    prisma.marketingOutboundActivity.findMany({
      take: 8,
      orderBy: { occurredAt: "desc" },
      include: { campaign: { select: { name: true } } },
    }),
    prisma.marketingChannelProfile.findMany({
      where: { status: { not: "READY" } },
      orderBy: [{ status: "asc" }, { channel: "asc" }],
    }),
    prisma.marketingAsset.findMany({
      where: {
        status: { notIn: ["READY", "ARCHIVED"] },
        dueAt: { lt: upcomingEnd },
      },
      orderBy: { dueAt: "asc" },
      take: 10,
      include: { campaign: { select: { name: true } } },
    }),
    prisma.marketingContent.findMany({
      where: { publishAt: { gte: launchStart, lt: launchEnd }, status: { not: "ARCHIVED" } },
      select: { id: true, status: true, contentType: true, primaryChannel: true },
    }),
    prisma.marketingEvent.findMany({
      where: { occurredAt: { gte: analyticsStart } },
      select: {
        name: true,
        route: true,
        sessionId: true,
      },
    }),
    prisma.projectLead.findMany({
      where: { createdAt: { gte: analyticsStart } },
      select: {
        status: true,
        source: true,
        firstTouchSource: true,
        firstTouchMedium: true,
        utmSource: true,
        utmMedium: true,
        landingPage: true,
        opportunity: {
          select: { stage: true, estimatedValue: true },
        },
      },
    }),
  ]);

  const contentViews = new Map<string, number>();
  const sessions = new Set<string>();
  let pageViews = 0;
  let primaryCtaActions = 0;
  let formStarts = 0;
  let formCompletions = 0;

  for (const event of analyticsEvents) {
    sessions.add(event.sessionId);
    if (event.name === "page_view") pageViews += 1;
    if (PRIMARY_CTA_EVENTS.has(event.name)) primaryCtaActions += 1;
    if (FORM_START_EVENTS.has(event.name)) formStarts += 1;
    if (FORM_COMPLETION_EVENTS.has(event.name)) formCompletions += 1;
    if (event.name === "insight_view" || event.name === "case_study_view") {
      increment(contentViews, event.route);
    }
  }

  type SourceFunnel = {
    source: string;
    leads: number;
    qualifiedLeads: number;
    discoveryConversations: number;
    opportunities: number;
    wonRevenue: number;
  };
  const sourceFunnelMap = new Map<string, SourceFunnel>();
  const qualifiedLandingPages = new Map<string, number>();

  for (const lead of attributedLeads) {
    const source = lead.firstTouchSource || lead.utmSource || lead.source || "unknown";
    const medium = lead.firstTouchMedium || lead.utmMedium || "none";
    const sourceKey = `${source} / ${medium}`;
    const row = sourceFunnelMap.get(sourceKey) ?? {
      source: sourceKey,
      leads: 0,
      qualifiedLeads: 0,
      discoveryConversations: 0,
      opportunities: 0,
      wonRevenue: 0,
    };
    const opportunityStage = lead.opportunity?.stage;
    const isQualified =
      QUALIFIED_LEAD_STATUSES.has(lead.status) ||
      Boolean(opportunityStage && QUALIFIED_OPPORTUNITY_STAGES.has(opportunityStage));
    const reachedDiscovery =
      DISCOVERY_LEAD_STATUSES.has(lead.status) ||
      Boolean(opportunityStage && DISCOVERY_OPPORTUNITY_STAGES.has(opportunityStage));

    row.leads += 1;
    if (isQualified) {
      row.qualifiedLeads += 1;
      increment(qualifiedLandingPages, lead.landingPage || "Unattributed landing page");
    }
    if (reachedDiscovery) row.discoveryConversations += 1;
    if (lead.opportunity) row.opportunities += 1;
    if (opportunityStage === "WON") {
      row.wonRevenue += Number(lead.opportunity?.estimatedValue ?? 0);
    }
    sourceFunnelMap.set(sourceKey, row);
  }

  const sourceFunnel = [...sourceFunnelMap.values()].sort(
    (a, b) => b.leads - a.leads || b.qualifiedLeads - a.qualifiedLeads,
  );
  const topContent = [...contentViews]
    .map(([route, views]) => ({ route, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);
  const topQualifiedLandingPages = [...qualifiedLandingPages]
    .map(([landingPage, qualifiedLeads]) => ({ landingPage, qualifiedLeads }))
    .sort((a, b) => b.qualifiedLeads - a.qualifiedLeads)
    .slice(0, 8);

  return {
    dueToday,
    awaitingProduction,
    scheduledCount,
    activeCampaigns,
    systemsReviewConversions,
    manualMetricTotals: {
      websiteClicks: metricTotals._sum.websiteClicks ?? 0,
      qualifiedConversations: metricTotals._sum.qualifiedConversations ?? 0,
      discoveryCalls: metricTotals._sum.discoveryCalls ?? 0,
      opportunities: metricTotals._sum.opportunities ?? 0,
      wonRevenue: Number(metricTotals._sum.wonRevenue ?? 0),
    },
    outboundActivity,
    profileTasks,
    assetTasks,
    launchContent,
    websiteMetrics: {
      enabled:
        process.env.NEXT_PUBLIC_TREXITI_ANALYTICS_PROVIDER === "first-party",
      windowDays: 30,
      sessions: sessions.size,
      pageViews,
      primaryCtaActions,
      formStarts,
      formCompletions,
      formCompletionRate: formStarts
        ? Math.min(100, Math.round((formCompletions / formStarts) * 1000) / 10)
        : 0,
    },
    sourceFunnel,
    topContent,
    topQualifiedLandingPages,
  };
}

export async function getMarketingContent(filters: MarketingContentFilters = {}) {
  await requireAdminSession("marketing:view");
  const where: Prisma.MarketingContentWhereInput = {
    ...(filters.query
      ? {
          OR: [
            { title: { contains: filters.query, mode: "insensitive" } },
            { coreIdea: { contains: filters.query, mode: "insensitive" } },
            { body: { contains: filters.query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filters.channel ? { primaryChannel: filters.channel } : {}),
    ...(filters.pillar ? { pillar: filters.pillar } : {}),
    ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
    ...(filters.status ? { status: filters.status } : { status: { not: "ARCHIVED" } }),
  };
  return prisma.marketingContent.findMany({
    where,
    orderBy: [{ publishAt: "asc" }, { updatedAt: "desc" }],
    include: {
      campaign: { select: { id: true, name: true } },
      parentContent: { select: { id: true, title: true } },
    },
  });
}

export async function getMarketingCampaigns(status?: MarketingCampaignStatus) {
  await requireAdminSession("marketing:view");
  return prisma.marketingCampaign.findMany({
    where: status ? { status } : { status: { not: "ARCHIVED" } },
    orderBy: [{ startAt: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { content: true, assets: true, outboundActivities: true } },
    },
  });
}

export async function getMarketingAssets() {
  await requireAdminSession("marketing:view");
  return prisma.marketingAsset.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: [{ dueAt: "asc" }, { name: "asc" }],
    include: {
      campaign: { select: { id: true, name: true } },
      content: { select: { id: true, title: true } },
    },
  });
}

export async function getMarketingAssetById(id: string) {
  await requireAdminSession("marketing:view");
  return prisma.marketingAsset.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, name: true } },
      content: { select: { id: true, title: true } },
    },
  });
}

export async function getMarketingChannels() {
  await requireAdminSession("marketing:view");
  return prisma.marketingChannelProfile.findMany({ orderBy: { channel: "asc" } });
}

export async function getMarketingMetrics() {
  await requireAdminSession("marketing:view");
  return prisma.marketingWeeklyMetric.findMany({
    orderBy: [{ weekStarting: "desc" }, { createdAt: "desc" }],
    include: { campaign: { select: { id: true, name: true } } },
  });
}

export async function getMarketingUtmPresets() {
  await requireAdminSession("marketing:view");
  return prisma.marketingUtmPreset.findMany({ orderBy: { name: "asc" } });
}

export async function getMarketingLaunchReadiness() {
  await requireAdminSession("marketing:view");
  const [checklist, sources] = await Promise.all([
    prisma.marketingLaunchChecklistItem.findMany({
      orderBy: [{ dueAt: "asc" }, { category: "asc" }, { title: "asc" }],
    }),
    prisma.marketingLaunchSource.findMany({ orderBy: { path: "asc" } }),
  ]);
  return { checklist, sources };
}

export async function getMarketingCalendar(input: {
  view: MarketingCalendarView;
  dateKey: string;
  channel?: MarketingChannel;
  pillar?: MarketingPillar;
  campaignId?: string;
  status?: MarketingContentStatus;
}) {
  await requireAdminSession("marketing:view");
  const range = getMarketingCalendarRange(input.view, input.dateKey);
  const content = await prisma.marketingContent.findMany({
    where: {
      publishAt: { gte: range.start, lt: range.end },
      ...(input.channel ? { primaryChannel: input.channel } : {}),
      ...(input.pillar ? { pillar: input.pillar } : {}),
      ...(input.campaignId ? { campaignId: input.campaignId } : {}),
      ...(input.status ? { status: input.status } : { status: { not: "ARCHIVED" } }),
    },
    orderBy: { publishAt: "asc" },
    include: { campaign: { select: { id: true, name: true } } },
  });
  return { ...range, content };
}
