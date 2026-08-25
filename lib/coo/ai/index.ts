export {
  discoverProspects,
  rankDailyPriorities,
  scoreProspects,
  type AiGeneration,
} from "@/lib/coo/ai/generate";
export { summarizeAiUsage, type AiUsageSummary } from "@/lib/coo/ai/usage";
export {
  COO_AI_SYSTEM_INSTRUCTIONS,
  COO_LUNA_MODEL,
  COO_TERRA_MODEL,
} from "@/lib/coo/ai/config";
export { askTrexiti, type AskTrexitiResult } from "@/lib/coo/ai/ask";
export {
  planAndStartOperations,
  planOperations,
  type OperationsPlan,
} from "@/lib/coo/ai/operations-planner";
export type {
  AiCitation,
  DailyBriefOutput,
  DiscoveredProspect,
  ScoredProspect,
} from "@/lib/coo/ai/schemas";
export {
  bindProspectCitationsToObservedSources,
  type ObservedWebSource,
} from "@/lib/coo/ai/evidence";
