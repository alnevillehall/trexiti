import type {
  MarketingEventDetail,
  MarketingEventName,
  MarketingEventProperties,
} from "@/lib/marketing/analytics-schema";

export const TREXITI_ANALYTICS_EVENT = "trexiti:analytics";

type AnalyticsBridge = {
  track: (detail: MarketingEventDetail) => void;
};

declare global {
  interface Window {
    __trexitiAnalytics?: AnalyticsBridge;
    __trexitiAnalyticsQueue?: MarketingEventDetail[];
  }
}

export function trackMarketingEvent<EventName extends MarketingEventName>(
  event: EventName,
  route: string,
  properties: MarketingEventProperties<EventName> = {} as MarketingEventProperties<EventName>,
) {
  if (typeof window === "undefined") return;

  const detail = { event, route, properties } as MarketingEventDetail;
  window.dispatchEvent(new CustomEvent(TREXITI_ANALYTICS_EVENT, { detail }));

  if (window.__trexitiAnalytics) {
    window.__trexitiAnalytics.track(detail);
    return;
  }

  window.__trexitiAnalyticsQueue ??= [];
  window.__trexitiAnalyticsQueue.push(detail);
}
