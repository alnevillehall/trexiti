import type { SafeOperationInput, SafeOperationResult } from "@/lib/coo/domain/types";
import type { AiUsageSummary } from "@/lib/coo/ai/usage";

export type WorkflowTrigger = "cron" | "admin" | "mcp";

export type ScheduledCooWorkflowInput = {
  businessDate: string;
  correlationId: string;
  idempotencyKey: string;
  requestedById: string | null;
  scheduledFor: string;
  trigger: WorkflowTrigger;
};

export type ProspectingWorkflowResult = {
  status: "SUCCEEDED" | "PARTIAL" | "FAILED" | "SKIPPED";
  automationRunId: string | null;
  acceptedCount: number;
  rejectedCount: number;
  correlationId: string;
  message: string;
};

export type DailyBriefWorkflowResult = {
  status: "SUCCEEDED" | "PARTIAL" | "FAILED" | "SKIPPED";
  automationRunId: string | null;
  briefId: string | null;
  correlationId: string;
  degradedReason: string | null;
};

export type OperationsWorkflowInput = {
  actorId: string;
  correlationId: string;
  idempotencyKey: string;
  operations: Array<Omit<SafeOperationInput, "actorId" | "correlationId">>;
  trigger: Extract<WorkflowTrigger, "admin" | "mcp">;
  model?: string | null;
  usage?: AiUsageSummary | null;
  estimatedCostUsd?: number | null;
};

export type OperationsWorkflowResult = {
  status: "SUCCEEDED" | "PARTIAL" | "FAILED" | "SKIPPED";
  automationRunId: string | null;
  correlationId: string;
  results: SafeOperationResult[];
};

export type ApprovalExecutionWorkflowInput = {
  approvalId: string;
  actorId: string;
  correlationId: string;
  idempotencyKey: string;
};

export type ApprovalExecutionWorkflowResult = {
  status: "SUCCEEDED" | "FAILED" | "SKIPPED";
  automationRunId: string | null;
  approvalId: string;
  correlationId: string;
};
