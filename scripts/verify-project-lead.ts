import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  engagementShapeOptions,
  investmentContextOptions,
} from "../lib/content/project-qualification";
import { projectLeadSubmissionSchema } from "../lib/validation/project-lead";

const validSubmission = {
  formToken: "x".repeat(50),
  companyFax: "",
  projectType: "Business System",
  objectives: ["Replace a manual process", "Improve operational visibility"],
  otherObjective: "",
  companyName: "Trexiti QA Company",
  companyWebsite: "https://example.com",
  industry: "Professional services",
  companyStage: "Growing",
  teamSize: "18",
  location: "Kingston, Jamaica",
  customerServiceArea: "Jamaica and the Caribbean",
  currentState:
    "Customer requests begin in email, move into a spreadsheet, and are assigned manually by an operations lead.",
  friction:
    "The team repeats data entry, cannot see ownership clearly, and customers have to ask for status updates.",
  existingSystems: ["Spreadsheets", "Email"],
  otherSystem: "",
  importantTools: "The accounting platform should remain connected.",
  engagementShape: "Focused Build",
  investmentContext: "I have a defined range",
  investmentNotes: "A range is defined internally and can be discussed.",
  timeline: "Within 1–2 months",
  name: "Jordan Ellis",
  email: "jordan@example.com",
  phone: "",
  role: "Operations Director",
  preferredContactMethod: "Work email",
  consent: true,
  firstTouchSource: "qa",
  firstTouchMedium: "validation",
  firstTouchCampaign: "project-intake",
  lastTouchSource: "qa",
  lastTouchMedium: "validation",
  lastTouchCampaign: "project-intake",
  landingPage: "/start-a-project",
  referrer: "https://example.com/services",
};

const validResult = projectLeadSubmissionSchema.safeParse(validSubmission);
assert.equal(validResult.success, true, "A complete project lead should validate.");

const focusedBuildWithoutPriceResult = projectLeadSubmissionSchema.safeParse({
  ...validSubmission,
  companyWebsite: "",
  teamSize: "",
  investmentContext: "I want to begin with the smallest valuable phase",
  investmentNotes: "",
});
assert.equal(
  focusedBuildWithoutPriceResult.success,
  true,
  "A focused engagement should validate without a website, team size, or price range.",
);

const invalidResult = projectLeadSubmissionSchema.safeParse({
  ...validSubmission,
  investmentContext: "$1,000",
  currentState: "Too short",
  consent: false,
});

assert.equal(invalidResult.success, false, "Invalid option and consent data must fail.");

if (!invalidResult.success) {
  const invalidFields = new Set(
    invalidResult.error.issues.map((issue) => String(issue.path[0])),
  );
  assert.equal(invalidFields.has("investmentContext"), true);
  assert.equal(invalidFields.has("currentState"), true);
  assert.equal(invalidFields.has("consent"), true);
}

const incompleteOtherObjectiveResult = projectLeadSubmissionSchema.safeParse({
  ...validSubmission,
  objectives: ["Other"],
  otherObjective: "",
});
assert.equal(incompleteOtherObjectiveResult.success, false);
if (!incompleteOtherObjectiveResult.success) {
  assert.equal(
    incompleteOtherObjectiveResult.error.issues.some(
      (issue) => issue.path[0] === "otherObjective",
    ),
    true,
  );
}

const incompleteOtherSystemResult = projectLeadSubmissionSchema.safeParse({
  ...validSubmission,
  existingSystems: ["Other"],
  otherSystem: "",
});
assert.equal(incompleteOtherSystemResult.success, false);
if (!incompleteOtherSystemResult.success) {
  assert.equal(
    incompleteOtherSystemResult.error.issues.some(
      (issue) => issue.path[0] === "otherSystem",
    ),
    true,
  );
}

const formSource = readFileSync(
  new URL("../components/marketing/project-qualification-form.tsx", import.meta.url),
  "utf8",
);
const actionSource = readFileSync(
  new URL("../app/(marketing)/start-a-project/actions.ts", import.meta.url),
  "utf8",
);

for (const eventName of [
  "project_form_view",
  "project_form_started",
  "project_form_step_completed",
  "project_form_submitted",
  "project_form_error",
  "engagement_shape_selected",
]) {
  assert.match(formSource, new RegExp(`"${eventName}"`));
}

for (const analyticsCall of formSource.matchAll(
  /trackQualificationEvent\(\s*"[^"]+"[\s\S]*?\n\s*\);/g,
)) {
  assert.doesNotMatch(
    analyticsCall[0],
    /\b(currentState|friction|importantTools|investmentNotes|email|phone|name)\s*:/,
    "Analytics calls must not include sensitive or free-text fields.",
  );
}

assert.doesNotMatch(
  JSON.stringify({ engagementShapeOptions, investmentContextOptions }),
  /\$\s*\d|minimum/i,
  "Engagement and investment choices must not publish a price anchor.",
);
assert.match(actionSource, /const recentDuplicate = await prisma\.projectLead\.findFirst/);
assert.match(actionSource, /if \(!recentDuplicate\)/);
assert.match(formSource, /Thanks — the context has been received\./);

console.log("Project lead validation checks passed.");
