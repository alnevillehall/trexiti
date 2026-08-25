import assert from "node:assert/strict";

import { bindProspectCitationsToObservedSources } from "../lib/coo/ai/evidence";
import { summarizeAiUsage } from "../lib/coo/ai/usage";
import {
  aggregatePipeline,
  sumByCurrency,
  summarizeFilteredOutstandingBalances,
  summarizeFilteredPipeline,
} from "../lib/coo/domain";
import {
  getProtectedResourceMetadataUrl,
  getWwwAuthenticateHeader,
} from "../lib/coo/mcp/oauth";
import {
  CooRateLimitError,
  SlidingWindowRateLimiter,
} from "../lib/coo/rate-limit";
import {
  createFreshEnvelope,
} from "../lib/coo/tools/contracts";
import {
  cooToolDefinitions,
  getTrexitiMcpToolList,
} from "../lib/coo/tools/definitions";
import {
  collectFilteredCursorPage,
  decodeCooCursor,
  encodeCooCursor,
  paginateStableRecords,
} from "../lib/coo/tools/pagination";
import {
  classifyToolError,
  collectRecordLinks,
  inferFreshness,
} from "../lib/coo/tools/envelope";
import {
  addInternalNoteInputSchema,
  classifyProspectOperationPayloadSchema,
  createTaskInputSchema,
  getOutstandingPaymentsOutputSchema,
  getSalesPipelineOutputSchema,
  runOperationsInputSchema,
  updateProspectInputSchema,
} from "../lib/coo/tools/schemas";
import { getJamaicaBusinessDate } from "../workflows/coo/time";
import { isApprovalExecutionModeAllowed } from "../workflows/coo/approval-policy";

const expectedTools = [
  "get_daily_summary",
  "get_sales_pipeline",
  "get_followups_due",
  "get_top_opportunities",
  "get_active_clients",
  "get_projects_at_risk",
  "get_outstanding_payments",
  "get_upcoming_deadlines",
  "get_automation_status",
  "create_task",
  "add_internal_note",
  "update_prospect",
  "run_operations",
  "list_approval_requests",
  "decide_approval",
] as const;

assert.deepEqual(
  cooToolDefinitions.map((tool) => tool.name),
  expectedTools,
);

const expectedOutputDataKeys: Record<(typeof expectedTools)[number], string> = {
  get_daily_summary: "metrics",
  get_sales_pipeline: "opportunities",
  get_followups_due: "items",
  get_top_opportunities: "opportunities",
  get_active_clients: "items",
  get_projects_at_risk: "items",
  get_outstanding_payments: "invoices",
  get_upcoming_deadlines: "deadlines",
  get_automation_status: "items",
  create_task: "action",
  add_internal_note: "action",
  update_prospect: "action",
  run_operations: "runId",
  list_approval_requests: "items",
  decide_approval: "approval",
};

const advertisedTools = getTrexitiMcpToolList();
assert.equal(advertisedTools.length, expectedTools.length);
for (const [index, advertised] of advertisedTools.entries()) {
  const definition = cooToolDefinitions[index]!;
  assert.equal(advertised.name, definition.name);
  assert.equal(advertised.inputSchema.type, "object");
  assert.equal(advertised.outputSchema.type, "object");
  assert.deepEqual(advertised.securitySchemes, [
    { type: "oauth2", scopes: [...definition.requiredScopes] },
  ]);
  assert.deepEqual(advertised._meta.securitySchemes, advertised.securitySchemes);
  assert.deepEqual(
    advertised._meta["openai/securitySchemes"],
    advertised.securitySchemes,
  );

  const dataSchema = (
    advertised.outputSchema.properties as
      | Record<string, Record<string, unknown>>
      | undefined
  )?.data;
  const variants = dataSchema?.anyOf;
  assert.ok(Array.isArray(variants), `${advertised.name} must declare nullable data.`);
  const objectVariant = variants.find(
    (variant) =>
      typeof variant === "object" &&
      variant !== null &&
      (variant as { type?: unknown }).type === "object",
  ) as { properties?: Record<string, unknown> } | undefined;
  assert.ok(objectVariant, `${advertised.name} must declare object data.`);
  assert.ok(
    objectVariant.properties?.[expectedOutputDataKeys[advertised.name]],
    `${advertised.name} must advertise its concrete data contract.`,
  );
}

