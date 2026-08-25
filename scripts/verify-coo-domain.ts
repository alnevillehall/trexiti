import assert from "node:assert/strict";

import {
  DEFAULT_POLICY,
  aggregateInvoiceBalances,
  aggregateExpectedCash,
  aggregatePipeline,
  approvalExpiresAt,
  assessClientHealth,
  assessProjectRisk,
  assessProspectAcceptance,
  calculateInvoiceBalance,
  evaluateFreshness,
  jamaicaMonthStart,
  validatePolicy,
  validateProspectScores,
} from "../lib/coo/domain";

const now = new Date("2026-08-21T15:00:00.000Z");
const day = 86_400_000;

assert.deepEqual(
  DEFAULT_POLICY,
  {
    version: 1,
    name: "Trexiti COO default policy",
    automationMode: "SHADOW",
    projectDeadlineHours: 72,
    staleProgressDays: 7,
    approvalExpiryHours: 24,
    safeBatchLimit: 25,
    prospectDailyMinimum: 40,
    prospectDailyMaximum: 50,
    maxFounderPriorities: 5,
    freshnessMinutes: 90,
  },
  "default policy must match the founder-approved operating rules",
);
assert.deepEqual(validatePolicy(DEFAULT_POLICY), []);
assert.match(
  validatePolicy({ ...DEFAULT_POLICY, safeBatchLimit: 26 })[0] ?? "",
  /safeBatchLimit/,
  "safe batches must never exceed 25",
);
assert.match(
  validatePolicy({
    ...DEFAULT_POLICY,
    prospectDailyMinimum: 51,
    prospectDailyMaximum: 50,
  })[0] ?? "",
  /prospectDailyMinimum/,
);
assert.equal(
  approvalExpiresAt(now, DEFAULT_POLICY).toISOString(),
  "2026-08-22T15:00:00.000Z",
  "approvals must expire after 24 hours",
);

const baselineProject = {
  status: "ACTIVE" as const,
  activeBlocker: null,
  healthOverride: null,
  createdAt: new Date(now.getTime() - day),
  lastProgressAt: new Date(now.getTime() - day),
  milestones: [
    {
      status: "IN_PROGRESS" as const,
      dueAt: new Date(now.getTime() + 5 * day),
      blocker: null,
      blockedAt: null,
      dependency: null,
    },
  ],
};
assert.deepEqual(assessProjectRisk(baselineProject, now, DEFAULT_POLICY), {
  health: "ON_TRACK",
  reasons: [],
});

const overdue = assessProjectRisk(
  {
    ...baselineProject,
    milestones: [
      {
        ...baselineProject.milestones[0],
        dueAt: new Date(now.getTime() - 1),
      },
    ],
  },
  now,
  DEFAULT_POLICY,
);
assert.equal(overdue.health, "AT_RISK");
assert.ok(overdue.reasons.includes("OVERDUE_MILESTONE"));

const blocked = assessProjectRisk(
  { ...baselineProject, activeBlocker: "Waiting on production access" },
  now,
  DEFAULT_POLICY,
);
assert.ok(blocked.reasons.includes("ACTIVE_BLOCKER"));

const stale = assessProjectRisk(
  {
    ...baselineProject,
    lastProgressAt: new Date(now.getTime() - 7 * day),
  },
  now,
  DEFAULT_POLICY,
);
assert.ok(stale.reasons.includes("STALE_PROGRESS"));

const dependencyRisk = assessProjectRisk(
  {
    ...baselineProject,
    milestones: [
      {
        status: "NOT_STARTED",
        dueAt: new Date(now.getTime() + 48 * 60 * 60 * 1_000),
        blocker: null,
        blockedAt: null,
        dependency: {
          status: "IN_PROGRESS",
          dueAt: new Date(now.getTime() - 1),
        },
      },
    ],
  },
  now,
  DEFAULT_POLICY,
);
assert.ok(dependencyRisk.reasons.includes("OVERDUE_DEPENDENCY"));
assert.ok(
  dependencyRisk.reasons.includes("DEADLINE_WITH_UNFINISHED_PREREQUISITE"),
);

assert.deepEqual(
  assessProjectRisk(
    { ...baselineProject, healthOverride: "ATTENTION" },
    now,
    DEFAULT_POLICY,
  ),
  { health: "ATTENTION", reasons: ["MANUAL_OVERRIDE"] },
);
assert.equal(
  assessProjectRisk(
    {
      ...baselineProject,
      healthOverride: "ON_TRACK",
      milestones: [
        {
          ...baselineProject.milestones[0],
          dueAt: new Date(now.getTime() - day),
        },
      ],
    },
    now,
    DEFAULT_POLICY,
  ).health,
  "AT_RISK",
  "an ON_TRACK override cannot hide deterministic risk",
);

const client = assessClientHealth(
  {
    projects: [overdue],
    hasOverdueInvoice: true,
    hasBlockedApprovalOrDependency: true,
    lastActiveDeliveryUpdateAt: new Date(now.getTime() - 8 * day),
  },
  now,
  DEFAULT_POLICY,
);
assert.equal(client.health, "ATTENTION");
assert.deepEqual(client.reasons, [
  "AT_RISK_PROJECT",
  "OVERDUE_INVOICE",
  "BLOCKED_APPROVAL_OR_DEPENDENCY",
  "STALE_ACTIVE_DELIVERY",
]);

const jmdInvoice = {
  currency: "JMD" as const,
  amount: 100_000,
  dueAt: new Date(now.getTime() - day),
  status: "PARTIALLY_PAID" as const,
  payments: [
    { currency: "JMD" as const, amount: 25_000, status: "CLEARED" as const },
    { currency: "JMD" as const, amount: 5_000, status: "PENDING" as const },
  ],
};
const usdInvoice = {
  currency: "USD" as const,
  amount: 1_000,
  dueAt: new Date(now.getTime() + day),
  status: "ISSUED" as const,
  payments: [
    { currency: "USD" as const, amount: 200, status: "CLEARED" as const },
  ],
};
assert.equal(
  calculateInvoiceBalance(jmdInvoice),
  75_000,
  "only cleared allocations reduce an invoice balance",
);
assert.deepEqual(aggregateInvoiceBalances([jmdInvoice, usdInvoice], now), {
  outstanding: { JMD: 75_000, USD: 800 },
  overdue: { JMD: 75_000, USD: 0 },
});
assert.deepEqual(aggregateExpectedCash([jmdInvoice, usdInvoice], now), {
  JMD: 0,
  USD: 800,
});
assert.equal(
  jamaicaMonthStart(new Date("2026-08-21T15:00:00.000Z")).toISOString(),
  "2026-08-01T05:00:00.000Z",
  "current-month receipts use America/Jamaica month boundaries",
);
assert.throws(
  () =>
    calculateInvoiceBalance({
      ...usdInvoice,
      payments: [
        { currency: "JMD", amount: 100, status: "CLEARED" },
      ],
    }),
  /currency must match/,
  "cross-currency allocations must fail instead of converting silently",
);

