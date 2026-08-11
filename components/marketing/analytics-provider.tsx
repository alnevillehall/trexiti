"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  captureAttributionForPage,
  getAnalyticsConsent,
  getAnalyticsSessionId,
  getAttributionState,
  honorsDoNotTrack,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/marketing/analytics-client";
import { trackMarketingEvent } from "@/lib/marketing/analytics";
import type {
  MarketingEventDetail,
  MarketingEventEnvelope,
} from "@/lib/marketing/analytics-schema";

import styles from "./analytics-provider.module.css";

const PREFERENCES_EVENT = "trexiti:analytics-preferences";

function placementFor(anchor: HTMLAnchorElement) {
  return (
    anchor.dataset.analyticsPlacement ||
    (anchor.closest("header") ? "header" : anchor.closest("footer") ? "footer" : "content")
  ).slice(0, 80);
}

function platformFor(url: URL) {
  if (url.hostname.includes("linkedin.com")) return "linkedin";
  if (url.hostname.includes("instagram.com")) return "instagram";
  return "social";
}

function sendFirstPartyEvent(detail: MarketingEventDetail) {
  const sessionId = getAnalyticsSessionId();
  if (!sessionId) return;

  const envelope: MarketingEventEnvelope = {
    ...detail,
    attribution: getAttributionState(),
    occurredAt: new Date().toISOString(),
    sessionId,
  };

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(envelope),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}

export function AnalyticsProvider({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const [consent, setConsent] = useState<AnalyticsConsent>("unset");
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const consentRef = useRef<AnalyticsConsent>("unset");
  const lastPageRef = useRef("");

  useEffect(() => {
    const current = getAnalyticsConsent();
    consentRef.current = current;
    const consentFrame = window.requestAnimationFrame(() => setConsent(current));

    window.__trexitiAnalytics = {
      track(detail) {
        if (!enabled || consentRef.current !== "granted") return;
        sendFirstPartyEvent(detail);
      },
    };

    const queued = window.__trexitiAnalyticsQueue ?? [];
    window.__trexitiAnalyticsQueue = [];
    if (enabled && current === "granted") queued.forEach(sendFirstPartyEvent);

    return () => {
      window.cancelAnimationFrame(consentFrame);
      delete window.__trexitiAnalytics;
    };
  }, [enabled]);

  useEffect(() => {
    const openPreferences = () => setPreferencesOpen(true);
    window.addEventListener(PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(PREFERENCES_EVENT, openPreferences);
  }, []);

  useEffect(() => {
    captureAttributionForPage();
    const routeKey = `${pathname}?${query}`;
    if (
      enabled &&
      consentRef.current === "granted" &&
      routeKey !== lastPageRef.current
    ) {
      lastPageRef.current = routeKey;
      trackMarketingEvent("page_view", pathname);
    }
  }, [enabled, pathname, query]);

  useEffect(() => {
    function trackLink(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      const placement = placementFor(anchor);
      if (href.startsWith("mailto:")) {
        trackMarketingEvent("email_link_clicked", pathname, { placement });
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      if (url.hostname === "wa.me" || url.hostname.includes("whatsapp.com")) {
        trackMarketingEvent("whatsapp_link_clicked", pathname, { placement });
      } else if (
        url.hostname.includes("linkedin.com") ||
        url.hostname.includes("instagram.com")
      ) {
        trackMarketingEvent("social_link_clicked", pathname, {
          placement,
          platform: platformFor(url),
        });
      }

      if (url.origin === window.location.origin && url.pathname === "/start-a-project") {
        trackMarketingEvent("start_project_clicked", pathname, {
          destination: url.pathname,
          placement,
        });
        trackMarketingEvent("primary_cta_clicked", pathname, {
          cta_id: anchor.dataset.analyticsCta || "start-project",
          destination: url.pathname,
          placement,
        });
      } else if (anchor.dataset.analyticsCta) {
        trackMarketingEvent("primary_cta_clicked", pathname, {
          cta_id: anchor.dataset.analyticsCta,
          destination: url.pathname,
          placement,
        });
      }

      const insightSlug = anchor.dataset.analyticsInsightCta;
      if (insightSlug) {
        trackMarketingEvent("insight_cta_clicked", pathname, {
          destination: url.pathname,
          placement,
          slug: insightSlug,
        });
      }
    }

    document.addEventListener("click", trackLink, true);
    return () => document.removeEventListener("click", trackLink, true);
  }, [pathname]);

  if (!enabled) return null;
  const showPreferences = preferencesOpen || consent === "unset";
  if (!showPreferences) return null;

  function choose(value: "granted" | "denied") {
    setAnalyticsConsent(value);
    consentRef.current = value;
    setConsent(value);
    setPreferencesOpen(false);
    window.__trexitiAnalyticsQueue = [];

    if (value === "granted") {
      captureAttributionForPage();
      lastPageRef.current = `${pathname}?${query}`;
      trackMarketingEvent("page_view", pathname);
    }
  }

  return (
    <section
      aria-label="Analytics preferences"
      aria-live="polite"
      className={styles.preferences}
      data-expanded={preferencesOpen ? "true" : "false"}
    >
      <div>
        <strong>Optional, privacy-conscious analytics</strong>
        <p>
          Trexiti can store anonymous page and conversion events to understand
          which content helps. No form answers, contact details, advertising
          pixels, or session recordings are collected. {honorsDoNotTrack() ? "Your browser’s Do Not Track preference is currently honored. " : ""}
          <Link href="/privacy">Read the privacy notice.</Link>
        </p>
      </div>
      <div className={styles.actions}>
        <button onClick={() => choose("denied")} type="button">
          Keep disabled
        </button>
        <button className={styles.allow} onClick={() => choose("granted")} type="button">
          Allow analytics
        </button>
      </div>
    </section>
  );
}

export function AnalyticsPreferencesButton() {
  return (
    <button
      className={styles.preferenceButton}
      onClick={() => window.dispatchEvent(new Event(PREFERENCES_EVENT))}
      type="button"
    >
      Analytics preferences
    </button>
  );
}

export function MarketingViewEvent({
  event,
  route,
  slug,
}: {
  event: "insight_view" | "case_study_view";
  route: string;
  slug: string;
}) {
  useEffect(() => {
    if (event === "insight_view") {
      trackMarketingEvent(event, route, { slug });
    } else {
      trackMarketingEvent(event, route, { slug });
    }
  }, [event, route, slug]);
  return null;
}
