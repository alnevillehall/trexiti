import { z } from "zod";

import { createToolEnvelopeSchema } from "@/lib/coo/tools/contracts";

const pageLimitSchema = z.number().int().min(1).max(100).default(25);
const pageCursorSchema = z.string().min(1).max(1_024).optional();
const optionalCurrencySchema = z.enum(["JMD", "USD"]).optional();
const idempotencyKeySchema = z.string().min(8).max(200);

export const safeOperationEvidenceLinkSchema = z
  .object({
    type: z.string().min(1).max(120),
    id: z.string().min(1).max(240),
    label: z.string().min(1).max(500),
    href: z.string().min(1).max(2_000),
  })
  .strict();

const safeOperationEvidenceSchema = z
  .array(safeOperationEvidenceLinkSchema)
  .max(25)
  .optional();

export const getDailySummaryInputSchema = z.object({}).strict();

export const getSalesPipelineInputSchema = z.object({
  currency: optionalCurrencySchema,
  stage: z.string().max(80).optional(),
  limit: pageLimitSchema,
  cursor: pageCursorSchema,
});

export const getFollowupsDueInputSchema = z.object({
  through: z.string().datetime().optional(),
  limit: pageLimitSchema,
  cursor: pageCursorSchema,
});

export const getTopOpportunitiesInputSchema = z.object({
  currency: optionalCurrencySchema,
  limit: z.number().int().min(1).max(25).default(5),
});

export const getActiveClientsInputSchema = z.object({
  health: z.enum(["HEALTHY", "ATTENTION"]).optional(),
  limit: pageLimitSchema,
  cursor: pageCursorSchema,
});

export const getProjectsAtRiskInputSchema = z.object({
  includeAttention: z.boolean().default(true),
  limit: pageLimitSchema,
  cursor: pageCursorSchema,
});

export const getOutstandingPaymentsInputSchema = z.object({
  currency: optionalCurrencySchema,
  overdueOnly: z.boolean().default(false),
  limit: pageLimitSchema,
  cursor: pageCursorSchema,
});

export const getUpcomingDeadlinesInputSchema = z.object({
  through: z.string().datetime().optional(),
  limit: pageLimitSchema,
  cursor: pageCursorSchema,
});

export const getAutomationStatusInputSchema = z.object({
  type: z
    .enum(["PROSPECTING", "DAILY_BRIEF", "RUN_OPERATIONS", "APPROVAL_EXECUTION"])
    .optional(),
  status: z
    .enum(["QUEUED", "RUNNING", "SUCCEEDED", "PARTIAL", "FAILED", "CANCELLED"])
    .optional(),
  limit: pageLimitSchema,
  cursor: pageCursorSchema,
});

export const createTaskInputSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  title: z.string().min(3).max(240),
  dueAt: z.string().datetime(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  notes: z.string().max(5_000).optional(),
  opportunityId: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  evidence: safeOperationEvidenceSchema,
}).strict();

export const addInternalNoteInputSchema = z.object({
  idempotencyKey: idempotencyKeySchema,
  opportunityId: z.string().min(1),
  body: z.string().min(1).max(10_000),
  evidence: safeOperationEvidenceSchema,
}).strict();

export const updateProspectInputSchema = z
  .object({
    operation: z.enum(["set_follow_up", "classify"]),
    idempotencyKey: idempotencyKeySchema,
    opportunityId: z.string().min(1),
    nextFollowUp: z.string().datetime().optional(),
    nextAction: z.string().min(1).max(2_000).optional(),
    classification: z.enum(["QUALIFIED", "NURTURE", "NOT_A_FIT"]).optional(),
    rationale: z.string().min(1).max(2_000).optional(),
    evidence: safeOperationEvidenceSchema,
  })
  .strict()
  .superRefine((input, context) => {
    const required =
      input.operation === "set_follow_up"
        ? (["nextFollowUp", "nextAction"] as const)
        : (["classification", "rationale"] as const);
    const forbidden =
      input.operation === "set_follow_up"
        ? (["classification", "rationale"] as const)
        : (["nextFollowUp", "nextAction"] as const);

    for (const field of required) {
      if (input[field] === undefined) {
        context.addIssue({
          code: "custom",
          message: `${field} is required for ${input.operation}.`,
          path: [field],
        });
      }
    }
    for (const field of forbidden) {
      if (input[field] !== undefined) {
        context.addIssue({
          code: "custom",
          message: `${field} is not allowed for ${input.operation}.`,
          path: [field],
        });
      }
    }
  });

