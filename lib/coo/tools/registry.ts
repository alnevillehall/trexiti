import "server-only";

import {
  decideApproval,
  executeSafeOperation,
  getFollowUpsDue,
  getOperationsDashboard,
  getSalesPipelineSummary,
  getUpcomingDeadlines,
  listApprovalRequestPage,
  listAutomationRunPage,
  listClientPage,
  listOutstandingPayments,
  listProjectPage,
} from "@/lib/coo/data";
import type {
  ClientView,
  ProjectView,
} from "@/lib/coo/domain";
import {
  aggregatePipeline,
  sumByCurrency,
  summarizeFilteredPipeline,
} from "@/lib/coo/domain";
import { McpAuthenticationError, assertToolScopes } from "@/lib/coo/mcp/auth";
import { enforceCooRateLimit } from "@/lib/coo/rate-limit";
import {
  type CooToolContext,
  type ToolEnvelope,
} from "@/lib/coo/tools/contracts";
import {
  cooToolDefinitions,
  getCooToolDefinition,
  type CooToolName,
} from "@/lib/coo/tools/definitions";
import { envelopeData, envelopeError } from "@/lib/coo/tools/envelope";
import {
  collectFilteredCursorPage,
  decodeCooCursor,
  mapCursorPage,
  paginateStableRecords,
} from "@/lib/coo/tools/pagination";
import {
  startApprovalExecutionWorkflow,
  startOperationsWorkflow,
} from "@/lib/coo/tools/workflow-launchers";

function filterItems<T>(
  items: readonly T[],
  predicate: (item: T) => boolean,
) {
  return items.filter(predicate);
}

function namespace(name: CooToolName, filters: Record<string, unknown>) {
  const entries = Object.entries(filters)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `${name}:${JSON.stringify(Object.fromEntries(entries))}`;
}

const executors: Record<
  CooToolName,
  (input: Record<string, unknown>, context: CooToolContext) => Promise<unknown>