assert.deepEqual(
  aggregatePipeline([
    { currency: "JMD", estimatedValue: 1_000_000, probability: 50 },
    { currency: "USD", estimatedValue: 10_000, probability: 25 },
  ]),
  {
    pipeline: { JMD: 1_000_000, USD: 10_000 },
    weightedPipeline: { JMD: 500_000, USD: 2_500 },
  },
  "pipeline values must stay separated by recorded currency",
);

const qualifiedProspect = assessProspectAcceptance(
  {
    sourceUrls: ["https://example.com/news/new-location"],
    sourceObservedAt: new Date(now.getTime() - day),
    hasReachableContactMethod: true,
    observedBusinessNeed: "Customer requests are fragmented across channels.",
    duplicateDomain: false,
    duplicateContact: false,
  },
  now,
);
assert.deepEqual(qualifiedProspect, { accepted: true, reasons: [] });

const weakProspect = assessProspectAcceptance(
  {
    sourceUrls: ["http://localhost/research"],
    sourceObservedAt: new Date(now.getTime() - 31 * day),
    hasReachableContactMethod: false,
    observedBusinessNeed: " ",
    duplicateDomain: true,
    duplicateContact: true,
  },
  now,
);
assert.equal(weakProspect.accepted, false);
assert.deepEqual(weakProspect.reasons, [
  "MISSING_CURRENT_PUBLIC_SOURCE",
  "MISSING_CONTACT_METHOD",
  "MISSING_OBSERVED_NEED",
  "DUPLICATE_DOMAIN",
  "DUPLICATE_CONTACT",
]);

assert.deepEqual(
  validateProspectScores({
    financialCapacityScore: 5,
    problemSeverityScore: 4,
    strategicFitScore: 5,
    urgencyScore: 3,
    decisionMakerAccessScore: 4,
  }),
  { valid: true, totalScore: 21 },
);

assert.equal(
  evaluateFreshness(new Date(now.getTime() - 89 * 60_000), now, 90).state,
  "FRESH",
);
assert.equal(
  evaluateFreshness(new Date(now.getTime() - 91 * 60_000), now, 90).state,
  "STALE",
);
assert.equal(evaluateFreshness(null, now, 90).state, "UNKNOWN");

console.log(
  "COO domain policy, risk, finance, prospect, dual-currency, and freshness rules passed.",
);

