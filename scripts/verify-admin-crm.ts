import assert from "node:assert/strict";

import {
  calculateOpportunityScore,
  isProspectReady,
  manualOutreachPlan,
  opportunityHeat,
  opportunityHeatLabel,
} from "../lib/admin/crm";
import { hasAdminPermission } from "../lib/admin/permissions";
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
assert.equal(hasAdminPermission("ADMIN", "company:manage"), true);
assert.equal(hasAdminPermission("SALES", "opportunity:update"), true);
assert.equal(hasAdminPermission("SALES", "opportunity:archive"), false);
assert.equal(hasAdminPermission("SALES", "company:manage"), false);

console.log("Admin CRM CRUD contracts, scoring, permissions, and validation passed.");
