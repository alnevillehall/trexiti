import {
  AdminProjectStatus,
  CooApprovalStatus,
  CooAutomationRunType,
  CooAutomationStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  DEFAULT_POLICY,
  aggregateInvoiceBalances,
  aggregateExpectedCash,
  aggregatePipeline,
  assessClientHealth,
  assessProjectRisk,
  calculateInvoiceBalance,
  emptyCurrencyTotals,
  evaluateFreshness,
  isInvoiceOverdue,
  jamaicaMonthStart,
  sumByCurrency,
  summarizeFilteredOutstandingBalances,
  type ApprovalView,
  type AutomationRunView,
  type BriefView,
  type ClientView,
  type CursorPage,
  type Currency,
  type FinanceOverview,
  type InvoiceView,
  type OperationsDashboard,
  type PolicyView,
  type PriorityView,
  type ProjectView,
  type QueueItemView,
} from "../domain";
import type { ApprovalExecutionContext } from "./contracts";
import {
  getEffectiveAutomationMode,
  getRuntimeAutomationMode,
} from "./runtime";

const OPEN_OPPORTUNITY_STAGES = [
  "RESEARCHING",
  "CONTACTED",
  "REPLIED",
  "QUALIFIED",
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
] as const;

function iso(value: Date | null | undefined): string | null {
  return value?.toISOString() ?? null;
}

function asCurrency(value: string): Currency {
  if (value !== "JMD" && value !== "USD") {
    throw new Error(`Unsupported currency: ${value}`);
  }
  return value;
}

function policyView(
  policy: {
    id: string;
    version: number;
    name: string;
    active: boolean;
    activatedAt: Date | null;
    automationMode: "OFF" | "SHADOW" | "GUARDED";
    projectDeadlineHours: number;
    staleProgressDays: number;
    approvalExpiryHours: number;
    safeBatchLimit: number;
    prospectDailyMinimum: number;
    prospectDailyMaximum: number;
    maxFounderPriorities: number;
    freshnessMinutes: number;
    rules: unknown;
  } | null,
): PolicyView {
  if (!policy) {
    const runtimeAutomationMode = getRuntimeAutomationMode();
    return {
      ...DEFAULT_POLICY,
      automationMode: getEffectiveAutomationMode(DEFAULT_POLICY.automationMode),
      configuredAutomationMode: DEFAULT_POLICY.automationMode,
      runtimeAutomationMode,
      id: null,
      active: false,
      activatedAt: null,
      rules: null,
    };
  }

  return {
    id: policy.id,
    version: policy.version,
    name: policy.name,
    active: policy.active,
    activatedAt: iso(policy.activatedAt),
    automationMode: getEffectiveAutomationMode(policy.automationMode),
    configuredAutomationMode: policy.automationMode,
    runtimeAutomationMode: getRuntimeAutomationMode(),
    projectDeadlineHours: policy.projectDeadlineHours,
    staleProgressDays: policy.staleProgressDays,
    approvalExpiryHours: policy.approvalExpiryHours,
    safeBatchLimit: policy.safeBatchLimit,
    prospectDailyMinimum: policy.prospectDailyMinimum,
    prospectDailyMaximum: policy.prospectDailyMaximum,
    maxFounderPriorities: policy.maxFounderPriorities,
    freshnessMinutes: policy.freshnessMinutes,
    rules: policy.rules,
  };
}

export async function getActivePolicy(): Promise<PolicyView> {
  const active = await prisma.cooPolicy.findFirst({
    where: { active: true },
    orderBy: { version: "desc" },
  });
  return policyView(active);
}

function priorityView(item: {
  id: string;
  rank: number;
  kind: PriorityView["kind"];
  severity: PriorityView["severity"];
  title: string;
  rationale: string;
  nextAction: string | null;
  recordType: string | null;
  recordId: string | null;
  recordUrl: string | null;
  currency: string | null;
  amount: unknown;
}): PriorityView {
  return {
    id: item.id,
    rank: item.rank,
    kind: item.kind,
    severity: item.severity,
    title: item.title,
    rationale: item.rationale,
    nextAction: item.nextAction,
    record:
      item.recordType && item.recordId && item.recordUrl
        ? {
            type: item.recordType,
            id: item.recordId,
            label: item.title,
            href: item.recordUrl,
          }
        : null,
    currency: item.currency ? asCurrency(item.currency) : null,
    amount: item.amount == null ? null : Number(item.amount),
  };
}

