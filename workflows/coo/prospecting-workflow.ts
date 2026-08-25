import {
  getProspectingRuntimeConfigStep,
  persistProspectResearchStep,
  researchProspectsStep,
} from "@/workflows/coo/prospecting";
import { workflowErrorMessage } from "@/workflows/coo/errors";
import {
  beginScheduledRunStep,
  finalizeRunStep,
  markStep,
} from "@/workflows/coo/shared";
import type {
  ProspectingWorkflowResult,
  ScheduledCooWorkflowInput,
} from "@/workflows/coo/types";

export async function prospectingWorkflow(
  input: ScheduledCooWorkflowInput,
): Promise<ProspectingWorkflowResult> {
  "use workflow";

  console.info("[coo:prospecting] workflow started", {
    correlationId: input.correlationId,
    businessDate: input.businessDate,
  });
  let runId: string | null = null;
  try {
    const runtimeConfig = await getProspectingRuntimeConfigStep();
    const started = await beginScheduledRunStep(
      "PROSPECTING",
      input,
      runtimeConfig.runModel,
    );
    runId = started.runId;
    if (started.shouldSkip) {
      if (started.blockedByMode) {
        await finalizeRunStep({
          runId,
          status: "CANCELLED",
          error: started.skipReason,
          outputSummary: { accepted: 0, rejected: 0, executed: false },
        });
      }
      return {
        status: "SKIPPED",
        automationRunId: started.runId,
        acceptedCount: 0,
        rejectedCount: 0,
        correlationId: input.correlationId,
        message: started.skipReason ?? "The idempotent run was skipped.",
      };
    }

    const requestedPool = Math.min(
      started.policy.prospectDailyMaximum + 25,
      runtimeConfig.researchCandidateLimit,
    );
    const batch = await researchProspectsStep(runId, requestedPool);
    const persisted = await persistProspectResearchStep({
      automationRunId: runId,
      workflow: input,
      batch,
      mode: started.mode,
      minimum: started.policy.prospectDailyMinimum,
      maximum: Math.min(
        started.policy.prospectDailyMaximum,
        runtimeConfig.acceptedProspectLimit,
      ),
    });
    const finalStatus = persisted.status;
    await finalizeRunStep({
      runId,
      status: finalStatus,
      outputSummary: {
        accepted: persisted.accepted,
        rejected: persisted.rejected.length,
        qualityTarget: started.policy.prospectDailyMinimum,
      },
      error:
        finalStatus === "FAILED"
          ? "No candidates passed Trexiti's prospect acceptance policy."
          : finalStatus === "PARTIAL"
            ? "Quality threshold preserved; fewer than the target minimum were accepted."
            : null,
      usage: batch.usage,
      estimatedCostUsd: batch.usage.costUsd,
    });
    return {
      status: finalStatus,
      automationRunId: runId,
      acceptedCount: persisted.accepted,
      rejectedCount: persisted.rejected.length,
      correlationId: input.correlationId,
      message:
        finalStatus === "SUCCEEDED"
          ? "Verified prospect research completed."
          : "Prospect research completed without filling the quota with weak records.",
    };
  } catch (error) {
    const message = workflowErrorMessage(error);
    console.error("[coo:prospecting] workflow failed", {
      correlationId: input.correlationId,
      runId,
      message,
    });
    if (runId) {
      await markStep({
        runId,
        key: "workflow_failure",
        label: "Prospecting workflow failure",
        status: "FAILED",
        error: message,
      });
      await finalizeRunStep({ runId, status: "FAILED", error: message });
    }
    return {
      status: "FAILED",
      automationRunId: runId,
      acceptedCount: 0,
      rejectedCount: 0,
      correlationId: input.correlationId,
      message,
    };
  }
}
