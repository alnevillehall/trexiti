import { FatalError } from "workflow";

import {
  getDefaultAutomationOwner,
  persistVerifiedProspectBatch,
  recordInteractionSummary,
  type PersistVerifiedProspectBatchResult,
  type VerifiedProspectCandidate,
} from "@/lib/coo/data";
import {
  COO_LUNA_MODEL,
  COO_TERRA_MODEL,
  discoverProspects,
  scoreProspects,
  type AiUsageSummary,
  type ScoredProspect,
} from "@/lib/coo/ai";
import type { ScheduledCooWorkflowInput } from "@/workflows/coo/types";
import {
  beginTrackedAutomationStep,
  completeTrackedAutomationStep,
  failTrackedAutomationStep,
} from "@/workflows/coo/step-observability";

type ResearchBatch = {
  prospects: ScoredProspect[];
  discoverySummary: string;
  scoringSummary: string;
  models: string[];
  usage: AiUsageSummary;
  citations: Array<{ url: string; title: string }>;
};

type ProspectPersistenceResult = Omit<
  PersistVerifiedProspectBatchResult,
  "rejected"
> & {
  rejected: Array<{ candidateKey: string; reasons: string[] }>;
  status: "SUCCEEDED" | "PARTIAL" | "FAILED";
};

function boundedPositiveInteger(
  raw: string | undefined,
  fallback: number,
  maximum: number,
) {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(Math.floor(parsed), maximum)
    : Math.min(fallback, maximum);
}

export async function getProspectingRuntimeConfigStep() {
  "use step";

  return {
    runModel: `${COO_LUNA_MODEL},${COO_TERRA_MODEL}`,
    fastModel: COO_LUNA_MODEL,
    reasoningModel: COO_TERRA_MODEL,
    researchCandidateLimit: boundedPositiveInteger(
      process.env.COO_MAX_RESEARCH_CANDIDATES,
      75,
      75,
    ),
    acceptedProspectLimit: boundedPositiveInteger(
      process.env.COO_MAX_ACCEPTED_PROSPECTS,
      50,
      50,
    ),
  };
}

function combineUsage(...usage: AiUsageSummary[]): AiUsageSummary {
  const sum = (field: keyof AiUsageSummary) => {
    const values = usage.map((item) => item[field]).filter((value) => value != null);
    return values.length ? values.reduce<number>((total, value) => total + value, 0) : null;
  };
  return {
    inputTokens: sum("inputTokens"),
    outputTokens: sum("outputTokens"),
    totalTokens: sum("totalTokens"),
    costUsd: sum("costUsd"),
  };
}

export async function researchProspectsStep(
  automationRunId: string,
  targetCount: number,
): Promise<ResearchBatch> {
  "use step";

  const tracked = await beginTrackedAutomationStep({
    runId: automationRunId,
    key: "research",
    label: "Discover and score public prospects",
    input: { targetCount },
  });
  try {
  const configuredMaximum = boundedPositiveInteger(
    process.env.COO_MAX_RESEARCH_CANDIDATES,
    targetCount,
    75,
  );
  const boundedTarget = Math.min(targetCount, configuredMaximum, 75);
  console.info("[coo:prospecting] researching candidates", {
    targetCount: boundedTarget,
  });
  const discovery = await discoverProspects({ targetCount: boundedTarget });
  const scoring = await scoreProspects(discovery.output.prospects);
  const citations = new Map<string, { url: string; title: string }>();
  for (const citation of [...discovery.citations, ...scoring.citations]) {
    citations.set(citation.url, citation);
  }
  console.info("[coo:prospecting] research complete", {
    discovered: discovery.output.prospects.length,
    scored: scoring.output.prospects.length,
  });
  const batch = {
    prospects: scoring.output.prospects,
    discoverySummary: discovery.output.summary,
    scoringSummary: scoring.output.summary,
    models: [discovery.model, scoring.model],
    usage: combineUsage(discovery.usage, scoring.usage),
    citations: [...citations.values()],
  };
  await completeTrackedAutomationStep(tracked, {
    candidates: batch.prospects.length,
    usage: batch.usage,
  });
  return batch;
  } catch (error) {
    await failTrackedAutomationStep(tracked, error);
    throw error;
  }
}