async function verifyPersistenceIfRequested() {
  if (process.env.COO_DOMAIN_DB_TEST !== "1") return;

  const { randomUUID } = await import("node:crypto");
  const { prisma } = await import("../lib/prisma");
  const {
    beginAutomationRun,
    addProjectUpdate,
    createMilestone,
    createProject,
    decideApproval,
    ensureActivePolicy,
    executeApprovedAction,
    executeSafeOperation,
    failApprovalExecution,
    getActivePolicy,
    getApprovalExecutionContext,
    getApprovalById,
    getAutomationRunById,
    getClientById,
    getInvoiceById,
    getOperationsDashboard,
    getProjectById,
    getSalesPipelineSummary,
    listApprovalRequests,
    listFinanceOverview,
    persistVerifiedProspectBatch,
    requestApproval,
    updateMilestone,
    updateProject,
  } = await import("../lib/coo/data");
  const suffix = randomUUID();
  const correlationId = `coo-domain-test:${suffix}`;
  const previousAutomationMode = process.env.COO_AUTOMATION_MODE;
  process.env.COO_AUTOMATION_MODE = "guarded";

  try {
    const actor = await prisma.adminUser.create({
      data: {
        externalAuthId: `coo-domain-${suffix}`,
        email: `coo-domain-${suffix}@trexiti.test`,
        name: "COO Domain Test Owner",
        role: "OWNER",
      },
    });
    const company = await prisma.adminCompany.create({
      data: {
        name: "COO Domain Test Client",
        domain: `coo-domain-${suffix}.test`,
        industry: "Testing",
        country: "Jamaica",
        status: "CLIENT",
      },
    });
    const policy = await ensureActivePolicy({ createdById: actor.id });
    assert.equal(
      policy.automationMode,
      "GUARDED",
      "a valid runtime mode must seed the initial persisted policy",
    );
    await prisma.cooPolicy.update({
      where: { id: policy.id },
      data: { automationMode: "GUARDED" },
    });

    const concurrentRunInput = {
      type: "DAILY_BRIEF" as const,
      mode: "GUARDED" as const,
      correlationId: `${correlationId}:concurrent-run`,
      idempotencyKey: `${correlationId}:concurrent-run`,
      policyId: policy.id,
      requestedById: actor.id,
      scheduledFor: now,
      model: "domain-verifier",
      input: { source: "duplicate-cron-verifier" },
    };
    const concurrentRuns = await Promise.all([
      beginAutomationRun(concurrentRunInput),
      beginAutomationRun({
        ...concurrentRunInput,
        correlationId: `${correlationId}:concurrent-run-duplicate-invocation`,
        scheduledFor: new Date(now.getTime() + 1_000),
        model: "domain-verifier-reconfigured",
      }),
    ]);
    assert.equal(
      new Set(concurrentRuns.map((run) => run.id)).size,
      1,
      "concurrent duplicate cron starts must resolve to one run",
    );
    assert.equal(
      concurrentRuns.filter((run) => !run.alreadyExisted).length,
      1,
      "exactly one concurrent cron invocation must create the run",
    );
    const runDetail = await getAutomationRunById(concurrentRuns[0].id);
    assert.equal(runDetail?.idempotencyKey, concurrentRunInput.idempotencyKey);
    assert.equal(runDetail?.model, concurrentRuns[0].model);
    assert.deepEqual(runDetail?.steps, []);
    await assert.rejects(
      () =>
        beginAutomationRun({
          ...concurrentRunInput,
          input: { source: "conflicting-retry" },
        }),
      /IDEMPOTENCY_CONFLICT/,
    );

    const projectInput = {
      actorId: actor.id,
      correlationId,
      idempotencyKey: `${correlationId}:project`,
      companyId: company.id,
      ownerId: actor.id,
      title: "COO integration project",
      status: "ACTIVE" as const,
    };
    const project = await createProject(projectInput);
    const retriedProject = await createProject(projectInput);
    assert.equal(project.id, retriedProject.id, "project create must be idempotent");
    await assert.rejects(
      () => createProject({ ...projectInput, title: "Conflicting project retry" }),
      /IDEMPOTENCY_CONFLICT/,
    );
    const concurrentProjectInput = {
      ...projectInput,
      idempotencyKey: `${correlationId}:concurrent-project`,
      title: "Concurrent project create",
    };
    const concurrentProjects = await Promise.all([
      createProject(concurrentProjectInput),
      createProject(concurrentProjectInput),
    ]);
    assert.equal(concurrentProjects[0].id, concurrentProjects[1].id);

    const projectMutationInput = {
      actorId: actor.id,
      correlationId: `${correlationId}:project-update`,
      idempotencyKey: `${correlationId}:project-update`,
      projectId: project.id,
      expectedVersion: project.version,
      changes: { description: "Updated exactly once" },
    };
    const projectMutations = await Promise.all([
      updateProject(projectMutationInput),
      updateProject(projectMutationInput),
    ]);
    assert.equal(projectMutations[0].version, projectMutations[1].version);
    await assert.rejects(
      () =>
        updateProject({
          ...projectMutationInput,
          changes: { description: "Conflicting update retry" },
        }),
      /IDEMPOTENCY_CONFLICT/,
    );

    const milestoneInput = {
      actorId: actor.id,
      correlationId: `${correlationId}:milestone`,
      idempotencyKey: `${correlationId}:milestone`,
      projectId: project.id,
      title: "Verifier milestone",
      dueAt: new Date(now.getTime() + day),
    };
    const milestones = await Promise.all([
      createMilestone(milestoneInput),
      createMilestone(milestoneInput),
    ]);
    assert.equal(milestones[0].id, milestones[1].id);
    const milestoneMutationInput = {
      actorId: actor.id,
      correlationId: `${correlationId}:milestone-update`,
      idempotencyKey: `${correlationId}:milestone-update`,
      milestoneId: milestones[0].id,
      expectedVersion: milestones[0].version,
      changes: { status: "IN_PROGRESS" as const },
    };
    const milestoneMutations = await Promise.all([
      updateMilestone(milestoneMutationInput),
      updateMilestone(milestoneMutationInput),
    ]);
    assert.equal(milestoneMutations[0].version, milestoneMutations[1].version);

    const progressInput = {
      actorId: actor.id,
      correlationId: `${correlationId}:progress`,
      idempotencyKey: `${correlationId}:progress`,
      projectId: project.id,
      summary: "Blocked pending founder input",
      progressPercent: 45,
      activeBlocker: "Founder decision required",
      blockers: { dependency: "Founder decision" },
    };
    const progressUpdates = await Promise.all([
      addProjectUpdate(progressInput),
      addProjectUpdate(progressInput),
    ]);
    assert.equal(progressUpdates[0].id, progressUpdates[1].id);
    assert.equal(
      (
        await prisma.adminProject.findUniqueOrThrow({
          where: { id: project.id },
        })
      ).activeBlocker,
      "Founder decision required",
    );
    const projectDetail = await getProjectById(project.id, { now });
    assert.equal(projectDetail?.updates[0]?.summary, progressInput.summary);
    assert.equal(projectDetail?.updates[0]?.authorName, actor.name);
    await assert.rejects(
      () =>
        addProjectUpdate({
          ...progressInput,
          summary: "Conflicting progress retry",
        }),
      /IDEMPOTENCY_CONFLICT/,
    );

    const metricClients = await Promise.all(
      Array.from({ length: 13 }, (_, index) =>
        prisma.adminCompany.create({
          data: {
            name: `Metric client ${index + 1}`,
            domain: `metric-${index + 1}-${suffix}.test`,
            industry: "Testing",
            country: "Jamaica",
            status: "CLIENT",
          },
        }),
      ),
    );
    await prisma.adminProject.createMany({
      data: metricClients.map((client, index) => ({
        companyId: client.id,
        ownerId: actor.id,
        title: `Metric risk project ${index + 1}`,
        status: "ACTIVE" as const,
        healthOverride: "AT_RISK" as const,
        healthOverrideReason: "Verifier risk override",
      })),
    });
    const dashboard = await getOperationsDashboard({ now });
    assert.equal(dashboard.clients.length, 12, "dashboard client cards stay bounded");
    assert.equal(dashboard.projects.length, 12, "dashboard project cards stay bounded");
    assert.equal(
      dashboard.metrics.activeClients,
      await prisma.adminCompany.count({
        where: { status: "CLIENT", archivedAt: null },
      }),
      "active-client metric must count the complete record set",
    );
    assert.equal(
      dashboard.metrics.atRiskProjects,
      14,
      "at-risk metric must include risks beyond the 12 displayed cards",
    );
    assert.equal((await getClientById(company.id, { now }))?.id, company.id);

    const invoiceApproval = await requestApproval({
      actorId: actor.id,
      correlationId,
      idempotencyKey: `${correlationId}:invoice-approval`,
      action: "CREATE_INVOICE",
      risk: "SENSITIVE",
      entityType: "AdminCompany",
      entityId: company.id,
      payload: {
        companyId: company.id,
        projectId: project.id,
        invoiceNumber: `COO-${suffix}`,
        currency: "JMD",
        amount: 100_000,
        issuedAt: now,
        dueAt: new Date(now.getTime() + 10 * day),
      },
    });
    const decisionInput = {
      approvalId: invoiceApproval.id,
      expectedVersion: invoiceApproval.version,
      actorId: actor.id,
      decision: "APPROVE" as const,
      reason: "Verified test invoice",
      correlationId,
      idempotencyKey: `${correlationId}:invoice-decision`,
      now,
    };
    const approvedInvoice = await decideApproval(decisionInput);
    const retriedDecision = await decideApproval(decisionInput);
    assert.equal(approvedInvoice.id, retriedDecision.id);
    await assert.rejects(
      () =>
        decideApproval({
          ...decisionInput,
          decision: "REJECT",
        }),
      /IDEMPOTENCY_CONFLICT/,
    );
    await executeApprovedAction({
      approvalId: invoiceApproval.id,
      actorId: actor.id,
      correlationId,
    });
    const invoice = await prisma.adminInvoice.findUniqueOrThrow({
      where: { invoiceNumber: `COO-${suffix}` },
    });
    assert.equal(invoice.currency, "JMD");
    assert.equal((await getInvoiceById(invoice.id, { now }))?.id, invoice.id);
    assert.equal((await getApprovalById(invoiceApproval.id, { now }))?.id, invoiceApproval.id);

    const staleApproval = await requestApproval({
      actorId: actor.id,
      correlationId: `${correlationId}:stale-execution`,
      idempotencyKey: `${correlationId}:stale-execution`,
      action: "UPDATE_PRICING",
      risk: "SENSITIVE",
      entityType: "AdminCompany",
      entityId: company.id,
      payload: { companyId: company.id, proposedPrice: 1_000 },
      now,
    });
    await decideApproval({
      approvalId: staleApproval.id,
      expectedVersion: staleApproval.version,
      actorId: actor.id,
      decision: "APPROVE",
      reason: "Exercise stale execution failure handling",
      correlationId: `${correlationId}:stale-execution`,
      idempotencyKey: `${correlationId}:stale-execution-decision`,
      now,
    });
    assert.equal(
      (await getApprovalExecutionContext(staleApproval.id))?.status,
      "APPROVED",
    );
    await prisma.adminCompany.update({
      where: { id: company.id },
      data: {
        name: "COO Domain Test Client Updated",
        updatedAt: new Date(now.getTime() + 1_000),
      },
    });
    await assert.rejects(
      () =>
        executeApprovedAction({
          approvalId: staleApproval.id,
          actorId: actor.id,
          correlationId: `${correlationId}:stale-execution`,
        }),
      /STALE_TARGET/,
    );
    const failedApproval = await failApprovalExecution({
      approvalId: staleApproval.id,
      actorId: actor.id,
      correlationId: `${correlationId}:stale-execution`,
      error: "STALE_TARGET",
    });
    assert.equal(failedApproval.status, "FAILED");
    assert.equal(failedApproval.executionError, "STALE_TARGET");
    const retriedFailure = await failApprovalExecution({
      approvalId: staleApproval.id,
      actorId: actor.id,
      correlationId: `${correlationId}:stale-execution-retry`,
      error: "retry must not overwrite",
    });
    assert.equal(retriedFailure.version, failedApproval.version);
    assert.equal(retriedFailure.executionError, "STALE_TARGET");
    assert.equal(
      (
        await failApprovalExecution({
          approvalId: invoiceApproval.id,
          actorId: actor.id,
          correlationId,
          error: "must not overwrite executed approval",
        })
      ).status,
      "EXECUTED",
    );

    const expiredApproval = await requestApproval({
      actorId: actor.id,
      correlationId: `${correlationId}:expired-execution`,
      idempotencyKey: `${correlationId}:expired-execution`,
      action: "UPDATE_PRICING",
      risk: "SENSITIVE",
      entityType: "AdminCompany",
      entityId: company.id,
      payload: { companyId: company.id, proposedPrice: 2_000 },
      now,
    });
    await decideApproval({
      approvalId: expiredApproval.id,
      expectedVersion: expiredApproval.version,
      actorId: actor.id,
      decision: "APPROVE",
      reason: "Exercise execution-time expiry",
      correlationId: `${correlationId}:expired-execution`,
      idempotencyKey: `${correlationId}:expired-execution-decision`,
      now,
    });
    await prisma.cooApprovalRequest.update({
      where: { id: expiredApproval.id },
      data: { expiresAt: new Date(now.getTime() - day) },
    });
    await assert.rejects(
      () =>
        executeApprovedAction({
          approvalId: expiredApproval.id,
          actorId: actor.id,
          correlationId: `${correlationId}:expired-execution`,
        }),
      /APPROVAL_EXPIRED/,
    );
    assert.equal(
      (
        await prisma.cooApprovalRequest.findUniqueOrThrow({
          where: { id: expiredApproval.id },
        })
      ).status,
      "EXPIRED",
      "execution-time expiry must be persisted",
    );
    assert.equal(
      (await listApprovalRequests({ status: "PENDING", now })).some(
        (approval) => approval.id === expiredApproval.id,
      ),
      false,
    );
    assert.equal(
      (await listApprovalRequests({ status: "EXPIRED", now })).some(
        (approval) => approval.id === expiredApproval.id,
      ),
      true,
    );

    const paymentApprovalInput = {
      actorId: actor.id,
      correlationId,
      idempotencyKey: `${correlationId}:payment-approval`,
      action: "RECORD_PAYMENT" as const,
      risk: "SENSITIVE" as const,
      entityType: "AdminInvoice",
      entityId: invoice.id,
      payload: {
        companyId: company.id,
        currency: "JMD",
        amount: 25_000,
        method: "BANK_TRANSFER",
        paidAt: now,
        allocations: [{ invoiceId: invoice.id, amount: 25_000 }],
      },
    };
    const paymentApprovals = await Promise.all([
      requestApproval(paymentApprovalInput),
      requestApproval(paymentApprovalInput),
    ]);
    const paymentApproval = paymentApprovals[0];
    assert.equal(
      new Set(paymentApprovals.map((approval) => approval.id)).size,
      1,
      "concurrent duplicate approval requests must resolve to one request",
    );
    await assert.rejects(
      () =>
        requestApproval({
          ...paymentApprovalInput,
          payload: { ...paymentApprovalInput.payload, amount: 30_000 },
        }),
      /IDEMPOTENCY_CONFLICT/,
    );
    await decideApproval({
      approvalId: paymentApproval.id,
      expectedVersion: paymentApproval.version,
      actorId: actor.id,
      decision: "APPROVE",
      reason: "Verified test receipt",
      correlationId,
      idempotencyKey: `${correlationId}:payment-decision`,
      now,
    });
    const paymentExecutions = await Promise.all([
      executeApprovedAction({
        approvalId: paymentApproval.id,
        actorId: actor.id,
        correlationId: `${correlationId}:payment-execution-one`,
      }),
      executeApprovedAction({
        approvalId: paymentApproval.id,
        actorId: actor.id,
        correlationId: `${correlationId}:payment-execution-two`,
      }),
    ]);
    assert.equal(paymentExecutions[0].status, "EXECUTED");
    assert.equal(paymentExecutions[1].status, "EXECUTED");
    assert.equal(
      await prisma.adminPayment.count({
        where: { idempotencyKey: `${paymentApproval.idempotencyKey}:payment` },
      }),
      1,
      "concurrent approval execution must apply the payment exactly once",
    );
    const finance = await listFinanceOverview({ now });
    const invoiceView = finance.invoices.find((item) => item.id === invoice.id);
    assert.equal(invoiceView?.balance, 75_000);
    assert.equal(finance.invoicedRevenue.JMD, 100_000);
    assert.equal(finance.invoicedRevenue.USD, 0);
    assert.equal(finance.invoicedRevenuePeriod.timezone, "America/Jamaica");
    assert.equal(finance.received.JMD, 25_000);

    const marketingMetric = await prisma.marketingWeeklyMetric.create({
      data: { weekStarting: now, wonRevenue: 500 },
    });
    assert.equal(
      marketingMetric.currency,
      "USD",
      "legacy marketing revenue must default explicitly to USD",
    );

    const taskInput = {
      action: "CREATE_TASK" as const,
      actorId: actor.id,
      correlationId,
      idempotencyKey: `${correlationId}:task`,
      payload: {
        ownerId: actor.id,
        companyId: company.id,
        projectId: project.id,
        type: "FOLLOW_UP",
        priority: "HIGH",
        title: "Review COO domain integration",
        dueAt: now,
      },
    };
    const task = await executeSafeOperation(taskInput);
    const retriedTask = await executeSafeOperation(taskInput);
    assert.equal(task.status, "EXECUTED");
    assert.equal(retriedTask.status, "ALREADY_EXECUTED");
    assert.equal(task.entityId, retriedTask.entityId);
    await assert.rejects(
      () =>
        executeSafeOperation({
          ...taskInput,
          payload: { ...taskInput.payload, title: "Conflicting idempotent retry" },
        }),
      /IDEMPOTENCY_CONFLICT/,
    );
    await assert.rejects(
      () =>
        executeSafeOperation({
          ...taskInput,
          idempotencyKey: `${correlationId}:invalid-task`,
          payload: { ...taskInput.payload, type: "DELETE_EVERYTHING" },
        }),
      /INVALID_TASK_TYPE/,
    );
    await assert.rejects(
      () =>
        executeSafeOperation({
          action: "SET_INTERNAL_RISK_FLAG",
          actorId: actor.id,
          correlationId: `${correlationId}:unsafe-risk-clear`,
          idempotencyKey: `${correlationId}:unsafe-risk-clear`,
          payload: {
            projectId: project.id,
            health: "ON_TRACK",
            reason: "AI must not clear deterministic risk",
          },
        }),
      /health must be ATTENTION or AT_RISK/,
    );
    const concurrentSafeInput = {
      ...taskInput,
      correlationId: `${correlationId}:concurrent-safe-task`,
      idempotencyKey: `${correlationId}:concurrent-safe-task`,
      payload: {
        ...taskInput.payload,
        title: "Concurrent exactly-once safe task",
      },
    };
    const concurrentSafeResults = await Promise.all([
      executeSafeOperation(concurrentSafeInput),
      executeSafeOperation(concurrentSafeInput),
    ]);
    assert.deepEqual(
      new Set(concurrentSafeResults.map((result) => result.entityId)).size,
      1,
    );
    assert.equal(
      await prisma.adminTask.count({
        where: { idempotencyKey: concurrentSafeInput.idempotencyKey },
      }),
      1,
      "concurrent identical safe writes must execute once",
    );

    const sensitiveOpportunity = await prisma.adminOpportunity.create({
      data: {
        reference: `SENSITIVE-${suffix}`,
        companyId: company.id,
        assignedOwnerId: actor.id,
        direction: "OUTBOUND",
        stage: "DISCOVERY",
        type: "BUSINESS_SYSTEM",
        title: "Approval-routed opportunity",
        source: "Domain verifier",
        identifiedProblem: "Commercial controls require founder approval.",
        opportunity: "Verify canonical opportunity mutations.",
        estimatedValue: 10_000,
        currency: "USD",
        probability: 40,
      },
    });
    const approveAction = async (
      approval: { id: string; version: number },
      key: string,
    ) => {
      await decideApproval({
        approvalId: approval.id,
        expectedVersion: approval.version,
        actorId: actor.id,
        decision: "APPROVE",
        reason: "Verified canonical opportunity action",
        correlationId: `${correlationId}:${key}`,
        idempotencyKey: `${correlationId}:${key}:decision`,
        now,
      });
      return executeApprovedAction({
        approvalId: approval.id,
        actorId: actor.id,
        correlationId: `${correlationId}:${key}`,
      });
    };

    const raceOpportunity = await prisma.adminOpportunity.create({
      data: {
        reference: `CONCURRENT-TARGET-${suffix}`,
        companyId: company.id,
        assignedOwnerId: actor.id,
        direction: "OUTBOUND",
        stage: "DISCOVERY",
        type: "BUSINESS_SYSTEM",
        title: "Concurrent target verifier",
        source: "Domain verifier",
        identifiedProblem: "Approved writes must never overwrite a concurrent edit.",
        opportunity: "Verify target locking and serializable retry.",
        estimatedValue: 10_000,
        currency: "USD",
        probability: 40,
      },
    });
    const raceApproval = await requestApproval({
      actorId: actor.id,
      correlationId: `${correlationId}:concurrent-target`,
      idempotencyKey: `${correlationId}:concurrent-target`,
      action: "UPDATE_OPPORTUNITY",
      risk: "SENSITIVE",
      entityType: "AdminOpportunity",
      entityId: raceOpportunity.id,
      payload: {
        opportunityId: raceOpportunity.id,
        changes: { probability: 70, estimatedValue: 20_000 },
      },
      now,
    });
    await decideApproval({
      approvalId: raceApproval.id,
      expectedVersion: raceApproval.version,
      actorId: actor.id,
      decision: "APPROVE",
      reason: "Verify execution-time target concurrency protection",
      correlationId: `${correlationId}:concurrent-target`,
      idempotencyKey: `${correlationId}:concurrent-target-decision`,
      now,
    });

    let releaseTargetLock!: () => void;
    const targetLockRelease = new Promise<void>((resolve) => {
      releaseTargetLock = resolve;
    });
    let signalTargetLocked!: () => void;
    const targetLocked = new Promise<void>((resolve) => {
      signalTargetLocked = resolve;
    });
    const concurrentTargetUpdate = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "AdminOpportunity" WHERE "id" = ${raceOpportunity.id} FOR UPDATE`;
      signalTargetLocked();
      await targetLockRelease;
      return tx.adminOpportunity.update({
        where: { id: raceOpportunity.id },
        data: { estimatedValue: 11_000 },
      });
    });
    await targetLocked;
    const racedExecution = executeApprovedAction({
      approvalId: raceApproval.id,
      actorId: actor.id,
      correlationId: `${correlationId}:concurrent-target-execution`,
    }).then(
      () => null,
      (error: unknown) => error,
    );
    await new Promise<void>((resolve) => setTimeout(resolve, 50));
    releaseTargetLock();
    await concurrentTargetUpdate;
    const racedExecutionError = await racedExecution;
    assert.ok(racedExecutionError instanceof Error);
    assert.match(racedExecutionError.message, /STALE_TARGET/);
    const raceTargetAfter = await prisma.adminOpportunity.findUniqueOrThrow({
      where: { id: raceOpportunity.id },
    });
    assert.equal(Number(raceTargetAfter.estimatedValue), 11_000);
    assert.equal(
      raceTargetAfter.probability,
      40,
      "the approved payload must not overwrite an overlapping target edit",
    );
    assert.equal(
      (
        await prisma.cooApprovalRequest.findUniqueOrThrow({
          where: { id: raceApproval.id },
        })
      ).status,
      "APPROVED",
      "a stale execution transaction must roll its claim back for explicit failure handling",
    );
    await assert.rejects(
      () =>
        executeApprovedAction({
          approvalId: raceApproval.id,
          actorId: actor.id,
          correlationId: `${correlationId}:concurrent-target-retry`,
        }),
      /STALE_TARGET/,
    );

    const updateOpportunityApproval = await requestApproval({
      actorId: actor.id,
      correlationId: `${correlationId}:update-opportunity`,
      idempotencyKey: `${correlationId}:update-opportunity`,
      action: "UPDATE_OPPORTUNITY",
      risk: "SENSITIVE",
      entityType: "AdminOpportunity",
      entityId: sensitiveOpportunity.id,
      payload: {
        opportunityId: sensitiveOpportunity.id,
        changes: {
          stage: "NEGOTIATION",
          probability: 75,
          estimatedValue: 15_000,
          currency: "JMD",
          budget: "JMD 15,000",
          timeline: "30 days",
          outcomeReason: null,
          nextAction: "Prepare founder-reviewed proposal",
          nextFollowUp: new Date(now.getTime() + day),
          assignedOwnerId: actor.id,
        },
      },
      now,
    });
    await approveAction(updateOpportunityApproval, "update-opportunity");
    const updatedOpportunity = await prisma.adminOpportunity.findUniqueOrThrow({
      where: { id: sensitiveOpportunity.id },
    });
    assert.equal(updatedOpportunity.stage, "NEGOTIATION");
    assert.equal(updatedOpportunity.currency, "JMD");
    assert.equal(Number(updatedOpportunity.estimatedValue), 15_000);

    const closeOpportunityApproval = await requestApproval({
      actorId: actor.id,
      correlationId: `${correlationId}:close-opportunity`,
      idempotencyKey: `${correlationId}:close-opportunity`,
      action: "CLOSE_OPPORTUNITY",
      risk: "SENSITIVE",
      entityType: "AdminOpportunity",
      entityId: sensitiveOpportunity.id,
      payload: {
        opportunityId: sensitiveOpportunity.id,
        changes: {
          stage: "WON",
          probability: 100,
          outcomeReason: "Founder confirmed the signed engagement.",
          nextAction: null,
          nextFollowUp: null,
        },
      },
      now,
    });
    await approveAction(closeOpportunityApproval, "close-opportunity");
    assert.equal(
      (await prisma.adminOpportunity.findUniqueOrThrow({
        where: { id: sensitiveOpportunity.id },
      })).stage,
      "WON",
    );

    const archiveOpportunityApproval = await requestApproval({
      actorId: actor.id,
      correlationId: `${correlationId}:archive-opportunity`,
      idempotencyKey: `${correlationId}:archive-opportunity`,
      action: "ARCHIVE_OPPORTUNITY",
      risk: "DESTRUCTIVE",
      entityType: "AdminOpportunity",
      entityId: sensitiveOpportunity.id,
      payload: { opportunityId: sensitiveOpportunity.id },
      now,
    });
    await approveAction(archiveOpportunityApproval, "archive-opportunity");
    assert.ok(
      (await prisma.adminOpportunity.findUniqueOrThrow({
        where: { id: sensitiveOpportunity.id },
      })).archivedAt,
      "approved archive must preserve the record and set archivedAt",
    );
    assert.equal(
      await prisma.adminActivity.count({
        where: {
          opportunityId: sensitiveOpportunity.id,
          kind: { in: ["STAGE_CHANGED", "ARCHIVED"] },
        },
      }),
      3,
      "approved opportunity writes must append CRM activity",
    );

    const deleteMetricApproval = await requestApproval({
      actorId: actor.id,
      correlationId: `${correlationId}:delete-marketing-metric`,
      idempotencyKey: `${correlationId}:delete-marketing-metric`,
      action: "DELETE_RECORD",
      risk: "DESTRUCTIVE",
      entityType: "MarketingWeeklyMetric",
      entityId: marketingMetric.id,
      payload: {
        recordType: "MarketingWeeklyMetric",
        recordId: marketingMetric.id,
        operation: "delete",
      },
      now,
    });
    await approveAction(deleteMetricApproval, "delete-marketing-metric");
    assert.equal(
      await prisma.marketingWeeklyMetric.count({ where: { id: marketingMetric.id } }),
      0,
      "approved metric deletion must hard-delete only the targeted record",
    );

    const marketingCampaign = await prisma.marketingCampaign.create({
      data: {
        name: `Verifier campaign ${suffix}`,
        objective: "Verify founder-approved archival.",
        audience: "Trexiti founder",
        message: "Destructive marketing controls require approval.",
        offer: "Operations review",
        startAt: now,
        endAt: new Date(now.getTime() + 7 * day),
        primaryCta: "Review",
      },
    });
    const archiveCampaignApproval = await requestApproval({
      actorId: actor.id,
      correlationId: `${correlationId}:archive-marketing-campaign`,
      idempotencyKey: `${correlationId}:archive-marketing-campaign`,
      action: "DELETE_RECORD",
      risk: "DESTRUCTIVE",
      entityType: "MarketingCampaign",
      entityId: marketingCampaign.id,
      payload: {
        recordType: "MarketingCampaign",
        recordId: marketingCampaign.id,
        operation: "archive",
      },
      now,
    });
    await approveAction(archiveCampaignApproval, "archive-marketing-campaign");
    assert.equal(
      (
        await prisma.marketingCampaign.findUniqueOrThrow({
          where: { id: marketingCampaign.id },
        })
      ).status,
      "ARCHIVED",
      "approved campaign removal must archive instead of deleting history",
    );

    process.env.COO_AUTOMATION_MODE = "shadow";
    const shadowPolicyView = await getActivePolicy();
    assert.equal(shadowPolicyView.configuredAutomationMode, "GUARDED");
    assert.equal(shadowPolicyView.runtimeAutomationMode, "SHADOW");
    assert.equal(shadowPolicyView.automationMode, "SHADOW");
    const shadowRun = await beginAutomationRun({
      type: "PROSPECTING",
      mode: "GUARDED",
      correlationId: `${correlationId}:shadow-run`,
      idempotencyKey: `${correlationId}:shadow-run`,
      policyId: policy.id,
      requestedById: actor.id,
    });
    assert.equal(shadowRun.mode, "SHADOW", "callers cannot override policy mode");
    const shadowSafeKey = `${correlationId}:shadow-safe-task`;
    const shadowSafeResult = await executeSafeOperation({
      ...taskInput,
      idempotencyKey: shadowSafeKey,
      correlationId: `${correlationId}:shadow-safe-task`,
      payload: {
        ...taskInput.payload,
        title: "Must remain a shadow-only task",
      },
    });
    assert.equal(shadowSafeResult.status, "SHADOWED");
    assert.equal(
      await prisma.adminTask.count({ where: { idempotencyKey: shadowSafeKey } }),
      0,
      "runtime shadow must suppress guarded policy writes",
    );
    process.env.COO_AUTOMATION_MODE = "guarded";
    const pinnedShadowKey = `${correlationId}:pinned-shadow-task`;
    const pinnedShadowResult = await executeSafeOperation({
      ...taskInput,
      automationRunId: shadowRun.id,
      idempotencyKey: pinnedShadowKey,
      correlationId: `${correlationId}:pinned-shadow-task`,
      payload: {
        ...taskInput.payload,
        title: "A shadow run cannot be elevated by a policy change",
      },
    });
    assert.equal(pinnedShadowResult.status, "SHADOWED");
    assert.equal(
      await prisma.adminTask.count({ where: { idempotencyKey: pinnedShadowKey } }),
      0,
      "workflow writes must stay pinned to their run mode",
    );
    const shadowProspects = await persistVerifiedProspectBatch({
      automationRunId: shadowRun.id,
      correlationId: `${correlationId}:shadow-prospects`,
      candidates: [
        {
          candidateKey: `shadow-${suffix}`,
          ownerId: actor.id,
          company: {
            name: "Shadow Mode Prospect",
            domain: `shadow-${suffix}.example`,
            website: `https://shadow-${suffix}.example`,
            industry: "Professional Services",
            country: "Jamaica",
          },
          contact: {
            name: "Shadow Decision Maker",
            title: "Managing Director",
            email: `shadow-${suffix}@example.com`,
          },
          opportunity: {
            reference: `SHADOW-${suffix}`,
            type: "BUSINESS_SYSTEM",
            title: "Connect fragmented client operations",
            source: "Verified public research",
            identifiedProblem: "Client requests are fragmented across channels.",
            opportunity: "Create one operational workflow and source of truth.",
            estimatedValue: 25_000,
            currency: "USD",
            probability: 20,
            personalizationAngle: "Reference the documented multi-channel workflow.",
          },
          research: {
            sourceUrls: ["https://example.com/news/operations-expansion"],
            sourceObservedAt: now,
            observedProblems: "Client requests are fragmented across channels.",
            recentBusinessActivity: "The company announced a service expansion.",
            financialCapacityScore: 4,
            problemSeverityScore: 4,
            strategicFitScore: 5,
            urgencyScore: 3,
            decisionMakerAccessScore: 4,
          },
          followUpTask: {
            title: "Prepare verified shadow prospect follow-up",
            dueAt: new Date(now.getTime() + day),
            priority: "HIGH",
          },
        },
        {
          candidateKey: `shadow-invalid-${suffix}`,
          ownerId: actor.id,
          company: {
            name: "Invalid Shadow Prospect",
            domain: `shadow-invalid-${suffix}.example`,
            website: `https://shadow-invalid-${suffix}.example`,
            industry: "Professional Services",
            country: "Jamaica",
          },
          contact: {
            name: "Duplicate Shadow Decision Maker",
            email: `SHADOW-${suffix}@EXAMPLE.COM`,
          },
          opportunity: {
            reference: `SHADOW-INVALID-${suffix}`,
            type: "BUSINESS_SYSTEM",
            title: "Invalid shadow candidate",
            source: "Verified public research",
            identifiedProblem: "Client requests are fragmented across channels.",
            opportunity: "Create one operational workflow and source of truth.",
            currency: "USD",
            personalizationAngle: "Reference the documented workflow.",
          },
          research: {
            sourceUrls: ["https://example.com/news/operations-expansion"],
            sourceObservedAt: now,
            observedProblems: "Client requests are fragmented across channels.",
            financialCapacityScore: 6,
            problemSeverityScore: 4,
            strategicFitScore: 5,
            urgencyScore: 3,
            decisionMakerAccessScore: 4,
          },
        },
      ],
    });
    assert.equal(shadowProspects.accepted, 1);
    assert.deepEqual(shadowProspects.rejected, [
      {
        candidateKey: `shadow-invalid-${suffix}`,
        reasons: ["DUPLICATE_CONTACT", "INVALID_SCORES"],
      },
    ]);
    assert.equal(
      await prisma.adminCompany.count({
        where: { domain: `shadow-${suffix}.example` },
      }),
      0,
      "shadow mode must not write prospects",
    );
    assert.equal(
      await prisma.adminOpportunity.count({
        where: { reference: `SHADOW-${suffix}` },
      }),
      0,
      "shadow mode must not write opportunities",
    );
    assert.equal(
      await prisma.adminTask.count({
        where: {
          idempotencyKey: `${shadowRun.id}:prospect:shadow-${suffix}:follow-up`,
        },
      }),
      0,
      "shadow mode must not write follow-up tasks",
    );

    process.env.COO_AUTOMATION_MODE = "off";
    const offRun = await beginAutomationRun({
      type: "RUN_OPERATIONS",
      mode: "GUARDED",
      correlationId: `${correlationId}:off-run`,
      idempotencyKey: `${correlationId}:off-run`,
      policyId: policy.id,
      requestedById: actor.id,
    });
    assert.equal(offRun.mode, "OFF");
    assert.equal(offRun.status, "CANCELLED");
    await assert.rejects(
      () =>
        executeSafeOperation({
          ...taskInput,
          automationRunId: offRun.id,
          idempotencyKey: `${correlationId}:cancelled-run-task`,
          correlationId: `${correlationId}:cancelled-run-task`,
        }),
      /AUTOMATION_RUN_NOT_RUNNING/,
    );
    await assert.rejects(
      () =>
        executeSafeOperation({
          ...taskInput,
          idempotencyKey: `${correlationId}:off-safe-task`,
          correlationId: `${correlationId}:off-safe-task`,
        }),
      /AUTOMATION_DISABLED/,
    );
    process.env.COO_AUTOMATION_MODE = "guarded";

    await prisma.adminContact.create({
      data: {
        companyId: company.id,
        name: "Existing Normalized Contact",
        email: `existing-${suffix}@example.com`,
        phone: "+1 (876) 555-0199",
        linkedInUrl: "https://www.linkedin.com/in/existing-domain-test/",
      },
    });
    await prisma.cooPolicy.update({
      where: { id: policy.id },
      data: { automationMode: "GUARDED" },
    });
    const dedupeRun = await beginAutomationRun({
      type: "PROSPECTING",
      mode: "GUARDED",
      correlationId: `${correlationId}:dedupe-run`,
      idempotencyKey: `${correlationId}:dedupe-run`,
      policyId: policy.id,
      requestedById: actor.id,
    });
    const duplicateContactProspect = await persistVerifiedProspectBatch({
      automationRunId: dedupeRun.id,
      correlationId: `${correlationId}:dedupe-prospect`,
      candidates: [
        {
          candidateKey: `dedupe-${suffix}`,
          ownerId: actor.id,
          company: {
            name: "Duplicate Contact Prospect",
            domain: `dedupe-${suffix}.example`,
            website: `https://dedupe-${suffix}.example`,
            industry: "Professional Services",
            country: "Jamaica",
          },
          contact: {
            name: "Same Person, Different Formatting",
            email: `unique-${suffix}@example.com`,
            phone: "1-876-555-0199",
            linkedInUrl: "https://linkedin.com/in/another-profile",
          },
          opportunity: {
            reference: `DEDUPE-${suffix}`,
            type: "BUSINESS_SYSTEM",
            title: "Should be rejected before persistence",
            source: "Verified public research",
            identifiedProblem: "Operations are fragmented.",
            opportunity: "Create one operational system.",
            estimatedValue: 10_000,
            currency: "USD",
            personalizationAngle: "Reference the verified operating problem.",
          },
          research: {
            sourceUrls: ["https://example.com/news/verified-prospect"],
            sourceObservedAt: now,
            observedProblems: "Operations are fragmented.",
            financialCapacityScore: 4,
            problemSeverityScore: 4,
            strategicFitScore: 4,
            urgencyScore: 3,
            decisionMakerAccessScore: 4,
          },
        },
      ],
    });
    assert.deepEqual(duplicateContactProspect.rejected, [
      { candidateKey: `dedupe-${suffix}`, reasons: ["DUPLICATE_CONTACT"] },
    ]);
    assert.equal(
      await prisma.adminCompany.count({
        where: { domain: `dedupe-${suffix}.example` },
      }),
      0,
      "normalized phone, email, or LinkedIn matches must block prospect writes",
    );

    const classifiedProspect = await persistVerifiedProspectBatch({
      automationRunId: dedupeRun.id,
      correlationId: `${correlationId}:classified-prospect`,
      candidates: [
        {
          candidateKey: `classified-${suffix}`,
          ownerId: actor.id,
          company: {
            name: "Classification Verifier Prospect",
            domain: `classified-${suffix}.example`,
            website: `https://classified-${suffix}.example`,
            industry: "Professional Services",
            country: "Jamaica",
          },
          contact: {
            name: "Classification Decision Maker",
            title: "Managing Director",
            email: `classified-${suffix}@example.com`,
          },
          opportunity: {
            reference: `CLASSIFIED-${suffix}`,
            type: "BUSINESS_SYSTEM",
            title: "Verify explicit prospect classification",
            source: "Verified public research",
            identifiedProblem: "Sales qualification state is not stored explicitly.",
            opportunity: "Persist a deterministic internal classification.",
            estimatedValue: 15_000,
            currency: "USD",
            personalizationAngle: "Reference the verified qualification workflow.",
          },
          research: {
            sourceUrls: ["https://example.com/news/classification-verifier"],
            sourceObservedAt: now,
            observedProblems: "Sales qualification state is not stored explicitly.",
            financialCapacityScore: 4,
            problemSeverityScore: 4,
            strategicFitScore: 4,
            urgencyScore: 3,
            decisionMakerAccessScore: 4,
          },
        },
      ],
    });
    assert.equal(classifiedProspect.accepted, 1);
    const classifiedOpportunityId = classifiedProspect.opportunityIds[0]!;
    const initialClassification = await prisma.adminProspectResearch.findUniqueOrThrow({
      where: { opportunityId: classifiedOpportunityId },
    });
    assert.equal(
      initialClassification.classification,
      "QUALIFIED",
      "verified ingestion must persist the deterministic acceptance classification",
    );
    assert.ok(initialClassification.readyForOutreachAt);
    const prospectAuditMetadata = (
      await prisma.adminAuditLog.findUniqueOrThrow({
        where: {
          idempotencyKey: `${dedupeRun.id}:prospect:classified-${suffix}:audit`,
        },
      })
    ).metadata as Record<string, unknown>;
    assert.equal(prospectAuditMetadata.policyId, policy.id);
    assert.equal(prospectAuditMetadata.policyVersion, policy.version);

    await assert.rejects(
      () =>
        executeSafeOperation({
          action: "CLASSIFY_PROSPECT",
          actorId: actor.id,
          automationRunId: dedupeRun.id,
          correlationId: `${correlationId}:classify-readiness-bypass`,
          idempotencyKey: `${correlationId}:classify-readiness-bypass`,
          payload: {
            opportunityId: classifiedOpportunityId,
            classification: "NURTURE",
            notes: "Classification must not rewrite verified readiness facts.",
            readyForOutreach: false,
          },
        }),
      /UNSUPPORTED_PROSPECT_CLASSIFICATION_FIELD/,
    );

    await executeSafeOperation({
      action: "CLASSIFY_PROSPECT",
      actorId: actor.id,
      automationRunId: dedupeRun.id,
      correlationId: `${correlationId}:classify-nurture`,
      idempotencyKey: `${correlationId}:classify-nurture`,
      payload: {
        opportunityId: classifiedOpportunityId,
        classification: "NURTURE",
        notes: "Keep warm while the verified need develops.",
      },
    });
    const nurtured = await prisma.adminProspectResearch.findUniqueOrThrow({
      where: { opportunityId: classifiedOpportunityId },
    });
    assert.equal(nurtured.classification, "NURTURE");
    assert.equal(nurtured.personalizationPrepared, true);
    assert.equal(
      nurtured.readyForOutreachAt?.toISOString(),
      initialClassification.readyForOutreachAt?.toISOString(),
      "classification must not rewrite evidence-derived readiness state",
    );

    await executeSafeOperation({
      action: "CLASSIFY_PROSPECT",
      actorId: actor.id,
      automationRunId: dedupeRun.id,
      correlationId: `${correlationId}:classify-qualified`,
      idempotencyKey: `${correlationId}:classify-qualified`,
      payload: {
        opportunityId: classifiedOpportunityId,
        classification: "QUALIFIED",
        notes: "The verified prospect is ready for internal follow-up.",
      },
    });
    assert.ok(
      (
        await prisma.adminProspectResearch.findUniqueOrThrow({
          where: { opportunityId: classifiedOpportunityId },
        })
      ).readyForOutreachAt,
    );

    await executeSafeOperation({
      action: "CLASSIFY_PROSPECT",
      actorId: actor.id,
      automationRunId: dedupeRun.id,
      correlationId: `${correlationId}:classify-not-fit`,
      idempotencyKey: `${correlationId}:classify-not-fit`,
      payload: {
        opportunityId: classifiedOpportunityId,
        classification: "NOT_A_FIT",
        notes: "The observed need no longer matches Trexiti's current offer.",
        evidence: [
          {
            type: "AdminOpportunity",
            id: classifiedOpportunityId,
            label: "Classification verifier prospect",
            href: `/admin/leads/${classifiedOpportunityId}`,
          },
        ],
      },
    });
    const notFit = await prisma.adminProspectResearch.findUniqueOrThrow({
      where: { opportunityId: classifiedOpportunityId },
    });
    assert.equal(notFit.classification, "NOT_A_FIT");
    assert.equal(
      notFit.readyForOutreachAt?.toISOString(),
      initialClassification.readyForOutreachAt?.toISOString(),
    );
    const classificationAuditMetadata = (
      await prisma.adminAuditLog.findUniqueOrThrow({
        where: { idempotencyKey: `${correlationId}:classify-not-fit` },
      })
    ).metadata as Record<string, unknown>;
    assert.equal(classificationAuditMetadata.policyId, policy.id);
    assert.equal(classificationAuditMetadata.policyVersion, policy.version);
    assert.deepEqual(classificationAuditMetadata.evidence, [
      {
        type: "AdminOpportunity",
        id: classifiedOpportunityId,
        label: "Classification verifier prospect",
        href: `/admin/leads/${classifiedOpportunityId}`,
      },
    ]);
    assert.equal(
      (await getSalesPipelineSummary()).opportunities.find(
        (opportunity) => opportunity.id === classifiedOpportunityId,
      )?.classification,
      "NOT_A_FIT",
      "pipeline reads must expose the stored classification",
    );

    const recoveryApproval = await requestApproval({
      actorId: actor.id,
      correlationId: `${correlationId}:policy-recovery`,
      idempotencyKey: `${correlationId}:policy-recovery`,
      action: "CHANGE_POLICY",
      risk: "SENSITIVE",
      entityType: "CooPolicy",
      entityId: policy.id,
      payload: {
        name: "Recovered shadow policy",
        automationMode: "SHADOW",
        thresholds: {},
      },
      now,
    });
    await decideApproval({
      approvalId: recoveryApproval.id,
      expectedVersion: recoveryApproval.version,
      actorId: actor.id,
      decision: "APPROVE",
      reason: "Verify kill-switch policy recovery",
      correlationId: `${correlationId}:policy-recovery`,
      idempotencyKey: `${correlationId}:policy-recovery-decision`,
      now,
    });
    process.env.COO_AUTOMATION_MODE = "off";
    const recoveryRun = await beginAutomationRun({
      type: "APPROVAL_EXECUTION",
      mode: "GUARDED",
      correlationId: `${correlationId}:policy-recovery-run`,
      idempotencyKey: `${correlationId}:policy-recovery-run`,
      policyId: policy.id,
      requestedById: actor.id,
      input: { approvalId: recoveryApproval.id, action: "CHANGE_POLICY" },
    });
    assert.equal(recoveryRun.mode, "OFF");
    assert.equal(
      recoveryRun.status,
      "RUNNING",
      "an approved policy change must remain runnable through the OFF kill switch",
    );
    await executeApprovedAction({
      approvalId: recoveryApproval.id,
      actorId: actor.id,
      correlationId: `${correlationId}:policy-recovery`,
    });
    assert.equal(
      (
        await prisma.cooPolicy.findFirstOrThrow({
          where: { active: true },
          orderBy: { version: "desc" },
        })
      ).automationMode,
      "SHADOW",
    );

    console.log(
      "COO PostgreSQL migration, approvals, allocations, idempotency, audit, and mode guards passed.",
    );
  } finally {
    if (previousAutomationMode === undefined) {
      delete process.env.COO_AUTOMATION_MODE;
    } else {
      process.env.COO_AUTOMATION_MODE = previousAutomationMode;
    }
    await prisma.$disconnect();
  }
}

verifyPersistenceIfRequested().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
