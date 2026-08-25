import type { RecordLink as DomainRecordLink } from "@/lib/coo/domain/types";
import { getSiteUrl } from "@/lib/coo/mcp/oauth";
import { CooRateLimitError } from "@/lib/coo/rate-limit";
import {
  createErrorEnvelope,
  createFreshEnvelope,
  type Freshness,
  type RecordLink,
  type ToolEnvelope,
  type ToolError,
} from "@/lib/coo/tools/contracts";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function absoluteAdminHref(href: string) {
  return href.startsWith("/admin") ? new URL(href, getSiteUrl()).toString() : href;
}

function isDomainRecordLink(value: unknown): value is DomainRecordLink {
  return (
    isObject(value) &&
    typeof value.type === "string" &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.href === "string"
  );
}

function internalAdminRecordLink(value: unknown): RecordLink | null {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    typeof value.href !== "string" ||
    !value.href.startsWith("/admin")
  ) {
    return null;
  }
  const labelCandidate =
    value.label ??
    value.title ??
    value.name ??
    value.reference ??
    value.invoiceNumber;
  if (typeof labelCandidate !== "string" || !labelCandidate) return null;
  return {
    label: labelCandidate,
    href: absoluteAdminHref(value.href),
    recordType: typeof value.type === "string" ? value.type : undefined,
    recordId: value.id,
  };
}

export function collectRecordLinks(value: unknown): RecordLink[] {
  const links = new Map<string, RecordLink>();
  const seen = new Set<unknown>();

  function visit(current: unknown) {
    if (current === null || typeof current !== "object" || seen.has(current)) {
      return;
    }
    seen.add(current);

    if (isDomainRecordLink(current)) {
      links.set(current.href, {
        label: current.label,
        href: absoluteAdminHref(current.href),
        recordType: current.type,
        recordId: current.id,
      });
      return;
    }

    const internalLink = internalAdminRecordLink(current);
    if (internalLink) {
      links.set(internalLink.href, internalLink);
      return;
    }

    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    Object.values(current).forEach(visit);
  }

  visit(value);
  return [...links.values()];
}

export function inferFreshness(value: unknown): {
  dataAsOf: string | null;
  staleAfterMinutes: number | null;
  status: Freshness["status"];
  warning: string | null;
} {
  if (!isObject(value)) {
    return {
      dataAsOf: null,
      staleAfterMinutes: null,
      status: "unknown",
      warning: null,
    };
  }

  const freshness = isObject(value.freshness) ? value.freshness : null;
  const brief = isObject(value.brief) ? value.brief : null;
  const briefStatus = brief?.status;
  const briefIsPartial =
    briefStatus === "DEGRADED" ||
    briefStatus === "FAILED" ||
    (typeof brief?.degradedReason === "string" &&
      brief.degradedReason.trim().length > 0);
  const rawState = freshness?.state;
  const state =
    rawState === "STALE"
      ? "stale"
      : rawState === "PARTIAL" || briefIsPartial
          ? "partial"
          : rawState === "FRESH"
            ? "fresh"
          : !freshness && typeof value.asOf === "string"
            ? "fresh"
            : "unknown";

  const dataAsOf =
    typeof freshness?.asOf === "string"
      ? freshness.asOf
      : typeof value.asOf === "string"
        ? value.asOf
        : null;

  return {
    dataAsOf,
    staleAfterMinutes:
      typeof freshness?.thresholdMinutes === "number"
        ? freshness.thresholdMinutes
        : null,
    status: state,
    warning:
      state === "stale"
        ? "Trexiti data is older than the active policy threshold."
        : state === "partial"
          ? briefIsPartial
            ? "The stored COO brief is degraded or failed and may contain partial data."
            : "The result contains partial data."
          : state === "unknown"
            ? "Trexiti did not provide source freshness metadata for this result."
            : null,
  };
}

export function envelopeData<T>(
  data: T,
  correlationId: string,
): ToolEnvelope<T> {
  const freshness = inferFreshness(data);
  return createFreshEnvelope(data, correlationId, {
    ...freshness,
    links: collectRecordLinks(data),
  });
}

export function classifyToolError(error: unknown): ToolError {
  const message = error instanceof Error ? error.message : "Unexpected COO tool error.";
  const name = error instanceof Error ? error.name : "";
  const normalized = message.toLowerCase();

  if (error instanceof CooRateLimitError) {
    return {
      code: "rate_limited",
      message,
      details: {
        bucket: error.bucket,
        retryAfterSeconds: error.retryAfterSeconds,
      },
    };
  }

  if (name === "McpAuthenticationError" || normalized.includes("scope")) {
    return { code: "forbidden", message };
  }
  if (normalized.includes("pagination cursor")) {
    return {
      code: normalized.includes("stale") ? "stale_data" : "validation_error",
      message,
    };
  }
  if (
    normalized.includes("stale_data") ||
    normalized.includes("stale data")
  ) {
    return { code: "stale_data", message };
  }
  if (normalized.includes("stale") || normalized.includes("version")) {
    return { code: "stale_target", message };
  }
  if (
    normalized.includes("approval_expired") ||
    normalized.includes("approval_not_pending") ||
    normalized.includes("approval_not_executable")
  ) {
    return { code: "stale_target", message };
  }
  if (normalized.includes("approval") && normalized.includes("required")) {
    return { code: "approval_required", message };
  }
  if (normalized.includes("unsupported")) {
    return { code: "unsupported_action", message };
  }
  if (normalized.includes("rate limit") || normalized.includes("rate_limited")) {
    return { code: "rate_limited", message };
  }
  if (
    normalized.includes("idempotency_conflict") ||
    normalized.includes("safe_batch_limit") ||
    normalized.includes("mixed_safe_batch")
  ) {
    return { code: "validation_error", message };
  }
  if (
    normalized.includes("automation_not_guarded") ||
    normalized.includes("automation_disabled")
  ) {
    return { code: "forbidden", message };
  }
  if (name === "ZodError" || normalized.includes("validation")) {
    return { code: "validation_error", message };
  }

  return { code: "internal_error", message: "The COO operation could not be completed." };
}

export function envelopeError(error: unknown, correlationId: string) {
  return createErrorEnvelope(classifyToolError(error), correlationId);
}
