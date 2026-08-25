import { FatalError } from "workflow";

import {
  beginAutomationRun,
  ensureActivePolicy,
  finalizeAutomationRun,
  getActivePolicy,
  upsertAutomationStep,
} from "@/lib/coo/data";
import type { PolicyView } from "@/lib/coo/domain";
import type { ScheduledCooWorkflowInput } from "@/workflows/coo/types";
import { isApprovalExecutionModeAllowed } from "@/workflows/coo/approval-policy";

type RunType =
  | "PROSPECTING"
  | "DAILY_BRIEF"
  | "RUN_OPERATIONS"
  | "APPROVAL_EXECUTION";

export type StartedRun = {
  runId: string;
  policy: PolicyView;
  mode: "OFF" | "SHADOW" | "GUARDED";
  shouldSkip: boolean;
  blockedByMode: boolean;
  skipReason: string | null;
};

export async function beginScheduledRunStep(
  type: Extract<RunType, "PROSPECTING" | "DAILY_BRIEF">,
  input: ScheduledCooWorkflowInput,
  model: string,
): Promise<StartedRun> {
  "use step";

  console.info("[coo:workflow] beginning scheduled run", {
    type,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
  });
  await ensureActivePolicy({ createdById: input.requestedById });
  const policy = await getActivePolicy();
  if (!policy.id) {
    throw new FatalError(
      "No persisted active COO policy exists. Activate the default policy before running automation.",
    );
  }

  const run = await beginAutomationRun({
    type,
    mode: policy.automationMode,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    policyId: policy.id,
    requestedById: input.requestedById,
    scheduledFor: new Date(input.scheduledFor),
    model,
    input: {
      businessDate: input.businessDate,
      trigger: input.trigger,
    },
  });

  const terminal = ["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"].includes(
    run.status,
  );
  const belongsToAnotherInvocation = run.correlationId !== input.correlationId;
  return {
    runId: run.id,
    policy,
    mode: run.mode,
    shouldSkip:
      run.mode === "OFF" || terminal || belongsToAnotherInvocation,
    blockedByMode: run.mode === "OFF",
    skipReason:
      run.mode === "OFF"
        ? "Automation is disabled by the active COO policy."
        : terminal
          ? `The idempotent run is already ${run.status.toLowerCase()}.`
          : belongsToAnotherInvocation
            ? "An idempotent run is already active for this business date."
            : null,
  };
}

export async function beginOperationsRunStep(input: {
  actorId: string;
  correlationId: string;
  idempotencyKey: string;
  operationCount: number;
  model?: string | null;
}): Promise<StartedRun> {
  "use step";

  console.info("[coo:workflow] beginning operations run", {
    correlationId: input.correlationId,
    operationCount: input.operationCount,
  });
  await ensureActivePolicy({ createdById: input.actorId });
  const policy = await getActivePolicy();
  if (!policy.id) {
    throw new FatalError("No persisted active COO policy exists.");
  }
  if (input.operationCount > policy.safeBatchLimit) {
    throw new FatalError(
      `The batch exceeds the active safe limit of ${policy.safeBatchLimit}.`,
    );
  }

  const run = await beginAutomationRun({
    type: "RUN_OPERATIONS",
    mode: policy.automationMode,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    policyId: policy.id,
    requestedById: input.actorId,
    model: input.model ?? null,
    input: { operationCount: input.operationCount },
  });
  const terminal = ["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"].includes(
    run.status,
  );
  const belongsToAnotherInvocation = run.correlationId !== input.correlationId;
  return {
    runId: run.id,
    policy,
    mode: run.mode,
    shouldSkip:
      run.mode === "OFF" || terminal || belongsToAnotherInvocation,
    blockedByMode: run.mode === "OFF",
    skipReason:
      run.mode === "OFF"
        ? "Automation is disabled by the active COO policy."
        : terminal
          ? `The idempotent run is already ${run.status.toLowerCase()}.`
          : belongsToAnotherInvocation
            ? "An idempotent operations run is already active."
            : null,
  };
}

export async function beginApprovalExecutionRunStep(input: {
  approvalId: string;
  action: string;
  actorId: string;
  correlationId: string;
  idempotencyKey: string;
}): Promise<StartedRun> {
  "use step";

  await ensureActivePolicy({ createdById: input.actorId });
  const policy = await getActivePolicy();
  if (!policy.id) throw new FatalError("No persisted active COO policy exists.");
  const run = await beginAutomationRun({
    type: "APPROVAL_EXECUTION",
    mode: policy.automationMode,
    correlationId: input.correlationId,
    idempotencyKey: input.idempotencyKey,
    policyId: policy.id,
    requestedById: input.actorId,
    input: { approvalId: input.approvalId, action: input.action },
  });
  const terminal = ["SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"].includes(
    run.status,
  );
  const belongsToAnotherInvocation = run.correlationId !== input.correlationId;
  const modeAllowed = isApprovalExecutionModeAllowed(
    input.action,
    run.mode,
  );
  return {
    runId: run.id,
    policy,
    mode: run.mode,
    shouldSkip: !modeAllowed || terminal || belongsToAnotherInvocation,
    blockedByMode: !modeAllowed,
    skipReason:
      !modeAllowed
        ? `Approval execution for ${input.action} is disabled while automation mode is ${run.mode.toLowerCase()}.`
        : terminal
        ? `The idempotent run is already ${run.status.toLowerCase()}.`
        : belongsToAnotherInvocation
          ? "An idempotent approval execution is already active."
          : null,
  };
}

export async function markStep(input: {
  runId: string;
  key: string;
  label: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "SKIPPED" | "FAILED";
  output?: unknown;
  error?: string | null;
}) {
  "use step";

  console.info("[coo:workflow] step state", {
    runId: input.runId,
    step: input.key,
    status: input.status,
  });
  return upsertAutomationStep({
    ...input,
    attempt: 1,
    startedAt: input.status === "RUNNING" ? new Date() : undefined,
    completedAt:
      input.status === "SUCCEEDED" ||
      input.status === "SKIPPED" ||
      input.status === "FAILED"
        ? new Date()
        : undefined,
    idempotencyKey: `${input.runId}:${input.key}:1`,
  });
}

export async function finalizeRunStep(input: {
  runId: string;
  status: "SUCCEEDED" | "PARTIAL" | "FAILED" | "CANCELLED";
  outputSummary?: unknown;
  error?: string | null;
  usage?: unknown;
  estimatedCostUsd?: number | null;
}) {
  "use step";

  console.info("[coo:workflow] finalizing run", {
    runId: input.runId,
    status: input.status,
  });
  return finalizeAutomationRun({
    ...input,
    completedAt: new Date(),
  });
}
