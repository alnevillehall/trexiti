import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";
import { z } from "zod";

import { siteConfig } from "@/lib/content/site";

export const insightCategories = [
  { name: "Business Systems", slug: "business-systems" },
  { name: "Operational Design", slug: "operational-design" },
  { name: "Digital Experience", slug: "digital-experience" },
  { name: "Build vs Buy", slug: "build-vs-buy" },
  { name: "Automation & Integration", slug: "automation-integration" },
  { name: "Behind the Work", slug: "behind-the-work" },
] as const;

export type InsightCategory = (typeof insightCategories)[number]["name"];
export type InsightPublicationStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

const insightCategoryNames = insightCategories.map((category) => category.name) as [
  InsightCategory,
  ...InsightCategory[],
];

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use an ISO date in YYYY-MM-DD format.");

const frontmatterSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(1),
  publishedAt: dateSchema,
  updatedAt: dateSchema.optional(),
  author: z.string().trim().min(1),
  category: z.enum(insightCategoryNames),
  tags: z.array(z.string().trim().min(1)).min(1),
  featured: z.boolean(),
  featureOnPublish: z.boolean().default(false),
  draft: z.boolean(),
  ogImage: z.string().trim().optional(),
  canonicalUrl: z.string().url().optional(),
  socialExcerpt: z.string().trim().min(1),
  socialStatus: z
    .enum(["Not scheduled", "Scheduled", "Distributed"])
    .default("Not scheduled"),
  cta: z.object({
    eyebrow: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    label: z.string().trim().min(1),
    href: z.string().trim().startsWith("/"),
  }),
});

export type InsightArticle = z.infer<typeof frontmatterSchema> & {
  body: string;
  readingTime: number;
  headings: Array<{ id: string; text: string }>;
};

const insightsDirectory = join(process.cwd(), "content", "insights");

const publicationTimeZoneOffset = "-05:00";

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function plainHeading(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

function computeReadingTime(body: string) {
  const words = body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`\[\]\(\)-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 220));
}

function extractHeadings(body: string) {
  return body
    .split("\n")
    .filter((line) => /^##\s+/.test(line))
    .map((line) => {
      const text = plainHeading(line.replace(/^##\s+/, ""));
      return { id: slugifyHeading(text), text };
    });
}

function readInsightFile(filename: string): InsightArticle {
  const source = readFileSync(join(insightsDirectory, filename), "utf8");
  const parsed = matter(source);
  const frontmatter = frontmatterSchema.parse(parsed.data);
  const expectedSlug = filename.replace(/\.md$/, "");

  if (frontmatter.slug !== expectedSlug) {
    throw new Error(
      `Insight slug "${frontmatter.slug}" must match filename "${expectedSlug}.md".`,
    );
  }

  const body = parsed.content.trim();

  return {
    ...frontmatter,
    body,
    readingTime: computeReadingTime(body),
    headings: extractHeadings(body),
  };
}

export function getAllInsights() {
  return readdirSync(insightsDirectory)
    .filter(
      (filename) => filename.endsWith(".md") && !filename.startsWith("_"),
    )
    .map(readInsightFile)
    .sort(
      (left, right) =>
        new Date(right.publishedAt).getTime() -
        new Date(left.publishedAt).getTime(),
    );
}

export function getInsightPublicationStatus(
  article: Pick<InsightArticle, "draft" | "publishedAt">,
  now = new Date(),
): InsightPublicationStatus {
  if (article.draft) return "DRAFT";
  return getInsightPublicationDate(article.publishedAt) > now
    ? "SCHEDULED"
    : "PUBLISHED";
}

export function getInsightPublicationDate(value: string) {
  return new Date(`${value}T00:00:00${publicationTimeZoneOffset}`);
}

export function getInsightPublicationDateTime(value: string) {
  return `${value}T00:00:00${publicationTimeZoneOffset}`;
}

export function getPublishedInsights(now = new Date()) {
  return getAllInsights().filter(
    (article) => getInsightPublicationStatus(article, now) === "PUBLISHED",
  );
}

export function getScheduledInsights(now = new Date()) {
  return getAllInsights()
    .filter(
      (article) => getInsightPublicationStatus(article, now) === "SCHEDULED",
    )
    .sort(
      (left, right) =>
        getInsightPublicationDate(left.publishedAt).getTime() -
        getInsightPublicationDate(right.publishedAt).getTime(),
    );
}

export function getInsightBySlug(slug: string) {
  return getAllInsights().find((article) => article.slug === slug);
}

export function getPublishedInsightBySlug(slug: string, now = new Date()) {
  return getPublishedInsights(now).find((article) => article.slug === slug);
}

export function getPublishedInsightPath(slug: string, now = new Date()) {
  return getPublishedInsightBySlug(slug, now)
    ? `/insights/${slug}`
    : undefined;
}

export function isInsightFeatured(
  article: Pick<InsightArticle, "draft" | "featured" | "featureOnPublish" | "publishedAt">,
  now = new Date(),
) {
  return (
    article.featured ||
    (article.featureOnPublish &&
      getInsightPublicationStatus(article, now) === "PUBLISHED")
  );
}

export function getInsightCategoryBySlug(slug: string) {
  return insightCategories.find((category) => category.slug === slug);
}

export function getRelatedInsights(article: InsightArticle, limit = 2) {
  return getPublishedInsights()
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => ({
      article: candidate,
      score:
        (candidate.category === article.category ? 3 : 0) +
        candidate.tags.filter((tag) => article.tags.includes(tag)).length,
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((candidate) => candidate.article);
}

export function getAdjacentInsights(slug: string) {
  const published = [...getPublishedInsights()].sort(
    (left, right) =>
      new Date(left.publishedAt).getTime() -
      new Date(right.publishedAt).getTime(),
  );
  const index = published.findIndex((article) => article.slug === slug);

  return {
    previous: index > 0 ? published[index - 1] : undefined,
    next: index >= 0 && index < published.length - 1 ? published[index + 1] : undefined,
  };
}

export function getInsightCanonicalUrl(article: InsightArticle) {
  return (
    article.canonicalUrl ?? `${siteConfig.url}/insights/${article.slug}`
  );
}

export function getInsightStructuredData(article: InsightArticle) {
  const canonical = getInsightCanonicalUrl(article);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: getInsightPublicationDateTime(article.publishedAt),
    dateModified: getInsightPublicationDateTime(
      article.updatedAt ?? article.publishedAt,
    ),
    mainEntityOfPage: canonical,
    url: canonical,
    articleSection: article.category,
    keywords: article.tags.join(", "),
    wordCount: article.body.split(/\s+/).filter(Boolean).length,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/icon-512.png`,
      },
    },
    image:
      article.ogImage ??
      `${siteConfig.url}/brand/trexiti_social_banner_1500x500.png`,
  } as const;
}

export function formatInsightDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}
