import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import {
  buildTaggedUrl,
  getMarketingCalendarRange,
  normalizeUtmValue,
  parseJamaicaDateTimeLocal,
  parseWeekOneCalendar,
  parseWeekOnePosts,
} from "../lib/admin/marketing";
import {
  buildWeekOneMarketingSeed,
  loadWeekOneMarketingSeed,
} from "../lib/admin/marketing-seed";
import { hasAdminPermission } from "../lib/admin/permissions";

const calendarMarkdown = readFileSync(
  new URL("../content/week_1_calendar.md", import.meta.url),
  "utf8",
);
const postsMarkdown = readFileSync(
  new URL("../content/week_1_posts.md", import.meta.url),
  "utf8",
);
const capabilityStatement = readFileSync(
  new URL("../materials/capability_statement.md", import.meta.url),
  "utf8",
);
const systemsReview = readFileSync(
  new URL("../materials/systems_review.md", import.meta.url),
  "utf8",
);
const frictionChecklist = readFileSync(
  new URL("../materials/friction_checklist.md", import.meta.url),
  "utf8",
);

assert.equal(
  createHash("sha256").update(calendarMarkdown).digest("hex"),
  "2ce0e4110f829bfb83bf2636a8e52980b4e17bb96d01f5af26e897a8ed478f43",
  "The approved Week 1 calendar changed unexpectedly.",
);
assert.equal(
  createHash("sha256").update(postsMarkdown).digest("hex"),
  "d5167d6b3da0fda7f451c7fa4bf979bcc3d76b69b4eab3a6077703d70ce1350c",
  "The approved Week 1 post copy changed unexpectedly.",
);
assert.equal(Object.keys(parseWeekOneCalendar(calendarMarkdown)).length, 7);
assert.equal(Object.keys(parseWeekOnePosts(postsMarkdown)).length, 7);

const seed = loadWeekOneMarketingSeed();
const secondSeed = buildWeekOneMarketingSeed({
  calendarMarkdown,
  postsMarkdown,
  articleBody: readFileSync(
    new URL(
      "../content/insights/your-employees-shouldnt-be-your-api.md",
      import.meta.url,
    ),
    "utf8",
  ),
  capabilityStatement,
  systemsReview,
  frictionChecklist,
});
assert.deepEqual(seed.sourceHashes, secondSeed.sourceHashes);
assert.equal(seed.campaigns.length, 4);
assert.deepEqual(
  seed.campaigns.map((campaign) => campaign.name),
  [
    "Trexiti Brand Relaunch",
    "Your Employees Shouldn't Be Your API",
    "Trexiti Systems Review",
    "Small Scope. Same Standard.",
  ],
);
assert.equal(seed.content.length, 17);
assert.equal(seed.assets.length, 9);
assert.equal(seed.channels.length, 7);
assert.equal(seed.metrics.length, 4);
assert.equal(seed.presets.length, 10);
assert.equal(seed.launchChecklist.length, 12);
assert.equal(seed.launchSources.length, 5);
assert.equal(seed.launchChecklist.every((item) => !("status" in item)), true);
assert.equal(
  seed.launchChecklist.some((item) => item.title === "Social URLs added to site configuration"),
  true,
);
assert.equal(seed.sourceHashes.capabilityStatement, "bfe97820cabc2116141365e6f5c41092f4a7d2ebd3bfc2a3898be34cc6ac6991");
assert.equal(seed.sourceHashes.systemsReview, "8454246e9fd99fcfbf9a46a79da374edb220b864696aff1886f561e2cbf47980");
assert.equal(seed.sourceHashes.frictionChecklist, "979b3216d4c437800c4f96f186875a31d6b88c46698a20ad880c78f0de0ce671");

for (const records of [
  seed.campaigns,
  seed.content,
  seed.assets,
  seed.metrics,
  seed.presets,
  seed.launchChecklist,
  seed.launchSources,
]) {
  const keys = records.map((record) => record.seedKey);
  assert.equal(new Set(keys).size, keys.length, "Seed keys must be unique for idempotent upserts.");
}
assert.equal(
  seed.content.find((item) => item.seedKey === "week1-d1-linkedin-founder")?.body,
  parseWeekOnePosts(postsMarkdown)[1]["Al's LinkedIn post"],
);
assert.match(
  seed.content.find((item) => item.seedKey === "week1-d2-linkedin-carousel")?.body ?? "",
  /YOUR EMPLOYEES\nSHOULDN'T BE YOUR API\./,
);
assert.equal(
  seed.content.find((item) => item.seedKey === "week1-d1-linkedin-founder")?.publishAt.toISOString(),
  "2026-08-11T12:30:00.000Z",
  "Seeded schedule must preserve America/Jamaica UTC-05:00 time.",
);
assert.equal(
  parseJamaicaDateTimeLocal("2026-08-11T07:30").toISOString(),
  "2026-08-11T12:30:00.000Z",
);

