import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { loadWeekOneMarketingSeed } from "../lib/admin/marketing-seed";
import { marketingTimezone } from "../lib/admin/marketing";
import {
  getAllInsights,
  getInsightPublicationStatus,
  getPublishedInsightBySlug,
} from "../lib/content/insights";

const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const normalizedHash = (value: string) =>
  createHash("sha256").update(value.replace(/\r\n/g, "\n")).digest("hex");

const approvedSourceHashes = {
  "content/week_1_calendar.md":
    "2ce0e4110f829bfb83bf2636a8e52980b4e17bb96d01f5af26e897a8ed478f43",
  "content/week_1_posts.md":
    "d5167d6b3da0fda7f451c7fa4bf979bcc3d76b69b4eab3a6077703d70ce1350c",
  "materials/capability_statement.md":
    "bfe97820cabc2116141365e6f5c41092f4a7d2ebd3bfc2a3898be34cc6ac6991",
  "materials/systems_review.md":
    "8454246e9fd99fcfbf9a46a79da374edb220b864696aff1886f561e2cbf47980",
  "materials/friction_checklist.md":
    "979b3216d4c437800c4f96f186875a31d6b88c46698a20ad880c78f0de0ce671",
} as const;

for (const [path, approvedHash] of Object.entries(approvedSourceHashes)) {
  assert.equal(existsSync(new URL(path, root)), true, `${path} is required.`);
  assert.equal(
    normalizedHash(read(path)),
    approvedHash,
    `${path} differs from the approved launch-pack source.`,
  );
}

assert.equal(marketingTimezone, "America/Jamaica");

const publicBrandSources = [
  "app/(marketing)/page.tsx",
  "app/(marketing)/about/page.tsx",
  "app/(marketing)/services/page.tsx",
  "app/(marketing)/start-a-project/page.tsx",
  "components/marketing/site-footer.tsx",
  "lib/content/services.ts",
  "lib/content/site.ts",
  "lib/content/projects.ts",
  "materials/capability_statement.md",
].map(read).join("\n");

assert.match(publicBrandSources, /Digital systems for ambitious businesses\./);
assert.match(
  publicBrandSources,
  /Trexiti designs and builds the digital systems businesses use to sell, operate and grow\./,
);
for (const capability of [
  "Digital Experiences",
  "Custom Software",
  "Business Systems",
  "Automation & Integration",
]) {
  assert.match(publicBrandSources, new RegExp(capability.replace("&", "&(?:amp;)?")));
}
assert.match(
  publicBrandSources,
  /The right engagement is shaped by the problem.not the size (?:or prestige )?of the company\./,
);
assert.doesNotMatch(publicBrandSources, /\$\s*3,?000/i);
assert.doesNotMatch(publicBrandSources, /\bcheap\b|every budget/i);
assert.match(publicBrandSources, /AI-assisted workflows where useful/);
assert.equal(
  publicBrandSources.match(/\bAI\b/gi)?.length,
  1,
  "AI should appear only as an optional capability in core public brand copy.",
);
assert.match(read("lib/content/site.ts"), /label: "PropertyOS"/);
assert.doesNotMatch(read("lib/content/site.ts"), /label: "ServiceOS"/);
assert.doesNotMatch(
  read("components/marketing/marketing-chrome.tsx"),
  /href="\/service-businesses"/,
);
assert.match(
  read("app/service-businesses/page.tsx"),
  /!isServiceOsEnabled\(\)[\s\S]*notFound\(\)/,
);
assert.match(read("lib/content/projects.ts"), /conceptDisclaimer/);
assert.match(read("app/(marketing)/about/page.tsx"), /founder-led/i);

const seed = loadWeekOneMarketingSeed();
assert.equal(seed.campaigns.length, 4);
assert.equal(seed.content.length, 17);
assert.equal(seed.assets.length, 9);
assert.equal(seed.launchChecklist.length, 12);
assert.equal(seed.launchSources.length, 5);
assert.equal(seed.metrics.length, 4);
assert.equal(
  seed.content.every(
    (item) =>
      item.publishAt >= new Date("2026-08-11T00:00:00-05:00") &&
      item.publishAt <= new Date("2026-08-17T23:59:59-05:00"),
  ),
  true,
  "Every Week 1 content record must remain inside the launch window.",
);
assert.equal(seed.content.every((item) => item.status === "SCHEDULED"), true);
assert.equal(
  seed.assets.every(
    (asset) =>
      asset.status === "READY" || asset.status === "REQUESTED",
  ),
  true,
);
assert.equal(
  seed.assets
    .filter((asset) => asset.template)
    .every((asset) => Boolean(asset.altText?.trim())),
  true,
  "Every renderable launch graphic must include alt text.",
);
assert.equal(
  seed.launchChecklist.every(
    (item) => !("status" in item) && !("completedAt" in item),
  ),
  true,
  "Manual launch tasks must never be auto-completed by the seed.",
);
assert.deepEqual(
  seed.launchSources.map((source) => source.path).sort(),
  Object.keys(approvedSourceHashes).sort(),
);

