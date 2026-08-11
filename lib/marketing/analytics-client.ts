import {
  createAttributionTouch,
  isAttributionState,
  toLeadAttribution,
  updateAttributionState,
  type AttributionState,
  type LeadAttribution,
} from "@/lib/marketing/attribution";

export type AnalyticsConsent = "granted" | "denied" | "unset";

const CONSENT_KEY = "trexiti_analytics_consent_v1";
const ATTRIBUTION_KEY = "trexiti_attribution_v1";
const SESSION_KEY = "trexiti_analytics_session_v1";

let memoryAttribution: AttributionState | null = null;
let sessionInitialized = false;

function storageAvailable(storage: Storage) {
  try {
    const key = "__trexiti_storage_test__";
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function readPersistedAttribution() {
  if (!storageAvailable(window.localStorage)) return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(ATTRIBUTION_KEY) ?? "null");
    return isAttributionState(value) ? value : null;
  } catch {
    return null;
  }
}

function currentSessionExists() {
  if (!storageAvailable(window.sessionStorage)) return false;
  return Boolean(window.sessionStorage.getItem(SESSION_KEY));
}

function persistAttribution(state: AttributionState) {
  if (getAnalyticsConsent() !== "granted") return;
  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(state));
  } catch {
    // Attribution remains available in memory for the current visit.
  }
}

export function honorsDoNotTrack() {
  if (typeof navigator === "undefined") return false;
  return navigator.doNotTrack === "1";
}

export function getAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return "unset";
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    if (value === "granted" || value === "denied") return value;
  } catch {
    return honorsDoNotTrack() ? "denied" : "unset";
  }
  return honorsDoNotTrack() ? "denied" : "unset";
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, "unset">) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
    if (value === "denied") {
      window.localStorage.removeItem(ATTRIBUTION_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // A blocked storage API naturally leaves analytics disabled.
  }

  if (value === "granted" && memoryAttribution) {
    persistAttribution(memoryAttribution);
  }
}

export function captureAttributionForPage() {
  const consent = getAnalyticsConsent();
  const persisted = consent === "granted" ? readPersistedAttribution() : null;
  const hasSession = currentSessionExists();
  const newSession = !sessionInitialized && !hasSession;
  const previous = memoryAttribution ?? persisted;
  const touch = createAttributionTouch({
    url: window.location.href,
    referrer: document.referrer,
  });

  memoryAttribution = updateAttributionState(previous, touch, { newSession });
  sessionInitialized = true;
  persistAttribution(memoryAttribution);
  return memoryAttribution;
}

export function getAttributionState() {
  return memoryAttribution ?? captureAttributionForPage();
}

export function getLeadAttribution(): LeadAttribution {
  return toLeadAttribution(getAttributionState());
}

export function getAnalyticsSessionId() {
  if (getAnalyticsConsent() !== "granted") return "";

  try {
    const current = window.sessionStorage.getItem(SESSION_KEY);
    if (current) return current;
    const sessionId = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, sessionId);
    return sessionId;
  } catch {
    return "";
  }
}

export function clearAnalyticsMemoryForTests() {
  memoryAttribution = null;
  sessionInitialized = false;
}
