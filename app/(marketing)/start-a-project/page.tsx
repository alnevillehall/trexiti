import type { Metadata } from "next";

import { ProjectQualificationForm } from "@/components/marketing/project-qualification-form";
import {
  Container,
  Eyebrow,
  Reveal,
  Section,
} from "@/components/marketing/site-primitives";
import { siteConfig } from "@/lib/content/site";

import styles from "./start-a-project.module.css";

const pageDescription =
  "Tell Trexiti what should work better, how the business handles it today, and what a useful outcome would look like.";

export const metadata: Metadata = {
  title: "Start a Project",
  description: pageDescription,
  alternates: { canonical: "/start-a-project" },
  openGraph: {
    title: "Start a Project | Trexiti",
    description: pageDescription,
    type: "website",
    siteName: "Trexiti",
    url: "/start-a-project",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Start a Project | Trexiti",
    description: pageDescription,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

const pageJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Start a Project with Trexiti",
  description: pageDescription,
  url: `${siteConfig.url}/start-a-project`,
  mainEntity: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
};

const qualificationPrinciples = [
  {
    number: "01",
    title: "Context before solution",
    description:
      "We look at the business objective and operating reality before assuming what should be built.",
  },
  {
    number: "02",
    title: "Commercial clarity",
    description:
      "Investment and timing help us recommend a credible starting point rather than an unrealistic scope.",
  },
  {
    number: "03",
    title: "Human review",
    description:
      "The brief is reviewed as a business problem—not routed into an automated sales sequence.",
  },
] as const;

export default function StartProjectPage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />

      <section className={styles.hero}>
        <Container>
          <div className={styles.heroTopline}>
            <Eyebrow>Start a project / Business context</Eyebrow>
            <span>Private / Considered / No automated pitch</span>
          </div>
          <Reveal>
            <h1>A better first conversation begins with context.</h1>
          </Reveal>
          <div className={styles.heroBottom}>
            <Reveal className={styles.heroIntroduction}>
              <p>
                Tell us what should work better, how the business handles it
                today, and what a useful outcome would look like. Some
                engagements begin with one focused improvement; others require
                a connected system.
              </p>
              <p className={styles.inclusionNote}>
                The right engagement is shaped by the problem—not the size of the
                company.
              </p>
            </Reveal>
            <dl>
              <div>
                <dt>Format</dt>
                <dd>10 considered stages</dd>
              </div>
              <div>
                <dt>Purpose</dt>
                <dd>One useful project brief</dd>
              </div>
              <div>
                <dt>Engagement shape</dt>
                <dd>Focused → Connected</dd>
              </div>
            </dl>
          </div>
        </Container>
      </section>

      <Section className={styles.qualificationSection} tone="secondary">
        <Container className={styles.qualificationLayout}>
          <aside className={styles.qualificationIntro}>
            <div>
              <Eyebrow>Project qualification</Eyebrow>
              <h2>Start with the business, not a feature list.</h2>
              <p>
                This structured brief gives the first conversation enough
                substance to be useful—for your team and ours.
              </p>
            </div>
            <div className={styles.principleList}>
              {qualificationPrinciples.map((principle) => (
                <article key={principle.number}>
                  <span>{principle.number}</span>
                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.description}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className={styles.privacyNote}>
              Your answers are used to assess and respond to this project
              enquiry.
            </p>
          </aside>

          <ProjectQualificationForm />
        </Container>
      </Section>
    </>
  );
}
