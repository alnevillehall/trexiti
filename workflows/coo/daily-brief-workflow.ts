import {
  fallbackBriefStep,
  getDailyBriefRuntimeConfigStep,
  loadBriefSnapshotStep,
  persistBriefStep,
  rankBriefStep,
} from "@/workflows/coo/daily-brief";
import { workflowErrorMessage } from "@/workflows/coo/errors";
import {
  beginScheduledRunStep,
  finalizeRunStep,
  markStep,
} from "@/workflows/coo/shared";
import type {
  DailyBriefWorkflowResult,
  ScheduledCooWorkflowInput,
} from "@/workflows/coo/types";

export async function dailyBriefWorkflow(
  input: ScheduledCooWorkflowInput,
): Promise<DailyBriefWorkflowResult> {
  "use workflow";

  console.info("[coo:brief] workflow started", {
    correlationId: input.correlationId,
    businessDate: input.businessDate,
  });
  let runId: string | null = null;
  try {
    const runtimeConfig = await getDailyBriefRuntimeConfigStep();
    const started = await beginScheduledRunStep(
      "DAILY_BRIEF",
      input,
      runtimeConfig.reasoningModel,
    );
    runId = started.runId;
    if (started.shouldSkip) {
      if (started.blockedByMode) {
        await finalizeRunStep({
          runId,
          status: "CANCELLED",
          error: started.skipReason,
          outputSummary: { briefId: null, executed: false },
        });
      }
      return {
        status: "SKIPPED",
        automationRunId: runId,
        briefId: null,
        correlationId: input.correlationId,
        degradedReason: started.skipReason,
      };
    }
    if (!started.policy.id) {
      throw new Error("The active policy does not have a persisted identifier.");
    }

    const snapshot = await loadBriefSnapshotStep(runId, input.businessDate);

    let fallbackReason: string | null = null;
    let ranked:
      | Awaited<ReturnType<typeof rankBriefStep>>
      | Awaited<ReturnType<typeof fallbackBriefStep>>;
    try {
      ranked = await rankBriefStep({
        automationRunId: runId,
        businessDate: input.businessDate,
        snapshot,
        maxPriorities: started.policy.maxFounderPriorities,
      });
    } catch (error) {
      fallbackReason = `AI ranking was unavailable: ${workflowErrorMessage(error)}`;
      ranked = await fallbackBriefStep({
        automationRunId: runId,
        businessDate: input.businessDate,
        snapshot,
        maxPriorities: started.policy.maxFounderPriorities,
        reason: workflowErrorMessage(error),
      });
    }

    const persisted = await persistBriefStep({
      automationRunId: runId,
      workflow: input,
      policyId: started.policy.id,
      snapshot,
      ranked,
      fallbackReason,
    });
    const finalStatus = persisted.status === "DEGRADED" ? "PARTIAL" : "SUCCEEDED";
    await finalizeRunStep({
      runId,
      status: finalStatus,
      outputSummary: persisted,
      error: persisted.degradedReason,
      usage: ranked.usage,
      estimatedCostUsd: ranked.usage.costUsd,
    });
    return {
      status: finalStatus,
      automationRunId: runId,
      briefId: persisted.briefId,
      correlationId: input.correlationId,
      degradedReason: persisted.degradedReason,
    };
  } catch (error) {
    const message = workflowErrorMessage(error);
    console.error("[coo:brief] workflow failed", {
      correlationId: input.correlationId,
      runId,
      message,
    });
    if (runId) {
      await markStep({
        runId,
        key: "workflow_failure",
        label: "Daily brief workflow failure",
        status: "FAILED",
        error: message,
      });
      await finalizeRunStep({ runId, status: "FAILED", error: message });
    }
    return {
      status: "FAILED",
      automationRunId: runId,
      briefId: null,
      correlationId: input.correlationId,
      degradedReason: message,
    };
  }
}