export async function getLatestBrief(): Promise<BriefView | null> {
  const brief = await prisma.cooBrief.findFirst({
    orderBy: [{ businessDate: "desc" }, { createdAt: "desc" }],
    include: {
      policy: { select: { version: true } },
      items: { orderBy: { rank: "asc" } },
    },
  });

  if (!brief) return null;
  return {
    id: brief.id,
    businessDate: brief.businessDate.toISOString().slice(0, 10),
    status: brief.status,
    headline: brief.headline,
    summary: brief.summary,
    asOf: brief.asOf.toISOString(),
    dataAsOf: iso(brief.dataAsOf),
    degradedReason: brief.degradedReason,
    model: brief.model,
    policyVersion: brief.policy.version,
    priorities: brief.items.map(priorityView),
  };
}

export type ProjectQueryOptions = {
  id?: string;
  companyId?: string;
  status?: AdminProjectStatus;
  take?: number;
  cursor?: string;
  now?: Date;
};

export async function listProjects(
  options: ProjectQueryOptions = {},
): Promise<ProjectView[]> {
  const now = options.now ?? new Date();
  const policy = await getActivePolicy();
  const projects = await prisma.adminProject.findMany({
    where: {
      archivedAt: null,
      ...(options.id ? { id: options.id } : {}),
      ...(options.companyId ? { companyId: options.companyId } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    take: options.take
      ? Math.min(101, Math.max(1, options.take))
      : undefined,
    cursor: options.cursor ? { id: options.cursor } : undefined,
    skip: options.cursor ? 1 : undefined,
    orderBy: [{ status: "asc" }, { targetEndAt: "asc" }, { updatedAt: "desc" }, { id: "asc" }],
    include: {
      company: { select: { id: true, name: true } },
      owner: { select: { name: true } },
      milestones: {
        orderBy: [{ sortOrder: "asc" }, { dueAt: "asc" }],
        include: { dependency: { select: { status: true, dueAt: true } } },
      },
      updates: {
        take: 10,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        include: { author: { select: { name: true } } },
      },
    },
  });

  return projects.map((project) => {
    const assessment = assessProjectRisk(project, now, policy);
    return {
      id: project.id,
      version: project.version,
      title: project.title,
      companyId: project.companyId,
      companyName: project.company.name,
      ownerName: project.owner?.name ?? null,
      status: project.status,
      health: assessment.health,
      riskReasons: assessment.reasons,
      progressPercent: project.progressPercent,
      targetEndAt: iso(project.targetEndAt),
      lastProgressAt: iso(project.lastProgressAt),
      activeBlocker: project.activeBlocker,
      milestones: project.milestones.map((milestone) => ({
        id: milestone.id,
        version: milestone.version,
        title: milestone.title,
        status: milestone.status,
        dueAt: iso(milestone.dueAt),
        blocker: milestone.blocker,
      })),
      updates: project.updates.map((update) => ({
        id: update.id,
        summary: update.summary,
        progressPercent: update.progressPercent,
        blockers: update.blockers,
        createdAt: update.createdAt.toISOString(),
        authorName: update.author?.name ?? null,
      })),
      record: {
        type: "AdminProject",
        id: project.id,
        label: project.title,
        href: `/admin/projects/${project.id}`,
      },
    };
  });
}

export async function getProjectById(
  id: string,
  options: { now?: Date } = {},
): Promise<ProjectView | null> {
  return (await listProjects({ id, now: options.now, take: 1 }))[0] ?? null;
}

export type ClientQueryOptions = {
  id?: string;
  take?: number;
  cursor?: string;
  now?: Date;
};

export async function listClients(
  options: ClientQueryOptions = {},
): Promise<ClientView[]> {
  const now = options.now ?? new Date();
  const policy = await getActivePolicy();
  const [companies, blockedApprovals] = await Promise.all([
    prisma.adminCompany.findMany({
      where: {
        status: "CLIENT",
        archivedAt: null,
        ...(options.id ? { id: options.id } : {}),
      },
      take: options.take
        ? Math.min(101, Math.max(1, options.take))
        : undefined,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      skip: options.cursor ? 1 : undefined,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      include: {
        projects: {
          where: { archivedAt: null },
          include: {
            milestones: {
              include: {
                dependency: { select: { status: true, dueAt: true } },
              },
            },
          },
        },
        invoices: {
          where: { archivedAt: null },
          include: { allocations: { include: { payment: true } } },
        },
      },
    }),
    prisma.cooApprovalRequest.findMany({
      where: { status: "PENDING", expiresAt: { gt: now } },
      select: { entityType: true, entityId: true },
    }),
  ]);

  return companies.map((company) => {
    const projectAssessments = company.projects.map((project) =>
      assessProjectRisk(project, now, policy),
    );
    const invoiceInputs = company.invoices.map((invoice) => ({
      currency: asCurrency(invoice.currency),
      amount: Number(invoice.amount),
      dueAt: invoice.dueAt,
      status: invoice.status,
      payments: invoice.allocations.map((allocation) => ({
        currency: asCurrency(allocation.currency),
        amount: Number(allocation.amount),
        status: allocation.payment.status,
      })),
    }));
    const { outstanding } = aggregateInvoiceBalances(invoiceInputs, now);
    const activeProjects = company.projects.filter(
      (project) => project.status === "ACTIVE" || project.status === "ON_HOLD",
    );
    const lastDeliveryUpdate = activeProjects
      .map((project) => project.lastProgressAt ?? project.updatedAt)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    const projectIds = new Set(company.projects.map((project) => project.id));
    const health = assessClientHealth(
      {
        projects: projectAssessments,
        hasOverdueInvoice: invoiceInputs.some((invoice) =>
          isInvoiceOverdue(invoice, now),
        ),
        hasBlockedApprovalOrDependency: blockedApprovals.some(
          (approval) =>
            (approval.entityType === "AdminCompany" &&
              approval.entityId === company.id) ||
            (approval.entityType === "AdminProject" &&
              projectIds.has(approval.entityId)),
        ),
        lastActiveDeliveryUpdateAt: lastDeliveryUpdate,
      },
      now,
      policy,
    );

    return {
      id: company.id,
      name: company.name,
      domain: company.domain,
      industry: company.industry,
      country: company.country,
      health: health.health,
      healthReasons: health.reasons,
      activeProjects: activeProjects.length,
      outstanding,
      lastUpdatedAt: company.updatedAt.toISOString(),
      record: {
        type: "AdminCompany",
        id: company.id,
        label: company.name,
        href: `/admin/clients/${company.id}`,
      },
    };
  });
}

export async function getClientById(
  id: string,
  options: { now?: Date } = {},
): Promise<ClientView | null> {
  return (await listClients({ id, now: options.now, take: 1 }))[0] ?? null;
}

export type FinanceQueryOptions = {
  id?: string;
  companyId?: string;
  now?: Date;
  take?: number;
  cursor?: string;
};

export async function listFinanceOverview(
  options: FinanceQueryOptions = {},
): Promise<FinanceOverview> {
  const now = options.now ?? new Date();
  const receivedFrom = jamaicaMonthStart(now);
  const [invoices, allMetricInvoices, receipts, invoicedByCurrency] = await Promise.all([
    prisma.adminInvoice.findMany({
      where: {
        archivedAt: null,
        ...(options.id ? { id: options.id } : {}),
        ...(options.companyId ? { companyId: options.companyId } : {}),
      },
      take: options.take
        ? Math.min(251, Math.max(1, options.take))
        : undefined,
      cursor: options.cursor ? { id: options.cursor } : undefined,
      skip: options.cursor ? 1 : undefined,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }, { id: "asc" }],
      include: {
        company: { select: { name: true } },
        allocations: { include: { payment: true } },
      },
    }),
    options.id || options.take || options.cursor
      ? prisma.adminInvoice.findMany({
          where: { archivedAt: null },
          include: { allocations: { include: { payment: true } } },
        })
      : Promise.resolve(null),
    prisma.adminPayment.findMany({
      where: { status: "CLEARED", paidAt: { gte: receivedFrom, lte: now } },
      select: { currency: true, amount: true },
    }),
    prisma.adminInvoice.groupBy({
      by: ["currency"],
      where: {
        archivedAt: null,
        status: { in: ["ISSUED", "PARTIALLY_PAID", "PAID"] },
        issuedAt: { gte: receivedFrom, lte: now },
      },
      _sum: { amount: true },
    }),
  ]);

  const views: InvoiceView[] = invoices.map((invoice) => {
    const input = {
      currency: asCurrency(invoice.currency),
      amount: Number(invoice.amount),
      dueAt: invoice.dueAt,
      status: invoice.status,
      payments: invoice.allocations.map((allocation) => ({
        currency: asCurrency(allocation.currency),
        amount: Number(allocation.amount),
        status: allocation.payment.status,
      })),
    };
    const balance = calculateInvoiceBalance(input);
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      companyId: invoice.companyId,
      companyName: invoice.company.name,
      projectId: invoice.projectId,
      status: invoice.status,
      currency: input.currency,
      amount: input.amount,
      paid: Math.max(0, input.amount - balance),
      balance,
      dueAt: iso(invoice.dueAt),
      overdue: isInvoiceOverdue(input, now),
      record: {
        type: "AdminInvoice",
        id: invoice.id,
        label: invoice.invoiceNumber,
        href: `/admin/finance/invoices/${invoice.id}`,
      },
    };
  });

  const invoiceInputs = (allMetricInvoices ?? invoices).map((invoice) => ({
    currency: asCurrency(invoice.currency),
    amount: Number(invoice.amount),
    dueAt: invoice.dueAt,
    status: invoice.status,
    payments: invoice.allocations.map((allocation) => ({
      currency: asCurrency(allocation.currency),
      amount: Number(allocation.amount),
      status: allocation.payment.status,
    })),
  }));
  const { outstanding, overdue } = aggregateInvoiceBalances(invoiceInputs, now);
  const expectedCash = aggregateExpectedCash(invoiceInputs, now);
  const invoicedRevenue = sumByCurrency(
    invoicedByCurrency.map((group) => ({
      currency: asCurrency(group.currency),
      amount: Number(group._sum.amount ?? 0),
    })),
  );
  const received = sumByCurrency(
    receipts.map((payment) => ({
      currency: asCurrency(payment.currency),
      amount: Number(payment.amount),
    })),
  );

  return {
    asOf: now.toISOString(),
    outstanding,
    overdue,
    expectedCash,
    invoicedRevenue,
    invoicedRevenuePeriod: {
      from: receivedFrom.toISOString(),
      through: now.toISOString(),
      timezone: "America/Jamaica",
    },
    received,
    receivedPeriod: {
      from: receivedFrom.toISOString(),
      through: now.toISOString(),
      timezone: "America/Jamaica",
    },
    invoices: views,
  };
}