const outputAsOf = "2026-08-21T12:00:00.000Z";
assert.equal(
  getSalesPipelineOutputSchema.safeParse(
    createFreshEnvelope(
      {
        asOf: outputAsOf,
        pipeline: { JMD: 0, USD: 10_000 },
        weightedPipeline: { JMD: 0, USD: 6_000 },
        totalOpportunities: 1,
        pagePipeline: { JMD: 0, USD: 10_000 },
        pageWeightedPipeline: { JMD: 0, USD: 6_000 },
        opportunities: {
          items: [
            {
              id: "opportunity-1",
              reference: "OPP-1",
              title: "Operations platform",
              companyName: "Example Company",
              stage: "QUALIFIED",
              classification: "NURTURE",
              probability: 60,
              currency: "USD",
              estimatedValue: 10_000,
              nextFollowUp: null,
              href: "/admin/leads/opportunity-1",
            },
          ],
          hasMore: false,
          nextCursor: null,
        },
      },
      "pipeline-output-contract",
    ),
  ).success,
  true,
  "pipeline output must retain full/page aggregates and prospect classification",
);
assert.equal(
  getOutstandingPaymentsOutputSchema.safeParse(
    createFreshEnvelope(
      {
        asOf: outputAsOf,
        totals: { JMD: 125_000, USD: 0 },
        totalInvoices: 1,
        pageTotals: { JMD: 125_000, USD: 0 },
        invoices: {
          items: [
            {
              id: "invoice-1",
              invoiceNumber: "INV-1",
              companyId: "company-1",
              companyName: "Example Company",
              projectId: null,
              status: "ISSUED",
              currency: "JMD",
              amount: 125_000,
              paid: 0,
              balance: 125_000,
              dueAt: outputAsOf,
              overdue: true,
              record: {
                type: "AdminInvoice",
                id: "invoice-1",
                label: "INV-1",
                href: "/admin/finance?invoice=invoice-1",
              },
            },
          ],
          hasMore: false,
          nextCursor: null,
        },
      },
      "payments-output-contract",
    ),
  ).success,
  true,
  "outstanding-payment output must retain full and page aggregates",
);

