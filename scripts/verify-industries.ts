import assert from "node:assert/strict";

import { industries } from "../lib/content/industries";

const expectedSlugs = [
  "property-development",
  "real-estate",
  "hospitality",
  "healthcare",
  "professional-services",
  "construction",
  "logistics",
] as const;

assert.deepEqual(
  industries.map((industry) => industry.slug),
  expectedSlugs,
  "only the seven reviewed industry routes should be generated",
);
assert.equal(
  new Set(industries.map((industry) => industry.slug)).size,
  industries.length,
  "industry slugs must be unique",
);

for (const industry of industries) {
  assert.ok(industry.metaTitle.length <= 60, `${industry.slug} title is too long`);
  assert.ok(
    industry.metaDescription.length >= 120 &&
      industry.metaDescription.length <= 165,
    `${industry.slug} description should be suitable for search snippets`,
  );
  assert.ok(industry.problems.length >= 4, `${industry.slug} needs substantive problems`);
  assert.ok(
    industry.digitalExperiences.length >= 4,
    `${industry.slug} needs substantive digital capabilities`,
  );
  assert.ok(
    industry.operationalSystems.length >= 5,
    `${industry.slug} needs substantive operational capabilities`,
  );
  assert.ok(industry.automations.length >= 4, `${industry.slug} needs workflow examples`);
  assert.ok(industry.integrations.length >= 6, `${industry.slug} needs integration context`);
  assert.equal(industry.engagement.length, 4, `${industry.slug} needs a complete engagement model`);
  assert.ok(industry.systemFlow.length >= 6, `${industry.slug} needs a connected operating flow`);

  for (const automation of industry.automations) {
    assert.ok(
      automation.flow.length >= 4,
      `${industry.slug}/${automation.title} needs an end-to-end workflow`,
    );
  }
}

console.log("Industry route, metadata, and substantive-content checks passed.");
