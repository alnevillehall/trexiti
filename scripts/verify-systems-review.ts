import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import sitemap from "../app/sitemap";
import {
  frictionChecklistSections,
  frictionQuestionCount,
  frictionQuestionId,
  getChecklistResult,
  getFrictionResultTier,
  scoreFrictionChecklist,
  type FrictionAnswerMap,
} from "../lib/content/friction-checklist";
import { buildSystemsReviewLeadData } from "../lib/marketing/systems-review-lead";
import { systemsReviewSubmissionSchema } from "../lib/validation/project-lead";

const questions = frictionChecklistSections.flatMap(
  (section) => section.questions,
);
assert.equal(frictionQuestionCount, 20);
assert.equal(questions.length, 20);
assert.equal(
  createHash("sha256").update(questions.join("\n")).digest("hex"),
  "3b4ad3739c79c811f30b9122f9ab9d2c7dacaa90fca62286405f3af1011645d8",
  "The checklist must retain the exact approved 20 statements.",
);

const answers = Object.fromEntries(
  frictionChecklistSections.flatMap((section) =>
    section.questions.map((_, index) => [
      frictionQuestionId(section.id, index),
      1,
    ]),
  ),
) as FrictionAnswerMap;
assert.equal(scoreFrictionChecklist(answers), 20);
assert.equal(getChecklistResult(answers).tier.label, "System fragmentation");

for (const [score, expected] of [
  [0, "Contained friction"],
  [8, "Contained friction"],
  [9, "Growing coordination cost"],
  [18, "Growing coordination cost"],
  [19, "System fragmentation"],
  [30, "System fragmentation"],
  [31, "Operating model at risk"],
  [40, "Operating model at risk"],
] as const) {
  assert.equal(getFrictionResultTier(score).label, expected);
}

const highOperationsAnswers = { ...answers };
for (let index = 0; index < 5; index += 1) {
  highOperationsAnswers[frictionQuestionId("work-operations", index)] = 2;
}
for (let index = 0; index < 5; index += 1) {
  highOperationsAnswers[frictionQuestionId("information-tools", index)] = 0;
}
assert.equal(
  getChecklistResult(highOperationsAnswers).highestSection.id,
  "work-operations",
);
assert.equal(
  getChecklistResult(highOperationsAnswers).highestSection.nextActions.length,
  3,
);

const validReviewSubmission = {
  formToken: "x".repeat(50),
  companyFax: "",
  companyName: "Trexiti QA Company",
  name: "Jordan Ellis",
  email: "jordan@example.com",
  role: "Operations Director",
  companyWebsite: "https://example.com",
  workflowProblem:
    "Customer requests enter through several channels and ownership becomes unclear before scheduling.",
  currentTools: "WhatsApp, spreadsheets, calendar and accounting software",
  desiredOutcome:
    "Create one visible path from request through completed work and invoicing.",
  companyStage: "Growing",
  preferredContactMethod: "Work email",
  consent: true,
  firstTouchSource: "qa",
  firstTouchMedium: "validation",
  firstTouchCampaign: "systems-review",
  lastTouchSource: "qa",
  lastTouchMedium: "validation",
  lastTouchCampaign: "systems-review",
  landingPage: "/systems-review",
  referrer: "https://example.com/operations",
};

const validReview = systemsReviewSubmissionSchema.safeParse(
  validReviewSubmission,
);
assert.equal(validReview.success, true);
assert.equal(
  systemsReviewSubmissionSchema.safeParse({
    ...validReviewSubmission,
    email: "not-an-email",
    workflowProblem: "Too short",
    consent: false,
  }).success,
  false,
);

if (validReview.success) {
  const persisted = buildSystemsReviewLeadData(
    validReview.data,
    "qa-fingerprint",
    new Date("2026-08-10T12:00:00Z"),
  );
  assert.equal(persisted.projectType, "SYSTEMS_REVIEW");
  assert.equal(persisted.source, "systems_review_page");
  assert.equal(persisted.consentedAt.toISOString(), "2026-08-10T12:00:00.000Z");
  assert.equal(persisted.requestFingerprint, "qa-fingerprint");
  assert.match(persisted.qualificationSummary, /Desired outcome:/);
  assert.equal(persisted.existingSystems.length, 1);
}

const checklistSource = readFileSync(
  new URL("../components/marketing/friction-checklist.tsx", import.meta.url),
  "utf8",
);
const reviewFormSource = readFileSync(
  new URL("../components/marketing/systems-review-form.tsx", import.meta.url),
  "utf8",
);
const actionSource = readFileSync(
  new URL("../app/(marketing)/start-a-project/actions.ts", import.meta.url),
  "utf8",
);
const reviewPageSource = readFileSync(
  new URL("../app/(marketing)/systems-review/page.tsx", import.meta.url),
  "utf8",
);
const checklistPageSource = readFileSync(
  new URL(
    "../app/(marketing)/resources/business-systems-friction-checklist/page.tsx",
    import.meta.url,
  ),
  "utf8",
);

for (const eventName of [
  "systems_review_view",
  "systems_review_form_started",
  "systems_review_submitted",
]) {
  assert.match(reviewFormSource, new RegExp(`"${eventName}"`));
}

for (const eventName of [
  "friction_checklist_started",
  "friction_checklist_completed",
  "friction_checklist_tier",
  "friction_checklist_email_requested",
]) {
  assert.match(checklistSource, new RegExp(`"${eventName}"`));
}

for (const analyticsCall of [
  ...reviewFormSource.matchAll(
    /trackMarketingEvent\([\s\S]*?\);/g,
  ),
  ...checklistSource.matchAll(
    /trackMarketingEvent\([\s\S]*?\);/g,
  ),
]) {
  assert.doesNotMatch(
    analyticsCall[0],
    /\b(email|name|companyName|workflowProblem|currentTools|desiredOutcome|answers)\s*:/,
    "Analytics must not contain personal details or checklist answers.",
  );
}

assert.doesNotMatch(checklistSource, /localStorage|sessionStorage|fetch\(/);
assert.match(checklistSource, /window\.location\.href = `mailto:/);
assert.match(checklistSource, /nothing is submitted to Trexiti/i);
assert.match(actionSource, /buildSystemsReviewLeadData/);
assert.match(actionSource, /submitSystemsReviewLead/);
assert.match(actionSource, /await prisma\.projectLead\.create/);
assert.match(reviewPageSource, /\/resources\/business-systems-friction-checklist/);
assert.match(checklistSource, /\/systems-review/);
assert.doesNotMatch(reviewPageSource, /FAQPage/);
assert.doesNotMatch(checklistPageSource, /FAQPage/);
assert.equal(
  sitemap().some(
    (entry) =>
      entry.url ===
      "https://trexiti.com/resources/business-systems-friction-checklist",
  ),
  true,
);

console.log(
  "Systems Review persistence, checklist scoring, privacy, analytics, links, and SEO checks passed.",
);
