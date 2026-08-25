import "server-only";

import { start } from "workflow/api";

import type { SafeOperationInput } from "@/lib/coo/domain/types";
import type { AiUsageSummary } from "@/lib/coo/ai";
import { approvalExecutionWorkflow } from "@/workflows/coo/approval-execution-workflow";
import { dailyBriefWorkflow } from "@/workflows/coo/daily-brief-workflow";
import { operationsWorkflow } from "@/workflows/coo/operations-workflow";
import { prospectingWorkflow } from "@/workflows/coo/prospecting-workflow";
import { getJamaicaBusinessDate } from "@/workflows/coo/time";
import type { WorkflowTrigger } from "@/workflows/coo/types";

type ScheduledLaunchInput = {
  trigger?: WorkflowTrigger;
  requestedById?: string | null;
  scheduledFor?: Date;
  businessDate?: string;
  idempotencyKey?: string;
  correlationId?: string;
};

function createScheduledInput(
  type: "prospecting" | "daily-brief",
  input: ScheduledLaunchInput = {},
) {
  const scheduledFor = input.scheduledFor ?? new Date();
  const businessDate = input.businessDate ?? getJamaicaBusinessDate(scheduledFor);
  return {
    businessDate,
    correlationId: input.correlationId ?? crypto.randomUUID(),
    idempotencyKey: input.idempotencyKey ?? `${type}:${businessDate}`,
    requestedById: input.requestedById ?? null,
    scheduledFor: scheduledFor.toISOString(),
    trigger: input.trigger ?? "cron",
  } as const;
}

export async function startProspectingWorkflow(input?: ScheduledLaunchInput) {
  const workflowInput = createScheduledInput("prospecting", input);
  const run = await start(prospectingWorkflow, [workflowInput]);
  return { runId: run.runId, correlationId: workflowInput.correlationId };
}

export async function startDailyBriefWorkflow(input?: ScheduledLaunchInput) {
  const workflowInput = createScheduledInput("daily-brief", input);
  const run = await start(dailyBriefWorkflow, [workflowInput]);
  return { runId: run.runId, correlationId: workflowInput.correlationId };
}

export async function startOperationsWorkflow(input: {
  actorId: string;
  trigger: "admin" | "mcp";
  idempotencyKey: string;
  operations: Array<Omit<SafeOperationInput, "actorId" | "correlationId">>;
  correlationId?: string;
  model?: string | null;
  usage?: AiUsageSummary | null;
  estimatedCostUsd?: number | null;
}) {
  const workflowInput = {
    ...input,
    correlationId: input.correlationId ?? crypto.randomUUID(),
  };
  const run = await start(operationsWorkflow, [workflowInput]);
  return { runId: run.runId, correlationId: workflowInput.correlationId };
}

export async function startApprovalExecutionWorkflow(input: {
  approvalId: string;
  actorId: string;
  idempotencyKey: string;
  correlationId?: string;
}) {
  const workflowInput = {
    ...input,
    correlationId: input.correlationId ?? crypto.randomUUID(),
  };
  const run = await start(approvalExecutionWorkflow, [workflowInput]);
  return { runId: run.runId, correlationId: workflowInput.correlationId };
}