export async function listOutstandingPayments(
  options: {
    currency?: Currency;
    overdueOnly?: boolean;
    now?: Date;
  } = {},
) {
  const now = options.now ?? new Date();
  const invoices = await prisma.adminInvoice.findMany({
    where: {
      archivedAt: null,
      ...(options.currency ? { currency: options.currency } : {}),
      ...(options.overdueOnly ? { dueAt: { lt: now } } : {}),
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }, { id: "asc" }],
    include: {
      company: { select: { name: true } },
      allocations: { include: { payment: true } },
    },
  });
  const views: InvoiceView[] = invoices.map((invoice) => {
    const invoiceInput = {
      currency: asCurrency(invoice.currency),
      amount: Number(invoice.amount),
      dueAt: invoice.dueAt,
      status: invoice.status,
      payments: invoice.allocations.map((allocation) => ({
        currency: asCurrency(allocation.currency),
        amount: Number(allocation.amount),
        status: allocation.payment.status,
      })),
    };
    const balance = calculateInvoiceBalance(invoiceInput);
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      companyId: invoice.companyId,
      companyName: invoice.company.name,
      projectId: invoice.projectId,
      status: invoice.status,
      currency: invoiceInput.currency,
      amount: invoiceInput.amount,
      paid: Math.max(0, invoiceInput.amount - balance),
      balance,
      dueAt: iso(invoice.dueAt),
      overdue: isInvoiceOverdue(invoiceInput, now),
      record: {
        type: "AdminInvoice",
        id: invoice.id,
        label: invoice.invoiceNumber,
        href: `/admin/finance/invoices/${invoice.id}`,
      },
    };
  });
  return {
    asOf: now.toISOString(),
    ...summarizeFilteredOutstandingBalances(views, options),
  };
}

