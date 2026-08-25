import { getStepMetadata } from "workflow";

import { upsertAutomationStep } from "@/lib/coo/data";
import { workflowErrorMessage } from "@/workflows/coo/errors";

export type TrackedAutomationStep = {
  runId: string;
  key: string;
  label: string;
  attempt: number;
  idempotencyKey: string;
};

export async function beginTrackedAutomationStep(input: {
  runId: string;
  key: string;
  label: string;
  input?: unknown;
}): Promise<TrackedAutomationStep> {
  const metadata = getStepMetadata();
  const tracked = {
    runId: input.runId,
    key: input.key,
    label: input.label,
    attempt: metadata.attempt,
    idempotencyKey: `${input.runId}:${input.key}:${metadata.attempt}`,
  };
  await upsertAutomationStep({
    ...tracked,
    status: "RUNNING",
    startedAt: metadata.stepStartedAt,
    input: input.input,
  });
  return tracked;
}

export async function completeTrackedAutomationStep(
  tracked: TrackedAutomationStep,
  output?: unknown,
  status: "SUCCEEDED" | "SKIPPED" | "FAILED" = "SUCCEEDED",
) {
  await upsertAutomationStep({
    ...tracked,
    status,
    completedAt: new Date(),
    output,
  });
}

export async function failTrackedAutomationStep(
  tracked: TrackedAutomationStep,
  error: unknown,
) {
  try {
    await upsertAutomationStep({
      ...tracked,
      status: "FAILED",
      completedAt: new Date(),
      error: workflowErrorMessage(error).slice(0, 4_000),
    });
  } catch (trackingError) {
    console.error("[coo:workflow] could not persist failed step attempt", {
      runId: tracked.runId,
      key: tracked.key,
      attempt: tracked.attempt,
      error: workflowErrorMessage(trackingError),
    });
  }
}
