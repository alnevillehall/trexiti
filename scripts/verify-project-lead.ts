import assert from "node:assert/strict";

import { projectLeadSubmissionSchema } from "../lib/validation/project-lead";

const validSubmission = {
  formToken: "x".repeat(50),
  companyFax: "",
  projectType: "Business System",
  objectives: ["Replace manual processes"],
  otherObjective: "",
  companyName: "Trexiti QA Company",
  companyWebsite: "https://example.com",
  industry: "Professional services",
  companySize: "11–50 people",
  location: "Kingston, Jamaica",
  challenge:
    "Customer requests are fragmented across several systems and need one governed operational workflow.",
  existingSystems: ["Spreadsheets", "Email"],
  otherSystem: "",
  budgetRange: "$10,000 – $25,000",
  timeline: "1–2 months",
  name: "Jordan Ellis",
  email: "jordan@example.com",
  phone: "",
  role: "Operations Director",
  consent: true,
  utmSource: "qa",
  utmMedium: "validation",
  utmCampaign: "project-qualification",
};

const validResult = projectLeadSubmissionSchema.safeParse(validSubmission);
assert.equal(validResult.success, true, "A complete qualified lead should validate.");

const invalidResult = projectLeadSubmissionSchema.safeParse({
  ...validSubmission,
  budgetRange: "$1,000",
  challenge: "Too short",
  consent: false,
  objectives: ["Other"],
  otherObjective: "",
});

assert.equal(invalidResult.success, false, "Invalid commercial and consent data must fail.");

if (!invalidResult.success) {
  const invalidFields = new Set(
    invalidResult.error.issues.map((issue) => String(issue.path[0])),
  );
  assert.equal(invalidFields.has("budgetRange"), true);
  assert.equal(invalidFields.has("challenge"), true);
  assert.equal(invalidFields.has("consent"), true);
}

const incompleteOtherResult = projectLeadSubmissionSchema.safeParse({
  ...validSubmission,
  objectives: ["Other"],
  otherObjective: "",
});
assert.equal(incompleteOtherResult.success, false);
if (!incompleteOtherResult.success) {
  assert.equal(
    incompleteOtherResult.error.issues.some(
      (issue) => issue.path[0] === "otherObjective",
    ),
    true,
  );
}

console.log("Project lead validation checks passed.");
