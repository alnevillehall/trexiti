import {
  getOperationsDashboard,
  listAutomationRunPage,
  listClientPage,
  listInvoicePage,
  listProjectPage,
  persistDailyBrief,
  recordInteractionSummary,
} from "@/lib/coo/data";
import {
  COO_TERRA_MODEL,
  rankDailyPriorities,
  type AiUsageSummary,
  type DailyBriefOutput,
} from "@/lib/coo/ai";
import {
  summarizeFilteredOutstandingBalances,
  type Currency,
  type OperationsDashboard,
  type RecordLink,
} from "@/lib/coo/domain";
import type { ScheduledCooWorkflowInput } from "@/workflows/coo/types";
import {
  beginTrackedAutomationStep,
  completeTrackedAutomationStep,
  failTrackedAutomationStep,
} from "@/workflows/coo/step-observability";

type DailyFinding = {
  sourceId: string;
  kind: "DECISION" | "ACTION" | "ALERT" | "COMPLETED";
  severity: "INFO" | "ATTENTION" | "HIGH" | "CRITICAL";
  title: string;
  rationale: string;
  nextAction: string | null;
  record: RecordLink;
  currency: Currency | null;
  amount: number | null;
};

type BriefSnapshot = {
  dashboard: OperationsDashboard;
  findings: DailyFinding[];
  degradedReason: string | null;
};

export async function getDailyBriefRuntimeConfigStep() {
  "use step";

  return {
    reasoningModel: COO_TERRA_MODEL,
  };
}

function sourceId(record: RecordLink) {
  return `${record.type}:${record.id}`;
}

function buildFindings(dashboard: OperationsDashboard): DailyFinding[] {
  const findings: DailyFinding[] = [];

  for (const item of dashboard.queues.founderDecisions) {
    findings.push({
      sourceId: sourceId(item.record),
      kind: "DECISION",
      severity: item.severity,
      title: item.title,
      rationale: item.detail ?? "A sensitive Trexiti action requires founder review.",
      nextAction: "Review and decide the approval request.",
      record: item.record,
      currency: null,
      amount: null,
    });
  }
  for (const project of dashboard.projects) {
    if (project.health === "ON_TRACK") continue;
    findings.push({
      sourceId: sourceId(project.record),
      kind: "ALERT",
      severity: project.health === "AT_RISK" ? "CRITICAL" : "HIGH",
      title: `${project.title} needs delivery attention`,
      rationale: project.riskReasons.join(", ").replaceAll("_", " ").toLowerCase(),
      nextAction: project.activeBlocker
        ? `Resolve blocker: ${project.activeBlocker}`
        : "Review the next unfinished milestone and owner commitment.",
      record: project.record,
      currency: null,
      amount: null,
    });
  }
  for (const client of dashboard.clients) {
    if (client.health !== "ATTENTION") continue;
    findings.push({
      sourceId: sourceId(client.record),
      kind: "ALERT",
      severity: "HIGH",
      title: `${client.name} needs attention`,
      rationale: client.healthReasons.join(", ").replaceAll("_", " ").toLowerCase(),
      nextAction: "Review the linked client and resolve the most urgent exception.",
      record: client.record,
      currency: null,
      amount: null,
    });
  }
  for (const currency of ["JMD", "USD"] as const) {
    const overdue = dashboard.metrics.overdue[currency];
    if (overdue <= 0) continue;
    const record: RecordLink = {
      type: "AdminFinanceQueue",
      id: `overdue:${currency}`,
      label: `${currency} overdue invoices`,
      href: `/admin/finance?currency=${currency}&status=overdue`,
    };
    findings.push({
      sourceId: sourceId(record),
      kind: "ALERT",
      severity: "CRITICAL",
      title: `${currency} ${overdue.toLocaleString("en-US")} is overdue`,
      rationale: "Recorded invoice balances are past their due dates.",
      nextAction: "Review the overdue invoice records and decide the collection follow-up.",
      record,
      currency,
      amount: overdue,
    });
  }
  if (dashboard.metrics.followUpsDue > 0) {
    const record: RecordLink = {
      type: "AdminTaskQueue",
      id: "follow-ups-due",
      label: "Due follow-up tasks",
      href: "/admin/tasks?status=due&type=follow-up",
    };
    findings.push({
      sourceId: sourceId(record),
      kind: "ACTION",
      severity: dashboard.metrics.followUpsDue >= 5 ? "HIGH" : "ATTENTION",
      title: `${dashboard.metrics.followUpsDue} follow-ups are due`,
      rationale: "Open internal tasks have reached or passed their due times.",
      nextAction: "Work the highest-priority follow-up queue.",
      record,
      currency: null,
      amount: null,
    });
  }
  for (const item of dashboard.queues.aiCanExecute) {
    findings.push({
      sourceId: sourceId(item.record),
      kind: "ACTION",
      severity: item.severity,
      title: item.title,
      rationale: item.detail ?? "This allow-listed internal task is ready to run.",
      nextAction: "Run the linked internal operation when appropriate.",
      record: item.record,
      currency: null,
      amount: null,
    });
  }
  for (const run of dashboard.automationRuns) {
    if (run.status !== "FAILED" && run.status !== "PARTIAL") continue;
    findings.push({
      sourceId: sourceId(run.record),
      kind: "ALERT",
      severity: run.status === "FAILED" ? "HIGH" : "ATTENTION",
      title: `${run.type.replaceAll("_", " ")} ${run.status.toLowerCase()}`,
      rationale: run.error ?? "The durable automation did not complete cleanly.",
      nextAction: "Inspect the automation steps before retrying.",
      record: run.record,
      currency: null,
      amount: null,
    });
  }

  return findings;
}

