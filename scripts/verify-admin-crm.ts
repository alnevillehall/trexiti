import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  calculateOpportunityScore,
  isProspectReady,
  manualOutreachPlan,
  opportunityHeat,
  opportunityHeatLabel,
} from "../lib/admin/crm";
import { hasAdminPermission } from "../lib/admin/permissions";
import {
  CooRateLimitError,
  SlidingWindowRateLimiter,
} from "../lib/coo/rate-limit";
import {
  archiveOpportunitySchema,
  createOpportunitySchema,
  createTaskSchema,
  opportunityFiltersSchema,
  moveOpportunitySchema,
  updateOpportunitySchema,
  updateProspectResearchSchema,
} from "../lib/admin/validation";

const createPayload = {
  companyName: "Example Operations Group",
  website: "https://example-operations.test",
  industry: "Professional Services",
  country: "Jamaica",
  estimatedCompanySize: "20–50 employees",
  decisionMaker: "Jordan Blake",
  decisionMakerTitle: "Managing Director",
  email: "jordan@example-operations.test",
  phone: "+1 876 555 0100",
  linkedInUrl: "https://linkedin.com/in/jordan-blake",
  instagramUrl: "",
  whatsapp: "",
  otherContactMethod: "",
  opportunityType: "BUSINESS_SYSTEM",
  identifiedProblem: "Customer and job information is fragmented across several tools.",
  opportunity: "Create one operational system around the company’s real workflow.",
  estimatedProjectValue: "25000",
  currency: "USD",
  budget: "$10,000–$25,000",
  timeline: "3–6 months",
  source: "Manual research",
  reasonForContact: "The operating model has a clear coordination problem.",
  personalizationAngle: "Reference the multi-location workflow and fragmented dispatch.",
  currentWebsiteQuality: "2",
  operationalMaturity: "3",
  observedProblems: "The website and operating process show disconnected customer and job records.",
  recentBusinessActivity: "A new service location was announced.",
  researchNotes: "Confirm the current scheduling and accounting systems.",
  nextFollowUp: "2026-08-12T09:00",
  financialCapacityScore: "5",
  problemSeverityScore: "4",
  strategicFitScore: "5",
  urgencyScore: "4",
  decisionMakerAccessScore: "4",
} as const;

const createResult = createOpportunitySchema.safeParse(createPayload);
assert.equal(createResult.success, true, "create contract should accept a qualified account");
const createdOpportunity = createOpportunitySchema.parse(createPayload);
assert.equal(createdOpportunity.totalScore, 22);
assert.equal(createdOpportunity.domain, "example-operations.test");
assert.equal(opportunityHeat(createdOpportunity.totalScore), "HOT");
assert.equal(opportunityHeatLabel(14), "LOW PRIORITY");

const normalizedUrls = createOpportunitySchema.parse({
  ...createPayload,
  website: "example-operations.test",
  linkedInUrl: "linkedin.com/in/jordan-blake",
});
assert.equal(normalizedUrls.website, "https://example-operations.test");
assert.equal(
  normalizedUrls.linkedInUrl,
  "https://linkedin.com/in/jordan-blake",
  "bare external URLs must be stored as absolute links",
);

const unsafeUrl = createOpportunitySchema.safeParse({
  ...createPayload,
  website: "javascript:alert(1)",
});
assert.equal(unsafeUrl.success, false, "unsafe website schemes must be rejected");

const focusedCommercialRange = createOpportunitySchema.safeParse({
  ...createPayload,
  estimatedProjectValue: "0",
});
assert.equal(
  focusedCommercialRange.success,
  true,
  "create contract must allow a focused or not-yet-estimated opportunity",
);

const negativeCommercialRange = createOpportunitySchema.safeParse({
  ...createPayload,
  estimatedProjectValue: "-1",
});
assert.equal(
  negativeCommercialRange.success,
  false,
  "create contract must reject negative opportunity values",
);

const invalidScore = createOpportunitySchema.safeParse({
  ...createPayload,
  urgencyScore: "6",
});
assert.equal(invalidScore.success, false, "scores must remain within 1–5");

const updateResult = updateOpportunitySchema.safeParse({
  opportunityId: "cm00000000000000000000001",
  stage: "PROPOSAL",
  probability: "65",
  estimatedProjectValue: "30000",
  currency: "USD",
  budget: "$25,000–$50,000",
  timeline: "3–6 months",
  outcomeReason: "",
  nextAction: "Review proposal with the decision maker.",
  nextFollowUp: "2026-08-14T10:00",
  assignedOwnerId: "cm00000000000000000000002",
});
assert.equal(updateResult.success, true, "update contract should accept commercial changes");