export async function getInvoiceById(
  id: string,
  options: { now?: Date } = {},
): Promise<InvoiceView | null> {
  return (await listFinanceOverview({ id, now: options.now, take: 1 })).invoices[0] ?? null;
}

export async function getApprovalExecutionContext(
  approvalId: string,
): Promise<ApprovalExecutionContext | null> {
  const approval = await prisma.cooApprovalRequest.findUnique({
    where: { id: approvalId },
    select: {
      id: true,
      action: true,
      status: true,
      expiresAt: true,
      version: true,
    },
  });
  if (!approval) return null;
  return {
    ...approval,
    status:
      (approval.status === "PENDING" || approval.status === "APPROVED") &&
      approval.expiresAt <= new Date()
        ? "EXPIRED"
        : approval.status,
  };
}

export type ApprovalQueryOptions = {
  id?: string;
  status?: CooApprovalStatus;
  take?: number;
  cursor?: string;
  now?: Date;
};

export function listApprovalRequests(): Promise<ApprovalView[]>;
export function listApprovalRequests(
  options: ApprovalQueryOptions,
): Promise<ApprovalView[]>;
export async function listApprovalRequests(
  options: ApprovalQueryOptions = {},
): Promise<ApprovalView[]> {
  const now = options.now ?? new Date();
  const statusWhere =
    options.status === CooApprovalStatus.PENDING
      ? { status: CooApprovalStatus.PENDING, expiresAt: { gt: now } }
      : options.status === CooApprovalStatus.APPROVED
        ? { status: CooApprovalStatus.APPROVED, expiresAt: { gt: now } }
      : options.status === CooApprovalStatus.EXPIRED
        ? {
            OR: [
              { status: CooApprovalStatus.EXPIRED },
              {
                status: {
                  in: [CooApprovalStatus.PENDING, CooApprovalStatus.APPROVED],
                },
                expiresAt: { lte: now },
              },
            ],
          }
        : options.status
          ? { status: options.status }
          : undefined;
  const approvals = await prisma.cooApprovalRequest.findMany({
    where: {
      ...(statusWhere ?? {}),
      ...(options.id ? { id: options.id } : {}),
    },
    take: options.take
      ? Math.min(101, Math.max(1, options.take))
      : undefined,
    cursor: options.cursor ? { id: options.cursor } : undefined,
    skip: options.cursor ? 1 : undefined,
    orderBy: [{ status: "asc" }, { expiresAt: "asc" }, { createdAt: "desc" }, { id: "asc" }],
  });

  return approvals.map((approval) => ({
    id: approval.id,
    version: approval.version,
    action: approval.action,
    entityType: approval.entityType,
    entityId: approval.entityId,
    risk: approval.risk,
    status:
      (approval.status === "PENDING" || approval.status === "APPROVED") &&
      approval.expiresAt <= now
        ? "EXPIRED"
        : approval.status,
    expiresAt: approval.expiresAt.toISOString(),
    requestedAt: approval.createdAt.toISOString(),
    targetVersion: approval.targetVersion,
    targetSnapshot: approval.targetSnapshot,
    safeBatchKey: approval.safeBatchKey,
    payload: approval.payload,
    record: {
      type: "CooApprovalRequest",
      id: approval.id,
      label: approval.action,
      href: `/admin/approvals/${approval.id}`,
    },
  }));
}

