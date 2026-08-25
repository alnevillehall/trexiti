import "server-only";

import {
  generateText,
  Output,
  stepCountIs,
  tool,
  zodSchema,
  type ToolSet,
} from "ai";
import { z } from "zod";

import { recordInteractionSummary } from "@/lib/coo/data";
import { getSiteUrl } from "@/lib/coo/mcp/oauth";
import { enforceCooRateLimit } from "@/lib/coo/rate-limit";
import {
  COO_AI_SYSTEM_INSTRUCTIONS,
  COO_TERRA_MODEL,
} from "@/lib/coo/ai/config";
import { summarizeAiUsage } from "@/lib/coo/ai/usage";
import {
  toolEnvelopeSchema,
  type CooToolContext,
  type RecordLink,
  type ToolEnvelope,
} from "@/lib/coo/tools/contracts";
import { cooToolDefinitions, executeCooTool } from "@/lib/coo/tools/registry";

const askOutputSchema = z.object({
  answer: z.string().min(1).max(8_000),
  recordHrefs: z.array(z.string()).max(50),
  dataLimitations: z.array(z.string().max(500)).max(10),
});

export type AskTrexitiResult = {
  answer: string;
  asOf: string;
  correlationId: string;
  model: string;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    costUsd: number | null;
  };
  links: RecordLink[];
  dataLimitations: string[];
  toolCalls: string[];
};

export function createReadTools(context: CooToolContext) {
  const entries = cooToolDefinitions
    .filter(
      (definition) =>
        definition.annotations.readOnlyHint &&
        definition.requiredScopes.every((scope) => context.scopes.has(scope)),
    )
    .map((definition) => [
      definition.name,
      tool<Record<string, unknown>, ToolEnvelope, never>({
        description: definition.description,
        inputSchema: zodSchema(
          definition.inputSchema as z.ZodType<Record<string, unknown>>,
        ),
        outputSchema: zodSchema(toolEnvelopeSchema),
        execute: async (toolInput) =>
          executeCooTool(definition.name, toolInput, context),
      }),
    ]);
  return Object.fromEntries(entries) as ToolSet;
}

export function collectReadToolObservations(result: {
  steps: ReadonlyArray<{
    toolResults: ReadonlyArray<{ toolName: string; output: unknown }>;
  }>;
}) {
  const links = new Map<string, RecordLink>();
  const toolCalls = new Set<string>();
  for (const step of result.steps) {
    for (const toolResult of step.toolResults) {
      toolCalls.add(toolResult.toolName);
      const parsed = toolEnvelopeSchema.safeParse(toolResult.output);
      if (!parsed.success) continue;
      for (const link of parsed.data.links) {
        links.set(link.href, link);
      }
    }
  }
  return { links, toolCalls: [...toolCalls] };
}

function canonicalRecordHref(href: string) {
  try {
    const url = new URL(href, getSiteUrl());
    return `${url.pathname}${url.search}`;
  } catch {
    return href;
  }
}

export async function askTrexiti(input: {
  question: string;
  context: CooToolContext;
}): Promise<AskTrexitiResult> {
  const question = z.string().trim().min(1).max(2_000).parse(input.question);
  if (input.context.actor.role !== "OWNER") {
    throw new Error("FORBIDDEN: Ask Trexiti is restricted to the founder account.");
  }
  enforceCooRateLimit({
    bucket: "ask_trexiti",
    subject: input.context.actor.id,
  });
  const result = await generateText({
    model: COO_TERRA_MODEL,
    instructions: `${COO_AI_SYSTEM_INSTRUCTIONS}\nUse the supplied read-only Trexiti tools before answering. Cite linked Trexiti records in the answer. Do not claim a write was performed.`,
    tools: createReadTools(input.context),
    stopWhen: stepCountIs(8),
    output: Output.object({
      name: "AskTrexitiAnswer",
      description: "A source-linked answer grounded in live Trexiti records.",
      schema: askOutputSchema,
    }),
    prompt: question,
  });
  const observed = collectReadToolObservations(result);
  const requestedHrefs = new Set(
    result.output.recordHrefs.map(canonicalRecordHref),
  );
  const observedLinks = [...observed.links.values()];
  const requestedLinks = observedLinks.filter(
    (link) =>
      requestedHrefs.size === 0 ||
      requestedHrefs.has(canonicalRecordHref(link.href)),
  );
  const links = (
    requestedHrefs.size > 0 && requestedLinks.length === 0
      ? observedLinks
      : requestedLinks
  ).slice(0, 50);
  const usage = summarizeAiUsage(result.usage, result.steps);
  const response: AskTrexitiResult = {
    answer: result.output.answer,
    asOf: new Date().toISOString(),
    correlationId: input.context.correlationId,
    model: result.response.modelId || COO_TERRA_MODEL,
    usage,
    links,
    dataLimitations: result.output.dataLimitations,
    toolCalls: observed.toolCalls,
  };
  await recordInteractionSummary({
    channel: input.context.origin === "mcp" ? "MCP" : "ADMIN",
    status: result.output.dataLimitations.length ? "PARTIAL" : "SUCCEEDED",
    actorId: input.context.actor.id,
    correlationId: input.context.correlationId,
    model: response.model,
    summary: `Ask Trexiti answered with ${links.length} linked record${links.length === 1 ? "" : "s"} after using ${observed.toolCalls.length} read tool${observed.toolCalls.length === 1 ? "" : "s"}.`,
    conclusions: { dataLimitations: response.dataLimitations },
    citations: links,
    toolCalls: observed.toolCalls.map((name) => ({ name })),
    outcomes: { linkCount: links.length, usage },
  });
  return response;
}