async function verifyFilteredPagination() {
  const rawPageItems = [1, 2, 3, 4, 5].map((number) => ({
    id: `record-${number}`,
    matches: number % 2 === 0,
  }));
  const fetchRawPage = async (options: { cursor?: string; take: number }) => {
    const cursorIndex = options.cursor
      ? rawPageItems.findIndex((item) => item.id === options.cursor)
      : -1;
    const items = rawPageItems.slice(
      cursorIndex + 1,
      cursorIndex + 1 + options.take,
    );
    const hasMore = cursorIndex + 1 + items.length < rawPageItems.length;
    return {
      items,
      hasMore,
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  };
  const filteredFirstPage = await collectFilteredCursorPage({
    cursor: undefined,
    namespace: "filtered-test:{}",
    limit: 1,
    predicate: (item) => item.matches,
    fetchPage: fetchRawPage,
  });
  assert.equal(filteredFirstPage.items[0]?.id, "record-2");
  assert.equal(filteredFirstPage.hasMore, true);
  const filteredSecondPage = await collectFilteredCursorPage({
    cursor: filteredFirstPage.nextCursor,
    namespace: "filtered-test:{}",
    limit: 1,
    predicate: (item) => item.matches,
    fetchPage: fetchRawPage,
  });
  assert.deepEqual(filteredSecondPage.items.map((item) => item.id), ["record-4"]);
  assert.equal(filteredSecondPage.hasMore, false);
}

function verifyFilteredAggregatePagination() {
  const pipeline = summarizeFilteredPipeline(
    [
      {
        id: "opportunity-1",
        currency: "USD" as const,
        stage: "DISCOVERY",
        estimatedValue: 100,
        probability: 50,
      },
      {
        id: "opportunity-2",
        currency: "USD" as const,
        stage: "DISCOVERY",
        estimatedValue: 300,
        probability: 25,
      },
      {
        id: "opportunity-3",
        currency: "JMD" as const,
        stage: "DISCOVERY",
        estimatedValue: 10_000,
        probability: 80,
      },
      {
        id: "opportunity-4",
        currency: "USD" as const,
        stage: "PROPOSAL",
        estimatedValue: 900,
        probability: 90,
      },
    ],
    { currency: "USD", stage: "DISCOVERY" },
  );
  const pipelinePage = paginateStableRecords({
    items: pipeline.opportunities,
    limit: 1,
    cursor: undefined,
    namespace: "pipeline-aggregate-test:{}",
  });
  assert.deepEqual(pipeline.pipeline, { JMD: 0, USD: 400 });
  assert.deepEqual(pipeline.weightedPipeline, { JMD: 0, USD: 125 });
  assert.equal(pipeline.totalOpportunities, 2);
  assert.deepEqual(aggregatePipeline(pipelinePage.items).pipeline, {
    JMD: 0,
    USD: 100,
  });
  assert.equal(pipelinePage.hasMore, true);

  const outstanding = summarizeFilteredOutstandingBalances(
    [
      { id: "invoice-1", currency: "USD" as const, balance: 100, overdue: true },
      { id: "invoice-2", currency: "USD" as const, balance: 250, overdue: false },
      { id: "invoice-3", currency: "JMD" as const, balance: 5_000, overdue: true },
      { id: "invoice-4", currency: "USD" as const, balance: 0, overdue: true },
    ],
    { currency: "USD", overdueOnly: false },
  );
  const outstandingPage = paginateStableRecords({
    items: outstanding.invoices,
    limit: 1,
    cursor: undefined,
    namespace: "outstanding-aggregate-test:{}",
  });
  const pageTotals = sumByCurrency(
    outstandingPage.items.map((invoice) => ({
      currency: invoice.currency,
      amount: invoice.balance,
    })),
  );
  assert.deepEqual(outstanding.totals, { JMD: 0, USD: 350 });
  assert.equal(outstanding.totalInvoices, 2);
  assert.deepEqual(pageTotals, { JMD: 0, USD: 100 });
  assert.equal(outstandingPage.hasMore, true);
}

const harvestedLinks = collectRecordLinks([
  { id: "opportunity-1", title: "Linked opportunity", href: "/admin/leads/1" },
  { id: "external-1", title: "External", href: "https://example.com" },
]);
assert.equal(harvestedLinks.length, 1);
assert.equal(harvestedLinks[0]?.label, "Linked opportunity");
assert.equal(harvestedLinks[0]?.recordId, "opportunity-1");
assert.equal(new URL(harvestedLinks[0]!.href).pathname, "/admin/leads/1");
assert.equal(
  inferFreshness({ asOf: "2026-08-21T12:00:00.000Z" }).status,
  "fresh",
);
const degradedBriefFreshness = inferFreshness({
  asOf: "2026-08-21T12:00:00.000Z",
  freshness: {
    state: "FRESH",
    asOf: "2026-08-21T12:00:00.000Z",
    thresholdMinutes: 90,
  },
  brief: {
    status: "DEGRADED",
    degradedReason: "The prospect run failed before the brief was generated.",
  },
});
assert.equal(degradedBriefFreshness.status, "partial");
assert.match(degradedBriefFreshness.warning ?? "", /stored COO brief/i);
assert.equal(
  inferFreshness({
    freshness: { state: "FRESH", asOf: "2026-08-21T12:00:00.000Z" },
    brief: { status: "FAILED", degradedReason: null },
  }).status,
  "partial",
);
assert.equal(
  inferFreshness({
    freshness: { state: "STALE", asOf: "2026-08-20T12:00:00.000Z" },
    brief: { status: "FAILED", degradedReason: "Source failure" },
  }).status,
  "stale",
  "stale source data must take priority over degraded-brief partial state",
);
assert.equal(classifyToolError(new Error("STALE_DATA")).code, "stale_data");
assert.equal(classifyToolError(new Error("RATE_LIMITED")).code, "rate_limited");
const rateLimitError = new CooRateLimitError("ask_trexiti", 1_500);
assert.deepEqual(classifyToolError(rateLimitError), {
  code: "rate_limited",
  message: rateLimitError.message,
  details: { bucket: "ask_trexiti", retryAfterSeconds: 2 },
});
const cooLimiter = new SlidingWindowRateLimiter();
cooLimiter.consume("operations_planning:founder", { limit: 1, windowMs: 1_000 }, 0);
assert.throws(
  () =>
    cooLimiter.consume(
      "operations_planning:founder",
      { limit: 1, windowMs: 1_000 },
      100,
    ),
  CooRateLimitError,
);
assert.equal(classifyToolError(new Error("APPROVAL_EXPIRED")).code, "stale_target");
assert.equal(
  classifyToolError(new Error("IDEMPOTENCY_CONFLICT")).code,
  "validation_error",
);
assert.equal(
  classifyToolError(new Error("AUTOMATION_NOT_GUARDED")).code,
  "forbidden",
);
assert.equal(new Set(expectedTools).size, expectedTools.length);
assert.equal(isApprovalExecutionModeAllowed("CHANGE_POLICY", "OFF"), true);
assert.equal(isApprovalExecutionModeAllowed("CHANGE_POLICY", "SHADOW"), true);
assert.equal(isApprovalExecutionModeAllowed("CREATE_INVOICE", "SHADOW"), false);
assert.equal(isApprovalExecutionModeAllowed("CREATE_INVOICE", "GUARDED"), true);
assert.deepEqual(
  summarizeAiUsage(
    { inputTokens: 100, outputTokens: 25, totalTokens: 125 },
    [
      { providerMetadata: { gateway: { cost: "0.001250" } } },
      { providerMetadata: { gateway: { cost: 0.00075 } } },
      { providerMetadata: { gateway: { cost: "not-a-number" } } },
    ],
  ),
  {
    inputTokens: 100,
    outputTokens: 25,
    totalTokens: 125,
    costUsd: 0.002,
  },
  "Gateway cost metadata must be captured without estimating from model prices",
);
assert.equal(summarizeAiUsage({}, []).costUsd, null);

for (const definition of cooToolDefinitions) {
  assert.ok(definition.requiredScopes.length > 0);
  assert.equal(
    definition.annotations.destructiveHint,
    definition.name === "decide_approval",
  );
  assert.equal(definition.annotations.openWorldHint, false);
  assert.equal(definition.annotations.idempotentHint, true);
  if (!definition.annotations.readOnlyHint) {
    const scopes: readonly string[] = definition.requiredScopes;
    assert.ok(
      scopes.includes("trexiti:write_internal") ||
        scopes.includes("trexiti:approve"),
    );
  }
}

const safeEvidence = [
  {
    type: "AdminOpportunity",
    id: "opportunity-1",
    label: "Example opportunity",
    href: "/admin/leads/opportunity-1",
  },
];
const directWriteCases = [
  {
    schema: createTaskInputSchema,
    input: {
      idempotencyKey: "direct-task-evidence-key",
      title: "Review verified evidence",
      dueAt: "2026-08-22T12:00:00.000Z",
      evidence: safeEvidence,
    },
  },
  {
    schema: addInternalNoteInputSchema,
    input: {
      idempotencyKey: "direct-note-evidence-key",
      opportunityId: "opportunity-1",
      body: "Verified internal research note.",
      evidence: safeEvidence,
    },
  },
  {
    schema: updateProspectInputSchema,
    input: {
      operation: "set_follow_up",
      idempotencyKey: "direct-followup-evidence-key",
      opportunityId: "opportunity-1",
      nextFollowUp: "2026-08-22T12:00:00.000Z",
      nextAction: "Review the verified source.",
      evidence: safeEvidence,
    },
  },
] as const;
for (const { schema, input } of directWriteCases) {
  assert.equal(schema.safeParse(input).success, true);
  assert.equal(
    schema.safeParse({ ...input, unsupportedField: true }).success,
    false,
    "direct write inputs must reject fields outside their allow-list",
  );
}

assert.equal(
  runOperationsInputSchema.safeParse({
    idempotencyKey: "batch-test-key",
    operations: [
      { action: "CREATE_TASK", idempotencyKey: "task-test-key", payload: {} },
      {
        action: "ADD_INTERNAL_NOTE",
        idempotencyKey: "note-test-key",
        payload: {},
      },
    ],
  }).success,
  false,
);
assert.equal(
  updateProspectInputSchema.safeParse({
    operation: "classify",
    idempotencyKey: "prospect-classification-key",
    opportunityId: "opportunity-1",
    classification: "NURTURE",
    rationale: "Current evidence supports qualification.",
    evidence: safeEvidence,
  }).success,
  true,
);
assert.equal(
  updateProspectInputSchema.safeParse({
    operation: "classify",
    idempotencyKey: "prospect-classification-key",
    opportunityId: "opportunity-1",
    nextFollowUp: "2026-08-22T12:00:00.000Z",
    nextAction: "Call the prospect.",
  }).success,
  false,
  "Conditional prospect fields must remain enforced with an MCP object-root schema.",
);
assert.equal(
  updateProspectInputSchema.safeParse({
    operation: "set_follow_up",
    idempotencyKey: "prospect-followup-key",
    opportunityId: "opportunity-1",
    nextFollowUp: "2026-08-22T12:00:00.000Z",
    nextAction: "Call the prospect.",
    classification: "QUALIFIED",
  }).success,
  false,
  "set_follow_up must reject classification fields",
);
assert.equal(
  classifyProspectOperationPayloadSchema.safeParse({
    opportunityId: "opportunity-1",
    notes: "The evidence does not support a classification yet.",
  }).success,
  false,
  "low-level classification payloads require an explicit classification",
);
assert.equal(
  classifyProspectOperationPayloadSchema.safeParse({
    opportunityId: "opportunity-1",
    classification: "NOT_A_FIT",
    readyForOutreach: false,
    evidence: safeEvidence,
  }).success,
  false,
  "low-level classification must reject readyForOutreach",
);
assert.equal(
  classifyProspectOperationPayloadSchema.safeParse({
    opportunityId: "opportunity-1",
    classification: "NOT_A_FIT",
    personalizationPrepared: false,
    evidence: safeEvidence,
  }).success,
  false,
  "low-level classification must reject personalizationPrepared",
);
assert.equal(
  classifyProspectOperationPayloadSchema.safeParse({
    opportunityId: "opportunity-1",
    classification: "NOT_A_FIT",
    evidence: safeEvidence,
  }).success,
  true,
);
assert.equal(
  runOperationsInputSchema.safeParse({
    idempotencyKey: "batch-valid-task",
    operations: [
      {
        action: "CREATE_TASK",
        idempotencyKey: "task-valid-key",
        payload: {
          title: "Review delivery risk",
          dueAt: "2026-08-22T12:00:00.000Z",
          projectId: "project-1",
        },
      },
    ],
  }).success,
  true,
);
assert.equal(
  runOperationsInputSchema.safeParse({
    idempotencyKey: "batch-forbidden-field",
    operations: [
      {
        action: "CREATE_TASK",
        idempotencyKey: "task-forbidden-field",
        payload: {
          title: "Attempt an unsafe write",
          dueAt: "2026-08-22T12:00:00.000Z",
          ownerId: "attacker-selected-owner",
          deleteEverything: true,
        },
      },
    ],
  }).success,
  false,
  "safe-operation payloads must reject fields outside their action allow-list",
);

const [boundProspect] = bindProspectCitationsToObservedSources({
  observedAt: "2026-08-21T12:00:00.000Z",
  observedSources: [
    { url: "https://example.com/evidence", title: "Observed evidence" },
  ],
  prospects: [
    {
      companyName: "Example Company",
      domain: "example.com",
      website: "https://example.com",
      industry: "Services",
      country: "Jamaica",
      observedBusinessNeed:
        "The company publicly described a current operational bottleneck.",
      recentBusinessActivity: null,
      contact: {
        name: "Example Contact",
        title: "Director",
        email: "contact@example.com",
        phone: null,
        linkedInUrl: null,
      },
      reasonForContact: "Trexiti can address the observed operational bottleneck.",
      personalizationAngle: "Reference the documented operational bottleneck.",
      citations: [
        {
          url: "https://example.com/evidence/",
          title: "Model-provided title",
          observedAt: "2020-01-01T00:00:00.000Z",
        },
        {
          url: "https://fabricated.example/instruction",
          title: "Unobserved source",
          observedAt: "2020-01-01T00:00:00.000Z",
        },
      ],
    },
  ],
});
assert.deepEqual(boundProspect?.citations, [
  {
    url: "https://example.com/evidence",
    title: "Observed evidence",
    observedAt: "2026-08-21T12:00:00.000Z",
  },
]);

const namespace = "test-page:{}";
const cursor = encodeCooCursor(namespace, "record-1");
assert.equal(decodeCooCursor(cursor, namespace), "record-1");
assert.throws(() => decodeCooCursor(cursor, "different-page:{}"));
assert.deepEqual(
  paginateStableRecords({
    items: [{ id: "record-1" }, { id: "record-2" }, { id: "record-3" }],
    limit: 2,
    cursor: undefined,
    namespace,
  }),
  {
    items: [{ id: "record-1" }, { id: "record-2" }],
    hasMore: true,
    nextCursor: encodeCooCursor(namespace, "record-2"),
  },
);

const challenge = getWwwAuthenticateHeader(
  "invalid_token",
  ["trexiti:read"],
  'Token is invalid. Do not trust "quoted" input.\r\nRetry authentication.',
);
assert.match(challenge, /^Bearer /);
assert.match(challenge, /resource_metadata=/);
assert.match(challenge, /scope="trexiti:read"/);
assert.match(challenge, /error="invalid_token"/);
assert.match(
  challenge,
  /error_description="Token is invalid\. Do not trust \\"quoted\\" input\. Retry authentication\."/,
);
assert.doesNotMatch(challenge, /[\r\n]/);

const originalMcpResourceUrl = process.env.COO_MCP_RESOURCE_URL;
try {
  process.env.COO_MCP_RESOURCE_URL = "https://operations.example.test/mcp";
  assert.equal(
    getProtectedResourceMetadataUrl(),
    "https://operations.example.test/.well-known/oauth-protected-resource",
  );
} finally {
  if (originalMcpResourceUrl === undefined) {
    delete process.env.COO_MCP_RESOURCE_URL;
  } else {
    process.env.COO_MCP_RESOURCE_URL = originalMcpResourceUrl;
  }
}

assert.equal(
  getJamaicaBusinessDate(new Date("2026-08-22T04:59:59.000Z")),
  "2026-08-21",
);
assert.equal(
  getJamaicaBusinessDate(new Date("2026-08-22T05:00:00.000Z")),
  "2026-08-22",
);

verifyFilteredPagination()
  .then(() => {
    verifyFilteredAggregatePagination();
    console.info("COO integration contract verification passed.");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