export async function getApprovalById(
  id: string,
  options: { now?: Date } = {},
): Promise<ApprovalView | null> {
  return (await listApprovalRequests({ id, now: options.now, take: 1 }))[0] ?? null;
}

export type AutomationQueryOptions = {
  id?: string;
  type?: CooAutomationRunType;
  status?: CooAutomationStatus;
  take?: number;
  cursor?: string;
};

export function listAutomationRuns(): Promise<AutomationRunView[]>;
export function listAutomationRuns(
  options: AutomationQueryOptions,
): Promise<AutomationRunView[]>;
export async function listAutomationRuns(
  options: AutomationQueryOptions = {},
): Promise<AutomationRunView[]> {
  const runs = await prisma.cooAutomationRun.findMany({
    where: {
      ...(options.id ? { id: options.id } : {}),
      ...(options.type ? { type: options.type } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    take: Math.min(101, Math.max(1, options.take ?? 25)),
    cursor: options.cursor ? { id: options.cursor } : undefined,
    skip: options.cursor ? 1 : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    include: {
      steps: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          key: true,
          label: true,
          status: true,
          attempt: true,
          startedAt: true,
          completedAt: true,
          error: true,
          idempotencyKey: true,
          input: true,
          output: true,
        },
      },
    },
  });

  return runs.map((run) => ({
    id: run.id,
    type: run.type,
    status: run.status,
    mode: run.mode,
    model: run.model,
    estimatedCostUsd:
      run.estimatedCostUsd === null ? null : Number(run.estimatedCostUsd),
    usage: run.usage,
    input: run.input,
    outputSummary: run.outputSummary,
    correlationId: run.correlationId,
    idempotencyKey: run.idempotencyKey,
    scheduledFor: iso(run.scheduledFor),
    startedAt: iso(run.startedAt),
    completedAt: iso(run.completedAt),
    error: run.error,
    createdAt: run.createdAt.toISOString(),
    stepCounts: run.steps.reduce<Record<string, number>>((counts, step) => {
      counts[step.status] = (counts[step.status] ?? 0) + 1;
      return counts;
    }, {}),
    steps: run.steps.map((step) => ({
      id: step.id,
      key: step.key,
      label: step.label,
      status: step.status,
      attempt: step.attempt,
      startedAt: iso(step.startedAt),
      completedAt: iso(step.completedAt),
      error: step.error,
      idempotencyKey: step.idempotencyKey,
      input: step.input,
      output: step.output,
    })),
    record: {
      type: "CooAutomationRun",
      id: run.id,
      label: `${run.type} ${run.status.toLowerCase()}`,
      href: `/admin/automations/${run.id}`,
    },
  }));
}