const closeWithoutReason = updateOpportunitySchema.safeParse({
  opportunityId: "cm00000000000000000000001",
  stage: "LOST",
  probability: "0",
  estimatedProjectValue: "30000",
  currency: "USD",
  budget: "",
  timeline: "",
  outcomeReason: "",
  nextAction: "",
  nextFollowUp: "",
  assignedOwnerId: "",
});
assert.equal(
  closeWithoutReason.success,
  false,
  "won and lost opportunities must capture a real outcome reason",
);

const closeWithReason = updateOpportunitySchema.safeParse({
  opportunityId: "cm00000000000000000000001",
  stage: "WON",
  probability: "100",
  estimatedProjectValue: "30000",
  currency: "USD",
  budget: "",
  timeline: "",
  outcomeReason: "Scope and commercial terms approved by the decision maker.",
  nextAction: "Schedule the kickoff.",
  nextFollowUp: "2026-08-18T09:00",
  assignedOwnerId: "",
});
assert.equal(closeWithReason.success, true);
assert.equal(
  moveOpportunitySchema.safeParse({
    opportunityId: "cm00000000000000000000001",
    stage: "LOST",
  }).success,
  false,
  "the quick pipeline mover must not bypass the outcome reason",
);

const researchUpdate = updateProspectResearchSchema.parse({
  opportunityId: "cm00000000000000000000001",
  currentWebsiteQuality: "2",
  operationalMaturity: "3",
  observedProblems: "Dispatch, lead ownership, and follow-up remain fragmented.",
  recentBusinessActivity: "A second service location opened.",
  personalizationAngle: "Connect the expansion to operational coordination needs.",
  researchNotes: "Verify the current scheduling system before outreach.",
  financialCapacityScore: "5",
  problemSeverityScore: "4",
  strategicFitScore: "5",
  urgencyScore: "3",
  decisionMakerAccessScore: "4",
});
assert.equal(researchUpdate.totalScore, 21, "research updates must recalculate the score");

const readFilters = opportunityFiltersSchema.safeParse({
  stage: "QUALIFIED",
  minScore: "15",
  minValue: "10000",
  followUp: "today",
  readiness: "ready",
});
assert.equal(readFilters.success, true, "read filters should parse safely");

const archiveResult = archiveOpportunitySchema.safeParse({
  opportunityId: "cm00000000000000000000001",
});
assert.equal(archiveResult.success, true, "archive contract should accept a valid record id");

const taskResult = createTaskSchema.safeParse({
  opportunityId: "cm00000000000000000000001",
  companyId: "cm00000000000000000000003",
  type: "FOLLOW_UP",
  priority: "HIGH",
  title: "Review discovery brief",
  dueAt: "2026-08-15T13:00",
  notes: "Confirm attendees and workflow evidence.",
});
assert.equal(taskResult.success, true, "task creation contract should parse");

assert.equal(calculateOpportunityScore({
  financialCapacityScore: 5,
  problemSeverityScore: 5,
  strategicFitScore: 5,
  urgencyScore: 5,
  decisionMakerAccessScore: 5,
}), 25);

assert.deepEqual(
  manualOutreachPlan.map((step) => step.dayOffset),
  [0, 3, 7, 14],
  "manual outreach must follow the requested cadence",
);
assert.equal(
  isProspectReady({
    websiteReviewed: true,
    mobileReviewed: true,
    businessModelUnderstood: true,
    decisionMakerIdentified: true,
    specificProblemIdentified: true,
    personalizationPrepared: true,
    contactMethodFound: true,
  }),
  true,
  "all research requirements should unlock outreach",
);
assert.equal(
  isProspectReady({
    websiteReviewed: true,
    mobileReviewed: true,
    businessModelUnderstood: true,
    decisionMakerIdentified: true,
    specificProblemIdentified: true,
    personalizationPrepared: false,
    contactMethodFound: true,
  }),
  false,
  "missing personalization must keep outreach locked",
);

assert.equal(hasAdminPermission("OWNER", "opportunity:archive"), true);
assert.equal(hasAdminPermission("OWNER", "operations:view"), true);
assert.equal(hasAdminPermission("OWNER", "operations:write"), true);
assert.equal(hasAdminPermission("OWNER", "operations:approve"), true);
assert.equal(hasAdminPermission("OWNER", "operations:policy"), true);
assert.equal(hasAdminPermission("ADMIN", "company:manage"), true);
assert.equal(hasAdminPermission("ADMIN", "operations:view"), false);
assert.equal(hasAdminPermission("ADMIN", "operations:write"), false);
assert.equal(hasAdminPermission("ADMIN", "operations:approve"), false);
assert.equal(hasAdminPermission("ADMIN", "operations:policy"), false);
assert.equal(hasAdminPermission("SALES", "opportunity:update"), true);
assert.equal(hasAdminPermission("SALES", "opportunity:archive"), false);
assert.equal(hasAdminPermission("SALES", "company:manage"), false);
assert.equal(hasAdminPermission("SALES", "operations:view"), false);