function normalizeDomain(raw: string, website: string) {
  const candidate = raw.trim().toLowerCase().replace(/^www\./, "");
  try {
    return new URL(
      website.startsWith("http") ? website : `https://${website}`,
    ).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return candidate.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function inferOpportunityType(
  prospect: ScoredProspect,
): VerifiedProspectCandidate["opportunity"]["type"] {
  const text = `${prospect.observedBusinessNeed} ${prospect.reasonForContact}`.toLowerCase();
  if (text.includes("automation")) return "AUTOMATION";
  if (text.includes("crm")) return "CRM";
  if (text.includes("integration")) return "INTEGRATION";
  if (text.includes("portal")) return "CUSTOMER_PORTAL";
  if (text.includes("website") || text.includes("digital experience")) {
    return "WEBSITE_REDESIGN";
  }
  if (text.includes("operations platform")) return "OPERATIONS_PLATFORM";
  if (text.includes("system")) return "BUSINESS_SYSTEM";
  if (text.includes("software")) return "CUSTOM_SOFTWARE";
  return "OTHER";
}

function referencePart(domain: string) {
  return domain.replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 28);
}

export async function persistProspectResearchStep(input: {
  automationRunId: string;
  workflow: ScheduledCooWorkflowInput;
  batch: ResearchBatch;
  mode: "OFF" | "SHADOW" | "GUARDED";
  minimum: number;
  maximum: number;
}): Promise<ProspectPersistenceResult> {
  "use step";

  const tracked = await beginTrackedAutomationStep({
    runId: input.automationRunId,
    key: "persist",
    label: "Verify, deduplicate, and persist prospects",
    input: { candidateCount: input.batch.prospects.length, mode: input.mode },
  });
  try {
  console.info("[coo:prospecting] validating and persisting batch", {
    runId: input.automationRunId,
    candidateCount: input.batch.prospects.length,
  });
  const owner = input.workflow.requestedById
    ? { id: input.workflow.requestedById }
    : await getDefaultAutomationOwner();
  if (!owner) {
    throw new FatalError("No active OWNER or ADMIN can own automated prospects.");
  }

  const seenDomains = new Set<string>();
  const preRejected: Array<{ candidateKey: string; reasons: string[] }> = [];
  const followUpAt = new Date(
    new Date(input.workflow.scheduledFor).getTime() + 24 * 60 * 60 * 1_000,
  );
  const acceptedCandidates: VerifiedProspectCandidate[] = [];
  const configuredMaximum = boundedPositiveInteger(
    process.env.COO_MAX_ACCEPTED_PROSPECTS,
    input.maximum,
    50,
  );
  const maximum = Math.min(input.maximum, configuredMaximum, 50);

  for (const [index, prospect] of input.batch.prospects.entries()) {
    if (acceptedCandidates.length >= maximum) break;
    const domain = normalizeDomain(prospect.domain, prospect.website);
    const reasons: string[] = [];
    if (!domain || seenDomains.has(domain)) reasons.push("DUPLICATE_BATCH_DOMAIN");
    if (!prospect.citations.length) reasons.push("MISSING_CURRENT_PUBLIC_SOURCE");
    if (!prospect.observedBusinessNeed.trim()) reasons.push("MISSING_OBSERVED_NEED");
    const contact = prospect.contact;
    if (
      !contact?.name ||
      (!contact.email && !contact.phone && !contact.linkedInUrl)
    ) {
      reasons.push("MISSING_NAMED_REACHABLE_CONTACT");
    }
    if (reasons.length > 0 || !contact?.name) {
      preRejected.push({ candidateKey: domain || `candidate-${index + 1}`, reasons });
      continue;
    }

    seenDomains.add(domain);
    const type = inferOpportunityType(prospect);
    acceptedCandidates.push({
      candidateKey: domain,
      ownerId: owner.id,
      company: {
        name: prospect.companyName,
        domain,
        website: prospect.website,
        industry: prospect.industry,
        country: prospect.country,
        phone: contact.phone,
      },
      contact: {
        name: contact.name,
        title: contact.title,
        email: contact.email,
        phone: contact.phone,
        linkedInUrl: contact.linkedInUrl,
      },
      opportunity: {
        reference: `COO-${input.workflow.businessDate.replaceAll("-", "")}-${String(index + 1).padStart(2, "0")}-${referencePart(domain)}`,
        type,
        title: `${prospect.companyName} — ${type.replaceAll("_", " ").toLowerCase()}`,
        source: "COO_DAILY_PROSPECTING",
        identifiedProblem: prospect.observedBusinessNeed,
        opportunity: prospect.reasonForContact,
        probability: 10,
        nextFollowUp: followUpAt,
        reasonForContact: prospect.reasonForContact,
        personalizationAngle: prospect.personalizationAngle,
      },
      research: {
        sourceUrls: prospect.citations.map((citation) => citation.url),
        sourceObservedAt: new Date(
          prospect.citations[0]?.observedAt ?? input.workflow.scheduledFor,
        ),
        observedProblems: prospect.observedBusinessNeed,
        recentBusinessActivity: prospect.recentBusinessActivity,
        notes: prospect.scoreRationale,
        financialCapacityScore: prospect.financialCapacityScore,
        problemSeverityScore: prospect.problemSeverityScore,
        strategicFitScore: prospect.strategicFitScore,
        urgencyScore: prospect.urgencyScore,
        decisionMakerAccessScore: prospect.decisionMakerAccessScore,
      },
      followUpTask: {
        title: `Review and contact ${prospect.companyName}`,
        dueAt: followUpAt,
        priority:
          prospect.problemSeverityScore + prospect.urgencyScore >= 8
            ? "URGENT"
            : "HIGH",
        notes: `Source-backed reason: ${prospect.reasonForContact}`,
      },
    });
  }

  const persisted = await persistVerifiedProspectBatch({
    automationRunId: input.automationRunId,
    correlationId: input.workflow.correlationId,
    candidates: acceptedCandidates,
  });
  const shadowMode = input.mode === "SHADOW";
  const accepted = persisted.accepted;
  const rejected = [...preRejected, ...persisted.rejected];
  const status =
    accepted >= input.minimum
      ? "SUCCEEDED"
      : accepted > 0
        ? "PARTIAL"
        : "FAILED";

  await recordInteractionSummary({
    channel: "WORKFLOW",
    status: status === "SUCCEEDED" ? "SUCCEEDED" : status === "PARTIAL" ? "PARTIAL" : "FAILED",
    automationRunId: input.automationRunId,
    correlationId: `${input.workflow.correlationId}:prospect-research`,
    model: input.batch.models.at(-1) ?? COO_TERRA_MODEL,
    summary: shadowMode
      ? `${accepted} prospect candidates passed validation in shadow mode; no CRM records were written.`
      : `${persisted.accepted} verified prospects persisted; ${rejected.length} candidates rejected by evidence, contact, score, or duplicate checks.`,
    conclusions: {
      discoverySummary: input.batch.discoverySummary,
      scoringSummary: input.batch.scoringSummary,
    },
    citations: input.batch.citations,
    toolCalls: [{ name: "web_search", purpose: "public prospect evidence" }],
    outcomes: {
      accepted: persisted.accepted,
      verifiedAccepted: accepted,
      mode: input.mode,
      rejected,
      opportunityIds: persisted.opportunityIds,
      taskIds: persisted.taskIds,
    },
  });

  const result: ProspectPersistenceResult = {
    ...persisted,
    accepted,
    rejected,
    status,
  };
  await completeTrackedAutomationStep(tracked, {
    accepted,
    rejected: rejected.length,
    status,
  }, status === "FAILED" ? "FAILED" : "SUCCEEDED");
  return result;
  } catch (error) {
    await failTrackedAutomationStep(tracked, error);
    throw error;
  }
}