export const createTaskOperationPayloadSchema = z
  .object({
    title: z.string().min(3).max(240),
    dueAt: z.string().datetime(),
    type: z
      .enum([
        "CALL",
        "EMAIL",
        "LINKEDIN",
        "RESEARCH",
        "PROPOSAL",
        "FOLLOW_UP",
        "MEETING",
      ])
      .default("FOLLOW_UP"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
    notes: z.string().max(5_000).optional(),
    opportunityId: z.string().min(1).optional(),
    companyId: z.string().min(1).optional(),
    contactId: z.string().min(1).optional(),
    projectId: z.string().min(1).optional(),
    milestoneId: z.string().min(1).optional(),
    evidence: safeOperationEvidenceSchema,
  })
  .strict();

export const addInternalNoteOperationPayloadSchema = z
  .object({
    opportunityId: z.string().min(1),
    body: z.string().min(1).max(10_000),
    evidence: safeOperationEvidenceSchema,
  })
  .strict();

export const setFollowUpOperationPayloadSchema = z
  .object({
    opportunityId: z.string().min(1),
    nextFollowUp: z.string().datetime(),
    nextAction: z.string().min(1).max(2_000).optional(),
    evidence: safeOperationEvidenceSchema,
  })
  .strict();

export const classifyProspectOperationPayloadSchema = z
  .object({
    opportunityId: z.string().min(1),
    classification: z.enum(["QUALIFIED", "NURTURE", "NOT_A_FIT"]),
    notes: z.string().min(1).max(5_000).optional(),
    evidence: safeOperationEvidenceSchema,
  })
  .strict();

export const setInternalRiskFlagOperationPayloadSchema = z
  .object({
    projectId: z.string().min(1),
    health: z.enum(["ATTENTION", "AT_RISK"]),
    reason: z.string().min(1).max(2_000),
    evidence: safeOperationEvidenceSchema,
  })
  .strict();

export const safeOperationSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("CREATE_TASK"),
      idempotencyKey: idempotencyKeySchema,
      payload: createTaskOperationPayloadSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("ADD_INTERNAL_NOTE"),
      idempotencyKey: idempotencyKeySchema,
      payload: addInternalNoteOperationPayloadSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("SET_FOLLOW_UP"),
      idempotencyKey: idempotencyKeySchema,
      payload: setFollowUpOperationPayloadSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("CLASSIFY_PROSPECT"),
      idempotencyKey: idempotencyKeySchema,
      payload: classifyProspectOperationPayloadSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal("SET_INTERNAL_RISK_FLAG"),
      idempotencyKey: idempotencyKeySchema,
      payload: setInternalRiskFlagOperationPayloadSchema,
    })
    .strict(),
]);

export const runOperationsInputSchema = z
  .object({
    idempotencyKey: idempotencyKeySchema,
    operations: z.array(safeOperationSchema).min(1).max(25),
  })
  .strict()
  .superRefine((value, context) => {
    const actions = new Set(value.operations.map((operation) => operation.action));
    if (actions.size > 1) {
      context.addIssue({
        code: "custom",
        message: "Safe batches must contain one homogeneous action type.",
        path: ["operations"],
      });
    }
  });

export const listApprovalRequestsInputSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "APPROVED",
      "REJECTED",
      "EXPIRED",
      "EXECUTING",
      "EXECUTED",
      "FAILED",
    ])
    .optional(),
  limit: pageLimitSchema,
  cursor: pageCursorSchema,
});

export const decideApprovalInputSchema = z.object({
  approvalId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().min(1).max(2_000),
  expectedVersion: z.number().int().positive(),
  idempotencyKey: idempotencyKeySchema,
}).strict();

const isoDateTimeSchema = z.string().datetime();
const currencySchema = z.enum(["JMD", "USD"]);
const currencyTotalsSchema = z.object({ JMD: z.number(), USD: z.number() });
const domainRecordLinkSchema = z.object({
  type: z.string(),
  id: z.string(),
  label: z.string(),
  href: z.string(),
});
const cursorPageSchema = <TItem extends z.ZodType>(itemSchema: TItem) =>
  z.object({
    items: z.array(itemSchema),
    hasMore: z.boolean(),
    nextCursor: z.string().nullable(),
  });

