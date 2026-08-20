import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import type {
  MarketingAssetFormat,
  MarketingAssetStatus,
  MarketingAssetTemplate,
  MarketingAssetVariant,
  MarketingCampaignStatus,
  MarketingChannel,
  MarketingContentStatus,
  MarketingContentType,
  MarketingPillar,
  PrismaClient,
} from "@prisma/client";

import { getBrandAssetFormat, parseApprovedCarouselSlides, type BrandAssetSlide } from "@/lib/admin/brand-assets";
import {
  jamaicaDateTime,
  marketingChannels,
  parseWeekOneCalendar,
  parseWeekOnePosts,
} from "@/lib/admin/marketing";

type CampaignSeed = {
  seedKey: string;
  name: string;
  objective: string;
  audience: string;
  message: string;
  offer: string;
  startAt: Date;
  endAt: Date;
  status: MarketingCampaignStatus;
  primaryCta: string;
  landingPage: string | null;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  targetAccountSegment: string;
  targetMetrics: Record<string, number>;
  notes: string;
};

type ContentSeed = {
  seedKey: string;
  parentSeedKey?: string;
  campaignSeedKey: string;
  title: string;
  coreIdea: string;
  contentType: MarketingContentType;
  pillar: MarketingPillar;
  status: MarketingContentStatus;
  primaryChannel: MarketingChannel;
  secondaryChannels: MarketingChannel[];
  publishAt: Date;
  owner: string;
  body: string;
  shortCaption?: string;
  cta: string;
  destinationUrl?: string;
  assetBrief: string;
  sourceArticleId?: string;
  notes: string;
};

type AssetSeed = {
  seedKey: string;
  campaignSeedKey: string;
  contentSeedKey?: string;
  name: string;
  kind: string;
  status: MarketingAssetStatus;
  channel?: MarketingChannel;
  dueAt: Date;
  brief: string;
  owner: string;
  notes: string;
  template?: MarketingAssetTemplate;
  format?: MarketingAssetFormat;
  variant?: MarketingAssetVariant;
  title?: string;
  eyebrow?: string;
  body?: string;
  cta?: string;
  altText?: string;
  slideCount?: number;
  slides?: BrandAssetSlide[];
  systemNodes?: string[];
  destinationUrl?: string;
  exportWidth?: number;
  exportHeight?: number;
};

type LaunchChecklistSeed = {
  seedKey: string;
  title: string;
  category: string;
  dueAt: Date;
};

type LaunchSourceSeed = {
  seedKey: string;
  path: string;
  sha256: string;
  notes: string;
};

