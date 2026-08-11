import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowLink,
  Container,
  Eyebrow,
  PageIntro,
  Section,
} from "@/components/marketing/site-primitives";
import {
  formatInsightDate,
  getInsightCategoryBySlug,
  getPublishedInsights,
  getScheduledInsights,
  insightCategories,
  isInsightFeatured,
} from "@/lib/content/insights";
import { siteConfig } from "@/lib/content/site";

import styles from "./insights.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const description =
  "Field notes on operating models, digital systems, product decisions and practical lessons from the work.";

export const metadata: Metadata = {
  title: "Insights",
  description,
  alternates: {
    canonical: "/insights",
    types: { "application/rss+xml": "/insights/feed.xml" },
  },
  openGraph: {
    title: "Insights | Trexiti",
    description,
    type: "website",
    siteName: "Trexiti",
    url: "/insights",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Insights | Trexiti",
    description,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const categoryValue = Array.isArray(query.category)
    ? query.category[0]
    : query.category;
  const selectedCategory = categoryValue
    ? getInsightCategoryBySlug(categoryValue)
    : undefined;
  const articles = getPublishedInsights();
  const nextScheduledArticle = selectedCategory
    ? undefined
    : getScheduledInsights()[0];
  const filteredArticles = selectedCategory
    ? articles.filter((article) => article.category === selectedCategory.name)
    : articles;
  const featuredArticle = selectedCategory
    ? filteredArticles[0]
    : articles.find((article) => isInsightFeatured(article)) ?? articles[0];
  const recentArticles = filteredArticles.filter(
    (article) => article.slug !== featuredArticle?.slug,
  );

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Trexiti Insights",
    description,
    url: `${siteConfig.url}/insights`,
    hasPart: articles.map((article) => ({
      "@type": "Article",
      headline: article.title,
      url: `${siteConfig.url}/insights/${article.slug}`,
    })),
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />

      <PageIntro
        eyebrow="Insights / Field notes"
        title="Notes on making businesses work better."
        description={description}
      />

      <Section className={styles.indexSection}>
        <Container>
          <nav className={styles.categoryFilters} aria-label="Insight categories">
            <Link
              aria-current={!selectedCategory ? "page" : undefined}
              data-active={!selectedCategory || undefined}
              href="/insights"
            >
              All notes <span>{String(articles.length).padStart(2, "0")}</span>
            </Link>
            {insightCategories.map((category) => {
              const count = articles.filter(
                (article) => article.category === category.name,
              ).length;
              const active = selectedCategory?.slug === category.slug;
              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  data-active={active || undefined}
                  href={`/insights?category=${category.slug}`}
                  key={category.slug}
                >
                  {category.name} <span>{String(count).padStart(2, "0")}</span>
                </Link>
              );
            })}
          </nav>

          {featuredArticle ? (
            <article className={styles.featuredArticle}>
              <div className={styles.featuredNotation} aria-hidden="true">
                <span>INPUT</span>
                <i />
                <span>MODEL</span>
                <i />
                <span>BETTER WORK</span>
              </div>
              <div className={styles.featuredContent}>
                <p className={styles.articleMeta}>
                  <span>{featuredArticle.category}</span>
                  <time dateTime={featuredArticle.publishedAt}>
                    {formatInsightDate(featuredArticle.publishedAt)}
                  </time>
                  <span>{featuredArticle.readingTime} min read</span>
                </p>
                <h2>
                  <Link href={`/insights/${featuredArticle.slug}`}>
                    {featuredArticle.title}
                  </Link>
                </h2>
                <p>{featuredArticle.description}</p>
                <ArrowLink href={`/insights/${featuredArticle.slug}`}>
                  Read the field note
                </ArrowLink>
              </div>
            </article>
          ) : (
            <div className={styles.editorialEmpty}>
              <Eyebrow>
                {selectedCategory
                  ? `${selectedCategory.name} / No published notes`
                  : nextScheduledArticle
                    ? "Next field note / Scheduled"
                    : "Editorial collection / In preparation"}
              </Eyebrow>
              <div>
                <h2>
                  {selectedCategory
                    ? "This category is ready for its first field note."
                    : nextScheduledArticle?.title ??
                      "The first Trexiti field notes are being prepared."}
                </h2>
                {nextScheduledArticle && !selectedCategory ? (
                  <>
                    <p>{nextScheduledArticle.description}</p>
                    <p className={styles.articleMeta}>
                      <span>{nextScheduledArticle.category}</span>
                      <time dateTime={nextScheduledArticle.publishedAt}>
                        Publishes {formatInsightDate(nextScheduledArticle.publishedAt)}
                      </time>
                    </p>
                  </>
                ) : (
                  <p>
                    {selectedCategory
                      ? "Choose another category or return to all notes. Unpublished work stays private until its intended release."
                      : "Approved field notes remain private until their release dates and scheduled production deployments."}
                  </p>
                )}
                {selectedCategory ? (
                  <ArrowLink href="/insights">View all notes</ArrowLink>
                ) : nextScheduledArticle ? null : (
                  <ArrowLink href="/start-a-project">
                    Discuss a business system
                  </ArrowLink>
                )}
              </div>
            </div>
          )}

          {recentArticles.length ? (
            <section className={styles.recentSection} aria-labelledby="recent-insights">
              <div className={styles.sectionTopline}>
                <Eyebrow>Recent notes</Eyebrow>
                <Link href="/insights/feed.xml">RSS / XML</Link>
              </div>
              <div className={styles.articleList}>
                {recentArticles.map((article, index) => (
                  <article key={article.slug}>
                    <span className={styles.articleIndex}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className={styles.articleMeta}>
                        <span>{article.category}</span>
                        <time dateTime={article.publishedAt}>
                          {formatInsightDate(article.publishedAt)}
                        </time>
                        <span>{article.readingTime} min read</span>
                      </p>
                      <h2>
                        <Link href={`/insights/${article.slug}`}>
                          {article.title}
                        </Link>
                      </h2>
                      <p>{article.description}</p>
                    </div>
                    <Link
                      aria-label={`Read ${article.title}`}
                      className={styles.articleArrow}
                      href={`/insights/${article.slug}`}
                    >
                      ↗
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </Container>
      </Section>

      <section className={styles.systemsCta}>
        <Container className={styles.systemsCtaInner}>
          <Eyebrow>From field note to operating change</Eyebrow>
          <h2>There is usually one workflow worth making visible first.</h2>
          <p>
            Bring Trexiti the business context. We will help identify a sensible
            boundary for improving it.
          </p>
          <ArrowLink href="/start-a-project?utm_source=insights&utm_medium=editorial&utm_campaign=insights_index">
            Discuss a business system
          </ArrowLink>
        </Container>
      </section>
    </>
  );
}