const prioritySchema = z.object({
  id: z.string(),
  rank: z.number().int().positive(),
  kind: z.enum(["DECISION", "ACTION", "ALERT", "COMPLETED"]),
  severity: z.enum(["INFO", "ATTENTION", "HIGH", "CRITICAL"]),
  title: z.string(),
  rationale: z.string(),
  nextAction: z.string().nullable(),
  record: domainRecordLinkSchema.nullable(),
  currency: currencySchema.nullable(),
  amount: z.number().nullable(),
});

const briefSchema = z.object({
  id: z.string(),
  businessDate: z.string(),
  status: z.enum(["READY", "DEGRADED", "FAILED"]),
  headline: z.string(),
  summary: z.string(),
  asOf: isoDateTimeSchema,
  dataAsOf: isoDateTimeSchema.nullable(),
  degradedReason: z.string().nullable(),
  model: z.string().nullable(),
  policyVersion: z.number().int().positive(),
  priorities: z.array(prioritySchema),
});

const policySchema = z.object({
  id: z.string().nullable(),
  version: z.number().int().positive(),
  name: z.string(),
  automationMode: z.enum(["OFF", "SHADOW", "GUARDED"]),
  configuredAutomationMode: z.enum(["OFF", "SHADOW", "GUARDED"]),
  runtimeAutomationMode: z.enum(["OFF", "SHADOW", "GUARDED"]),
  projectDeadlineHours: z.number().int().positive(),
  staleProgressDays: z.number().int().positive(),
  approvalExpiryHours: z.number().int().positive(),
  safeBatchLimit: z.number().int().positive(),
  prospectDailyMinimum: z.number().int().nonnegative(),
  prospectDailyMaximum: z.number().int().positive(),
  maxFounderPriorities: z.number().int().positive(),
  freshnessMinutes: z.number().int().positive(),
  active: z.boolean(),
  activatedAt: isoDateTimeSchema.nullable(),
  rules: z.unknown(),
});

const queueItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string().nullable(),
  severity: z.enum(["INFO", "ATTENTION", "HIGH", "CRITICAL"]),
  dueAt: isoDateTimeSchema.nullable(),
  status: z.string(),
  record: domainRecordLinkSchema,
});

const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  industry: z.string(),
  country: z.string(),
  health: z.enum(["HEALTHY", "ATTENTION"]),
  healthReasons: z.array(
    z.enum([
      "AT_RISK_PROJECT",
      "OVERDUE_INVOICE",
      "BLOCKED_APPROVAL_OR_DEPENDENCY",
      "STALE_ACTIVE_DELIVERY",
    ]),
  ),
  activeProjects: z.number().int().nonnegative(),
  outstanding: currencyTotalsSchema,
  lastUpdatedAt: isoDateTimeSchema,
  record: domainRecordLinkSchema,
});

const projectSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  title: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  ownerName: z.string().nullable(),
  status: z.enum(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  health: z.enum(["ON_TRACK", "ATTENTION", "AT_RISK"]),
  riskReasons: z.array(
    z.enum([
      "OVERDUE_MILESTONE",
      "ACTIVE_BLOCKER",
      "OVERDUE_DEPENDENCY",
      "DEADLINE_WITH_UNFINISHED_PREREQUISITE",
      "STALE_PROGRESS",
      "MANUAL_OVERRIDE",
    ]),
  ),
  progressPercent: z.number().min(0).max(100),
  targetEndAt: isoDateTimeSchema.nullable(),
  lastProgressAt: isoDateTimeSchema.nullable(),
  activeBlocker: z.string().nullable(),
  milestones: z.array(
    z.object({
      id: z.string(),
      version: z.number().int().positive(),
      title: z.string(),
      status: z.string(),
      dueAt: isoDateTimeSchema.nullable(),
      blocker: z.string().nullable(),
    }),
  ),
  updates: z.array(
    z.object({
      id: z.string(),
      summary: z.string(),
      progressPercent: z.number().nullable(),
      blockers: z.unknown(),
      createdAt: isoDateTimeSchema,
      authorName: z.string().nullable(),
    }),
  ),
  record: domainRecordLinkSchema,
});

const invoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  companyId: z.string(),
  companyName: z.string(),
  projectId: z.string().nullable(),
  status: z.string(),
  currency: currencySchema,
  amount: z.number(),
  paid: z.number(),
  balance: z.number(),
  dueAt: isoDateTimeSchema.nullable(),
  overdue: z.boolean(),
  record: domainRecordLinkSchema,
});

