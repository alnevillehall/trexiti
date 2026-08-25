import type { AdminRole } from "@prisma/client";
import { z } from "zod";

export const cooScopeSchema = z.enum([
  "trexiti:read",
  "trexiti:write_internal",
  "trexiti:approve",
]);

export type CooScope = z.infer<typeof cooScopeSchema>;

export type CooToolOrigin = "admin" | "mcp" | "workflow" | "cron";

export type CooToolActor = {
  id: string;
  externalAuthId: string;
  email: string;
  name: string;
  role: AdminRole;
};

export type CooToolContext = {
  actor: CooToolActor;
  scopes: ReadonlySet<CooScope>;
  correlationId: string;
  origin: CooToolOrigin;
};

export const recordLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  recordType: z.string().optional(),
  recordId: z.string().optional(),
});

export type RecordLink = z.infer<typeof recordLinkSchema>;

export const freshnessSchema = z.object({
  status: z.enum(["fresh", "stale", "partial", "unknown"]),
  dataAsOf: z.string().datetime().nullable(),
  staleAfterMinutes: z.number().int().positive().nullable(),
  warning: z.string().nullable(),
});

export type Freshness = z.infer<typeof freshnessSchema>;

export const toolErrorSchema = z.object({
  code: z.enum([
    "unauthorized",
    "forbidden",
    "stale_target",
    "approval_required",
    "unsupported_action",
    "stale_data",
    "rate_limited",
    "validation_error",
    "internal_error",
  ]),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ToolError = z.infer<typeof toolErrorSchema>;

export const toolEnvelopeSchema = z.object({
  ok: z.boolean(),
  asOf: z.string().datetime(),
  freshness: freshnessSchema,
  links: z.array(recordLinkSchema),
  correlationId: z.string(),
  data: z.unknown().nullable(),
  error: toolErrorSchema.nullable(),
});

/**
 * Build the concrete MCP result contract for one COO tool. Keeping the
 * envelope shape shared while specializing `data` lets MCP clients inspect
 * each tool's real structured result instead of an unhelpful `unknown` value.
 */
export function createToolEnvelopeSchema<TData extends z.ZodType>(
  dataSchema: TData,
) {
  return toolEnvelopeSchema.extend({
    data: dataSchema.nullable(),
  });
}

export type ToolEnvelope<T = unknown> = Omit<
  z.infer<typeof toolEnvelopeSchema>,
  "data"
> & {
  data: T | null;
};

export function createFreshEnvelope<T>(
  data: T,
  correlationId: string,
  options?: {
    links?: RecordLink[];
    dataAsOf?: Date | string | null;
    staleAfterMinutes?: number | null;
    status?: Freshness["status"];
    warning?: string | null;
  },
): ToolEnvelope<T> {
  const asOf = new Date().toISOString();
  const rawDataAsOf = options?.dataAsOf;

  return {
    ok: true,
    asOf,
    freshness: {
      status: options?.status ?? "fresh",
      dataAsOf:
        rawDataAsOf instanceof Date
          ? rawDataAsOf.toISOString()
          : (rawDataAsOf ?? asOf),
      staleAfterMinutes: options?.staleAfterMinutes ?? null,
      warning: options?.warning ?? null,
    },
    links: options?.links ?? [],
    correlationId,
    data,
    error: null,
  };
}

export function createErrorEnvelope(
  error: ToolError,
  correlationId: string,
  links: RecordLink[] = [],
): ToolEnvelope<never> {
  return {
    ok: false,
    asOf: new Date().toISOString(),
    freshness: {
      status: "unknown",
      dataAsOf: null,
      staleAfterMinutes: null,
      warning: error.message,
    },
    links,
    correlationId,
    data: null,
    error,
  };
}