async function collectEveryPage<T extends { id: string }>(
  fetchPage: (options: {
    take: number;
    cursor?: string;
  }) => Promise<{ items: T[]; hasMore: boolean; nextCursor: string | null }>,
) {
  const items: T[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  while (true) {
    const page = await fetchPage({ take: 100, cursor });
    items.push(...page.items);
    if (!page.hasMore || !page.nextCursor) return items;
    if (seenCursors.has(page.nextCursor)) {
      throw new Error("A Trexiti data cursor repeated while building the brief.");
    }
    seenCursors.add(page.nextCursor);
    cursor = page.nextCursor;
  }
}

export async function loadBriefSnapshotStep(
  automationRunId: string,
  businessDate: string,
): Promise<BriefSnapshot> {
  "use step";

  const tracked = await beginTrackedAutomationStep({
    runId: automationRunId,
    key: "snapshot",
    label: "Build deterministic operations snapshot",
    input: { businessDate },
  });
  try {
  console.info("[coo:brief] loading deterministic operations snapshot", {
    businessDate,
  });
  const [rawDashboard, prospectRuns, projects, clients, invoices] = await Promise.all([
    getOperationsDashboard(),
    collectEveryPage((options) =>
      listAutomationRunPage({ ...options, type: "PROSPECTING" }),
    ),
    collectEveryPage((options) => listProjectPage(options)),
    collectEveryPage((options) => listClientPage(options)),
    collectEveryPage((options) => listInvoicePage(options)),
  ]);
  const sameDayProspect = prospectRuns.find(
    (run) => (run.scheduledFor ?? run.createdAt).slice(0, 10) === businessDate,
  );
  const invoiceTotals = {
    outstanding: summarizeFilteredOutstandingBalances(invoices).totals,
    overdue: summarizeFilteredOutstandingBalances(invoices, {
      overdueOnly: true,
    }).totals,
  };
  const dashboard: OperationsDashboard = {
    ...rawDashboard,
    projects,
    clients,
    metrics: {
      ...rawDashboard.metrics,
      activeClients: clients.length,
      atRiskProjects: projects.filter((project) => project.health === "AT_RISK")
        .length,
      outstanding: invoiceTotals.outstanding,
      overdue: invoiceTotals.overdue,
    },
  };
  const reasons: string[] = [];
  const findings = buildFindings(dashboard);
  const prospectRecord: RecordLink = sameDayProspect?.record ?? {
    type: "CooAutomationQueue",
    id: `prospecting:${businessDate}`,
    label: `Prospecting automation for ${businessDate}`,
    href: `/admin/automations?type=PROSPECTING&businessDate=${businessDate}`,
  };
  if (!sameDayProspect) {
    reasons.push("The scheduled prospect research run is missing.");
  } else if (sameDayProspect.status === "RUNNING" || sameDayProspect.status === "QUEUED") {
    reasons.push("The scheduled prospect research run is not complete.");
  } else if (sameDayProspect.status === "FAILED") {
    reasons.push("The scheduled prospect research run failed.");
  } else if (sameDayProspect.status === "PARTIAL") {
    reasons.push("Prospect research completed below its verified quality target.");
  } else if (sameDayProspect.status === "CANCELLED") {
    reasons.push("The scheduled prospect research run was cancelled.");
  }
  if (
    !sameDayProspect ||
    ["QUEUED", "RUNNING", "FAILED", "PARTIAL", "CANCELLED"].includes(
      sameDayProspect.status,
    )
  ) {
    findings.push({
      sourceId: sourceId(prospectRecord),
      kind: "ALERT",
      severity: sameDayProspect?.status === "FAILED" ? "HIGH" : "ATTENTION",
      title: "Prospect research data is degraded",
      rationale: reasons.at(-1) ?? "The scheduled prospect run is unavailable.",
      nextAction: "Inspect the linked prospecting automation before relying on its results.",
      record: prospectRecord,
      currency: null,
      amount: null,
    });
  }
  const result = {
    dashboard,
    findings,
    degradedReason: reasons.length ? reasons.join(" ") : null,
  };
  await completeTrackedAutomationStep(tracked, {
    findingCount: findings.length,
    degradedReason: result.degradedReason,
  });
  return result;
  } catch (error) {
    await failTrackedAutomationStep(tracked, error);
    throw error;
  }
}

export async function rankBriefStep(input: {
  automationRunId: string;
  businessDate: string;
  snapshot: BriefSnapshot;
  maxPriorities: number;
}) {
  "use step";

  const tracked = await beginTrackedAutomationStep({
    runId: input.automationRunId,
    key: "rank",
    label: "Rank founder priority exceptions",
    input: { businessDate: input.businessDate, findingCount: input.snapshot.findings.length },
  });
  try {
  console.info("[coo:brief] ranking founder priorities", {
    findingCount: input.snapshot.findings.length,
  });
  const result = await rankDailyPriorities({
    businessDate: input.businessDate,
    deterministicFindings: input.snapshot.findings,
    maxPriorities: input.maxPriorities,
    degradedReason: input.snapshot.degradedReason,
  });
  await completeTrackedAutomationStep(tracked, {
    priorityCount: result.output.priorities.length,
    usage: result.usage,
  });
  return result;
  } catch (error) {
    await failTrackedAutomationStep(tracked, error);
    throw error;
  }
}

const severityWeight = { CRITICAL: 4, HIGH: 3, ATTENTION: 2, INFO: 1 } as const;

export async function fallbackBriefStep(input: {
  automationRunId: string;
  businessDate: string;
  snapshot: BriefSnapshot;
  maxPriorities: number;
  reason: string;
}): Promise<{
  output: DailyBriefOutput;
  model: null;
  usage: AiUsageSummary;
  citations: Array<{ url: string; title: string }>;
}> {
  "use step";

  const tracked = await beginTrackedAutomationStep({
    runId: input.automationRunId,
    key: "fallback_rank",
    label: "Build deterministic fallback ranking",
    input: { businessDate: input.businessDate, reason: input.reason },
  });
  try {
  console.warn("[coo:brief] using deterministic fallback", {
    reason: input.reason,
  });
  const priorities = [...input.snapshot.findings]
    .sort(
      (left, right) =>
        severityWeight[right.severity] - severityWeight[left.severity],
    )
    .slice(0, input.maxPriorities)
    .map(({ sourceId: id, kind, severity, title, rationale, nextAction }) => ({
      sourceId: id,
      kind,
      severity,
      title,
      rationale,
      nextAction,
    }));
  const result = {
    output: {
      headline: priorities.length
        ? `Trexiti has ${priorities.length} founder priorities`
        : "Trexiti has no verified priority exceptions",
      summary: `A deterministic brief was generated because AI ranking was unavailable: ${input.reason}`,
      priorities,
    },
    model: null,
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0 },
    citations: [] as Array<{ url: string; title: string }>,
  };
  await completeTrackedAutomationStep(tracked, {
    priorityCount: priorities.length,
    fallback: true,
  });
  return result;
  } catch (error) {
    await failTrackedAutomationStep(tracked, error);
    throw error;
  }
}

