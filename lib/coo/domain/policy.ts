import {
  DEFAULT_POLICY,
  type Freshness,
  type PolicyThresholds,
} from "./types";

const POSITIVE_INTEGER_KEYS = [
  "projectDeadlineHours",
  "staleProgressDays",
  "approvalExpiryHours",
  "safeBatchLimit",
  "prospectDailyMinimum",
  "prospectDailyMaximum",
  "maxFounderPriorities",
  "freshnessMinutes",
] as const satisfies ReadonlyArray<keyof PolicyThresholds>;

export function validatePolicy(policy: PolicyThresholds): string[] {
  const errors: string[] = [];

  for (const key of POSITIVE_INTEGER_KEYS) {
    const value = policy[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
      errors.push(`${key} must be a positive integer`);
    }
  }

  if (policy.prospectDailyMinimum > policy.prospectDailyMaximum) {
    errors.push("prospectDailyMinimum cannot exceed prospectDailyMaximum");
  }

  if (policy.safeBatchLimit > DEFAULT_POLICY.safeBatchLimit) {
    errors.push(`safeBatchLimit cannot exceed ${DEFAULT_POLICY.safeBatchLimit}`);
  }

  if (policy.maxFounderPriorities > DEFAULT_POLICY.maxFounderPriorities) {
    errors.push(
      `maxFounderPriorities cannot exceed ${DEFAULT_POLICY.maxFounderPriorities}`,
    );
  }

  return errors;
}

export function evaluateFreshness(
  asOf: Date | null,
  now: Date,
  thresholdMinutes: number,
): Freshness {
  if (!asOf) {
    return { state: "UNKNOWN", asOf: null, thresholdMinutes };
  }

  const ageMs = now.getTime() - asOf.getTime();
  return {
    state: ageMs <= thresholdMinutes * 60_000 ? "FRESH" : "STALE",
    asOf: asOf.toISOString(),
    thresholdMinutes,
  };
}

export function approvalExpiresAt(
  requestedAt: Date,
  policy: Pick<PolicyThresholds, "approvalExpiryHours">,
): Date {
  return new Date(
    requestedAt.getTime() + policy.approvalExpiryHours * 60 * 60 * 1_000,
  );
}

