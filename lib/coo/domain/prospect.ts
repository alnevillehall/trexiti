import type {
  ProspectAcceptance,
  ProspectAcceptanceInput,
} from "./types";

export const PROSPECT_SOURCE_MAX_AGE_DAYS = 30;

function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const hostname = url.hostname.toLowerCase();
    return !(
      hostname === "localhost" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".test") ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    );
  } catch {
    return false;
  }
}

export function assessProspectAcceptance(
  input: ProspectAcceptanceInput,
  now: Date,
): ProspectAcceptance {
  const reasons: ProspectAcceptance["reasons"] = [];
  const sourceAgeMs = input.sourceObservedAt
    ? now.getTime() - input.sourceObservedAt.getTime()
    : Number.POSITIVE_INFINITY;
  const maxSourceAgeMs = PROSPECT_SOURCE_MAX_AGE_DAYS * 24 * 60 * 60 * 1_000;
  const hasCurrentPublicSource =
    input.sourceUrls.some(isPublicHttpUrl) &&
    sourceAgeMs >= -5 * 60_000 &&
    sourceAgeMs <= maxSourceAgeMs;

  if (!hasCurrentPublicSource) reasons.push("MISSING_CURRENT_PUBLIC_SOURCE");
  if (!input.hasReachableContactMethod) reasons.push("MISSING_CONTACT_METHOD");
  if (!input.observedBusinessNeed?.trim()) reasons.push("MISSING_OBSERVED_NEED");
  if (input.duplicateDomain) reasons.push("DUPLICATE_DOMAIN");
  if (input.duplicateContact) reasons.push("DUPLICATE_CONTACT");

  return { accepted: reasons.length === 0, reasons };
}

export function validateProspectScores(scores: {
  financialCapacityScore: number;
  problemSeverityScore: number;
  strategicFitScore: number;
  urgencyScore: number;
  decisionMakerAccessScore: number;
}): { valid: boolean; totalScore: number } {
  const values = Object.values(scores);
  return {
    valid: values.every(
      (value) => Number.isInteger(value) && value >= 1 && value <= 5,
    ),
    totalScore: values.reduce((sum, value) => sum + value, 0),
  };
}

