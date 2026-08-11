import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import {
  brandAssetFormats,
  brandAssetTemplates,
  brandAssetTokens,
  defaultBrandAssetDraft,
  getBrandAssetIssues,
  parseApprovedCarouselSlides,
} from "../lib/admin/brand-assets";
import { createStoredZip } from "../lib/admin/brand-asset-zip";
import { loadWeekOneMarketingSeed } from "../lib/admin/marketing-seed";
import { brandAssetDesignSchema } from "../lib/admin/marketing-validation";

assert.deepEqual(brandAssetTokens, {
  paper: "#f1f0eb",
  paperSecondary: "#e6e5df",
  paperElevated: "#faf9f5",
  ink: "#151613",
  inkSecondary: "#454740",
  muted: "#61645c",
  olive: "#626a50",
  oliveSoft: "#dfe1d3",
  inverse: "#f7f5ef",
});

assert.deepEqual(brandAssetTemplates.map((template) => template.label), [
  "Brand Statement",
  "System Flow",
  "Fragmented vs Connected",
  "Insight Article",
  "Carousel",
  "Case Study",
  "Focused Build",
  "Systems Review",
]);

assert.deepEqual(
  brandAssetFormats.map(({ id, width, height }) => [id, width, height]),
  [
    ["LINKEDIN_FEED", 1200, 627],
    ["LINKEDIN_SQUARE", 1200, 1200],
    ["INSTAGRAM_PORTRAIT", 1080, 1350],
    ["INSTAGRAM_SQUARE", 1080, 1080],
    ["INSTAGRAM_STORY", 1080, 1920],
    ["LINKEDIN_PERSONAL_COVER", 1584, 396],
    ["LINKEDIN_COMPANY_COVER", 4200, 700],
    ["LOGO_AVATAR", 400, 400],
    ["OPEN_GRAPH", 1200, 630],
  ],
);

