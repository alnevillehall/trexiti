import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";

import { GET as getInsightsFeed } from "../app/(marketing)/insights/feed.xml/route";
import sitemap from "../app/sitemap";
import { InsightMarkdown } from "../components/marketing/insight-markdown";
import {
  getInsightSocialVisual,
  insightSocialVisuals,
} from "../lib/content/insight-social-visuals";
import {
  getAllInsights,
  getInsightBySlug,
  getInsightPublicationStatus,
  getInsightStructuredData,
  getPublishedInsightBySlug,
  getPublishedInsightPath,
  getPublishedInsights,
  getScheduledInsights,
  isInsightFeatured,
} from "../lib/content/insights";

const beforeLaunch = new Date("2026-08-10T12:00:00Z");
const afterCollectionLaunch = new Date("2026-09-01T12:00:00Z");

async function run() {
  const approvedBodyHashes: Record<string, string> = {
    "your-employees-shouldnt-be-your-api":
      "ebd9ae1617f50d8db3e50734975dd2e9fb02188e2c04ab7baadf078a4eb1b0c6",
    "you-probably-dont-need-custom-software":
      "5bc9373a650f9c45c72247fc54ca1ab742f843de1dfd8ddf5dcd55f8751aa9cb",
    "the-website-is-not-the-end-of-the-customer-journey":
      "a27a7c9a8af09a40e1388d3e2fcb8088a58a58b6cdb33926368bac83cf846916",
  };
  const approvedSocialExcerpts: Record<string, string> = {
    "your-employees-shouldnt-be-your-api":
      "A lot of businesses do not have a formal integration strategy. They have people.",
    "you-probably-dont-need-custom-software":
      "The objective should never be to own the most software. The objective is to create the best operating result.",
    "the-website-is-not-the-end-of-the-customer-journey":
      "A website can look excellent and still fail the business immediately after someone clicks Submit.",
  };
  const approvedCtas: Record<string, { title: string; path: string }> = {
    "your-employees-shouldnt-be-your-api": {
      title: "Discuss a Systems Review.",
      path: "/systems-review",
    },
    "you-probably-dont-need-custom-software": {
      title: "Decide what the business genuinely needs to own.",
      path: "/services/custom-software",
    },
    "the-website-is-not-the-end-of-the-customer-journey": {
      title: "Build the whole customer journey.",
      path: "/services/digital-experiences",
    },
  };

  const articles = getAllInsights();
  assert.equal(
    articles.length,
    3,
    "The initial editorial collection should contain three articles.",
  );
  assert.equal(
    getScheduledInsights(beforeLaunch)[0]?.slug,
    "your-employees-shouldnt-be-your-api",
    "the Insights index should preview the next approved field note without publishing its route",
  );

  for (const article of articles) {
    assert.equal(article.draft, false, `${article.title} should be release-ready.`);
    assert.equal(
      getInsightPublicationStatus(article, beforeLaunch),
      "SCHEDULED",
      `${article.title} should be scheduled before its launch date.`,
    );
    assert.equal(article.socialExcerpt, approvedSocialExcerpts[article.slug]);
    assert.equal(article.cta.title, approvedCtas[article.slug].title);
    assert.ok(article.cta.href.startsWith(approvedCtas[article.slug].path));
    assert.match(article.cta.href, /utm_source=insights/);
    assert.ok(article.readingTime > 0, "Reading time should be computed.");
    assert.ok(
      article.headings.length >= 4,
      "Long articles should expose useful table-of-contents headings.",
    );
    assert.equal(
      createHash("sha256")
        .update(article.body.replace(/\r\n/g, "\n"))
        .digest("hex"),
      approvedBodyHashes[article.slug],
      `${article.title} must retain the exact approved launch-pack body.`,
    );
  }

  assert.equal(
    getPublishedInsights(beforeLaunch).length,
    0,
    "Future-dated scheduled articles must remain private.",
  );
  assert.equal(
    getPublishedInsights(afterCollectionLaunch).length,
    3,
    "All three release-ready articles should publish after their launch dates.",
  );
  const secondArticle = getInsightBySlug(
    "you-probably-dont-need-custom-software",
  );
  assert.ok(secondArticle);
  assert.equal(isInsightFeatured(secondArticle, beforeLaunch), false);
  assert.equal(isInsightFeatured(secondArticle, afterCollectionLaunch), true);
  assert.equal(
    getInsightPublicationStatus(
      { draft: false, publishedAt: "2026-08-14" },
      new Date("2026-08-14T04:59:59Z"),
    ),
    "SCHEDULED",
    "Publication must not begin before midnight Jamaica time.",
  );
  assert.equal(
    getInsightPublicationStatus(
      { draft: false, publishedAt: "2026-08-14" },
      new Date("2026-08-14T05:00:00Z"),
    ),
    "PUBLISHED",
  );
  assert.equal(
    getInsightPublicationStatus(
      { draft: true, publishedAt: "2026-08-01" },
      afterCollectionLaunch,
    ),
    "DRAFT",
  );

  const firstSlug = "your-employees-shouldnt-be-your-api";
  const firstArticle = getInsightBySlug(firstSlug);
  assert.ok(firstArticle);
  assert.equal(getPublishedInsightBySlug(firstSlug, beforeLaunch), undefined);
  assert.equal(getPublishedInsightPath(firstSlug, beforeLaunch), undefined);
  assert.equal(
    getPublishedInsightPath(firstSlug, afterCollectionLaunch),
    `/insights/${firstSlug}`,
  );
  assert.ok(getPublishedInsightBySlug(firstSlug, afterCollectionLaunch));
  assert.equal(getInsightBySlug("missing-insight"), undefined);

  const structuredData = getInsightStructuredData(firstArticle);
  assert.equal(structuredData["@type"], "BlogPosting");
  assert.equal(structuredData.headline, firstArticle.title);
  assert.equal(
    structuredData.datePublished,
    "2026-08-14T00:00:00-05:00",
  );
  assert.match(
    structuredData.url,
    /\/insights\/your-employees-shouldnt-be-your-api$/,
  );

  const currentlyPublished = getPublishedInsights();
  const publicSitemap = sitemap();
  for (const article of articles) {
    assert.equal(
      publicSitemap.some((entry) => entry.url.endsWith(`/insights/${article.slug}`)),
      currentlyPublished.some((published) => published.slug === article.slug),
      "The sitemap and publication guard must agree.",
    );
  }

  const feedResponse = getInsightsFeed();
  assert.match(
    feedResponse.headers.get("content-type") ?? "",
    /application\/rss\+xml/,
  );
  const feedBody = await feedResponse.text();
  assert.match(feedBody, /<rss version="2\.0"/);
  assert.equal(
    (feedBody.match(/<item>/g) ?? []).length,
    currentlyPublished.length,
    "RSS and the publication guard must agree.",
  );

  const markdownOutput = renderToStaticMarkup(
    <InsightMarkdown body={"# Test\n\nUse [`code`](/insights) and `inline`."} />,
  );
  assert.match(markdownOutput, /href="\/insights"/);
  assert.match(markdownOutput, /<code>inline<\/code>/);

  assert.equal(Object.keys(insightSocialVisuals).length, 3);
  assert.equal(getInsightSocialVisual(firstSlug)?.variant, "human-layer");
  assert.deepEqual(
    getInsightSocialVisual("you-probably-dont-need-custom-software"),
    {
      variant: "decision",
      choices: [
        { label: "Keep", detail: "Proven tools" },
        { label: "Connect", detail: "Shared context" },
        { label: "Build", detail: "Strategic boundary" },
      ],
    },
  );
  const journeyVisual = getInsightSocialVisual(
    "the-website-is-not-the-end-of-the-customer-journey",
  );
  assert.deepEqual(
    journeyVisual?.variant === "journey" ? journeyVisual.stages : [],
    ["Visitor", "Website", "Sales", "Operations", "Payment"],
  );

  const articleRouteSource = readFileSync(
    new URL("../app/(marketing)/insights/[slug]/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(articleRouteSource, /export async function generateMetadata/);
  assert.match(articleRouteSource, /if \(!article\) notFound\(\)/);
  assert.match(articleRouteSource, /application\/ld\+json/);
  assert.match(articleRouteSource, /article\.cta\.href/);

  const indexRouteSource = readFileSync(
    new URL("../app/(marketing)/insights/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(indexRouteSource, /getScheduledInsights/);
  assert.match(indexRouteSource, /Next field note \/ Scheduled/);
  assert.doesNotMatch(indexRouteSource, /href=\{`\/insights\/\$\{nextScheduledArticle/);

  const ogSource = readFileSync(
    new URL(
      "../app/(marketing)/insights/[slug]/opengraph-image.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(ogSource, /ImageResponse/);
  assert.match(ogSource, /SocialDiagram/);

  const internalLinkSources = [
    ["../app/(marketing)/about/page.tsx", firstSlug],
    ["../app/(marketing)/services/business-systems/page.tsx", firstSlug],
    [
      "../app/(marketing)/services/business-systems/page.tsx",
      "you-probably-dont-need-custom-software",
    ],
    [
      "../app/(marketing)/services/digital-experiences/page.tsx",
      "the-website-is-not-the-end-of-the-customer-journey",
    ],
    ["../app/(marketing)/services/automation/page.tsx", firstSlug],
  ] as const;
  for (const [source, slug] of internalLinkSources) {
    assert.match(readFileSync(new URL(source, import.meta.url), "utf8"), new RegExp(slug));
  }

  console.log(
    "Insights scheduling, approved copy, CTAs, social visuals, internal links, metadata, sitemap, and RSS checks passed.",
  );
}

void run();
