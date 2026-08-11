import {
  getInsightCanonicalUrl,
  getInsightPublicationDate,
  getPublishedInsights,
} from "@/lib/content/insights";
import { siteConfig } from "@/lib/content/site";

export const dynamic = "force-dynamic";

function xml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const articles = getPublishedInsights();
  const lastBuildDate = articles[0]
    ? getInsightPublicationDate(
        articles[0].updatedAt ?? articles[0].publishedAt,
      )
    : new Date();
  const items = articles
    .map((article) => {
      const canonical = getInsightCanonicalUrl(article);
      return `
    <item>
      <title>${xml(article.title)}</title>
      <link>${xml(canonical)}</link>
      <guid isPermaLink="true">${xml(canonical)}</guid>
      <description>${xml(article.description)}</description>
      <category>${xml(article.category)}</category>
      <dc:creator>${xml(article.author)}</dc:creator>
      <pubDate>${getInsightPublicationDate(article.publishedAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Trexiti Insights</title>
    <link>${siteConfig.url}/insights</link>
    <description>Field notes on operating models, digital systems, product decisions and practical lessons from the work.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600",
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