export async function getAutomationRunById(
  id: string,
): Promise<AutomationRunView | null> {
  return (await listAutomationRuns({ id, take: 1 }))[0] ?? null;
}

function approvalQueueItem(approval: ApprovalView): QueueItemView {
  return {
    id: approval.id,
    title: approval.action,
    detail: `${approval.entityType} requires founder approval`,
    severity: approval.risk === "DESTRUCTIVE" ? "CRITICAL" : "HIGH",
    dueAt: approval.expiresAt,
    status: approval.status,
    record: approval.record,
  };
}

function cursorPage<T extends { id: string }>(
  items: T[],
  take: number,
): CursorPage<T> {
  const pageItems = items.slice(0, take);
  const hasMore = items.length > take;
  return {
    items: pageItems,
    hasMore,
    nextCursor: hasMore ? (pageItems.at(-1)?.id ?? null) : null,
  };
}

export async function listProjectPage(
  options: Omit<ProjectQueryOptions, "take"> & { take?: number } = {},
): Promise<CursorPage<ProjectView>> {
  const take = Math.min(100, Math.max(1, options.take ?? 50));
  return cursorPage(await listProjects({ ...options, take: take + 1 }), take);
}

export async function listClientPage(
  options: Omit<ClientQueryOptions, "take"> & { take?: number } = {},
): Promise<CursorPage<ClientView>> {
  const take = Math.min(100, Math.max(1, options.take ?? 50));
  return cursorPage(await listClients({ ...options, take: take + 1 }), take);
}

