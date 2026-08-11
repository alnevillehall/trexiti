import { NextResponse } from "next/server";

import { isAttributionState } from "@/lib/marketing/attribution";
import {
  isMarketingEventName,
  marketingEventPropertyAllowList,
  type MarketingEventName,
  type MarketingEventProperty,
} from "@/lib/marketing/analytics-schema";
import { prisma } from "@/lib/prisma";

const MAX_BODY_LENGTH = 20_000;
const MAX_EVENTS_PER_SESSION_PER_HOUR = 120;
const EVENT_RETENTION_MS = 395 * 24 * 60 * 60 * 1_000;

function cleanText(value: unknown, maximum: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maximum);
}

function validDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function cleanProperties(event: MarketingEventName, value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const allowed = new Set<string>(marketingEventPropertyAllowList[event]);
  const output: Record<string, MarketingEventProperty> = {};

  for (const [key, property] of Object.entries(input)) {
    if (!allowed.has(key)) continue;
    if (typeof property === "string") output[key] = cleanText(property, 200);
    if (typeof property === "boolean") output[key] = property;
    if (typeof property === "number" && Number.isFinite(property)) {
      output[key] = Math.max(-1_000_000, Math.min(1_000_000, property));
    }
  }

  return output;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_TREXITI_ANALYTICS_PROVIDER !== "first-party") {
    return new NextResponse(null, { status: 204 });
  }

  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  const body = await request.text();
  if (!body || body.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  let input: Record<string, unknown>;
  try {
    input = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  const event = input.event;
  const attribution = input.attribution;
  const occurredAt = validDate(input.occurredAt);
  const sessionId = cleanText(input.sessionId, 80);
  const route = cleanText(input.route, 500);

  if (
    !isMarketingEventName(event) ||
    !isAttributionState(attribution) ||
    !occurredAt ||
    !/^[a-f0-9-]{16,80}$/i.test(sessionId) ||
    !route.startsWith("/")
  ) {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  const firstTouchAt = validDate(attribution.firstTouch.timestamp);
  const lastTouchAt = validDate(attribution.lastTouch.timestamp);
  if (!firstTouchAt || !lastTouchAt) {
    return NextResponse.json({ error: "Invalid attribution timestamps." }, { status: 400 });
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1_000);
  const recentCount = await prisma.marketingEvent.count({
    where: { sessionId, receivedAt: { gte: hourAgo } },
  });
  if (recentCount >= MAX_EVENTS_PER_SESSION_PER_HOUR) {
    return new NextResponse(null, { status: 202 });
  }

  await prisma.$transaction([
    prisma.marketingEvent.deleteMany({
      where: { receivedAt: { lt: new Date(Date.now() - EVENT_RETENTION_MS) } },
    }),
    prisma.marketingEvent.create({
      data: {
        occurredAt,
        name: event,
        route,
        sessionId,
        properties: cleanProperties(event, input.properties),
        firstTouchSource:
          cleanText(attribution.firstTouch.source, 120) || "direct",
        firstTouchMedium:
          cleanText(attribution.firstTouch.medium, 120) || "none",
        firstTouchCampaign:
          cleanText(attribution.firstTouch.campaign, 160) || null,
        firstTouchContent:
          cleanText(attribution.firstTouch.content, 160) || null,
        firstTouchTerm: cleanText(attribution.firstTouch.term, 160) || null,
        firstTouchAt,
        lastTouchSource:
          cleanText(attribution.lastTouch.source, 120) || "direct",
        lastTouchMedium:
          cleanText(attribution.lastTouch.medium, 120) || "none",
        lastTouchCampaign:
          cleanText(attribution.lastTouch.campaign, 160) || null,
        lastTouchContent:
          cleanText(attribution.lastTouch.content, 160) || null,
        lastTouchTerm: cleanText(attribution.lastTouch.term, 160) || null,
        lastTouchAt,
        landingPage:
          cleanText(attribution.firstTouch.landingPage, 500) || "/",
        referrer: cleanText(attribution.firstTouch.referrer, 500) || null,
        isReturning: attribution.isReturning,
      },
    }),
  ]);

  return new NextResponse(null, { status: 204 });
}
