import { normalizeObjectSchema } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { toJsonSchemaCompat } from "@modelcontextprotocol/sdk/server/zod-json-schema-compat.js";
import { z } from "zod";

import { getOAuthSecuritySchemes } from "@/lib/coo/mcp/oauth";
import type { CooScope } from "@/lib/coo/tools/contracts";
import {
  addInternalNoteInputSchema,
  createTaskInputSchema,
  decideApprovalInputSchema,
  decideApprovalOutputSchema,
  getActiveClientsInputSchema,
  getActiveClientsOutputSchema,
  getAutomationStatusInputSchema,
  getAutomationStatusOutputSchema,
  getDailySummaryInputSchema,
  getDailySummaryOutputSchema,
  getFollowupsDueInputSchema,
  getFollowupsDueOutputSchema,
  getOutstandingPaymentsInputSchema,
  getOutstandingPaymentsOutputSchema,
  getProjectsAtRiskInputSchema,
  getProjectsAtRiskOutputSchema,
  getSalesPipelineInputSchema,
  getSalesPipelineOutputSchema,
  getTopOpportunitiesInputSchema,
  getTopOpportunitiesOutputSchema,
  getUpcomingDeadlinesInputSchema,
  getUpcomingDeadlinesOutputSchema,
  listApprovalRequestsInputSchema,
  listApprovalRequestsOutputSchema,
  runOperationsInputSchema,
  runOperationsOutputSchema,
  safeOperationOutputSchema,
  updateProspectInputSchema,
} from "@/lib/coo/tools/schemas";

export type CooToolName =
  | "get_daily_summary"
  | "get_sales_pipeline"
  | "get_followups_due"
  | "get_top_opportunities"
  | "get_active_clients"
  | "get_projects_at_risk"
  | "get_outstanding_payments"
  | "get_upcoming_deadlines"
  | "get_automation_status"
  | "create_task"
  | "add_internal_note"
  | "update_prospect"
  | "run_operations"
  | "list_approval_requests"
  | "decide_approval";

export type CooToolDefinition = {
  name: CooToolName;
  title: string;
  description: string;
  inputSchema: z.ZodType;
  outputSchema: z.ZodType;
  requiredScopes: readonly CooScope[];
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    openWorldHint: boolean;
  };
};

const readAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const writeAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const approvalDecisionAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const cooToolDefinitions = [
  {
    name: "get_daily_summary",
    title: "Get Trexiti daily summary",
    description:
      "Read the stored COO brief and live operational dashboard, including freshness and currency-separated totals.",
    inputSchema: getDailySummaryInputSchema,
    outputSchema: getDailySummaryOutputSchema,
    requiredScopes: ["trexiti:read"],
    annotations: readAnnotations,
  },
  {
    name: "get_sales_pipeline",
    title: "Get sales pipeline",
    description:
      "Read Trexiti pipeline totals and opportunities without combining JMD and USD.",
    inputSchema: getSalesPipelineInputSchema,
    outputSchema: getSalesPipelineOutputSchema,
    requiredScopes: ["trexiti:read"],
    annotations: readAnnotations,
  },
  {
    name: "get_followups_due",
    title: "Get follow-ups due",
    description: "Read overdue and upcoming internal sales follow-up work.",
    inputSchema: getFollowupsDueInputSchema,
    outputSchema: getFollowupsDueOutputSchema,
    requiredScopes: ["trexiti:read"],
    annotations: readAnnotations,
  },
  {
    name: "get_top_opportunities",
    title: "Get top opportunities",
    description: "Read the highest-priority Trexiti opportunities with source-record links.",
    inputSchema: getTopOpportunitiesInputSchema,
    outputSchema: getTopOpportunitiesOutputSchema,
    requiredScopes: ["trexiti:read"],
    annotations: readAnnotations,
  },
  {
    name: "get_active_clients",
    title: "Get active clients",
    description: "Read active clients, delivery health, projects, and outstanding balances.",
    inputSchema: getActiveClientsInputSchema,
    outputSchema: getActiveClientsOutputSchema,
    requiredScopes: ["trexiti:read"],
    annotations: readAnnotations,
  },
  {
    name: "get_projects_at_risk",
    title: "Get projects at risk",
    description: "Read projects flagged by Trexiti's deterministic delivery-risk policy.",
    inputSchema: getProjectsAtRiskInputSchema,
    outputSchema: getProjectsAtRiskOutputSchema,
    requiredScopes: ["trexiti:read"],
    annotations: readAnnotations,
  },
  {
    name: "get_outstanding_payments",
    title: "Get outstanding payments",
    description: "Read invoice balances and overdue receivables by explicit currency.",
    inputSchema: getOutstandingPaymentsInputSchema,
    outputSchema: getOutstandingPaymentsOutputSchema,
    requiredScopes: ["trexiti:read"],
    annotations: readAnnotations,
  },
  {
    name: "get_upcoming_deadlines",
    title: "Get upcoming deadlines",
    description: "Read upcoming project, milestone, task, and follow-up deadlines.",
    inputSchema: getUpcomingDeadlinesInputSchema,
    outputSchema: getUpcomingDeadlinesOutputSchema,
    requiredScopes: ["trexiti:read"],
    annotations: readAnnotations,
  },
  {
    name: "get_automation_status",
    title: "Get automation status",
    description: "Read durable COO automation run and failure status.",
    inputSchema: getAutomationStatusInputSchema,
    outputSchema: getAutomationStatusOutputSchema,
    requiredScopes: ["trexiti:read"],
    annotations: readAnnotations,
  },
  {
    name: "create_task",
    title: "Create internal task",
    description:
      "Idempotently create an allow-listed Trexiti internal task. This never contacts a client.",
    inputSchema: createTaskInputSchema,
    outputSchema: safeOperationOutputSchema,
    requiredScopes: ["trexiti:write_internal"],
    annotations: writeAnnotations,
  },
  {
    name: "add_internal_note",
    title: "Add internal opportunity note",
    description:
      "Idempotently add an internal note to an existing Trexiti opportunity.",
    inputSchema: addInternalNoteInputSchema,
    outputSchema: safeOperationOutputSchema,
    requiredScopes: ["trexiti:write_internal"],
    annotations: writeAnnotations,
  },
  {
    name: "update_prospect",
    title: "Update safe prospect fields",
    description:
      "Idempotently set a follow-up or internal research classification; pricing, closing, deletion, and external communication are unsupported.",
    inputSchema: updateProspectInputSchema,
    outputSchema: safeOperationOutputSchema,
    requiredScopes: ["trexiti:write_internal"],
    annotations: writeAnnotations,
  },
  {
    name: "run_operations",
    title: "Run guarded internal operations",
    description:
      "Start a durable, homogeneous batch of at most 25 allow-listed internal actions.",
    inputSchema: runOperationsInputSchema,
    outputSchema: runOperationsOutputSchema,
    requiredScopes: ["trexiti:write_internal"],
    annotations: writeAnnotations,
  },
  {
    name: "list_approval_requests",
    title: "List approval requests",
    description: "Read pending and historical Trexiti COO approval requests.",
    inputSchema: listApprovalRequestsInputSchema,
    outputSchema: listApprovalRequestsOutputSchema,
    requiredScopes: ["trexiti:approve"],
    annotations: readAnnotations,
  },
  {
    name: "decide_approval",
    title: "Decide approval request",
    description:
      "Approve or reject one request using optimistic concurrency. Approval does not bypass Trexiti's execution policy.",
    inputSchema: decideApprovalInputSchema,
    outputSchema: decideApprovalOutputSchema,
    requiredScopes: ["trexiti:approve"],
    annotations: approvalDecisionAnnotations,
  },
] as const satisfies readonly CooToolDefinition[];

function toMcpJsonSchema(
  schema: z.ZodType,
  pipeStrategy: "input" | "output",
) {
  const normalized = normalizeObjectSchema(schema);
  if (!normalized) {
    throw new Error("COO MCP tool schemas must have an object at the root.");
  }
  return toJsonSchemaCompat(normalized, {
    strictUnions: true,
    pipeStrategy,
    target: "draft-2020-12",
  });
}

/**
 * SDK 1.30 only models OAuth schemes in tool `_meta`. OpenAI clients also
 * consume the current top-level `securitySchemes` extension, so Trexiti owns
 * tools/list and emits both representations until the SDK supports it.
 */
export function getTrexitiMcpToolList() {
  return cooToolDefinitions.map((definition) => {
    const securitySchemes = getOAuthSecuritySchemes(definition.requiredScopes);
    return {
      name: definition.name,
      title: definition.title,
      description: definition.description,
      inputSchema: toMcpJsonSchema(definition.inputSchema, "input"),
      outputSchema: toMcpJsonSchema(definition.outputSchema, "output"),
      annotations: definition.annotations,
      securitySchemes,
      _meta: {
        securitySchemes,
        "openai/securitySchemes": securitySchemes,
      },
    };
  });
}

export function getCooToolDefinition(name: CooToolName) {
  const definition = cooToolDefinitions.find((tool) => tool.name === name);
  if (!definition) {
    throw new Error(`Unknown COO tool: ${name}`);
  }
  return definition;
}
