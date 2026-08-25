import {
  executeApprovedActionStep,
  getApprovalExecutionContextStep,
  markApprovalExecutionFailedStep,
} from "@/workflows/coo/approval-execution";
import { workflowErrorMessage } from "@/workflows/coo/errors";
import {
  beginApprovalExecutionRunStep,
  finalizeRunStep,
  markStep,
} from "@/workflows/coo/shared";
import type {
  ApprovalExecutionWorkflowInput,
  ApprovalExecutionWorkflowResult,
} from "@/workflows/coo/types";

export async function approvalExecutionWorkflow(
  input: ApprovalExecutionWorkflowInput,
): Promise<ApprovalExecutionWorkflowResult> {
  "use workflow";

  let runId: string | null = null;
  try {
    const approval = await getApprovalExecutionContextStep(input.approvalId);
    if (!approval || approval.status !== "APPROVED") {
      return {
        status: "SKIPPED",
        automationRunId: null,
        approvalId: input.approvalId,
        correlationId: input.correlationId,
      };
    }
    const started = await beginApprovalExecutionRunStep({
      ...input,
      action: approval.action,
    });
    runId = started.runId;
    if (started.shouldSkip) {
      if (started.blockedByMode) {
        await finalizeRunStep({
          runId,
          status: "CANCELLED",
          error: started.skipReason,
          outputSummary: { approvalId: input.approvalId, executed: false },
        });
      }
      return {
        status: "SKIPPED",
        automationRunId: runId,
        approvalId: input.approvalId,
        correlationId: input.correlationId,
      };
    }
    const result = await executeApprovedActionStep({
      ...input,
      automationRunId: runId,
    });
    await finalizeRunStep({
      runId,
      status: "SUCCEEDED",
      outputSummary: result,
    });
    return {
      status: "SUCCEEDED",
      automationRunId: runId,
      approvalId: input.approvalId,
      correlationId: input.correlationId,
    };
  } catch (error) {
    const message = workflowErrorMessage(error);
    console.error("[coo:approval] execution workflow failed", {
      approvalId: input.approvalId,
      runId,
      message,
    });
    if (runId) {
      try {
        await markStep({
          runId,
          key: "workflow_failure",
          label: "Approval execution failure",
          status: "FAILED",
          error: message,
        });
        await finalizeRunStep({ runId, status: "FAILED", error: message });
      } catch (runPersistenceError) {
        console.error("[coo:approval] could not persist run failure", {
          approvalId: input.approvalId,
          correlationId: input.correlationId,
          message: workflowErrorMessage(runPersistenceError),
        });
      }
    }
    try {
      await markApprovalExecutionFailedStep({
        approvalId: input.approvalId,
        actorId: input.actorId,
        correlationId: input.correlationId,
        error: message,
      });
    } catch (failurePersistenceError) {
      console.error("[coo:approval] could not persist approval failure", {
        approvalId: input.approvalId,
        correlationId: input.correlationId,
        message: workflowErrorMessage(failurePersistenceError),
      });
    }
    return {
      status: "FAILED",
      automationRunId: runId,
      approvalId: input.approvalId,
      correlationId: input.correlationId,
    };
  }
}
