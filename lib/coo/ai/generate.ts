import "server-only";

import { generateText, gateway, Output, stepCountIs } from "ai";

import {
  COO_AI_SYSTEM_INSTRUCTIONS,
  COO_LUNA_MODEL,
  COO_TERRA_MODEL,
} from "@/lib/coo/ai/config";
import { bindProspectCitationsToObservedSources } from "@/lib/coo/ai/evidence";
import {
  dailyBriefOutputSchema,
  prospectDiscoveryOutputSchema,
  prospectScoringOutputSchema,
  type DailyBriefOutput,
  type DiscoveredProspect,
  type ScoredProspect,
} from "@/lib/coo/ai/schemas";
import { summarizeAiUsage, type AiUsageSummary } from "@/lib/coo/ai/usage";

export type AiGeneration<T> = {
  output: T;
  model: string;
  usage: AiUsageSummary;
  citations: Array<{ url: string; title: string }>;
};

function summarizeSources(
  sources: ReadonlyArray<{ sourceType: string; url?: string; title?: string }>,
) {
  const seen = new Set<string>();
  return sources.flatMap((source) => {
    if (source.sourceType !== "url" || !source.url || seen.has(source.url)) {
      return [];
    }

    seen.add(source.url);
    return [{ url: source.url, title: source.title ?? source.url }];
  });
}

export async function discoverProspects(input?: {
  targetCount?: number;
  market?: string;
  serviceProfile?: string;
}): Promise<AiGeneration<{ summary: string; prospects: DiscoveredProspect[] }>> {
  const targetCount = Math.min(Math.max(input?.targetCount ?? 60, 1), 75);
  const observedAt = new Date().toISOString();
  const market = input?.market ?? "Jamaica and the wider Caribbean";
  const serviceProfile =
    input?.serviceProfile ??
    "business systems, automation, custom software, and digital experience work";

  const result = await generateText({
    model: COO_LUNA_MODEL,
    instructions: COO_AI_SYSTEM_INSTRUCTIONS,
    tools: {
      web_search: gateway.tools.exaSearch({
        type: "auto",
        numResults: Math.min(100, Math.max(targetCount, 25)),
        category: "company",
        contents: {
          highlights: true,
          maxAgeHours: 168,
        },
      }),
    },
    stopWhen: stepCountIs(4),
    output: Output.object({
      name: "TrexitiProspectDiscovery",
      description: "A source-backed preliminary prospect research batch.",
      schema: prospectDiscoveryOutputSchema,
    }),
    prompt: `
Research up to ${targetCount} companies in ${market} that show a specific, current
need aligned with Trexiti's ${serviceProfile}. Accuracy is more important than
quota. Each candidate must have a canonical company website, a normalized domain,
at least one current public source, an observed need grounded in those sources,
and at least one reachable method (email, phone, LinkedIn profile, or a verified
company contact page). Do not guess contact details. Use ${observedAt} as the
observedAt timestamp for evidence gathered in this run. Return fewer companies
when the evidence is insufficient.
    `.trim(),
  });
  const observedSources = summarizeSources(result.sources);

  return {
    output: {
      summary: result.output.summary,
      prospects: bindProspectCitationsToObservedSources({
        prospects: result.output.prospects,
        observedSources,
        observedAt,
      }),
    },
    model: result.response.modelId || COO_LUNA_MODEL,
    usage: summarizeAiUsage(result.usage, result.steps),
    citations: observedSources,
  };
}

export async function scoreProspects(
  prospects: readonly DiscoveredProspect[],
): Promise<AiGeneration<{ summary: string; prospects: ScoredProspect[] }>> {
  if (prospects.length === 0) {
    return {
      output: { summary: "No source-qualified prospects were available to score.", prospects: [] },
      model: COO_TERRA_MODEL,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0 },
      citations: [],
    };
  }

  const result = await generateText({
    model: COO_TERRA_MODEL,
    instructions: COO_AI_SYSTEM_INSTRUCTIONS,
    output: Output.object({
      name: "TrexitiProspectScoring",
      description: "Evidence-bound, five-dimension Trexiti prospect scores.",
      schema: prospectScoringOutputSchema,
    }),
    prompt: `
Score every supplied prospect from 1 to 5 on financial capacity, problem
severity, strategic fit with Trexiti, urgency, and decision-maker access. Preserve
all source facts and citation URLs exactly. Do not improve a score based on
unstated assumptions. A weak or missing signal receives 1. Return the same number
of prospects in the same order.

Prospects:
${JSON.stringify(prospects)}
    `.trim(),
  });
  if (result.output.prospects.length !== prospects.length) {
    throw new Error(
      "Prospect scoring returned a different number of records than supplied.",
    );
  }

  return {
    output: {
      summary: result.output.summary,
      prospects: result.output.prospects.map((scored, index) => ({
        ...prospects[index]!,
        financialCapacityScore: scored.financialCapacityScore,
        problemSeverityScore: scored.problemSeverityScore,
        strategicFitScore: scored.strategicFitScore,
        urgencyScore: scored.urgencyScore,
        decisionMakerAccessScore: scored.decisionMakerAccessScore,
        scoreRationale: scored.scoreRationale,
      })),
    },
    model: result.response.modelId || COO_TERRA_MODEL,
    usage: summarizeAiUsage(result.usage, result.steps),
    citations: summarizeSources(result.sources),
  };
}

export async function rankDailyPriorities(input: {
  businessDate: string;
  deterministicFindings: unknown;
  maxPriorities?: number;
  degradedReason?: string | null;
}): Promise<AiGeneration<DailyBriefOutput>> {
  const maxPriorities = Math.min(Math.max(input.maxPriorities ?? 5, 1), 5);
  const result = await generateText({
    model: COO_TERRA_MODEL,
    instructions: COO_AI_SYSTEM_INSTRUCTIONS,
    output: Output.object({
      name: "TrexitiDailyBrief",
      description: "A concise founder brief ranked from deterministic findings.",
      schema: dailyBriefOutputSchema,
    }),
    prompt: `
Rank no more than ${maxPriorities} founder priorities for ${input.businessDate}.
Use only the deterministic findings below. Preserve each selected finding's
sourceId exactly so the application can link back to the source record. Put cash,
customer, delivery, and near-term deadline impact first. Do not combine JMD and
USD. If data is degraded, make that limitation explicit without treating unknown
values as zero.

Degraded reason: ${input.degradedReason ?? "none"}

Deterministic findings:
${JSON.stringify(input.deterministicFindings)}
    `.trim(),
  });

  return {
    output: {
      ...result.output,
      priorities: result.output.priorities.slice(0, maxPriorities),
    },
    model: result.response.modelId || COO_TERRA_MODEL,
    usage: summarizeAiUsage(result.usage, result.steps),
    citations: summarizeSources(result.sources),
  };
}
