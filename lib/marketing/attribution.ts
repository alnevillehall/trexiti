export type AttributionTouch = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  landingPage: string;
  referrer: string;
  timestamp: string;
  hasCampaignSignal: boolean;
};

export type AttributionState = {
  firstTouch: AttributionTouch;
  lastTouch: AttributionTouch;
  isReturning: boolean;
};

export type LeadAttribution = {
  firstTouchSource: string;
  firstTouchMedium: string;
  firstTouchCampaign: string;
  firstTouchContent: string;
  firstTouchTerm: string;
  firstTouchAt: string;
  lastTouchSource: string;
  lastTouchMedium: string;
  lastTouchCampaign: string;
  lastTouchContent: string;
  lastTouchTerm: string;
  lastTouchAt: string;
  landingPage: string;
  referrer: string;
  isReturning: boolean;
};

const UTM_LIMITS = {
  source: 120,
  medium: 120,
  campaign: 160,
  content: 160,
  term: 160,
} as const;

function normalizedUtm(value: string | null, maximum: number) {
  return (value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9._~-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maximum);
}

function safeReferrer(value: string, siteOrigin: string) {
  if (!value) return "";

  try {
    const url = new URL(value);
    if (url.origin === siteOrigin) return "";
    if (!/^https?:$/.test(url.protocol)) return "";
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return "";
  }
}

export function createAttributionTouch(input: {
  url: string;
  referrer?: string;
  timestamp?: string;
}) {
  const url = new URL(input.url);
  const referrer = safeReferrer(input.referrer ?? "", url.origin);
  const source = normalizedUtm(
    url.searchParams.get("utm_source"),
    UTM_LIMITS.source,
  );
  const medium = normalizedUtm(
    url.searchParams.get("utm_medium"),
    UTM_LIMITS.medium,
  );
  const campaign = normalizedUtm(
    url.searchParams.get("utm_campaign"),
    UTM_LIMITS.campaign,
  );
  const content = normalizedUtm(
    url.searchParams.get("utm_content"),
    UTM_LIMITS.content,
  );
  const term = normalizedUtm(
    url.searchParams.get("utm_term"),
    UTM_LIMITS.term,
  );
  const referrerHost = referrer
    ? new URL(referrer).hostname.replace(/^www\./, "").slice(0, 120)
    : "";

  return {
    source: source || referrerHost || "direct",
    medium: medium || (referrer ? "referral" : "none"),
    campaign,
    content,
    term,
    landingPage: url.pathname.slice(0, 500) || "/",
    referrer,
    timestamp: input.timestamp ?? new Date().toISOString(),
    hasCampaignSignal: Boolean(source || medium || campaign || content || term || referrer),
  } satisfies AttributionTouch;
}

export function updateAttributionState(
  previous: AttributionState | null,
  touch: AttributionTouch,
  options: { newSession: boolean },
) {
  if (!previous) {
    return {
      firstTouch: touch,
      lastTouch: touch,
      isReturning: false,
    } satisfies AttributionState;
  }

  const lastTouch = options.newSession || touch.hasCampaignSignal
    ? touch
    : { ...previous.lastTouch, timestamp: touch.timestamp };

  return {
    firstTouch: previous.firstTouch,
    lastTouch,
    isReturning: previous.isReturning || options.newSession,
  } satisfies AttributionState;
}

export function toLeadAttribution(state: AttributionState): LeadAttribution {
  return {
    firstTouchSource: state.firstTouch.source,
    firstTouchMedium: state.firstTouch.medium,
    firstTouchCampaign: state.firstTouch.campaign,
    firstTouchContent: state.firstTouch.content,
    firstTouchTerm: state.firstTouch.term,
    firstTouchAt: state.firstTouch.timestamp,
    lastTouchSource: state.lastTouch.source,
    lastTouchMedium: state.lastTouch.medium,
    lastTouchCampaign: state.lastTouch.campaign,
    lastTouchContent: state.lastTouch.content,
    lastTouchTerm: state.lastTouch.term,
    lastTouchAt: state.lastTouch.timestamp,
    landingPage: state.firstTouch.landingPage,
    referrer: state.firstTouch.referrer,
    isReturning: state.isReturning,
  };
}

export function isAttributionState(value: unknown): value is AttributionState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<AttributionState>;
  return Boolean(
    state.firstTouch &&
      state.lastTouch &&
      typeof state.firstTouch.source === "string" &&
      typeof state.firstTouch.timestamp === "string" &&
      typeof state.lastTouch.source === "string" &&
      typeof state.lastTouch.timestamp === "string" &&
      typeof state.isReturning === "boolean",
  );
}