export async function listInvoicePage(
  options: Omit<FinanceQueryOptions, "take"> & { take?: number } = {},
): Promise<CursorPage<InvoiceView>> {
  const take = Math.min(100, Math.max(1, options.take ?? 50));
  const finance = await listFinanceOverview({ ...options, take: take + 1 });
  return cursorPage(finance.invoices, take);
}

export async function listApprovalRequestPage(
  options: Omit<ApprovalQueryOptions, "take"> & { take?: number } = {},
): Promise<CursorPage<ApprovalView>> {
  const take = Math.min(100, Math.max(1, options.take ?? 50));
  return cursorPage(
    await listApprovalRequests({ ...options, take: take + 1 }),
    take,
  );
}

export async function listAutomationRunPage(
  options: Omit<AutomationQueryOptions, "take"> & { take?: number } = {},
): Promise<CursorPage<AutomationRunView>> {
  const take = Math.min(100, Math.max(1, options.take ?? 50));
  return cursorPage(await listAutomationRuns({ ...options, take: take + 1 }), take);
}

export async function getOperationsDashboard(
  options: { now?: Date } = {},
): Promise<OperationsDashboard> {
  const now = options.now ?? new Date();
  const [policy, brief, allProjects, clients, activeClientCount, finance, approvals, automationRuns, opportunities, dueTasks, aiTasks] =
    await Promise.all([
      getActivePolicy(),
      getLatestBrief(),
      listProjects({ now }),
      listClients({ now, take: 12 }),
      prisma.adminCompany.count({
        where: { status: "CLIENT", archivedAt: null },
      }),
      listFinanceOverview({ now }),
      listApprovalRequests({ status: CooApprovalStatus.PENDING, now }),
      listAutomationRuns({ take: 10 }),
      prisma.adminOpportunity.findMany({
        where: {
          archivedAt: null,
          stage: { in: [...OPEN_OPPORTUNITY_STAGES] },
        },
        select: { currency: true, estimatedValue: true, probability: true },
      }),
      prisma.adminTask.count({
        where: {
          archivedAt: null,
          status: { in: ["TODO", "IN_PROGRESS"] },
          dueAt: { lte: now },
        },
      }),
      prisma.adminTask.findMany({
        where: {
          archivedAt: null,
          source: { in: ["AI", "AUTOMATION"] },
          status: { in: ["TODO", "IN_PROGRESS"] },
        },
        take: 25,
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      }),
    ]);

  const pipeline = aggregatePipeline(
    opportunities.map((opportunity) => ({
      currency: asCurrency(opportunity.currency),
      estimatedValue: Number(opportunity.estimatedValue),
      probability: opportunity.probability,
    })),
  );
  const latestCompletedRun = automationRuns.find(
    (run) => run.completedAt && (run.status === "SUCCEEDED" || run.status === "PARTIAL"),
  );
  const freshnessDate = brief?.dataAsOf
    ? new Date(brief.dataAsOf)
    : latestCompletedRun?.completedAt
      ? new Date(latestCompletedRun.completedAt)
      : null;

  const completed: QueueItemView[] = automationRuns
    .filter((run) => run.status === "SUCCEEDED" || run.status === "PARTIAL")
    .slice(0, 10)
    .map((run) => ({
      id: run.id,
      title: `${run.type.replaceAll("_", " ")} completed`,
      detail: run.status === "PARTIAL" ? "Completed with degraded data" : null,
      severity: run.status === "PARTIAL" ? "ATTENTION" : "INFO",
      dueAt: run.completedAt,
      status: run.status,
      record: run.record,
    }));

  return {
    asOf: now.toISOString(),
    policy,
    brief: brief
      ? { ...brief, priorities: brief.priorities.slice(0, policy.maxFounderPriorities) }
      : null,
    metrics: {
      activeClients: activeClientCount,
      atRiskProjects: allProjects.filter((project) => project.health === "AT_RISK")
        .length,
      pendingApprovals: approvals.length,
      followUpsDue: dueTasks,
      pipeline: pipeline.pipeline,
      weightedPipeline: pipeline.weightedPipeline,
      outstanding: finance.outstanding,
      overdue: finance.overdue,
      expectedCash: finance.expectedCash,
      invoicedRevenue: finance.invoicedRevenue,
      invoicedRevenuePeriod: finance.invoicedRevenuePeriod,
      received: finance.received,
      receivedPeriod: finance.receivedPeriod,
    },
    queues: {
      founderDecisions: approvals.slice(0, 25).map(approvalQueueItem),
      aiCanExecute: aiTasks.map((task) => ({
        id: task.id,
        title: task.title,
        detail: task.notes,
        severity:
          task.priority === "URGENT"
            ? "CRITICAL"
            : task.priority === "HIGH"
              ? "HIGH"
              : "ATTENTION",
        dueAt: task.dueAt.toISOString(),
        status: task.status,
        record: {
          type: "AdminTask",
          id: task.id,
          label: task.title,
          href: `/admin/tasks?task=${task.id}`,
        },
      })),
      completed,
    },
    projects: allProjects.slice(0, 12),
    clients,
    automationRuns,
    freshness: evaluateFreshness(freshnessDate, now, policy.freshnessMinutes),
  };
}