const operationsPages = [
  "../app/(admin)/admin/page.tsx",
  "../app/(admin)/admin/clients/page.tsx",
  "../app/(admin)/admin/clients/[id]/page.tsx",
  "../app/(admin)/admin/projects/page.tsx",
  "../app/(admin)/admin/projects/[id]/page.tsx",
  "../app/(admin)/admin/finance/page.tsx",
  "../app/(admin)/admin/finance/invoices/[id]/page.tsx",
  "../app/(admin)/admin/approvals/page.tsx",
  "../app/(admin)/admin/approvals/[id]/page.tsx",
  "../app/(admin)/admin/automations/page.tsx",
  "../app/(admin)/admin/automations/[id]/page.tsx",
  "../app/(admin)/admin/operations-policy/page.tsx",
];
for (const page of operationsPages) {
  assert.match(
    readFileSync(new URL(page, import.meta.url), "utf8"),
    /await requireFounderSession\(/,
    `${page} must enforce the founder boundary before loading operations data`,
  );
}
const adminLayoutSource = readFileSync(
  new URL("../app/(admin)/admin/layout.tsx", import.meta.url),
  "utf8",
);
assert.match(adminLayoutSource, /await requireAdminSession\(\)/);
assert.doesNotMatch(adminLayoutSource, /requireFounderSession/);
for (const legacyPage of [
  "../app/(admin)/admin/leads/page.tsx",
  "../app/(admin)/admin/accounts/page.tsx",
  "../app/(admin)/admin/companies/page.tsx",
  "../app/(admin)/admin/pipeline/page.tsx",
  "../app/(admin)/admin/tasks/page.tsx",
  "../app/(admin)/admin/marketing/page.tsx",
]) {
  assert.doesNotMatch(
    readFileSync(new URL(legacyPage, import.meta.url), "utf8"),
    /requireFounderSession/,
    `${legacyPage} must remain available under the established CRM permissions`,
  );
}
const operationsActionsSource = readFileSync(
  new URL("../app/(admin)/admin/coo-actions.ts", import.meta.url),
  "utf8",
);
assert.doesNotMatch(operationsActionsSource, /requireAdminSession\(/);
assert.match(operationsActionsSource, /requireFounderSession\("operations:view"\)/);
assert.match(operationsActionsSource, /requireFounderSession\("operations:write"\)/);
assert.match(operationsActionsSource, /requireFounderSession\("operations:approve"\)/);
const operationsNavigationSource = readFileSync(
  new URL("../components/admin/admin-navigation.tsx", import.meta.url),
  "utf8",
);
assert.match(operationsNavigationSource, /founderOnly: true/);
assert.match(operationsNavigationSource, /role === "OWNER"/);
const mcpAuthSource = readFileSync(
  new URL("../lib/coo/mcp/auth.ts", import.meta.url),
  "utf8",
);
assert.match(mcpAuthSource, /admin\.role !== "OWNER"/);

const mcpRegistrySource = readFileSync(
  new URL("../lib/coo/tools/registry.ts", import.meta.url),
  "utf8",
);
assert.match(mcpRegistrySource, /context\.origin === "mcp"/);
assert.match(mcpRegistrySource, /bucket: "mcp_total"/);
assert.match(mcpRegistrySource, /"mcp_run_operations"/);
const askSource = readFileSync(
  new URL("../lib/coo/ai/ask.ts", import.meta.url),
  "utf8",
);
assert.match(askSource, /actor\.role !== "OWNER"/);
assert.match(askSource, /bucket: "ask_trexiti"/);
const operationsPlannerSource = readFileSync(
  new URL("../lib/coo/ai/operations-planner.ts", import.meta.url),
  "utf8",
);
assert.match(operationsPlannerSource, /actor\.role !== "OWNER"/);
assert.match(operationsPlannerSource, /bucket: "operations_planning"/);

const limiter = new SlidingWindowRateLimiter();
const policy = { limit: 2, windowMs: 1_000 };
assert.deepEqual(limiter.consume("ask_trexiti:founder-1", policy, 0), {
  remaining: 1,
  resetAt: 1_000,
});
assert.deepEqual(limiter.consume("ask_trexiti:founder-1", policy, 100), {
  remaining: 0,
  resetAt: 1_000,
});
assert.throws(
  () => limiter.consume("ask_trexiti:founder-1", policy, 500),
  (error: unknown) =>
    error instanceof CooRateLimitError && error.retryAfterSeconds === 1,
);
assert.equal(
  limiter.consume("ask_trexiti:founder-2", policy, 500).remaining,
  1,
  "rate limits must be isolated per authenticated actor",
);
assert.equal(
  limiter.consume("ask_trexiti:founder-1", policy, 1_100).remaining,
  1,
  "the actor may retry after the complete sliding window",
);

console.log("Admin CRM CRUD contracts, scoring, permissions, and validation passed.");
