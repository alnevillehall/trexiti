import type { Metadata } from "next";

import { FrictionChecklist } from "@/components/marketing/friction-checklist";
import { Container, Eyebrow, Section } from "@/components/marketing/site-primitives";
import type { FrictionSectionId } from "@/lib/content/friction-checklist";
import {
  getInsightBySlug,
  getPublishedInsightPath,
} from "@/lib/content/insights";

import styles from "./friction-checklist-page.module.css";

const description =
  "Score 20 signs of operational friction to identify where customers, employees, information and money depend on manual coordination rather than a reliable system.";

export const metadata: Metadata = {
  title: "Business Systems Friction Checklist",
  description,
  alternates: {
    canonical: "/resources/business-systems-friction-checklist",
  },
  openGraph: {
    title: "Business Systems Friction Checklist | Trexiti",
    description,
    type: "website",
    siteName: "Trexiti",
    url: "/resources/business-systems-friction-checklist",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Systems Friction Checklist | Trexiti",
    description,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

const articleBySection: Record<FrictionSectionId, string> = {
  "customer-sales": "the-website-is-not-the-end-of-the-customer-journey",
  "work-operations": "your-employees-shouldnt-be-your-api",
  "information-tools": "you-probably-dont-need-custom-software",
  "finance-management": "your-employees-shouldnt-be-your-api",
  "experience-growth": "the-website-is-not-the-end-of-the-customer-journey",
};

function getRelevantArticles() {
  return Object.fromEntries(
    Object.entries(articleBySection).flatMap(([sectionId, slug]) => {
      const href = getPublishedInsightPath(slug);
      const article = href ? getInsightBySlug(slug) : undefined;
      return href && article
        ? [[sectionId, { href, title: article.title }]]
        : [];
    }),
  );
}

export default function BusinessSystemsFrictionChecklistPage() {
  return (
    <>
      <section className={styles.hero}>
        <Container className={styles.heroGrid}>
          <div>
            <Eyebrow>Resource / Business systems</Eyebrow>
            <h1>The Business Systems Friction Checklist</h1>
          </div>
          <div className={styles.heroSupport}>
            <p>
              This checklist helps a business identify where customers,
              employees, information and money are being held together by
              manual effort rather than a reliable system.
            </p>
            <dl>
              <div><dt>Questions</dt><dd>20</dd></div>
              <div><dt>Result</dt><dd>Immediate</dd></div>
              <div><dt>Email gate</dt><dd>None</dd></div>
            </dl>
          </div>
        </Container>
      </section>

      <Section className={styles.instructions}>
        <Container className={styles.instructionsGrid}>
          <div>
            <Eyebrow>How to score</Eyebrow>
            <h2>Score what happens in practice.</h2>
          </div>
          <div className={styles.scoreKey}>
            <div><strong>0</strong><span>Rarely or never</span></div>
            <div><strong>1</strong><span>Sometimes</span></div>
            <div><strong>2</strong><span>Frequently</span></div>
          </div>
          <aside>
            <strong>Private by default</strong>
            <p>
              Answers remain in this browser session. Trexiti does not receive
              or store them, and no email is required to see the result.
            </p>
          </aside>
        </Container>
      </Section>

      <Section className={styles.checklistSection} tone="secondary">
        <Container>
          <FrictionChecklist relevantArticles={getRelevantArticles()} />
        </Container>
      </Section>
    </>
  );
}
