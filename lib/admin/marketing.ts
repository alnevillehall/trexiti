import type {
  MarketingCampaignStatus,
  MarketingChannel,
  MarketingContentStatus,
  MarketingContentType,
  MarketingPillar,
} from "@prisma/client";

export const marketingTimezone = "America/Jamaica";

export const marketingContentStatuses: readonly MarketingContentStatus[] = [
  "IDEA",
  "DRAFTING",
  "REVIEW",
  "READY",
  "SCHEDULED",
  "PUBLISHED",
  "REPURPOSED",
  "ARCHIVED",
];

export const marketingContentTypes: readonly MarketingContentType[] = [
  "TEXT_POST",
  "CAROUSEL",
  "VIDEO",
  "ARTICLE",
  "CASE_STUDY",
  "EMAIL",
  "WHATSAPP_STATUS",
  "PROFILE_UPDATE",
  "LANDING_PAGE",
];

export const marketingPillars: readonly MarketingPillar[] = [
  "BUSINESS_SYSTEMS",
  "OPERATIONAL_DESIGN",
  "DIGITAL_EXPERIENCE",
  "BUILD_VS_BUY",
  "AUTOMATION",
  "BEHIND_THE_WORK",
  "SMALL_BUSINESS",
];

export const marketingChannels: readonly MarketingChannel[] = [
  "LINKEDIN_FOUNDER",
  "LINKEDIN_COMPANY",
  "INSTAGRAM",
  "WEBSITE_INSIGHTS",
  "EMAIL",
  "WHATSAPP",
  "GOOGLE_BUSINESS_PROFILE",
];

export const marketingCampaignStatuses: readonly MarketingCampaignStatus[] = [
  "PLANNED",
  "ACTIVE",
  "PAUSED",
  "COMPLETE",
  "ARCHIVED",
];

export const marketingLabels = {
  IDEA: "Idea",
  DRAFTING: "Drafting",
  REVIEW: "Review",
  READY: "Ready",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  REPURPOSED: "Repurposed",
  ARCHIVED: "Archived",
  TEXT_POST: "Text post",
  CAROUSEL: "Carousel",
  VIDEO: "Video",
  ARTICLE: "Article",
  CASE_STUDY: "Case study",
  EMAIL: "Email",
  WHATSAPP_STATUS: "WhatsApp status",
  PROFILE_UPDATE: "Profile update",
  LANDING_PAGE: "Landing page",
  BUSINESS_SYSTEMS: "Business systems",
  OPERATIONAL_DESIGN: "Operational design",
  DIGITAL_EXPERIENCE: "Digital experience",
  BUILD_VS_BUY: "Build vs buy",
  AUTOMATION: "Automation",
  BEHIND_THE_WORK: "Behind the work",
  SMALL_BUSINESS: "Small business",
  LINKEDIN_FOUNDER: "LinkedIn / Founder",
  LINKEDIN_COMPANY: "LinkedIn / Company",
  INSTAGRAM: "Instagram",
  WEBSITE_INSIGHTS: "Website Insights",
  WHATSAPP: "WhatsApp",
  GOOGLE_BUSINESS_PROFILE: "Google Business Profile",
  PLANNED: "Planned",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETE: "Complete",
  REQUESTED: "Requested",
  IN_PRODUCTION: "In production",
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  NEEDS_REVIEW: "Needs review",
  UNCHECKED: "Unchecked",
  PENDING: "Pending",
  VERIFIED: "Verified",
  NOT_AVAILABLE: "Not available",
  MANUAL: "Manual",
  IMPORTED: "Imported",
} as const;

export function marketingLabel(value: string) {
  return marketingLabels[value as keyof typeof marketingLabels] ??
    value.toLowerCase().replaceAll("_", " ");
}

export function jamaicaDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00-05:00`);
}

export function parseJamaicaDateTimeLocal(value: string) {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
    throw new Error("Use a valid Jamaica date and time.");
  }
  return new Date(`${normalized}:00-05:00`);
}

export function formatJamaicaDateTimeInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: marketingTimezone,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function formatJamaicaDateTime(value: Date | string | null | undefined) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-JM", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: marketingTimezone,
  }).format(new Date(value));
}

export function formatJamaicaDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-JM", {
    dateStyle: "medium",
    timeZone: marketingTimezone,
  }).format(new Date(value));
}

export function getJamaicaDateKey(value: Date | string = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: marketingTimezone,
  }).formatToParts(new Date(value));
  const valueFor = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${valueFor("year")}-${valueFor("month")}-${valueFor("day")}`;
}