export function buildWeekOneMarketingSeed(input: {
  postsMarkdown: string;
  calendarMarkdown: string;
  articleBody: string;
  capabilityStatement: string;
  systemsReview: string;
  frictionChecklist: string;
}) {
  const posts = parseWeekOnePosts(input.postsMarkdown);
  const calendar = parseWeekOneCalendar(input.calendarMarkdown);

  function section(day: number, heading: string) {
    const value = posts[day]?.[heading];
    if (!value) throw new Error(`Missing approved Week 1 copy: day ${day} / ${heading}`);
    return value;
  }

  function scheduleNote(day: number) {
    const value = calendar[day];
    if (!value) throw new Error(`Missing approved Week 1 calendar entry: day ${day}`);
    return `Approved schedule source: content/week_1_calendar.md\n\n${value}`;
  }

  const campaigns: CampaignSeed[] = [
    {
      seedKey: "campaign-trexiti-brand-relaunch",
      name: "Trexiti Brand Relaunch",
      objective: "Make Trexiti clearer about the digital systems it designs and builds.",
      audience: "Founder-led businesses and established organizations with customer, workflow or systems friction.",
      message: "Trexiti designs and builds digital systems businesses use to sell, operate and grow.",
      offer: "A focused build or connected digital system shaped by how the business actually works.",
      startAt: jamaicaDateTime("2026-08-11", "07:15"),
      endAt: jamaicaDateTime("2026-08-17", "20:00"),
      status: "PLANNED",
      primaryCta: "What should work better in your business?",
      landingPage: "https://trexiti.com/start-a-project",
      utmSource: "linkedin",
      utmMedium: "founder-organic",
      utmCampaign: "trexiti-relaunch-2026",
      targetAccountSegment: "Ambitious businesses with a visible digital experience or operating-system constraint.",
      targetMetrics: {
        qualifiedTargetAccounts: 40,
        personalizedOutboundMessages: 25,
        warmNetworkMessages: 10,
        meaningfulReplies: 5,
        discoveryConversations: 2,
      },
      notes: input.calendarMarkdown,
    },
    {
      seedKey: "campaign-employees-api",
      name: "Your Employees Shouldn't Be Your API",
      objective: "Make fragmented operating systems visible and distribute the first Trexiti Insight.",
      audience: "Operators and owners whose teams manually carry information between tools.",
      message: "When systems do not share context, employees become the manual integration layer.",
      offer: "Map the system before adding another tool.",
      startAt: jamaicaDateTime("2026-08-12", "07:15"),
      endAt: jamaicaDateTime("2026-08-14", "18:00"),
      status: "PLANNED",
      primaryCta: "Discuss a Systems Review.",
      landingPage: "https://trexiti.com/insights/your-employees-shouldnt-be-your-api",
      utmSource: "linkedin",
      utmMedium: "founder-organic",
      utmCampaign: "employees-shouldnt-be-api",
      targetAccountSegment: "Businesses coordinating sales, operations and finance across disconnected tools.",
      targetMetrics: { meaningfulReplies: 3, discoveryConversations: 1 },
      notes: "Approved Week 1 campaign spanning the carousel, founder video and first Insight distribution.",
    },
    {
      seedKey: "campaign-systems-review",
      name: "Trexiti Systems Review",
      objective: "Create qualified conversations around one visible workflow or connected operating area.",
      audience: "Business owners and operators with slow, fragmented or difficult-to-see processes.",
      message: "Clarity before development: simplify, connect, automate or build only after the operating model is visible.",
      offer: "Trexiti Systems Review",
      startAt: jamaicaDateTime("2026-08-13", "07:15"),
      endAt: jamaicaDateTime("2026-08-17", "20:00"),
      status: "PLANNED",
      primaryCta: "Start a Systems Review.",
      landingPage: "https://trexiti.com/systems-review",
      utmSource: "linkedin",
      utmMedium: "founder-organic",
      utmCampaign: "systems-review",
      targetAccountSegment: "Operators with a contained workflow problem or wider system-fragmentation signal.",
      targetMetrics: { privateProspectAudits: 2, discoveryConversations: 2 },
      notes: "Approved Week 1 direct-offer campaign. No automated outreach or posting is authorized.",
    },
    {
      seedKey: "campaign-small-scope-same-standard",
      name: "Small Scope. Same Standard.",
      objective: "Clarify that project fit is based on the value and boundary of the problem, not company prestige.",
      audience: "Small and medium businesses with one focused digital constraint.",
      message: "The scope changes. The standard does not.",
      offer: "A tightly scoped Focused Build with a clear operating result.",
      startAt: jamaicaDateTime("2026-08-15", "07:15"),
      endAt: jamaicaDateTime("2026-08-15", "20:00"),
      status: "PLANNED",
      primaryCta: "Bring one focused problem.",
      landingPage: "https://trexiti.com/start-a-project",
      utmSource: "linkedin",
      utmMedium: "founder-organic",
      utmCampaign: "focused-build",
      targetAccountSegment: "Local small and medium businesses with genuinely contained opportunities.",
      targetMetrics: { targetAccountsContacted: 5, meaningfulReplies: 1 },
      notes: scheduleNote(5),
    },
  ];

  const content: ContentSeed[] = [
    {
      seedKey: "week1-d1-linkedin-founder",
      campaignSeedKey: "campaign-trexiti-brand-relaunch",
      title: "Trexiti brand relaunch — founder post",
      coreIdea: "Trexiti is clearer about what it builds.",
      contentType: "TEXT_POST",
      pillar: "BEHIND_THE_WORK",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_FOUNDER",
      secondaryChannels: ["LINKEDIN_COMPANY", "INSTAGRAM"],
      publishAt: jamaicaDateTime("2026-08-11", "07:30"),
      owner: "Al Neville Hall",
      body: section(1, "Al's LinkedIn post"),
      cta: "What should work better in your business?",
      destinationUrl: "https://trexiti.com/start-a-project",
      assetBrief: "Founder text post with a simple Trexiti brand graphic.",
      notes: scheduleNote(1),
    },
    {
      seedKey: "week1-d1-linkedin-company",
      parentSeedKey: "week1-d1-linkedin-founder",
      campaignSeedKey: "campaign-trexiti-brand-relaunch",
      title: "Trexiti brand relaunch — company version",
      coreIdea: "Understand how the business works, then build what should make it work better.",
      contentType: "TEXT_POST",
      pillar: "BEHIND_THE_WORK",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_COMPANY",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-11", "09:30"),
      owner: "Trexiti",
      body: section(1, "Trexiti Company Page version"),
      cta: "What should work better in your business?",
      destinationUrl: "https://trexiti.com/start-a-project",
      assetBrief: "Short company-page version of the brand relaunch.",
      notes: scheduleNote(1),
    },
    {
      seedKey: "week1-d1-instagram",
      parentSeedKey: "week1-d1-linkedin-founder",
      campaignSeedKey: "campaign-trexiti-brand-relaunch",
      title: "A clearer Trexiti — Instagram graphic",
      coreIdea: "Digital systems for ambitious businesses.",
      contentType: "CAROUSEL",
      pillar: "BEHIND_THE_WORK",
      status: "SCHEDULED",
      primaryChannel: "INSTAGRAM",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-11", "19:00"),
      owner: "Trexiti",
      body: section(1, "Instagram graphic copy"),
      cta: "What should work better in your business?",
      destinationUrl: "https://trexiti.com/start-a-project",
      assetBrief: "Simple brand graphic using the approved launch copy.",
      notes: scheduleNote(1),
    },
    {
      seedKey: "week1-d2-linkedin-carousel",
      campaignSeedKey: "campaign-employees-api",
      title: "Your Employees Shouldn't Be Your API — carousel",
      coreIdea: "Fragmented systems turn employees into the manual integration layer.",
      contentType: "CAROUSEL",
      pillar: "BUSINESS_SYSTEMS",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_FOUNDER",
      secondaryChannels: ["INSTAGRAM"],
      publishAt: jamaicaDateTime("2026-08-12", "07:30"),
      owner: "Al Neville Hall",
      body: section(2, "Carousel: Your Employees Shouldn't Be Your API"),
      shortCaption: section(2, "LinkedIn caption"),
      cta: "Map the system before adding another tool.",
      destinationUrl: "https://trexiti.com/systems-review",
      assetBrief: "Seven-slide LinkedIn document using the approved slide copy.",
      notes: scheduleNote(2),
    },
    {
      seedKey: "week1-d2-instagram-carousel",
      parentSeedKey: "week1-d2-linkedin-carousel",
      campaignSeedKey: "campaign-employees-api",
      title: "Employees as the API — Instagram carousel",
      coreIdea: "Map the workflow before buying more software.",
      contentType: "CAROUSEL",
      pillar: "BUSINESS_SYSTEMS",
      status: "SCHEDULED",
      primaryChannel: "INSTAGRAM",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-12", "19:00"),
      owner: "Trexiti",
      body: section(2, "Instagram caption"),
      cta: "Map the workflow. Choose the source of truth.",
      destinationUrl: "https://trexiti.com/systems-review",
      assetBrief: "Adapt the approved seven-slide carousel for Instagram.",
      notes: scheduleNote(2),
    },
    {
      seedKey: "week1-d3-founder-video",
      campaignSeedKey: "campaign-systems-review",
      title: "Before you automate anything, map this",
      coreIdea: "Automation should strengthen a sound process, not accelerate a confusing one.",
      contentType: "VIDEO",
      pillar: "AUTOMATION",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_FOUNDER",
      secondaryChannels: ["INSTAGRAM"],
      publishAt: jamaicaDateTime("2026-08-13", "07:30"),
      owner: "Al Neville Hall",
      body: section(3, "60–90 second founder video script"),
      shortCaption: section(3, "LinkedIn caption"),
      cta: "Comment MAP or send one workflow that causes friction.",
      destinationUrl: "https://trexiti.com/systems-review",
      assetBrief: "Record and caption a 60–90 second founder video.",
      notes: scheduleNote(3),
    },
    {
      seedKey: "week1-d3-instagram-reel",
      parentSeedKey: "week1-d3-founder-video",
      campaignSeedKey: "campaign-systems-review",
      title: "Simplify first. Automate second. — Reel",
      coreIdea: "Define the trigger, owner, information, source of truth and failure path.",
      contentType: "VIDEO",
      pillar: "AUTOMATION",
      status: "SCHEDULED",
      primaryChannel: "INSTAGRAM",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-13", "19:00"),
      owner: "Trexiti",
      body: section(3, "Instagram Reel caption"),
      cta: "Simplify first. Automate second.",
      destinationUrl: "https://trexiti.com/systems-review",
      assetBrief: "Vertical captioned cut of the approved founder video.",
      notes: scheduleNote(3),
    },
    {
      seedKey: "week1-d4-insight",
      campaignSeedKey: "campaign-employees-api",
      title: "Your Employees Shouldn't Be Your API",
      coreIdea: "The hidden cost of people carrying context between disconnected systems.",
      contentType: "ARTICLE",
      pillar: "BUSINESS_SYSTEMS",
      status: "SCHEDULED",
      primaryChannel: "WEBSITE_INSIGHTS",
      secondaryChannels: ["LINKEDIN_FOUNDER", "LINKEDIN_COMPANY", "EMAIL"],
      publishAt: jamaicaDateTime("2026-08-14", "07:00"),
      owner: "Al Neville Hall",
      body: input.articleBody,
      cta: "Discuss a Systems Review.",
      destinationUrl: "https://trexiti.com/insights/your-employees-shouldnt-be-your-api",
      assetBrief: "Source-controlled Insight article and tailored social preview image.",
      sourceArticleId: "your-employees-shouldnt-be-your-api",
      notes: scheduleNote(4),
    },
    {
      seedKey: "week1-d4-linkedin-teaser",
      parentSeedKey: "week1-d4-insight",
      campaignSeedKey: "campaign-employees-api",
      title: "First Trexiti Insight — founder teaser",
      coreIdea: "A lot of businesses do not have an integration strategy. They have people.",
      contentType: "TEXT_POST",
      pillar: "BUSINESS_SYSTEMS",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_FOUNDER",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-14", "07:45"),
      owner: "Al Neville Hall",
      body: section(4, "LinkedIn teaser for Insight Article 01"),
      cta: "Read the Insight and discuss a Systems Review.",
      destinationUrl: "https://trexiti.com/insights/your-employees-shouldnt-be-your-api",
      assetBrief: "Founder teaser using the approved article social preview.",
      sourceArticleId: "your-employees-shouldnt-be-your-api",
      notes: scheduleNote(4),
    },
    {
      seedKey: "week1-d4-linkedin-company",
      parentSeedKey: "week1-d4-insight",
      campaignSeedKey: "campaign-employees-api",
      title: "First Trexiti Insight — company summary",
      coreIdea: "Recognize fragmentation and design a more reliable operating model.",
      contentType: "TEXT_POST",
      pillar: "BUSINESS_SYSTEMS",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_COMPANY",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-14", "09:30"),
      owner: "Trexiti",
      body: section(4, "Company Page summary"),
      cta: "Read the new Trexiti Insight.",
      destinationUrl: "https://trexiti.com/insights/your-employees-shouldnt-be-your-api",
      assetBrief: "Short company-page summary with the article preview.",
      sourceArticleId: "your-employees-shouldnt-be-your-api",
      notes: scheduleNote(4),
    },
    {
      seedKey: "week1-d5-linkedin-founder",
      campaignSeedKey: "campaign-small-scope-same-standard",
      title: "Small scope. Same standard. — founder post",
      coreIdea: "Fit is based on the problem, not the prestige of the company.",
      contentType: "TEXT_POST",
      pillar: "SMALL_BUSINESS",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_FOUNDER",
      secondaryChannels: ["INSTAGRAM"],
      publishAt: jamaicaDateTime("2026-08-15", "07:30"),
      owner: "Al Neville Hall",
      body: section(5, "Al's LinkedIn post"),
      cta: "Bring one thing that should work better.",
      destinationUrl: "https://trexiti.com/start-a-project",
      assetBrief: "Founder text post with the Small scope. Same standard. graphic.",
      notes: scheduleNote(5),
    },
    {
      seedKey: "week1-d5-instagram",
      parentSeedKey: "week1-d5-linkedin-founder",
      campaignSeedKey: "campaign-small-scope-same-standard",
      title: "Small scope. Same standard. — Instagram",
      coreIdea: "Some businesses need an entire system; others need one focused improvement.",
      contentType: "CAROUSEL",
      pillar: "SMALL_BUSINESS",
      status: "SCHEDULED",
      primaryChannel: "INSTAGRAM",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-15", "19:00"),
      owner: "Trexiti",
      body: `${section(5, "Instagram carousel copy")}\n\n${section(5, "Instagram caption")}`,
      shortCaption: section(5, "Instagram caption"),
      cta: "Bring one thing that should work better.",
      destinationUrl: "https://trexiti.com/start-a-project",
      assetBrief: "Five-slide Instagram carousel using the approved copy.",
      notes: scheduleNote(5),
    },
    {
      seedKey: "week1-d6-instagram",
      campaignSeedKey: "campaign-trexiti-brand-relaunch",
      title: "From inquiry to payment — systems visual",
      coreIdea: "A website is the first step in a larger customer and operating journey.",
      contentType: "CAROUSEL",
      pillar: "DIGITAL_EXPERIENCE",
      status: "SCHEDULED",
      primaryChannel: "INSTAGRAM",
      secondaryChannels: ["LINKEDIN_COMPANY"],
      publishAt: jamaicaDateTime("2026-08-16", "19:00"),
      owner: "Trexiti",
      body: `${section(6, "Systems visual: From inquiry to payment")}\n\n${section(6, "LinkedIn/Instagram caption")}`,
      shortCaption: section(6, "LinkedIn/Instagram caption"),
      cta: "Build the whole journey.",
      destinationUrl: "https://trexiti.com/services/digital-experiences",
      assetBrief: "Connected-flow visual from visitor through reporting.",
      notes: scheduleNote(6),
    },
    {
      seedKey: "week1-d6-linkedin-company",
      parentSeedKey: "week1-d6-instagram",
      campaignSeedKey: "campaign-trexiti-brand-relaunch",
      title: "The contact form is not the outcome — company post",
      coreIdea: "The public experience and operating business are one journey.",
      contentType: "TEXT_POST",
      pillar: "DIGITAL_EXPERIENCE",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_COMPANY",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-16", "09:30"),
      owner: "Trexiti",
      body: section(6, "LinkedIn/Instagram caption"),
      cta: "Build the whole journey.",
      destinationUrl: "https://trexiti.com/services/digital-experiences",
      assetBrief: "Company-page post using the inquiry-to-payment visual.",
      notes: scheduleNote(6),
    },
    {
      seedKey: "week1-d7-linkedin-founder",
      campaignSeedKey: "campaign-systems-review",
      title: "Bring one process — Systems Review offer",
      coreIdea: "Bring one process that is slower, messier or harder to see than it should be.",
      contentType: "TEXT_POST",
      pillar: "OPERATIONAL_DESIGN",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_FOUNDER",
      secondaryChannels: ["LINKEDIN_COMPANY", "WHATSAPP", "EMAIL"],
      publishAt: jamaicaDateTime("2026-08-17", "07:30"),
      owner: "Al Neville Hall",
      body: section(7, "Al's LinkedIn offer post"),
      cta: "Start a Systems Review.",
      destinationUrl: "https://trexiti.com/systems-review",
      assetBrief: "Direct offer post with a concise Systems Review card.",
      notes: scheduleNote(7),
    },
    {
      seedKey: "week1-d7-linkedin-company",
      parentSeedKey: "week1-d7-linkedin-founder",
      campaignSeedKey: "campaign-systems-review",
      title: "A better system begins with a visible operating model",
      coreIdea: "Identify what should be simplified, connected, automated or built.",
      contentType: "TEXT_POST",
      pillar: "OPERATIONAL_DESIGN",
      status: "SCHEDULED",
      primaryChannel: "LINKEDIN_COMPANY",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-17", "09:30"),
      owner: "Trexiti",
      body: section(7, "Trexiti Company Page version"),
      cta: "What should work better?",
      destinationUrl: "https://trexiti.com/systems-review",
      assetBrief: "Company-page version using the Systems Review offer card.",
      notes: scheduleNote(7),
    },
    {
      seedKey: "week1-d7-whatsapp",
      parentSeedKey: "week1-d7-linkedin-founder",
      campaignSeedKey: "campaign-systems-review",
      title: "Systems Review — WhatsApp Status sequence",
      coreIdea: "Trexiti maps the workflow before recommending technology.",
      contentType: "WHATSAPP_STATUS",
      pillar: "OPERATIONAL_DESIGN",
      status: "SCHEDULED",
      primaryChannel: "WHATSAPP",
      secondaryChannels: [],
      publishAt: jamaicaDateTime("2026-08-17", "18:00"),
      owner: "Al Neville Hall",
      body: section(7, "WhatsApp Status sequence"),
      cta: "What should work better in your business?",
      destinationUrl: "https://trexiti.com/systems-review",
      assetBrief: "Four approved WhatsApp Status frames; no automated sending.",
      notes: scheduleNote(7),
    },
  ];

  const dayTwoSlides = parseApprovedCarouselSlides(section(2, "Carousel: Your Employees Shouldn't Be Your API"));
  const dayFiveSlides = parseApprovedCarouselSlides(section(5, "Instagram carousel copy"));
  if (dayTwoSlides.length !== 7 || dayFiveSlides.length !== 5) {
    throw new Error("Approved Week 1 carousel copy does not match the expected slide counts.");
  }

  function renderAsset(input: Omit<AssetSeed, "exportWidth" | "exportHeight">): AssetSeed {
    if (!input.format) return input;
    const dimensions = getBrandAssetFormat(input.format);
    return { ...input, exportWidth: dimensions.width, exportHeight: dimensions.height };
  }

  const commonNotes = "Seeded from the approved Week 1 launch calendar and publish-ready copy.";
  const assets: AssetSeed[] = [
    renderAsset({
      seedKey: "week1-asset-brand-graphic",
      campaignSeedKey: "campaign-trexiti-brand-relaunch",
      contentSeedKey: "week1-d1-linkedin-founder",
      name: "Trexiti relaunch statement",
      kind: "Brand statement graphic",
      status: "READY",
      channel: "LINKEDIN_FOUNDER",
      dueAt: jamaicaDateTime("2026-08-10", "16:00"),
      brief: "A restrained relaunch statement using only the approved Week 1 graphic copy.",
      owner: "Al Neville Hall",
      notes: commonNotes,
      template: "BRAND_STATEMENT",
      format: "LINKEDIN_FEED",
      variant: "LIGHT",
      eyebrow: "TREXITI / BRAND RELAUNCH",
      title: "Digital systems for ambitious businesses.",
      body: "Websites · Software · Systems · Automation",
      cta: "What should work better in your business?",
      altText: "Trexiti brand relaunch graphic reading Digital systems for ambitious businesses, with Websites, Software, Systems and Automation.",
      slideCount: 1,
      systemNodes: [],
      destinationUrl: "https://trexiti.com/start-a-project",
    }),
    renderAsset({
      seedKey: "week1-asset-employees-api-carousel",
      campaignSeedKey: "campaign-employees-api",
      contentSeedKey: "week1-d2-linkedin-carousel",
      name: "Your Employees Shouldn't Be Your API — 7 slides",
      kind: "Carousel",
      status: "READY",
      channel: "LINKEDIN_FOUNDER",
      dueAt: jamaicaDateTime("2026-08-11", "16:00"),
      brief: "Seven-slide LinkedIn carousel using the exact approved Day 2 slide copy.",
      owner: "Al Neville Hall",
      notes: commonNotes,
      template: "CAROUSEL",
      format: "LINKEDIN_SQUARE",
      variant: "DARK",
      eyebrow: "TREXITI / FIELD NOTE 01",
      title: "Your Employees Shouldn't Be Your API.",
      body: "When systems do not share context, people carry it.",
      cta: "What should work better in your business?",
      altText: "Seven-slide Trexiti carousel explaining how fragmented systems make employees carry information manually between tools.",
      slideCount: 7,
      slides: dayTwoSlides,
      systemNodes: [],
      destinationUrl: "https://trexiti.com/systems-review",
    }),
    renderAsset({
      seedKey: "week1-asset-founder-video",
      campaignSeedKey: "campaign-systems-review",
      contentSeedKey: "week1-d3-founder-video",
      name: "Before you automate anything — video cover",
      kind: "Video cover",
      status: "READY",
      channel: "INSTAGRAM",
      dueAt: jamaicaDateTime("2026-08-12", "16:00"),
      brief: "Vertical video cover derived from the approved Day 3 script and caption.",
      owner: "Al Neville Hall",
      notes: commonNotes,
      template: "BRAND_STATEMENT",
      format: "INSTAGRAM_STORY",
      variant: "DARK",
      eyebrow: "TREXITI / SYSTEMS NOTE",
      title: "Before you automate anything, map this.",
      body: "Trigger · Owner · Information · Source of truth · Failure path",
      cta: "Simplify first. Automate second.",
      altText: "Trexiti vertical video cover listing the five things to map before automating: trigger, owner, information, source of truth and failure path.",
      slideCount: 1,
      systemNodes: [],
      destinationUrl: "https://trexiti.com/systems-review",
    }),
    renderAsset({
      seedKey: "week1-asset-insight-preview",
      campaignSeedKey: "campaign-employees-api",
      contentSeedKey: "week1-d4-insight",
      name: "Insight 01 — Open Graph image",
      kind: "Open Graph image",
      status: "READY",
      channel: "WEBSITE_INSIGHTS",
      dueAt: jamaicaDateTime("2026-08-13", "16:00"),
      brief: "Editorial social cover for the approved first Trexiti Insight.",
      owner: "Al Neville Hall",
      notes: commonNotes,
      template: "INSIGHT_ARTICLE",
      format: "OPEN_GRAPH",
      variant: "LIGHT",
      eyebrow: "BUSINESS SYSTEMS / INSIGHT 01",
      title: "Your Employees Shouldn't Be Your API",
      body: "Al Neville Hall · 14 August 2026",
      cta: "Read the Insight",
      altText: "Trexiti Insight cover for Your Employees Shouldn't Be Your API by Al Neville Hall, published 14 August 2026.",
      slideCount: 1,
      systemNodes: [],
      destinationUrl: "https://trexiti.com/insights/your-employees-shouldnt-be-your-api",
    }),
    {
      seedKey: "week1-asset-insight-email",
      campaignSeedKey: "campaign-employees-api",
      contentSeedKey: "week1-d4-insight",
      name: "Warm-network Insight email",
      kind: "Email adaptation",
      status: "REQUESTED",
      channel: "EMAIL",
      dueAt: jamaicaDateTime("2026-08-14", "09:00"),
      brief: "Adapt only the approved Insight teaser for a small warm-network email; no mass sending.",
      owner: "Al Neville Hall",
      notes: commonNotes,
    },
    renderAsset({
      seedKey: "week1-asset-small-scope-graphic",
      campaignSeedKey: "campaign-small-scope-same-standard",
      contentSeedKey: "week1-d5-linkedin-founder",
      name: "Small scope. Same standard. — 5 slides",
      kind: "Carousel",
      status: "READY",
      channel: "INSTAGRAM",
      dueAt: jamaicaDateTime("2026-08-14", "16:00"),
      brief: "Five-slide Instagram carousel using the exact approved Day 5 slide copy.",
      owner: "Al Neville Hall",
      notes: commonNotes,
      template: "CAROUSEL",
      format: "INSTAGRAM_PORTRAIT",
      variant: "LIGHT",
      eyebrow: "TREXITI / FOCUSED BUILD",
      title: "Small scope. Same standard.",
      body: "A small business may need one focused improvement.",
      cta: "Bring one thing that should work better.",
      altText: "Five-slide Trexiti carousel explaining that smaller projects receive the same standard within a more focused scope.",
      slideCount: 5,
      slides: dayFiveSlides,
      systemNodes: [],
      destinationUrl: "https://trexiti.com/start-a-project",
    }),
    renderAsset({
      seedKey: "week1-asset-inquiry-payment-flow",
      campaignSeedKey: "campaign-trexiti-brand-relaunch",
      contentSeedKey: "week1-d6-instagram",
      name: "Website to payment system flow",
      kind: "Systems diagram",
      status: "READY",
      channel: "INSTAGRAM",
      dueAt: jamaicaDateTime("2026-08-15", "16:00"),
      brief: "A reduced operating flow using the approved Day 6 system stages.",
      owner: "Al Neville Hall",
      notes: commonNotes,
      template: "SYSTEM_FLOW",
      format: "INSTAGRAM_PORTRAIT",
      variant: "DARK",
      eyebrow: "TREXITI / CONNECTED SYSTEM",
      title: "The website is not the end of the customer journey.",
      body: "Build the whole system.",
      cta: "What should work better?",
      altText: "Trexiti systems diagram connecting Website to CRM, Sales, Operations and Payment.",
      slideCount: 1,
      systemNodes: ["WEBSITE", "CRM", "SALES", "OPERATIONS", "PAYMENT"],
      destinationUrl: "https://trexiti.com/services/digital-experiences",
    }),
    renderAsset({
      seedKey: "week1-asset-systems-review-card",
      campaignSeedKey: "campaign-systems-review",
      contentSeedKey: "week1-d7-linkedin-founder",
      name: "Systems Review offer",
      kind: "Offer graphic",
      status: "READY",
      channel: "LINKEDIN_FOUNDER",
      dueAt: jamaicaDateTime("2026-08-16", "16:00"),
      brief: "A direct Systems Review offer card using approved Day 7 copy only.",
      owner: "Al Neville Hall",
      notes: commonNotes,
      template: "SYSTEMS_REVIEW",
      format: "LINKEDIN_FEED",
      variant: "LIGHT",
      eyebrow: "TREXITI / SYSTEMS REVIEW",
      title: "What should work better in your business?",
      body: "Map how work, decisions and information move—then identify what should be simplified, connected, automated or built.",
      cta: "Start a Systems Review",
      altText: "Trexiti Systems Review offer card asking what should work better in your business.",
      slideCount: 1,
      systemNodes: ["SIMPLIFY", "CONNECT", "AUTOMATE", "BUILD"],
      destinationUrl: "https://trexiti.com/systems-review",
    }),
    {
      seedKey: "week1-asset-systems-review-email",
      campaignSeedKey: "campaign-systems-review",
      contentSeedKey: "week1-d7-linkedin-founder",
      name: "Targeted Systems Review email",
      kind: "Email adaptation",
      status: "REQUESTED",
      channel: "EMAIL",
      dueAt: jamaicaDateTime("2026-08-17", "09:00"),
      brief: "Prepare a targeted one-to-one email adaptation; do not automate or mass-send.",
      owner: "Al Neville Hall",
      notes: commonNotes,
    },
  ];

  const campaignPresets = campaigns.map((campaign) => ({
    seedKey: `utm-${campaign.seedKey}`,
    name: campaign.name,
    destination: campaign.landingPage ?? "https://trexiti.com/",
    source: campaign.utmSource,
    medium: campaign.utmMedium,
    campaign: campaign.utmCampaign,
    content: "",
    term: "",
  }));

  const channelPresets = [
    {
      seedKey: "utm-standard-linkedin-company",
      name: "LinkedIn company organic",
      destination: "https://trexiti.com/",
      source: "linkedin",
      medium: "company-organic",
      campaign: "trexiti-relaunch-2026",
      content: "company-page",
      term: "",
    },
    {
      seedKey: "utm-standard-instagram-organic",
      name: "Instagram organic social",
      destination: "https://trexiti.com/start-a-project",
      source: "instagram",
      medium: "organic-social",
      campaign: "focused-build",
      content: "profile-link",
      term: "",
    },
    {
      seedKey: "utm-standard-warm-email",
      name: "Direct email / warm outreach",
      destination: "https://trexiti.com/systems-review",
      source: "direct-email",
      medium: "warm-outreach",
      campaign: "systems-review",
      content: "one-to-one",
      term: "",
    },
    {
      seedKey: "utm-standard-cold-email",
      name: "Direct email / cold outreach",
      destination: "https://trexiti.com/systems-review",
      source: "direct-email",
      medium: "cold-outreach",
      campaign: "systems-review",
      content: "one-to-one",
      term: "",
    },
    {
      seedKey: "utm-standard-whatsapp",
      name: "WhatsApp direct message",
      destination: "https://trexiti.com/systems-review",
      source: "whatsapp",
      medium: "direct-message",
      campaign: "systems-review",
      content: "one-to-one",
      term: "",
    },
    {
      seedKey: "utm-standard-private-audit",
      name: "Private audit / account-based outreach",
      destination: "https://trexiti.com/systems-review",
      source: "private-audit",
      medium: "account-based-outreach",
      campaign: "systems-review",
      content: "account-specific",
      term: "",
    },
  ];

  const presets = [...campaignPresets, ...channelPresets];

  const launchChecklist: LaunchChecklistSeed[] = [
    ["al-linkedin-headline", "Al LinkedIn headline updated", "LinkedIn / Founder"],
    ["al-linkedin-about", "Al LinkedIn About updated", "LinkedIn / Founder"],
    ["al-linkedin-banner", "Personal banner exported", "LinkedIn / Founder"],
    ["linkedin-company-page", "Trexiti LinkedIn Company Page completed", "LinkedIn / Company"],
    ["linkedin-company-logo", "Company logo uploaded", "LinkedIn / Company"],
    ["linkedin-company-cover", "Company cover uploaded", "LinkedIn / Company"],
    ["instagram-bio", "Instagram bio updated from old AI/PropertyOS positioning", "Instagram"],
    ["instagram-contact-buttons", "Instagram contact buttons set", "Instagram"],
    ["whatsapp-greeting-replies", "WhatsApp Business greeting and quick replies set", "WhatsApp"],
    ["email-signature", "Email signature updated", "Email"],
    ["google-business-decision", "Google Business Profile decision recorded as eligible/not eligible", "Google Business Profile"],
    ["site-social-urls", "Social URLs added to site configuration", "Website"],
  ].map(([seedKey, title, category]) => ({
    seedKey: `launch-${seedKey}`,
    title,
    category,
    dueAt: jamaicaDateTime(
      seedKey === "google-business-decision" ? "2026-08-17" : "2026-08-11",
      seedKey === "google-business-decision" ? "17:00" : "07:00",
    ),
  }));

  const launchSources: LaunchSourceSeed[] = [
    ["week-1-calendar", "content/week_1_calendar.md", input.calendarMarkdown],
    ["week-1-posts", "content/week_1_posts.md", input.postsMarkdown],
    ["capability-statement", "materials/capability_statement.md", input.capabilityStatement],
    ["systems-review", "materials/systems_review.md", input.systemsReview],
    ["friction-checklist", "materials/friction_checklist.md", input.frictionChecklist],
  ].map(([seedKey, path, body]) => ({
    seedKey: `launch-source-${seedKey}`,
    path,
    sha256: createHash("sha256").update(body).digest("hex"),
    notes: "Approved launch-pack source imported without copy changes.",
  }));

  return {
    campaigns,
    content,
    assets,
    channels: marketingChannels.map((channel) => ({ channel })),
    presets,
    launchChecklist,
    launchSources,
    metrics: campaigns.map((campaign) => ({
      seedKey: `week1-metrics-${campaign.seedKey}`,
      campaignSeedKey: campaign.seedKey,
      weekStarting: jamaicaDateTime("2026-08-11", "00:00"),
      notes: "Week 1 baseline. Enter actual results manually after reviewing source data.",
    })),
    sourceHashes: {
      calendar: createHash("sha256").update(input.calendarMarkdown).digest("hex"),
      posts: createHash("sha256").update(input.postsMarkdown).digest("hex"),
      capabilityStatement: createHash("sha256").update(input.capabilityStatement).digest("hex"),
      systemsReview: createHash("sha256").update(input.systemsReview).digest("hex"),
      frictionChecklist: createHash("sha256").update(input.frictionChecklist).digest("hex"),
    },
  };
}

