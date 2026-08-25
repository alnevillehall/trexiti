import {
  executeApprovedAction,
  failApprovalExecution,
  getApprovalExecutionContext,
  recordInteractionSummary,
} from "@/lib/coo/data";
import type { ApprovalExecutionWorkflowInput } from "@/workflows/coo/types";
import {
  beginTrackedAutomationStep,
  completeTrackedAutomationStep,
  failTrackedAutomationStep,
} from "@/workflows/coo/step-observability";

export async function getApprovalExecutionContextStep(approvalId: string) {
  "use step";

  const approval = await getApprovalExecutionContext(approvalId);
  return approval
    ? { id: approval.id, action: approval.action, status: approval.status }
    : null;
}

export async function markApprovalExecutionFailedStep(input: {
  approvalId: string;
  actorId: string;
  correlationId: string;
  error: string;
}) {
  "use step";

  return failApprovalExecution({
    ...input,
    error: input.error.slice(0, 4_000),
  });
}

export async function executeApprovedActionStep(
  input: ApprovalExecutionWorkflowInput & { automationRunId: string },
) {
  "use step";

  const tracked = await beginTrackedAutomationStep({
    runId: input.automationRunId,
    key: "execute",
    label: "Execute founder-approved action",
    input: { approvalId: input.approvalId },
  });
  try {
  console.info("[coo:approval] executing approved action", {
    approvalId: input.approvalId,
    runId: input.automationRunId,
  });
  const approval = await executeApprovedAction({
    approvalId: input.approvalId,
    actorId: input.actorId,
    correlationId: input.correlationId,
  });
  await recordInteractionSummary({
    channel: "WORKFLOW",
    status: "SUCCEEDED",
    actorId: input.actorId,
    automationRunId: input.automationRunId,
    correlationId: `${input.correlationId}:approval-execution`,
    summary: `Approved action ${approval.action} executed.`,
    toolCalls: [{ name: "execute_approved_action", approvalId: approval.id }],
    outcomes: { approvalId: approval.id, status: approval.status },
  });
  const result = { approvalId: approval.id, status: approval.status, action: approval.action };
  await completeTrackedAutomationStep(tracked, result);
  return result;
  } catch (error) {
    await failTrackedAutomationStep(tracked, error);
    throw error;
  }
}