const posts = readFileSync(new URL("../content/week_1_posts.md", import.meta.url), "utf8");
const dayTwoCopy = posts.match(/### Carousel: Your Employees Shouldn't Be Your API\s+([\s\S]*?)\n### LinkedIn caption/)?.[1].trim() ?? "";
const dayFiveCopy = posts.match(/### Instagram carousel copy\s+([\s\S]*?)\n### Instagram caption/)?.[1].trim() ?? "";
const dayTwoSlides = parseApprovedCarouselSlides(dayTwoCopy);
const dayFiveSlides = parseApprovedCarouselSlides(dayFiveCopy);
assert.equal(dayTwoSlides.length, 7);
assert.equal(dayFiveSlides.length, 5);
assert.match(dayTwoSlides[0].copy ?? "", /YOUR EMPLOYEES\nSHOULDN'T BE YOUR API\./);
assert.equal(dayFiveSlides[4].copy, "Bring one thing that should work better.\nTREXITI");

const seed = loadWeekOneMarketingSeed();
const renderReady = seed.assets.filter((asset) => asset.template);
assert.equal(renderReady.length, 7, "Week 1 should include seven render-ready visual records.");
assert.equal(renderReady.every((asset) => asset.status === "READY" && Boolean(asset.altText)), true);
assert.deepEqual(
  renderReady.map((asset) => asset.seedKey),
  [
    "week1-asset-brand-graphic",
    "week1-asset-employees-api-carousel",
    "week1-asset-founder-video",
    "week1-asset-insight-preview",
    "week1-asset-small-scope-graphic",
    "week1-asset-inquiry-payment-flow",
    "week1-asset-systems-review-card",
  ],
);
const employeeCarousel = renderReady.find((asset) => asset.seedKey === "week1-asset-employees-api-carousel");
const smallScopeCarousel = renderReady.find((asset) => asset.seedKey === "week1-asset-small-scope-graphic");
assert.deepEqual(employeeCarousel?.slides, dayTwoSlides);
assert.deepEqual(smallScopeCarousel?.slides, dayFiveSlides);
assert.equal(employeeCarousel?.slideCount, 7);
assert.equal(smallScopeCarousel?.slideCount, 5);
assert.deepEqual(
  renderReady.find((asset) => asset.seedKey === "week1-asset-inquiry-payment-flow")?.systemNodes,
  ["WEBSITE", "CRM", "SALES", "OPERATIONS", "PAYMENT"],
);
for (const asset of renderReady) {
  const expected = brandAssetFormats.find((format) => format.id === asset.format);
  assert.equal(asset.exportWidth, expected?.width);
  assert.equal(asset.exportHeight, expected?.height);
}

assert.equal(
  getBrandAssetIssues({ ...defaultBrandAssetDraft, status: "READY", altText: "" })
    .some((issue) => issue.field === "altText" && issue.level === "error"),
  true,
);
assert.equal(
  brandAssetDesignSchema.safeParse({ ...defaultBrandAssetDraft, status: "READY", altText: "" }).success,
  false,
);
assert.equal(
  getBrandAssetIssues({ ...defaultBrandAssetDraft, title: "averyveryveryveryveryveryverylongunbrokenword" })
    .some((issue) => issue.message.includes("long word")),
  true,
);
assert.equal(
  getBrandAssetIssues({ ...defaultBrandAssetDraft, template: "SYSTEM_FLOW", systemNodes: ["WEBSITE"] })
    .some((issue) => issue.field === "systemNodes" && issue.level === "error"),
  true,
);

const zipEntries = [
  { name: "slide-01.png", data: new Uint8Array([137, 80, 78, 71, 1]) },
  { name: "slide-02.png", data: new Uint8Array([137, 80, 78, 71, 2]) },
];
const zip = createStoredZip(zipEntries);
assert.deepEqual(Array.from(zip.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04]);
assert.deepEqual(Array.from(zip.slice(-22, -18)), [0x50, 0x4b, 0x05, 0x06]);
assert.deepEqual(zip, createStoredZip(zipEntries), "Carousel ZIP output should be deterministic.");

for (const route of [
  "../app/(admin)/admin/marketing/assets/page.tsx",
  "../app/(admin)/admin/marketing/assets/new/page.tsx",
  "../app/(admin)/admin/marketing/assets/[id]/page.tsx",
]) {
  assert.equal(existsSync(new URL(route, import.meta.url)), true, `Missing protected route ${route}`);
}

const rendererSource = readFileSync(new URL("../lib/admin/brand-asset-renderer.ts", import.meta.url), "utf8");
const editorSource = readFileSync(new URL("../components/admin/brand-asset-editor.tsx", import.meta.url), "utf8");
const actionsSource = readFileSync(new URL("../app/(admin)/admin/marketing/actions.ts", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../app/(admin)/admin/marketing/layout.tsx", import.meta.url), "utf8");
const schemaSource = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migrationSource = readFileSync(new URL("../prisma/migrations/20260811060000_brand_asset_generator/migration.sql", import.meta.url), "utf8");

assert.match(rendererSource, /document\.fonts\.ready/);
assert.match(rendererSource, /canvas\.toBlob/);
assert.match(editorSource, /showSafeArea: false/);
assert.match(editorSource, /createZipBlob/);
assert.match(editorSource, /Export all · ZIP/);
assert.match(actionsSource, /saveBrandAssetDesignAction/);
assert.match(actionsSource, /requireAdminSession\("marketing:manage"\)/);
assert.match(layoutSource, /requireAdminSession\("marketing:view"\)/);
assert.doesNotMatch(rendererSource + editorSource, /createLinearGradient|createRadialGradient|fetch\(|openai|image.?generation/i);
for (const value of ["MarketingAssetTemplate", "MarketingAssetFormat", "altText", "slides", "systemNodes", "exportWidth", "exportHeight"]) {
  assert.match(schemaSource, new RegExp(value));
  assert.match(migrationSource, new RegExp(value));
}

console.log("Brand templates, formats, Week 1 copy, accessibility, deterministic ZIP export, route protection and renderer contracts passed.");