export function getJamaicaDayRange(dateKey = getJamaicaDateKey()) {
  const start = new Date(`${dateKey}T00:00:00-05:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1_000);
  return { start, end };
}

export type MarketingCalendarView = "month" | "week" | "agenda";

export function getMarketingCalendarRange(view: MarketingCalendarView, dateKey: string) {
  const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : getJamaicaDateKey();
  const reference = new Date(`${safeDate}T12:00:00-05:00`);
  let start: Date;
  let end: Date;

  if (view === "month") {
    const [year, month] = safeDate.split("-").map(Number);
    start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-05:00`);
    const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
    end = new Date(`${nextMonth}-01T00:00:00-05:00`);
  } else if (view === "week") {
    const mondayOffset = (reference.getUTCDay() + 6) % 7;
    const monday = new Date(reference.getTime() - mondayOffset * 86_400_000);
    start = new Date(`${getJamaicaDateKey(monday)}T00:00:00-05:00`);
    end = new Date(start.getTime() + 7 * 86_400_000);
  } else {
    start = new Date(`${safeDate}T00:00:00-05:00`);
    end = new Date(start.getTime() + 31 * 86_400_000);
  }
  return { start, end, dateKey: safeDate };
}

export function normalizeUtmValue(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export type UtmInput = {
  destination: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  term?: string;
};

export function buildTaggedUrl(input: UtmInput) {
  const destination = new URL(input.destination);
  if (!['http:', 'https:'].includes(destination.protocol)) {
    throw new Error("Destination must use http or https.");
  }

  const required = {
    utm_source: normalizeUtmValue(input.source),
    utm_medium: normalizeUtmValue(input.medium),
    utm_campaign: normalizeUtmValue(input.campaign),
  };
  if (Object.values(required).some((value) => !value)) {
    throw new Error("Source, medium and campaign are required.");
  }

  for (const [key, value] of Object.entries(required)) {
    destination.searchParams.set(key, value);
  }

  const optional = {
    utm_content: normalizeUtmValue(input.content ?? ""),
    utm_term: normalizeUtmValue(input.term ?? ""),
  };
  for (const [key, value] of Object.entries(optional)) {
    if (value) destination.searchParams.set(key, value);
    else destination.searchParams.delete(key);
  }

  return destination.toString();
}

export type ParsedWeekOnePosts = Record<number, Record<string, string>>;

export function parseWeekOnePosts(markdown: string): ParsedWeekOnePosts {
  const parsed: ParsedWeekOnePosts = {};
  let day: number | null = null;
  let heading: string | null = null;
  let buffer: string[] = [];

  function commit() {
    if (day === null || !heading) return;
    parsed[day] ??= {};
    parsed[day][heading] = buffer.join("\n").trim();
  }

  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    const dayMatch = line.match(/^## Day (\d+)/);
    if (dayMatch) {
      commit();
      day = Number(dayMatch[1]);
      heading = null;
      buffer = [];
      continue;
    }

    const headingMatch = line.match(/^### (.+)$/);
    if (headingMatch && day !== null) {
      commit();
      heading = headingMatch[1].trim();
      buffer = [];
      continue;
    }

    if (heading) buffer.push(line);
  }
  commit();
  return parsed;
}

export function parseWeekOneCalendar(markdown: string) {
  const parsed: Record<number, string> = {};
  let day = 0;
  let buffer: string[] = [];

  function commit() {
    if (!day) return;
    parsed[day] = buffer.join("\n").trim();
  }

  for (const line of markdown.replace(/\r\n/g, "\n").split("\n")) {
    if (/^## (Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Monday),/.test(line)) {
      commit();
      day += 1;
      buffer = [];
      continue;
    }
    if (day) buffer.push(line);
  }
  commit();
  return parsed;
}