const automationStepSchema = z.object({
  id: z.string(),
  key: z.string(),
  label: z.string(),
  status: z.string(),
  attempt: z.number().int().positive(),
  startedAt: isoDateTimeSchema.nullable(),
  completedAt: isoDateTimeSchema.nullable(),
  error: z.string().nullable(),
  idempotencyKey: z.string(),
  input: z.unknown(),
  output: z.unknown(),
});

const automationRunSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.string(),
  mode: z.string(),
  model: z.string().nullable(),
  estimatedCostUsd: z.number().nullable(),
  usage: z.unknown(),
  input: z.unknown(),
  outputSummary: z.unknown(),
  correlationId: z.string(),
  idempotencyKey: z.string(),
  scheduledFor: isoDateTimeSchema.nullable(),
  startedAt: isoDateTimeSchema.nullable(),
  completedAt: isoDateTimeSchema.nullable(),
  error: z.string().nullable(),
  createdAt: isoDateTimeSchema,
  stepCounts: z.record(z.string(), z.number().int().nonnegative()),
  steps: z.array(automationStepSchema),
  record: domainRecordLinkSchema,
});

const approvalViewSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  risk: z.enum(["SENSITIVE", "DESTRUCTIVE"]),
  status: z.string(),
  expiresAt: isoDateTimeSchema,
  requestedAt: isoDateTimeSchema,
  targetVersion: z.number().int().nullable(),
  targetSnapshot: z.unknown(),
  safeBatchKey: z.string().nullable(),
  payload: z.unknown(),
  record: domainRecordLinkSchema,
});

const opportunitySchema = z.object({
  id: z.string(),
  reference: z.string(),
  title: z.string(),
  companyName: z.string(),
  stage: z.string(),
  classification: z.enum([
    "UNCLASSIFIED",
    "QUALIFIED",
    "NURTURE",
    "NOT_A_FIT",
  ]),
  probability: z.number().int().min(0).max(100),
  currency: currencySchema,
  estimatedValue: z.number(),
  nextFollowUp: isoDateTimeSchema.nullable(),
  href: z.string(),
});

const followUpSchema = z.object({
  id: z.string(),
  title: z.string(),
  companyName: z.string().nullable(),
  priority: z.string(),
  status: z.string(),
  dueAt: isoDateTimeSchema,
  href: z.string(),
});

const safeOperationResultSchema = z.object({
  status: z.enum(["EXECUTED", "SHADOWED", "ALREADY_EXECUTED"]),
  action: z.enum([
    "CREATE_TASK",
    "ADD_INTERNAL_NOTE",
    "SET_FOLLOW_UP",
    "CLASSIFY_PROSPECT",
    "SET_INTERNAL_RISK_FLAG",
  ]),
  entityType: z.string(),
  entityId: z.string().nullable(),
  correlationId: z.string(),
});

const workflowLaunchSchema = z.object({
  runId: z.string(),
  correlationId: z.string(),
});

const approvalRecordSchema = z.object({
  id: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  expiresAt: isoDateTimeSchema,
  status: z.enum([
    "PENDING",
    "APPROVED",
    "REJECTED",
    "EXPIRED",
    "EXECUTING",
    "EXECUTED",
    "FAILED",
  ]),
  risk: z.enum(["SENSITIVE", "DESTRUCTIVE"]),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  targetVersion: z.number().int().nullable(),
  targetSnapshot: z.unknown(),
  payload: z.unknown(),
  evidence: z.unknown(),
  requestedById: z.string().nullable(),
  decidedById: z.string().nullable(),
  decidedAt: isoDateTimeSchema.nullable(),
  decisionReason: z.string().nullable(),
  executedAt: isoDateTimeSchema.nullable(),
  executionResult: z.unknown(),
  executionError: z.string().nullable(),
  safeBatchKey: z.string().nullable(),
  idempotencyKey: z.string(),
  correlationId: z.string(),
  version: z.number().int().positive(),
  policyId: z.string().nullable(),
  automationRunId: z.string().nullable(),
});