> = {
  async get_daily_summary() {
    const dashboard = await getOperationsDashboard();
    return {
      ...dashboard,
      metricSources: [
        {
          type: "AdminPipelineQueue",
          id: "open-pipeline",
          label: "Open sales pipeline",
          href: "/admin/pipeline",
        },
        {
          type: "AdminTaskQueue",
          id: "follow-ups-due",
          label: "Due follow-up tasks",
          href: "/admin/tasks?status=due&type=follow-up",
        },
        {
          type: "AdminFinanceQueue",
          id: "receivables",
          label: "Invoices and receivables",
          href: "/admin/finance",
        },
        {
          type: "CooApprovalQueue",
          id: "pending-approvals",
          label: "Pending founder approvals",
          href: "/admin/approvals?status=pending",
        },
        {
          type: "AdminProjectQueue",
          id: "delivery-risk",
          label: "Projects needing delivery attention",
          href: "/admin/projects?health=at-risk",
        },
        {
          type: "AdminClientQueue",
          id: "client-attention",
          label: "Clients needing attention",
          href: "/admin/clients?health=attention",
        },
      ],
    };
  },

  async get_sales_pipeline(input) {
    const summary = await getSalesPipelineSummary();
    const currency = input.currency as "JMD" | "USD" | undefined;
    const stage = input.stage as string | undefined;
    const limit = input.limit as number;
    const cursorNamespace = namespace("get_sales_pipeline", { currency, stage });
    const filtered = summarizeFilteredPipeline(summary.opportunities, {
      currency,
      stage,
    });
    const sortedOpportunities = filtered.opportunities.sort(
      (left, right) =>
        right.probability - left.probability ||
        right.estimatedValue - left.estimatedValue ||
        left.id.localeCompare(right.id),
    );
    const opportunities = paginateStableRecords({
      items: sortedOpportunities,
      limit,
      cursor: input.cursor,
      namespace: cursorNamespace,
    });
    const pageTotals = aggregatePipeline(opportunities.items);
    return {
      asOf: summary.asOf,
      pipeline: filtered.pipeline,
      weightedPipeline: filtered.weightedPipeline,
      totalOpportunities: filtered.totalOpportunities,
      pagePipeline: pageTotals.pipeline,
      pageWeightedPipeline: pageTotals.weightedPipeline,
      opportunities,
    };
  },

  async get_followups_due(input) {
    const through = input.through ? new Date(input.through as string) : new Date();
    const result = await getFollowUpsDue(through);
    const items = [...result.items].sort(
      (left, right) =>
        left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id),
    );
    return {
      ...result,
      asOf: new Date().toISOString(),
      through: through.toISOString(),
      items: paginateStableRecords({
        items,
        limit: input.limit as number,
        cursor: input.cursor,
        namespace: namespace("get_followups_due", {
          through: input.through ?? "now",
        }),
      }),
    };
  },

  async get_top_opportunities(input) {
    const summary = await getSalesPipelineSummary();
    const currency = input.currency as "JMD" | "USD" | undefined;
    return {
      asOf: summary.asOf,
      opportunities: filterItems(
        summary.opportunities,
        (opportunity) => !currency || opportunity.currency === currency,
      )
        .sort(
          (left, right) =>
            right.probability - left.probability ||
            right.estimatedValue - left.estimatedValue ||
            left.id.localeCompare(right.id),
        )
        .slice(0, input.limit as number),
    };
  },

  async get_active_clients(input) {
    const health = input.health as "HEALTHY" | "ATTENTION" | undefined;
    const cursorNamespace = namespace("get_active_clients", { health });
    const page = await collectFilteredCursorPage<ClientView>({
      cursor: input.cursor,
      namespace: cursorNamespace,
      limit: input.limit as number,
      predicate: (client) => !health || client.health === health,
      fetchPage: (options) => listClientPage(options),
    });
    return { asOf: new Date().toISOString(), ...page };
  },

  async get_projects_at_risk(input) {
    const includeAttention = input.includeAttention === true;
    const cursorNamespace = namespace("get_projects_at_risk", {
      includeAttention,
    });
    const page = await collectFilteredCursorPage<ProjectView>({
      cursor: input.cursor,
      namespace: cursorNamespace,
      limit: input.limit as number,
      predicate: (project) =>
        project.health === "AT_RISK" ||
        (includeAttention && project.health === "ATTENTION"),
      fetchPage: (options) => listProjectPage(options),
    });
    return { asOf: new Date().toISOString(), ...page };
  },

  async get_outstanding_payments(input) {
    const currency = input.currency as "JMD" | "USD" | undefined;
    const overdueOnly = input.overdueOnly === true;
    const cursorNamespace = namespace("get_outstanding_payments", {
      currency,
      overdueOnly,
    });
    const summary = await listOutstandingPayments({ currency, overdueOnly });
    const invoices = paginateStableRecords({
      items: summary.invoices,
      limit: input.limit as number,
      cursor: input.cursor,
      namespace: cursorNamespace,
    });
    const pageTotals = sumByCurrency(
      invoices.items.map((invoice) => ({
        currency: invoice.currency,
        amount: invoice.balance,
      })),
    );
    return {
      asOf: summary.asOf,
      totals: summary.totals,
      totalInvoices: summary.totalInvoices,
      pageTotals,
      invoices,
    };
  },

  async get_upcoming_deadlines(input) {
    const now = new Date();
    const through = input.through
      ? new Date(input.through as string)
      : new Date(now.getTime() + 14 * 86_400_000);
    const days = Math.max(
      1,
      Math.ceil((through.getTime() - now.getTime()) / 86_400_000),
    );
    const deadlines = await getUpcomingDeadlines({ now, days });
    const cursorNamespace = namespace("get_upcoming_deadlines", {
      through: input.through ?? "14-days",
    });
    const items = [
      ...deadlines.milestones.map((milestone) => ({
        id: `AdminMilestone:${milestone.id}`,
        recordId: milestone.id,
        type: "MILESTONE" as const,
        title: milestone.title,
        context: milestone.projectTitle,
        dueAt: milestone.dueAt,
        status: milestone.status,
        record: {
          type: "AdminMilestone",
          id: milestone.id,
          label: milestone.title,
          href: milestone.href,
        },
      })),
      ...deadlines.tasks.map((task) => ({
        id: `AdminTask:${task.id}`,
        recordId: task.id,
        type: "TASK" as const,
        title: task.title,
        context: null,
        dueAt: task.dueAt,
        status: task.status,
        record: {
          type: "AdminTask",
          id: task.id,
          label: task.title,
          href: task.href,
        },
      })),
    ].sort(
      (left, right) =>
        left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id),
    );
    return {
      asOf: deadlines.asOf,
      until: deadlines.until,
      deadlines: paginateStableRecords({
        items,
        limit: input.limit as number,
        cursor: input.cursor,
        namespace: cursorNamespace,
      }),
    };
  },

  async get_automation_status(input) {
    const type = input.type as
      | "PROSPECTING"
      | "DAILY_BRIEF"
      | "RUN_OPERATIONS"
      | "APPROVAL_EXECUTION"
      | undefined;
    const status = input.status as
      | "QUEUED"
      | "RUNNING"
      | "SUCCEEDED"
      | "PARTIAL"
      | "FAILED"
      | "CANCELLED"
      | undefined;
    const cursorNamespace = namespace("get_automation_status", { type, status });
    const page = await listAutomationRunPage({
      type,
      status,
      take: input.limit as number,
      cursor: decodeCooCursor(input.cursor, cursorNamespace),
    });
    return {
      asOf: new Date().toISOString(),
      ...mapCursorPage(page, cursorNamespace),
    };
  },

  async create_task(input, context) {
    return executeSafeOperation({
      action: "CREATE_TASK",
      actorId: context.actor.id,
      idempotencyKey: input.idempotencyKey as string,
      correlationId: context.correlationId,
      payload: {
        ownerId: context.actor.id,
        title: input.title,
        dueAt: input.dueAt,
        priority: input.priority,
        notes: input.notes,
        opportunityId: input.opportunityId,
        companyId: input.companyId,
        contactId: input.contactId,
        projectId: input.projectId,
        milestoneId: input.milestoneId,
        evidence: input.evidence,
      },
    });
  },

  async add_internal_note(input, context) {
    return executeSafeOperation({
      action: "ADD_INTERNAL_NOTE",
      actorId: context.actor.id,
      idempotencyKey: input.idempotencyKey as string,
      correlationId: context.correlationId,
      payload: {
        opportunityId: input.opportunityId,
        body: input.body,
        evidence: input.evidence,
      },
    });
  },

  async update_prospect(input, context) {
    const isFollowUp = input.operation === "set_follow_up";
    return executeSafeOperation({
      action: isFollowUp ? "SET_FOLLOW_UP" : "CLASSIFY_PROSPECT",
      actorId: context.actor.id,
      idempotencyKey: input.idempotencyKey as string,
      correlationId: context.correlationId,
      payload: isFollowUp
        ? {
            opportunityId: input.opportunityId,
            nextFollowUp: input.nextFollowUp,
            nextAction: input.nextAction,
            evidence: input.evidence,
          }
        : {
            opportunityId: input.opportunityId,
            classification: input.classification,
            notes: input.rationale,
            evidence: input.evidence,
          },
    });
  },

  async run_operations(input, context) {
    const operations = input.operations as Array<{
      action: "CREATE_TASK" | "ADD_INTERNAL_NOTE" | "SET_FOLLOW_UP" | "CLASSIFY_PROSPECT" | "SET_INTERNAL_RISK_FLAG";
      idempotencyKey: string;
      payload: Record<string, unknown>;
    }>;
    return startOperationsWorkflow({
      actorId: context.actor.id,
      trigger: context.origin === "mcp" ? "mcp" : "admin",
      idempotencyKey: input.idempotencyKey as string,
      correlationId: context.correlationId,
      operations,
    });
  },

  async list_approval_requests(input) {
    const status = input.status as
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | "EXPIRED"
      | "EXECUTING"
      | "EXECUTED"
      | "FAILED"
      | undefined;
    const cursorNamespace = namespace("list_approval_requests", { status });
    const page = await listApprovalRequestPage({
      status,
      take: input.limit as number,
      cursor: decodeCooCursor(input.cursor, cursorNamespace),
    });
    return {
      asOf: new Date().toISOString(),
      ...mapCursorPage(page, cursorNamespace),
    };
  },

  async decide_approval(input, context) {
    const approval = await decideApproval({
      approvalId: input.approvalId as string,
      expectedVersion: input.expectedVersion as number,
      actorId: context.actor.id,
      decision: input.decision as "APPROVE" | "REJECT",
      reason: input.reason as string,
      correlationId: context.correlationId,
      idempotencyKey: input.idempotencyKey as string,
    });
    const execution =
      input.decision === "APPROVE" && approval.status === "APPROVED"
        ? await startApprovalExecutionWorkflow({
            approvalId: approval.id,
            actorId: context.actor.id,
            idempotencyKey: `approval-execution:${approval.id}:${approval.version}`,
            correlationId: `${context.correlationId}:execute`,
          })
        : null;
    return { approval, execution };
  },
};

export async function executeCooTool(
  name: CooToolName,
  rawInput: unknown,
  context: CooToolContext,
): Promise<ToolEnvelope> {
  const definition = getCooToolDefinition(name);

  try {
    assertToolScopes(context, definition.requiredScopes);
    if (context.origin === "mcp") {
      enforceCooRateLimit({ bucket: "mcp_total", subject: context.actor.id });
      const bucket =
        name === "run_operations"
          ? "mcp_run_operations"
          : (definition.requiredScopes as readonly string[]).includes(
                "trexiti:approve",
              )
            ? "mcp_approve"
            : definition.annotations.readOnlyHint
              ? "mcp_read"
              : "mcp_write";
      enforceCooRateLimit({ bucket, subject: context.actor.id });
    }
    const input = definition.inputSchema.parse(rawInput) as Record<string, unknown>;
    const result = await executors[name](input, context);
    return envelopeData(result, context.correlationId);
  } catch (error) {
    if (error instanceof McpAuthenticationError) {
      throw error;
    }
    console.error(`[coo:tool] ${name} failed`, {
      correlationId: context.correlationId,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return envelopeError(error, context.correlationId);
  }
}

export { cooToolDefinitions };
