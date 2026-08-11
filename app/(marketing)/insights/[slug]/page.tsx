import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InsightMarkdown } from "@/components/marketing/insight-markdown";
import { MarketingViewEvent } from "@/components/marketing/analytics-provider";
import {
  ArrowLink,
  Container,
  Eyebrow,
} from "@/components/marketing/site-primitives";
import {
  formatInsightDate,
  getAdjacentInsights,
  getInsightCanonicalUrl,
  getInsightPublicationDateTime,
  getInsightStructuredData,
  getPublishedInsightBySlug,
  getPublishedInsights,
  getRelatedInsights,
} from "@/lib/content/insights";

import styles from "../insights.module.css";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPublishedInsights().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedInsightBySlug(slug);

  if (!article) {
    return {
      title: "Insight not found",
      robots: { index: false, follow: false },
    };
  }

  const canonical = getInsightCanonicalUrl(article);
  return {
    title: article.title,
    description: article.description,
    authors: [{ name: article.author }],
    category: article.category,
    keywords: article.tags,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url: canonical,
      siteName: "Trexiti",
      publishedTime: getInsightPublicationDateTime(article.publishedAt),
      modifiedTime: getInsightPublicationDateTime(
        article.updatedAt ?? article.publishedAt,
      ),
      authors: [article.author],
      section: article.category,
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

export default async function InsightArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getPublishedInsightBySlug(slug);

  if (!article) notFound();

  const canonical = getInsightCanonicalUrl(article);
  const related = getRelatedInsights(article);
  const adjacent = getAdjacentInsights(article.slug);
  const showTableOfContents = article.headings.length >= 4;
  const articleJsonLd = getInsightStructuredData(article);

  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}`;
  const emailShare = `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`${article.description}\n\n${canonical}`)}`;

  return (
    <>
      <MarketingViewEvent
        event="insight_view"
        route={`/insights/${article.slug}`}
        slug={article.slug}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />

      <article className={styles.articlePage}>
        <header className={styles.articleHero}>
          <Container>
            <Link className={styles.backToInsights} href="/insights">
              ← All insights
            </Link>
            <p className={styles.articleMeta}>
              <span>{article.category}</span>
              <time dateTime={article.publishedAt}>
                {formatInsightDate(article.publishedAt)}
              </time>
              <span>{article.readingTime} min read</span>
            </p>
            <h1>{article.title}</h1>
            <p className={styles.articleDeck}>{article.description}</p>
            <div className={styles.articleByline}>
              <span>Written by</span>
              <strong>{article.author}</strong>
              {article.updatedAt ? (
                <span>Updated {formatInsightDate(article.updatedAt)}</span>
              ) : null}
            </div>
          </Container>
        </header>

        <Container className={styles.articleLayout}>
          <aside className={styles.articleRail}>
            {showTableOfContents ? (
              <nav aria-label="On this page" className={styles.tableOfContents}>
                <p>On this page</p>
                <ol>
                  {article.headings.map((heading) => (
                    <li key={heading.id}>
                      <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            <nav aria-label="Share this article" className={styles.shareLinks}>
              <p>Share</p>
              <a href={linkedInShare} rel="noreferrer" target="_blank">
                LinkedIn ↗
              </a>
              <a href={emailShare}>Email ↗</a>
            </nav>
          </aside>

          <div className={styles.articleBody}>
            <InsightMarkdown body={article.body} />
          </div>
        </Container>

        <section className={styles.articleCta}>
          <Container>
            <Eyebrow>{article.cta.eyebrow}</Eyebrow>
            <h2>{article.cta.title}</h2>
            <p>{article.cta.description}</p>
            <ArrowLink
              analyticsCta="insight-article-cta"
              analyticsInsightCta={article.slug}
              analyticsPlacement="insight-end"
              href={article.cta.href}
            >
              {article.cta.label}
            </ArrowLink>
          </Container>
        </section>

        {related.length ? (
          <section className={styles.relatedSection}>
            <Container>
              <div className={styles.sectionTopline}>
                <Eyebrow>Related field notes</Eyebrow>
                <span>Category + shared themes</span>
              </div>
              <div className={styles.relatedGrid}>
                {related.map((item, index) => (
                  <article key={item.slug}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p className={styles.articleMeta}>{item.category}</p>
                    <h2>
                      <Link href={`/insights/${item.slug}`}>{item.title}</Link>
                    </h2>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        ) : null}

        {adjacent.previous || adjacent.next ? (
          <nav className={styles.articlePagination} aria-label="Adjacent articles">
            <Container>
              {adjacent.previous ? (
                <Link href={`/insights/${adjacent.previous.slug}`}>
                  <span>Previous</span>
                  <strong>{adjacent.previous.title}</strong>
                </Link>
              ) : (
                <span />
              )}
              {adjacent.next ? (
                <Link href={`/insights/${adjacent.next.slug}`}>
                  <span>Next</span>
                  <strong>{adjacent.next.title}</strong>
                </Link>
              ) : null}
            </Container>
          </nav>
        ) : null}
      </article>
    </>
  );
}