export function loadWeekOneMarketingSeed() {
  return buildWeekOneMarketingSeed({
    postsMarkdown: readFileSync(new URL("../../content/week_1_posts.md", import.meta.url), "utf8"),
    calendarMarkdown: readFileSync(new URL("../../content/week_1_calendar.md", import.meta.url), "utf8"),
    articleBody: readFileSync(
      new URL("../../content/insights/your-employees-shouldnt-be-your-api.md", import.meta.url),
      "utf8",
    ),
    capabilityStatement: readFileSync(
      new URL("../../materials/capability_statement.md", import.meta.url),
      "utf8",
    ),
    systemsReview: readFileSync(
      new URL("../../materials/systems_review.md", import.meta.url),
      "utf8",
    ),
    frictionChecklist: readFileSync(
      new URL("../../materials/friction_checklist.md", import.meta.url),
      "utf8",
    ),
  });
}

export async function seedMarketingOs(prisma: PrismaClient) {
  const seed = loadWeekOneMarketingSeed();
  const campaignIds = new Map<string, string>();

  for (const campaign of seed.campaigns) {
    const { seedKey, status, ...editable } = campaign;
    const record = await prisma.marketingCampaign.upsert({
      where: { seedKey },
      create: { seedKey, status, ...editable },
      update: editable,
      select: { id: true },
    });
    campaignIds.set(seedKey, record.id);
  }

  const contentIds = new Map<string, string>();
  for (const item of seed.content) {
    const { seedKey, parentSeedKey, campaignSeedKey, status, ...editable } = item;
    void parentSeedKey;
    const campaignId = campaignIds.get(campaignSeedKey);
    if (!campaignId) throw new Error(`Missing seeded campaign: ${campaignSeedKey}`);
    const record = await prisma.marketingContent.upsert({
      where: { seedKey },
      create: { seedKey, status, campaignId, ...editable },
      update: { campaignId, ...editable },
      select: { id: true },
    });
    contentIds.set(seedKey, record.id);
  }

  for (const item of seed.content) {
    if (!item.parentSeedKey) continue;
    const id = contentIds.get(item.seedKey);
    const parentContentId = contentIds.get(item.parentSeedKey);
    if (!id || !parentContentId) throw new Error(`Missing repurposing relation for ${item.seedKey}`);
    await prisma.marketingContent.update({ where: { id }, data: { parentContentId } });
  }

  for (const asset of seed.assets) {
    const { seedKey, campaignSeedKey, contentSeedKey, status, ...editable } = asset;
    const campaignId = campaignIds.get(campaignSeedKey);
    const contentId = contentSeedKey ? contentIds.get(contentSeedKey) : undefined;
    await prisma.marketingAsset.upsert({
      where: { seedKey },
      create: { seedKey, status, campaignId, contentId, ...editable },
      update: { campaignId, contentId, ...editable },
    });
  }

  for (const profile of seed.channels) {
    await prisma.marketingChannelProfile.upsert({
      where: { channel: profile.channel },
      create: profile,
      update: {},
    });
  }

  for (const preset of seed.presets) {
    const { seedKey, ...editable } = preset;
    await prisma.marketingUtmPreset.upsert({
      where: { seedKey },
      create: { seedKey, ...editable },
      update: editable,
    });
  }

  for (const metric of seed.metrics) {
    const campaignId = campaignIds.get(metric.campaignSeedKey);
    await prisma.marketingWeeklyMetric.upsert({
      where: { seedKey: metric.seedKey },
      create: {
        seedKey: metric.seedKey,
        campaignId,
        weekStarting: metric.weekStarting,
        notes: metric.notes,
      },
      update: {},
    });
  }

  for (const item of seed.launchChecklist) {
    const { seedKey, ...editable } = item;
    await prisma.marketingLaunchChecklistItem.upsert({
      where: { seedKey },
      create: { seedKey, ...editable },
      update: editable,
    });
  }

  for (const source of seed.launchSources) {
    const { seedKey, ...editable } = source;
    await prisma.marketingLaunchSource.upsert({
      where: { seedKey },
      create: { seedKey, ...editable },
      update: editable,
    });
  }

  return {
    campaigns: seed.campaigns.length,
    content: seed.content.length,
    assets: seed.assets.length,
    channels: seed.channels.length,
    metrics: seed.metrics.length,
    presets: seed.presets.length,
    launchChecklist: seed.launchChecklist.length,
    launchSources: seed.launchSources.length,
    sourceHashes: seed.sourceHashes,
  };
}