export const getDailySummaryOutputSchema = createToolEnvelopeSchema(
  z.object({
    asOf: isoDateTimeSchema,
    policy: policySchema,
    brief: briefSchema.nullable(),
    metrics: z.object({
      activeClients: z.number().int().nonnegative(),
      atRiskProjects: z.number().int().nonnegative(),
      pendingApprovals: z.number().int().nonnegative(),
      followUpsDue: z.number().int().nonnegative(),
      pipeline: currencyTotalsSchema,
      weightedPipeline: currencyTotalsSchema,
      outstanding: currencyTotalsSchema,
      overdue: currencyTotalsSchema,
      expectedCash: currencyTotalsSchema,
      invoicedRevenue: currencyTotalsSchema,
      invoicedRevenuePeriod: z.object({
        from: isoDateTimeSchema,
        through: isoDateTimeSchema,
        timezone: z.literal("America/Jamaica"),
      }),
      received: currencyTotalsSchema,
      receivedPeriod: z.object({
        from: isoDateTimeSchema,
        through: isoDateTimeSchema,
        timezone: z.literal("America/Jamaica"),
      }),
    }),
    queues: z.object({
      founderDecisions: z.array(queueItemSchema),
      aiCanExecute: z.array(queueItemSchema),
      completed: z.array(queueItemSchema),
    }),
    projects: z.array(projectSchema),
    clients: z.array(clientSchema),
    automationRuns: z.array(automationRunSchema),
    freshness: z.object({
      state: z.enum(["FRESH", "STALE", "UNKNOWN"]),
      asOf: isoDateTimeSchema.nullable(),
      thresholdMinutes: z.number().int().positive(),
    }),
    metricSources: z.array(domainRecordLinkSchema),
  }),
);

export const getSalesPipelineOutputSchema = createToolEnvelopeSchema(
  z.object({
    asOf: isoDateTimeSchema,
    pipeline: currencyTotalsSchema,
    weightedPipeline: currencyTotalsSchema,
    totalOpportunities: z.number().int().nonnegative(),
    pagePipeline: currencyTotalsSchema,
    pageWeightedPipeline: currencyTotalsSchema,
    opportunities: cursorPageSchema(opportunitySchema),
  }),
);

export const getFollowupsDueOutputSchema = createToolEnvelopeSchema(
  z.object({
    asOf: isoDateTimeSchema,
    through: isoDateTimeSchema,
    items: cursorPageSchema(followUpSchema),
  }),
);

export const getTopOpportunitiesOutputSchema = createToolEnvelopeSchema(
  z.object({
    asOf: isoDateTimeSchema,
    opportunities: z.array(opportunitySchema),
  }),
);

export const getActiveClientsOutputSchema = createToolEnvelopeSchema(
  z.object({ asOf: isoDateTimeSchema, ...cursorPageSchema(clientSchema).shape }),
);

export const getProjectsAtRiskOutputSchema = createToolEnvelopeSchema(
  z.object({ asOf: isoDateTimeSchema, ...cursorPageSchema(projectSchema).shape }),
);

export const getOutstandingPaymentsOutputSchema = createToolEnvelopeSchema(
  z.object({
    asOf: isoDateTimeSchema,
    totals: currencyTotalsSchema,
    totalInvoices: z.number().int().nonnegative(),
    pageTotals: currencyTotalsSchema,
    invoices: cursorPageSchema(invoiceSchema),
  }),
);

export const getUpcomingDeadlinesOutputSchema = createToolEnvelopeSchema(
  z.object({
    asOf: isoDateTimeSchema,
    until: isoDateTimeSchema,
    deadlines: cursorPageSchema(
      z.object({
        id: z.string(),
        recordId: z.string(),
        type: z.enum(["MILESTONE", "TASK"]),
        title: z.string(),
        context: z.string().nullable(),
        dueAt: isoDateTimeSchema,
        status: z.string(),
        record: domainRecordLinkSchema,
      }),
    ),
  }),
);

export const getAutomationStatusOutputSchema = createToolEnvelopeSchema(
  z.object({ asOf: isoDateTimeSchema, ...cursorPageSchema(automationRunSchema).shape }),
);

export const safeOperationOutputSchema = createToolEnvelopeSchema(
  safeOperationResultSchema,
);

export const runOperationsOutputSchema = createToolEnvelopeSchema(
  workflowLaunchSchema,
);

export const listApprovalRequestsOutputSchema = createToolEnvelopeSchema(
  z.object({ asOf: isoDateTimeSchema, ...cursorPageSchema(approvalViewSchema).shape }),
);

export const decideApprovalOutputSchema = createToolEnvelopeSchema(
  z.object({
    approval: approvalRecordSchema,
    execution: workflowLaunchSchema.nullable(),
  }),
);