const articleOne = getAllInsights().find(
  (article) => article.slug === "your-employees-shouldnt-be-your-api",
);
assert.ok(articleOne);
assert.equal(articleOne.publishedAt, "2026-08-14");
assert.equal(
  getInsightPublicationStatus(articleOne, new Date("2026-08-11T12:00:00-05:00")),
  "SCHEDULED",
);
assert.equal(
  getPublishedInsightBySlug(
    articleOne.slug,
    new Date("2026-08-11T12:00:00-05:00"),
  ),
  undefined,
  "Article 01 must not expose its detail route before August 14 in Jamaica.",
);
assert.equal(
  getInsightPublicationStatus(articleOne, new Date("2026-08-14T00:00:01-05:00")),
  "PUBLISHED",
);
for (const article of getAllInsights().filter((item) => item.slug !== articleOne.slug)) {
  assert.equal(
    getInsightPublicationStatus(article, new Date("2026-08-17T23:59:59-05:00")),
    "SCHEDULED",
    `${article.title} must remain scheduled after Week 1.`,
  );
}
assert.match(read("app/(marketing)/insights/page.tsx"), /Next field note \/ Scheduled/);

const schema = read("prisma/schema.prisma");
for (const salesContract of [
  /model AdminCompany/,
  /model AdminContact/,
  /model AdminProspectResearch/,
  /totalScore\s+Int/,
  /model AdminMessage/,
  /nextFollowUp\s+DateTime\?/,
  /source\s+String/,
  /projectLeadId\s+String\?/,
  /nextAction\s+String\?/,
  /stage\s+AdminOpportunityStage/,
  /estimatedValue\s+Decimal/,
  /probability\s+Int/,
  /model AdminProposal/,
  /outcomeReason\s+String\?/,
]) {
  assert.match(schema, salesContract);
}
assert.match(read("lib/admin/queries.ts"), /expectedRevenue/);
assert.match(read("lib/admin/marketing-queries.ts"), /DISCOVERY/);
assert.match(read("app/(admin)/admin/actions.ts"), /outcomeReason/);
assert.match(
  read("lib/admin/validation.ts"),
  /Record a reason before closing an opportunity as won or lost/,
);

for (const route of [
  "app/(marketing)/capabilities/overview/page.tsx",
  "app/(marketing)/media-kit/page.tsx",
  "app/(marketing)/privacy/page.tsx",
  "app/(marketing)/systems-review/page.tsx",
  "app/(marketing)/resources/business-systems-friction-checklist/page.tsx",
  "app/(admin)/admin/marketing/launch-readiness/page.tsx",
]) {
  assert.equal(existsSync(new URL(route, root)), true, `${route} is required.`);
}

const sitemapUrls = sitemap().map((entry) => entry.url);
assert.equal(
  sitemapUrls.includes("https://trexiti.com/service-businesses"),
  false,
  "Dormant ServiceOS must not be published in the sitemap.",
);
for (const path of [
  "/capabilities/overview",
  "/media-kit",
  "/privacy",
  "/systems-review",
  "/resources/business-systems-friction-checklist",
  "/insights",
]) {
  assert.equal(
    sitemapUrls.includes(`https://trexiti.com${path}`),
    true,
    `${path} must be present in the sitemap.`,
  );
}
const robotRules = robots().rules;
const disallowed = Array.isArray(robotRules)
  ? robotRules.flatMap((rule) => rule.disallow ?? [])
  : robotRules.disallow ?? [];
assert.equal(disallowed.includes("/admin"), true);

const migration = read(
  "prisma/migrations/20260811100000_launch_readiness/migration.sql",
);
assert.match(migration, /MarketingLaunchChecklistItem/);
assert.match(migration, /MarketingLaunchSource/);
assert.match(migration, /ADD COLUMN "outcomeReason" TEXT/);

console.log(
  "Launch sources, brand, content schedule, assets, manual checklist, sales tracking, routes, sitemap, robots and migration contracts passed.",
);
