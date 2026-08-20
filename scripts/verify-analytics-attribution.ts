import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { loadWeekOneMarketingSeed } from "../lib/admin/marketing-seed";
import {
  createAttributionTouch,
  toLeadAttribution,
  updateAttributionState,
} from "../lib/marketing/attribution";
import {
  marketingEventNames,
  marketingEventPropertyAllowList,
} from "../lib/marketing/analytics-schema";

const firstTouch = createAttributionTouch({
  url: "https://trexiti.com/insights/your-employees-shouldnt-be-your-api?utm_source=linkedin&utm_medium=founder-organic&utm_campaign=employees-shouldnt-be-api&utm_content=carousel&utm_term=operations",
  referrer: "https://www.linkedin.com/feed/",
  timestamp: "2026-08-11T12:00:00.000Z",
});
let state = updateAttributionState(null, firstTouch, { newSession: true });

const sameSessionPage = createAttributionTouch({
  url: "https://trexiti.com/services/business-systems",
  referrer: "https://trexiti.com/insights/your-employees-shouldnt-be-your-api",
  timestamp: "2026-08-11T12:05:00.000Z",
});
state = updateAttributionState(state, sameSessionPage, { newSession: false });
assert.equal(state.firstTouch.source, "linkedin");
assert.equal(state.firstTouch.campaign, "employees-shouldnt-be-api");
assert.equal(state.firstTouch.content, "carousel");
assert.equal(state.firstTouch.term, "operations");
assert.equal(state.firstTouch.timestamp, "2026-08-11T12:00:00.000Z");
assert.equal(state.lastTouch.source, "linkedin");
assert.equal(state.lastTouch.timestamp, "2026-08-11T12:05:00.000Z");
assert.equal(state.isReturning, false);

const returnVisit = createAttributionTouch({
  url: "https://trexiti.com/start-a-project",
  timestamp: "2026-08-13T09:00:00.000Z",
});
state = updateAttributionState(state, returnVisit, { newSession: true });
const leadAttribution = toLeadAttribution(state);
assert.equal(leadAttribution.firstTouchSource, "linkedin");
assert.equal(leadAttribution.firstTouchCampaign, "employees-shouldnt-be-api");
assert.equal(leadAttribution.lastTouchSource, "direct");
assert.equal(leadAttribution.lastTouchMedium, "none");
assert.equal(leadAttribution.landingPage, "/insights/your-employees-shouldnt-be-your-api");
assert.equal(leadAttribution.isReturning, true);

const direct = createAttributionTouch({
  url: "https://trexiti.com/",
  timestamp: "2026-08-11T12:00:00.000Z",
});
const directState = updateAttributionState(null, direct, { newSession: true });
assert.equal(directState.firstTouch.source, "direct");
assert.equal(directState.firstTouch.medium, "none");

const requiredEvents = [
  "page_view",
  "primary_cta_clicked",
  "start_project_clicked",
  "project_form_view",
  "project_form_started",
  "project_form_step_completed",
  "project_form_submitted",
  "project_form_error",
  "systems_review_view",
  "systems_review_submitted",
  "friction_checklist_started",
  "friction_checklist_completed",
  "insight_view",
  "insight_cta_clicked",
  "capability_statement_view",
  "capability_statement_download",
  "email_link_clicked",
  "whatsapp_link_clicked",
  "social_link_clicked",
  "case_study_view",
  "outbound_audit_link_viewed",
] as const;
for (const eventName of requiredEvents) {
  assert.equal(marketingEventNames.includes(eventName), true, `Missing event ${eventName}`);
}

const forbiddenProperties = new Set([
  "name",
  "email",
  "phone",
  "company",
  "company_name",
  "workflow",
  "workflow_description",
  "answers",
  "textarea",
  "description",
]);
for (const [eventName, properties] of Object.entries(marketingEventPropertyAllowList)) {
  assert.equal(
    properties.some((property) => forbiddenProperties.has(property)),
    false,
    `${eventName} exposes a forbidden analytics property.`,
  );
}

const seed = loadWeekOneMarketingSeed();
const requiredPresets = [
  ["linkedin", "founder-organic"],
  ["linkedin", "company-organic"],
  ["instagram", "organic-social"],
  ["direct-email", "warm-outreach"],
  ["direct-email", "cold-outreach"],
  ["whatsapp", "direct-message"],
  ["private-audit", "account-based-outreach"],
] as const;
for (const [source, medium] of requiredPresets) {
  assert.equal(
    seed.presets.some((preset) => preset.source === source && preset.medium === medium),
    true,
    `Missing UTM standard ${source} / ${medium}`,
  );
}
assert.deepEqual(
  new Set(seed.campaigns.map((campaign) => campaign.utmCampaign)),
  new Set([
    "trexiti-relaunch-2026",
    "employees-shouldnt-be-api",
    "systems-review",
    "focused-build",
  ]),
);

const projectForm = readFileSync(
  new URL("../components/marketing/project-qualification-form.tsx", import.meta.url),
  "utf8",
);
const systemsReviewForm = readFileSync(
  new URL("../components/marketing/systems-review-form.tsx", import.meta.url),
  "utf8",
);
const actionSource = readFileSync(
  new URL("../app/(marketing)/start-a-project/actions.ts", import.meta.url),
  "utf8",
);
const systemsLeadSource = readFileSync(
  new URL("../lib/marketing/systems-review-lead.ts", import.meta.url),
  "utf8",
);
const eventRoute = readFileSync(
  new URL("../app/api/analytics/events/route.ts", import.meta.url),
  "utf8",
);
const privacySource = readFileSync(
  new URL("../app/(marketing)/privacy/page.tsx", import.meta.url),
  "utf8",
);
const migrationSource = readFileSync(
  new URL(
    "../prisma/migrations/20260811080000_analytics_attribution/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

assert.match(projectForm, /getLeadAttribution\(\)/);
assert.match(systemsReviewForm, /getLeadAttribution\(\)/);
for (const field of [
  "firstTouchContent",
  "firstTouchTerm",
  "firstTouchAt",
  "lastTouchContent",
  "lastTouchTerm",
  "lastTouchAt",
  "isReturning",
]) {
  assert.match(actionSource, new RegExp(field));
  assert.match(systemsLeadSource, new RegExp(field));
  assert.match(migrationSource, new RegExp(field));
}
assert.match(eventRoute, /NEXT_PUBLIC_TREXITI_ANALYTICS_PROVIDER !== "first-party"/);
assert.match(eventRoute, /marketingEventPropertyAllowList/);
assert.match(eventRoute, /EVENT_RETENTION_MS/);
assert.doesNotMatch(eventRoute, /user-agent|x-forwarded-for|ipAddress|email|phone/i);
assert.match(privacySource, /no advertising pixels/i);
assert.match(privacySource, /Do Not Track is honored/i);
assert.match(privacySource, /AnalyticsPreferencesButton/);

console.log(
  "Analytics event safety, direct/multi-page/repeat attribution, UTM standards, lead persistence and privacy contracts passed.",
);
