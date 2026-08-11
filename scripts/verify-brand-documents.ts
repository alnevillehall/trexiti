import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import {
  companyDescriptions,
  mediaKitAssets,
  mediaKitCapabilities,
  mediaKitColors,
  mediaKitFounder,
  mediaKitTypography,
} from "../lib/content/media-kit";

const capabilitySource = readFileSync(new URL("../materials/capability_statement.md", import.meta.url), "utf8");
assert.equal(
  createHash("sha256").update(capabilitySource).digest("hex"),
  "bfe97820cabc2116141365e6f5c41092f4a7d2ebd3bfc2a3898be34cc6ac6991",
  "The approved capability-statement source changed unexpectedly.",
);

for (const approvedText of [
  "Digital systems for ambitious businesses.",
  "Trexiti designs and builds the digital systems businesses use to sell, operate and grow.",
  "Digital Experiences",
  "Custom Software",
  "Business Systems",
  "Automation & Integration",
  "When Trexiti makes sense",
  "Discover",
  "Map",
  "Design",
  "Build",
  "Integrate",
  "Improve",
  "Focused Build",
  "Connected Experience",
  "Custom System",
  "Systems Partnership",
  "What should work better in your business?",
  "hello@trexiti.com",
]) {
  assert.match(capabilitySource, new RegExp(approvedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.doesNotMatch(capabilitySource, /\$3,?000|cheap|every budget/i);

assert.deepEqual(companyDescriptions.map((item) => item.text), [
  "Trexiti designs and builds the digital systems businesses use to sell, operate and grow.",
  "Trexiti combines business analysis, design and engineering to build websites, software, operational systems and automation around how a business actually works.",
  "Trexiti is a Jamaica-based business systems and digital engineering company. It studies how customers, employees, information and money move through a business, then determines what should be simplified, connected, automated or built. Its work spans digital experiences, custom software, business systems and automation/integration for companies at different stages of growth.",
]);
assert.deepEqual(mediaKitCapabilities, ["Digital Experiences", "Custom Software", "Business Systems", "Automation & Integration"]);
assert.deepEqual(mediaKitFounder, { name: "Al Neville Hall", title: "Founder / Business Systems & Software" });
assert.deepEqual(mediaKitTypography.map((item) => item.name), ["Space Grotesk", "Geist", "Geist Mono"]);
assert.equal(mediaKitColors.length, 7);
assert.deepEqual(mediaKitAssets.map((asset) => asset.href), [
  "/brand/trexiti_logo_icon.svg",
  "/brand/trexiti_icon_transparent_1024.png",
]);

for (const asset of mediaKitAssets) {
  assert.equal(existsSync(new URL(`../public${asset.href}`, import.meta.url)), true, `Missing media-kit asset ${asset.href}`);
}

for (const route of [
  "../app/(marketing)/capabilities/overview/page.tsx",
  "../app/(marketing)/media-kit/page.tsx",
]) {
  assert.equal(existsSync(new URL(route, import.meta.url)), true, `Missing route ${route}`);
}

const capabilityPage = readFileSync(new URL("../app/(marketing)/capabilities/overview/page.tsx", import.meta.url), "utf8");
const mediaPage = readFileSync(new URL("../app/(marketing)/media-kit/page.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../components/marketing/brand-document-actions.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../components/marketing/brand-documents.module.css", import.meta.url), "utf8");
const siteStyles = readFileSync(new URL("../components/marketing/trexiti-site.module.css", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");

assert.match(capabilityPage, /canonical: "\/capabilities\/overview"/);
assert.match(mediaPage, /canonical: "\/media-kit"/);
assert.match(capabilityPage, /capabilityStatement\.capabilities/);
assert.match(capabilityPage, /capabilityStatement\.fitSignals/);
assert.match(capabilityPage, /capabilityStatement\.process/);
assert.match(capabilityPage, /capabilityStatement\.engagementShapes/);
assert.match(mediaPage, /project\.concept \? "Concept study"/);
assert.doesNotMatch(mediaPage, /trexiti_(?:social_banner|logo_horizontal|logo_full|wordmark)/);
assert.match(mediaPage, /Legacy lockups and banners containing retired positioning are intentionally excluded/);
for (const event of [
  "capability_statement_view",
  "capability_statement_print",
  "capability_statement_download",
  "media_kit_view",
  "asset_download",
]) {
  assert.match(actions, new RegExp(event));
}
assert.match(styles, /@page\s*{/);
assert.match(styles, /size: A4/);
assert.match(styles, /break-before: page/);
assert.match(siteStyles, /@media print[\s\S]*\.siteHeader[\s\S]*\.siteFooter/);
assert.match(sitemap, /"\/capabilities\/overview"/);
assert.match(sitemap, /"\/media-kit"/);
assert.doesNotMatch(capabilityPage + mediaPage, /\$3,?000|client logos|award-winning|world-class/i);

console.log("Capability source fidelity, media boilerplate, approved assets, analytics, canonicals, print rules and public routes passed.");