export async function persistBriefStep(input: {
  automationRunId: string;
  workflow: ScheduledCooWorkflowInput;
  policyId: string;
  snapshot: BriefSnapshot;
  ranked: Awaited<ReturnType<typeof rankBriefStep>> | Awaited<ReturnType<typeof fallbackBriefStep>>;
  fallbackReason: string | null;
}) {
  "use step";

  const tracked = await beginTrackedAutomationStep({
    runId: input.automationRunId,
    key: "persist",
    label: "Persist founder brief",
    input: { businessDate: input.workflow.businessDate },
  });
  try {
  const bySourceId = new Map(
    input.snapshot.findings.map((finding) => [finding.sourceId, finding]),
  );
  const selected = new Set<string>();
  const priorities = input.ranked.output.priorities.flatMap((priority) => {
    const finding = bySourceId.get(priority.sourceId);
    if (!finding || selected.has(priority.sourceId)) return [];
    selected.add(priority.sourceId);
    return [
      {
        rank: selected.size,
        kind: priority.kind,
        severity: priority.severity,
        title: priority.title,
        rationale: priority.rationale,
        nextAction: priority.nextAction,
        recordType: finding.record.type,
        recordId: finding.record.id,
        recordUrl: finding.record.href,
        currency: finding.currency,
        amount: finding.amount,
        evidence: { sourceId: finding.sourceId },
      },
    ];
  });
  const reasons = [input.snapshot.degradedReason, input.fallbackReason].filter(
    (value): value is string => Boolean(value),
  );
  const degradedReason = reasons.length ? reasons.join(" ") : null;
  const status = degradedReason ? "DEGRADED" : "READY";
  const brief = await persistDailyBrief({
    businessDate: new Date(`${input.workflow.businessDate}T00:00:00.000Z`),
    status,
    headline: input.ranked.output.headline,
    summary: input.ranked.output.summary,
    asOf: new Date(),
    dataAsOf: new Date(input.snapshot.dashboard.asOf),
    degradedReason,
    model: input.ranked.model,
    policyId: input.policyId,
    automationRunId: input.automationRunId,
    evidence: {
      dashboardAsOf: input.snapshot.dashboard.asOf,
      sourceIds: priorities.map((priority) => priority.evidence.sourceId),
    },
    priorities,
  });
  await recordInteractionSummary({
    channel: "WORKFLOW",
    status: degradedReason ? "PARTIAL" : "SUCCEEDED",
    automationRunId: input.automationRunId,
    correlationId: `${input.workflow.correlationId}:daily-brief`,
    model: input.ranked.model,
    summary: input.ranked.output.summary,
    conclusions: priorities.map((priority) => ({
      rank: priority.rank,
      title: priority.title,
      sourceId: priority.evidence.sourceId,
    })),
    citations: input.ranked.citations,
    toolCalls: [],
    outcomes: { briefId: brief.id, status, degradedReason },
  });
  const result = { briefId: brief.id, status, degradedReason, priorities: priorities.length };
  await completeTrackedAutomationStep(tracked, result);
  return result;
  } catch (error) {
    await failTrackedAutomationStep(tracked, error);
    throw error;
  }
}
