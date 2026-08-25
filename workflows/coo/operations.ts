import { FatalError } from "workflow";

import {
  executeSafeOperation,
  recordInteractionSummary,
} from "@/lib/coo/data";
import type { SafeOperationResult } from "@/lib/coo/domain";
import type { OperationsWorkflowInput } from "@/workflows/coo/types";
import {
  beginTrackedAutomationStep,
  completeTrackedAutomationStep,
  failTrackedAutomationStep,
} from "@/workflows/coo/step-observability";

export async function executeOperationsBatchStep(input: {
  automationRunId: string;
  workflow: OperationsWorkflowInput;
}): Promise<SafeOperationResult[]> {
  "use step";

  const tracked = await beginTrackedAutomationStep({
    runId: input.automationRunId,
    key: "execute",
    label: "Execute allow-listed internal operations",
    input: { operationCount: input.workflow.operations.length },
  });
  try {
  const actionTypes = new Set(
    input.workflow.operations.map((operation) => operation.action),
  );
  if (actionTypes.size !== 1) {
    throw new FatalError("Safe batches must contain one homogeneous action type.");
  }
  if (input.workflow.operations.length > 25) {
    throw new FatalError("Safe batches cannot exceed 25 operations.");
  }

  console.info("[coo:operations] executing guarded batch", {
    runId: input.automationRunId,
    action: input.workflow.operations[0]?.action,
    count: input.workflow.operations.length,
  });
  const results: SafeOperationResult[] = [];
  for (const operation of input.workflow.operations) {
    const payload =
      operation.action === "CREATE_TASK"
        ? { ...operation.payload, ownerId: input.workflow.actorId }
        : operation.payload;
    results.push(
      await executeSafeOperation({
        ...operation,
        payload,
        actorId: input.workflow.actorId,
        correlationId: input.workflow.correlationId,
        automationRunId: input.automationRunId,
      }),
    );
  }
  await recordInteractionSummary({
    channel: input.workflow.trigger === "mcp" ? "MCP" : "ADMIN",
    status: "SUCCEEDED",
    actorId: input.workflow.actorId,
    automationRunId: input.automationRunId,
    correlationId: `${input.workflow.correlationId}:operations`,
    summary: `${results.length} allow-listed ${input.workflow.operations[0]?.action ?? "internal"} operations processed.`,
    conclusions: null,
    citations: null,
    toolCalls: [{ name: "run_operations", action: input.workflow.operations[0]?.action }],
    outcomes: results,
  });
  await completeTrackedAutomationStep(tracked, { processed: results.length });
  return results;
  } catch (error) {
    await failTrackedAutomationStep(tracked, error);
    throw error;
  }
}
