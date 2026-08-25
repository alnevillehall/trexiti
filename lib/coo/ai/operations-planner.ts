import "server-only";

import { generateText, Output, stepCountIs } from "ai";
import { z } from "zod";

import {
  COO_AI_SYSTEM_INSTRUCTIONS,
  COO_TERRA_MODEL,
} from "@/lib/coo/ai/config";
import { summarizeAiUsage, type AiUsageSummary } from "@/lib/coo/ai/usage";
import {
  collectReadToolObservations,
  createReadTools,
} from "@/lib/coo/ai/ask";
import { recordInteractionSummary } from "@/lib/coo/data";
import type { SafeOperationInput } from "@/lib/coo/domain";
import { enforceCooRateLimit } from "@/lib/coo/rate-limit";
import type { CooToolContext } from "@/lib/coo/tools/contracts";
import {
  addInternalNoteOperationPayloadSchema,
  classifyProspectOperationPayloadSchema,
  createTaskOperationPayloadSchema,
  setFollowUpOperationPayloadSchema,
  setInternalRiskFlagOperationPayloadSchema,
} from "@/lib/coo/tools/schemas";
import { startOperationsWorkflow } from "@/lib/coo/tools/workflow-launchers";

const plannedSafeOperationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("CREATE_TASK"),
      payload: createTaskOperationPayloadSchema,
      rationale: z.string().min(1).max(1_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("ADD_INTERNAL_NOTE"),
      payload: addInternalNoteOperationPayloadSchema,
      rationale: z.string().min(1).max(1_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("SET_FOLLOW_UP"),
      payload: setFollowUpOperationPayloadSchema,
      rationale: z.string().min(1).max(1_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("CLASSIFY_PROSPECT"),
      payload: classifyProspectOperationPayloadSchema,
      rationale: z.string().min(1).max(1_000),
    })
    .strict(),
  z
    .object({
      action: z.literal("SET_INTERNAL_RISK_FLAG"),
      payload: setInternalRiskFlagOperationPayloadSchema,
      rationale: z.string().min(1).max(1_000),
    })
    .strict(),
]);

const operationPlanSchema = z
  .object({
    rationale: z.string().min(1).max(2_000),
    safeOperations: z.array(plannedSafeOperationSchema).max(25),
    blockedSensitiveActions: z.array(z.string().min(1).max(1_000)).max(25),
    unsupportedActions: z.array(z.string().min(1).max(1_000)).max(25),
  })
  .strict();

export type OperationsPlan = {
  rationale: string;
  operations: Array<Omit<SafeOperationInput, "actorId" | "correlationId">>;
  blockedSensitiveActions: string[];
  unsupportedActions: string[];
  model: string;
  usage: AiUsageSummary;
};

export async function planOperations(input: {
  instruction: string;
  context: CooToolContext;
  idempotencyKeyPrefix: string;
}): Promise<OperationsPlan> {
  const instruction = z.string().trim().min(3).max(2_000).parse(input.instruction);
  const idempotencyKeyPrefix = z
    .string()
    .trim()
    .min(8)
    .max(160)
    .parse(input.idempotencyKeyPrefix);
  if (input.context.actor.role !== "OWNER") {
    throw new Error(
      "FORBIDDEN: Operations planning is restricted to the founder account.",
    );
  }
  enforceCooRateLimit({
    bucket: "operations_planning",
    subject: input.context.actor.id,
  });
  const result = await generateText({
    model: COO_TERRA_MODEL,
    instructions: `${COO_AI_SYSTEM_INSTRUCTIONS}\nPlan only; do not claim to execute anything. Use Trexiti read tools to resolve every referenced record ID. Safe operations are limited to CREATE_TASK, ADD_INTERNAL_NOTE, SET_FOLLOW_UP, CLASSIFY_PROSPECT, and SET_INTERNAL_RISK_FLAG. A safe batch must be homogeneous. Put pricing, proposals, invoice/payment changes, closing, deletion, policy changes, external communications, contracts, and refunds in blockedSensitiveActions. Put unavailable integrations or actions in unsupportedActions.`,
    tools: createReadTools(input.context),
    stopWhen: stepCountIs(8),
    output: Output.object({
      name: "TrexitiOperationsPlan",
      description: "A guarded, allow-listed internal operations plan.",
      schema: operationPlanSchema,
    }),
    prompt: instruction,
  });
  const actionTypes = new Set(
    result.output.safeOperations.map((operation) => operation.action),
  );
  if (actionTypes.size > 1) {
    throw new Error(
      "The planned safe batch was not homogeneous; no operations were launched.",
    );
  }
  const observed = collectReadToolObservations(result);
  const usage = summarizeAiUsage(result.usage, result.steps);
  await recordInteractionSummary({
    channel: input.context.origin === "mcp" ? "MCP" : "ADMIN",
    status:
      result.output.blockedSensitiveActions.length ||
      result.output.unsupportedActions.length
        ? "PARTIAL"
        : "SUCCEEDED",
    actorId: input.context.actor.id,
    correlationId: input.context.correlationId,
    model: result.response.modelId || COO_TERRA_MODEL,
    summary: `Operations planning produced ${result.output.safeOperations.length} allow-listed action${result.output.safeOperations.length === 1 ? "" : "s"}; ${result.output.blockedSensitiveActions.length} sensitive and ${result.output.unsupportedActions.length} unsupported action${result.output.unsupportedActions.length === 1 ? "" : "s"} remained unexecuted.`,
    conclusions: {
      rationale: result.output.rationale,
      blockedSensitiveActions: result.output.blockedSensitiveActions,
      unsupportedActions: result.output.unsupportedActions,
    },
    citations: [...observed.links.values()],
    toolCalls: observed.toolCalls.map((name) => ({ name })),
    outcomes: {
      safeActionTypes: [...actionTypes],
      safeActionCount: result.output.safeOperations.length,
      usage,
    },
  });
  return {
    rationale: result.output.rationale,
    operations: result.output.safeOperations.map((operation, index) => ({
      action: operation.action,
      payload: operation.payload,
      idempotencyKey: `${idempotencyKeyPrefix}:${index + 1}`,
    })),
    blockedSensitiveActions: result.output.blockedSensitiveActions,
    unsupportedActions: result.output.unsupportedActions,
    model: result.response.modelId || COO_TERRA_MODEL,
    usage,
  };
}

export async function planAndStartOperations(input: {
  instruction: string;
  context: CooToolContext;
  idempotencyKey: string;
}) {
  const plan = await planOperations({
    instruction: input.instruction,
    context: input.context,
    idempotencyKeyPrefix: input.idempotencyKey,
  });
  const launch = plan.operations.length
    ? await startOperationsWorkflow({
        actorId: input.context.actor.id,
        trigger: input.context.origin === "mcp" ? "mcp" : "admin",
        idempotencyKey: input.idempotencyKey,
        correlationId: input.context.correlationId,
        operations: plan.operations,
        model: plan.model,
        usage: plan.usage,
        estimatedCostUsd: plan.usage.costUsd,
      })
    : null;
  return { plan, launch };
}