export async function getSalesPipelineSummary() {
  const opportunities = await prisma.adminOpportunity.findMany({
    where: { archivedAt: null, stage: { in: [...OPEN_OPPORTUNITY_STAGES] } },
    orderBy: [{ probability: "desc" }, { estimatedValue: "desc" }],
    include: {
      company: { select: { name: true } },
      research: { select: { classification: true } },
    },
  });
  const totals = aggregatePipeline(
    opportunities.map((opportunity) => ({
      currency: asCurrency(opportunity.currency),
      estimatedValue: Number(opportunity.estimatedValue),
      probability: opportunity.probability,
    })),
  );
  return {
    asOf: new Date().toISOString(),
    ...totals,
    opportunities: opportunities.map((opportunity) => ({
      id: opportunity.id,
      reference: opportunity.reference,
      title: opportunity.title,
      companyName: opportunity.company.name,
      stage: opportunity.stage,
      classification: opportunity.research?.classification ?? "UNCLASSIFIED",
      probability: opportunity.probability,
      currency: asCurrency(opportunity.currency),
      estimatedValue: Number(opportunity.estimatedValue),
      nextFollowUp: iso(opportunity.nextFollowUp),
      href: `/admin/leads/${opportunity.id}`,
    })),
  };
}

export async function getFollowUpsDue(now = new Date()) {
  const tasks = await prisma.adminTask.findMany({
    where: {
      archivedAt: null,
      status: { in: ["TODO", "IN_PROGRESS"] },
      dueAt: { lte: now },
    },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
    include: { company: { select: { name: true } } },
  });
  return {
    asOf: now.toISOString(),
    items: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      companyName: task.company?.name ?? null,
      priority: task.priority,
      status: task.status,
      dueAt: task.dueAt.toISOString(),
      href: `/admin/tasks?task=${task.id}`,
    })),
  };
}

export async function getUpcomingDeadlines(
  options: { now?: Date; days?: number } = {},
) {
  const now = options.now ?? new Date();
  const until = new Date(now.getTime() + (options.days ?? 14) * 86_400_000);
  const [milestones, tasks] = await Promise.all([
    prisma.adminMilestone.findMany({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        dueAt: { gte: now, lte: until },
        project: { archivedAt: null },
      },
      orderBy: { dueAt: "asc" },
      include: { project: { select: { title: true } } },
    }),
    prisma.adminTask.findMany({
      where: {
        archivedAt: null,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { gte: now, lte: until },
      },
      orderBy: { dueAt: "asc" },
    }),
  ]);
  return {
    asOf: now.toISOString(),
    until: until.toISOString(),
    milestones: milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      projectTitle: milestone.project.title,
      dueAt: milestone.dueAt!.toISOString(),
      status: milestone.status,
      href: `/admin/projects/${milestone.projectId}`,
    })),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueAt: task.dueAt.toISOString(),
      status: task.status,
      href: `/admin/tasks?task=${task.id}`,
    })),
  };
}

export { emptyCurrencyTotals };
