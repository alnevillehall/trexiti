import { executeOperationsBatchStep } from "@/workflows/coo/operations";
import { workflowErrorMessage } from "@/workflows/coo/errors";
import {
  beginOperationsRunStep,
  finalizeRunStep,
  markStep,
} from "@/workflows/coo/shared";
import type {
  OperationsWorkflowInput,
  OperationsWorkflowResult,
} from "@/workflows/coo/types";

export async function operationsWorkflow(
  input: OperationsWorkflowInput,
): Promise<OperationsWorkflowResult> {
  "use workflow";

  console.info("[coo:operations] workflow started", {
    correlationId: input.correlationId,
    operationCount: input.operations.length,
  });
  let runId: string | null = null;
  try {
    const started = await beginOperationsRunStep({
      actorId: input.actorId,
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      operationCount: input.operations.length,
      model: input.model,
    });
    runId = started.runId;
    if (started.shouldSkip) {
      if (started.blockedByMode) {
        await finalizeRunStep({
          runId,
          status: "CANCELLED",
          error: started.skipReason,
          outputSummary: { processed: 0, executed: false },
          usage: input.usage,
          estimatedCostUsd: input.estimatedCostUsd,
        });
      }
      return {
        status: "SKIPPED",
        automationRunId: runId,
        correlationId: input.correlationId,
        results: [],
      };
    }
    const results = await executeOperationsBatchStep({
      automationRunId: runId,
      workflow: input,
    });
    await finalizeRunStep({
      runId,
      status: "SUCCEEDED",
      outputSummary: { processed: results.length, results },
      usage: input.usage,
      estimatedCostUsd: input.estimatedCostUsd,
    });
    return {
      status: "SUCCEEDED",
      automationRunId: runId,
      correlationId: input.correlationId,
      results,
    };
  } catch (error) {
    const message = workflowErrorMessage(error);
    console.error("[coo:operations] workflow failed", {
      correlationId: input.correlationId,
      runId,
      message,
    });
    if (runId) {
      await markStep({
        runId,
        key: "workflow_failure",
        label: "Operations workflow failure",
        status: "FAILED",
        error: message,
      });
      await finalizeRunStep({ runId, status: "FAILED", error: message });
    }
    return {
      status: "FAILED",
      automationRunId: runId,
      correlationId: input.correlationId,
      results: [],
    };
  }
}
