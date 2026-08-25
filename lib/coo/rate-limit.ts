export type CooRateLimitBucket =
  | "mcp_total"
  | "mcp_read"
  | "mcp_write"
  | "mcp_approve"
  | "mcp_run_operations"
  | "ask_trexiti"
  | "operations_planning";

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

export const COO_RATE_LIMIT_POLICIES: Readonly<
  Record<CooRateLimitBucket, RateLimitPolicy>
> = Object.freeze({
  mcp_total: { limit: 90, windowMs: 60_000 },
  mcp_read: { limit: 60, windowMs: 60_000 },
  mcp_write: { limit: 20, windowMs: 60_000 },
  mcp_approve: { limit: 10, windowMs: 60_000 },
  mcp_run_operations: { limit: 5, windowMs: 10 * 60_000 },
  ask_trexiti: { limit: 6, windowMs: 10 * 60_000 },
  operations_planning: { limit: 4, windowMs: 10 * 60_000 },
});

export class CooRateLimitError extends Error {
  readonly retryAfterSeconds: number;
  readonly bucket: CooRateLimitBucket;

  constructor(bucket: CooRateLimitBucket, retryAfterMs: number) {
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1_000));
    super(
      `RATE_LIMITED: Too many ${bucket.replaceAll("_", " ")} requests. Retry after ${retryAfterSeconds} seconds.`,
    );
    this.name = "CooRateLimitError";
    this.bucket = bucket;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class SlidingWindowRateLimiter {
  private readonly buckets = new Map<string, number[]>();

  constructor(private readonly maximumBuckets = 5_000) {}

  consume(
    key: string,
    policy: RateLimitPolicy,
    nowMs = Date.now(),
  ): { remaining: number; resetAt: number } {
    if (!key.trim()) throw new Error("A rate-limit key is required.");
    if (!Number.isInteger(policy.limit) || policy.limit < 1) {
      throw new Error("A positive integer rate limit is required.");
    }
    if (!Number.isFinite(policy.windowMs) || policy.windowMs < 1) {
      throw new Error("A positive rate-limit window is required.");
    }
    if (!Number.isFinite(nowMs)) throw new Error("A valid rate-limit time is required.");

    const cutoff = nowMs - policy.windowMs;
    const active = (this.buckets.get(key) ?? []).filter(
      (timestamp) => timestamp > cutoff,
    );

    if (active.length >= policy.limit) {
      const resetAt = active[0]! + policy.windowMs;
      throw new CooRateLimitError(
        key.split(":", 1)[0] as CooRateLimitBucket,
        resetAt - nowMs,
      );
    }

    if (!this.buckets.has(key) && this.buckets.size >= this.maximumBuckets) {
      this.prune(nowMs);
      if (this.buckets.size >= this.maximumBuckets) {
        throw new CooRateLimitError(
          key.split(":", 1)[0] as CooRateLimitBucket,
          policy.windowMs,
        );
      }
    }

    active.push(nowMs);
    this.buckets.set(key, active);
    const resetAt = active[0]! + policy.windowMs;
    return { remaining: policy.limit - active.length, resetAt };
  }

  clear() {
    this.buckets.clear();
  }

  private prune(nowMs: number) {
    const longestWindow = Math.max(
      ...Object.values(COO_RATE_LIMIT_POLICIES).map((policy) => policy.windowMs),
    );
    const cutoff = nowMs - longestWindow;
    for (const [key, timestamps] of this.buckets) {
      if (!timestamps.some((timestamp) => timestamp > cutoff)) {
        this.buckets.delete(key);
      }
    }
  }
}

const globalRateLimitState = globalThis as typeof globalThis & {
  __trexitiCooRateLimiter?: SlidingWindowRateLimiter;
};

const applicationLimiter =
  globalRateLimitState.__trexitiCooRateLimiter ?? new SlidingWindowRateLimiter();

globalRateLimitState.__trexitiCooRateLimiter = applicationLimiter;

export function enforceCooRateLimit(input: {
  bucket: CooRateLimitBucket;
  subject: string;
  nowMs?: number;
}) {
  const subject = input.subject.trim();
  if (!subject) throw new Error("A rate-limit subject is required.");
  return applicationLimiter.consume(
    `${input.bucket}:${subject}`,
    COO_RATE_LIMIT_POLICIES[input.bucket],
    input.nowMs,
  );
}