assert.equal(normalizeUtmValue(" Your Employees Shouldn't Be Your API "), "your-employees-shouldnt-be-your-api");
assert.equal(
  buildTaggedUrl({
    destination: "https://www.trexiti.com/systems-review?ref=launch",
    source: "LinkedIn Founder",
    medium: "Organic Social",
    campaign: "Trexiti Systems Review",
    content: "Direct Offer",
  }),
  "https://www.trexiti.com/systems-review?ref=launch&utm_source=linkedin-founder&utm_medium=organic-social&utm_campaign=trexiti-systems-review&utm_content=direct-offer",
);
assert.throws(() =>
  buildTaggedUrl({
    destination: "ftp://example.com/file",
    source: "email",
    medium: "email",
    campaign: "launch",
  }),
);

const weekRange = getMarketingCalendarRange("week", "2026-08-11");
assert.equal(weekRange.start.toISOString(), "2026-08-10T05:00:00.000Z");
assert.equal(weekRange.end.toISOString(), "2026-08-17T05:00:00.000Z");
const monthRange = getMarketingCalendarRange("month", "2026-08-11");
assert.equal((monthRange.end.getTime() - monthRange.start.getTime()) / 86_400_000, 31);

assert.equal(hasAdminPermission("OWNER", "marketing:manage"), true);
assert.equal(hasAdminPermission("ADMIN", "marketing:manage"), true);
assert.equal(hasAdminPermission("SALES", "marketing:view"), true);
assert.equal(hasAdminPermission("SALES", "marketing:manage"), false);

const routeFiles = [
  "../app/(admin)/admin/marketing/page.tsx",
  "../app/(admin)/admin/marketing/calendar/page.tsx",
  "../app/(admin)/admin/marketing/content/page.tsx",
  "../app/(admin)/admin/marketing/campaigns/page.tsx",
  "../app/(admin)/admin/marketing/assets/page.tsx",
  "../app/(admin)/admin/marketing/channels/page.tsx",
  "../app/(admin)/admin/marketing/metrics/page.tsx",
  "../app/(admin)/admin/marketing/utm/page.tsx",
  "../app/(admin)/admin/marketing/launch-readiness/page.tsx",
];
for (const route of routeFiles) {
  assert.equal(existsSync(new URL(route, import.meta.url)), true, `Missing route ${route}`);
}
const actionsSource = readFileSync(
  new URL("../app/(admin)/admin/marketing/actions.ts", import.meta.url),
  "utf8",
);
const queriesSource = readFileSync(
  new URL("../lib/admin/marketing-queries.ts", import.meta.url),
  "utf8",
);
const calendarSource = readFileSync(
  new URL("../app/(admin)/admin/marketing/calendar/page.tsx", import.meta.url),
  "utf8",
);
const schemaSource = readFileSync(
  new URL("../prisma/schema.prisma", import.meta.url),
  "utf8",
);
const migrationSource = readFileSync(
  new URL(
    "../prisma/migrations/20260811043000_marketing_os/migration.sql",
    import.meta.url,
  ),
  "utf8",
);
const launchMigrationSource = readFileSync(
  new URL(
    "../prisma/migrations/20260811100000_launch_readiness/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

for (const model of ["MarketingLaunchChecklistItem", "MarketingLaunchSource"]) {
  assert.match(schemaSource, new RegExp(`model ${model}`));
  assert.match(launchMigrationSource, new RegExp(`CREATE TABLE "${model}"`));
}

assert.doesNotMatch(actionsSource, /export function /, "Every exported server action must be async.");
assert.match(actionsSource, /requireAdminSession\("marketing:manage"\)/);
assert.match(queriesSource, /requireAdminSession\("marketing:view"\)/);
for (const filter of ["primaryChannel", "pillar", "campaignId", "status"]) {
  assert.match(queriesSource, new RegExp(filter));
}
assert.match(calendarSource, /"month", "week", "agenda"/);
assert.match(calendarSource, /more than two pieces share the same Jamaica-time hour/);
assert.match(calendarSource, /Copy prepared post/);
for (const model of [
  "MarketingCampaign",
  "MarketingContent",
  "MarketingAsset",
  "MarketingChannelProfile",
  "MarketingWeeklyMetric",
  "MarketingOutboundActivity",
  "MarketingUtmPreset",
]) {
  assert.match(schemaSource, new RegExp(`model ${model}`));
  assert.match(migrationSource, new RegExp(`CREATE TABLE "${model}"`));
}
assert.doesNotMatch(schemaSource, /socialPassword|accessToken|refreshToken/i);
assert.doesNotMatch(actionsSource, /linkedin\.com\/api|instagram\.com\/api|auto.?post|scrap/i);

console.log(
  "Marketing OS routes, source fidelity, permissions, timezone, UTM generation, filters, seed idempotency and migration contracts passed.",
);
