import type { Metadata } from "next";

import { Stagger, StaggerItem } from "@/components/marketing/motion-primitives";
import {
  ArrowLink,
  Container,
  Eyebrow,
  Section,
} from "@/components/marketing/site-primitives";
import { SystemsReviewForm } from "@/components/marketing/systems-review-form";
import { siteConfig } from "@/lib/content/site";

import styles from "./systems-review-page.module.css";

const pageDescription =
  "A Trexiti Systems Review examines one workflow or a wider operating area to identify where work, information, ownership and decisions become fragmented.";

export const metadata: Metadata = {
  title: "Systems Review",
  description: pageDescription,
  alternates: { canonical: "/systems-review" },
  openGraph: {
    title: "Systems Review | Trexiti",
    description: pageDescription,
    type: "website",
    siteName: "Trexiti",
    url: "/systems-review",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Systems Review | Trexiti",
    description: pageDescription,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

const reviewJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Trexiti Systems Review",
  description: pageDescription,
  url: `${siteConfig.url}/systems-review`,
  areaServed: "Global",
  serviceType: "Operating model and business systems review",
  provider: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
};

const reviewSubjects = [
  "Customer inquiry to sale",
  "Booking to delivery",
  "Quote approval to completed work",
  "Scheduling and staff assignment",
  "Inventory request to replenishment",
  "Completed work to invoice and payment",
  "Document and approval workflows",
  "Management reporting",
  "Website-to-CRM handoffs",
  "One persistent small-business bottleneck",
] as const;

const operatingDimensions = [
  ["01", "People", "Roles, responsibilities, knowledge and manual coordination."],
  ["02", "Processes", "Events, handoffs, decisions, exceptions and completion rules."],
  ["03", "Customers", "Intent, experience, communication and continuity of context."],
  ["04", "Data", "Records, ownership, source-of-truth rules and reporting."],
  ["05", "Technology", "Useful tools, missing connections and justified system boundaries."],
] as const;

const reviewMethod = [
  "Define objective",
  "Select boundary",
  "Interview participants",
  "Map current state",
  "Identify friction and risk",
  "Define ownership and source-of-truth rules",
  "Evaluate keep, integrate, replace or build",
  "Design future state",
  "Recommend the smallest valuable implementation path",
] as const;

const possibleOutputs = [
  "Workflow map",
  "Bottleneck summary",
  "Future-state system map",
  "Requirements and user roles",
  "Integration and automation opportunities",
  "Build-versus-buy recommendations",
  "Implementation phases",
  "Preliminary architecture",
  "Proposal for the next step",
] as const;

const engagementPaths = [
  {
    title: "No build required",
    description:
      "Clarify ownership, simplify the process or use the current tools more deliberately.",
  },
  {
    title: "Focused Build",
    description:
      "Improve one contained workflow with a clear operating result and controlled boundary.",
  },
  {
    title: "Connected System",
    description:
      "Integrate useful platforms around shared records, workflow and operational visibility.",
  },
  {
    title: "Custom Platform",
    description:
      "Build a governed product or operating layer when distinctive requirements justify ownership.",
  },
] as const;

export default function SystemsReviewPage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />

      <section className={styles.hero}>
        <Container className={styles.heroGrid}>
          <div>
            <Eyebrow>Systems Review / Operating model</Eyebrow>
            <h1>Make the way your business works visible.</h1>
          </div>
          <div className={styles.heroSupport}>
            <p>{pageDescription}</p>
            <div className={styles.heroBoundary} aria-label="Systems Review decision model">
              <span>Current state</span>
              <i aria-hidden="true">→</i>
              <strong>Review boundary</strong>
              <i aria-hidden="true">→</i>
              <span>Useful next step</span>
            </div>
          </div>
        </Container>
      </section>

      <Section className={styles.principleSection}>
        <Container className={styles.principleGrid}>
          <Eyebrow>Key principle</Eyebrow>
          <p>
            The answer is not automatically custom software. The review
            determines what should be simplified, clarified, integrated,
            automated or built.
          </p>
        </Container>
      </Section>

      <Section tone="secondary">
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>Suitable review subjects</Eyebrow>
              <h2>Choose a boundary the business can recognize.</h2>
            </div>
            <p>
              A review can focus on one persistent bottleneck or a connected
              operating area. Scope is agreed before the engagement begins.
            </p>
          </div>
          <ol className={styles.subjectGrid}>
            {reviewSubjects.map((subject, index) => (
              <li key={subject}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{subject}</strong>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section className={styles.dimensionsSection} tone="inverse">
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>What Trexiti examines</Eyebrow>
              <h2>One operating picture. Five connected dimensions.</h2>
            </div>
            <p>
              Friction rarely belongs to one tool. The review follows the
              relationships between people, processes, customers, data and
              technology.
            </p>
          </div>
          <Stagger className={styles.dimensionMap} role="list" step={0.06}>
            {operatingDimensions.map(([index, title, description]) => (
              <StaggerItem key={title} role="listitem">
                <article>
                  <span>{index}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>Review method</Eyebrow>
              <h2>From an unclear problem to an actionable boundary.</h2>
            </div>
            <p>
              The method adapts to scope while preserving the same sequence:
              understand the operation before recommending technology.
            </p>
          </div>
          <ol className={styles.methodFlow}>
            {reviewMethod.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="accent">
        <Container className={styles.outputsGrid}>
          <div>
            <Eyebrow>Possible outputs / Scope dependent</Eyebrow>
            <h2>The output should support the next useful decision.</h2>
            <p>
              A focused workflow review and a wider operating review do not
              produce an identical package. Outputs are selected because they
              are useful to the agreed boundary.
            </p>
          </div>
          <ul>
            {possibleOutputs.map((output) => (
              <li key={output}>{output}</li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="secondary">
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>After the review</Eyebrow>
              <h2>The recommendation may be to build less—or not at all.</h2>
            </div>
            <p>
              Trexiti separates diagnosis from a predetermined implementation.
              The operating result determines the next engagement path.
            </p>
          </div>
          <div className={styles.pathGrid}>
            {engagementPaths.map((path, index) => (
              <article key={path.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container className={styles.resourceBand}>
          <div>
            <Eyebrow>Not sure where to begin?</Eyebrow>
            <h2>Check where coordination cost is accumulating.</h2>
          </div>
          <div>
            <p>
              The ungated Business Systems Friction Checklist scores 20 common
              signs without saving your answers or asking for an email first.
            </p>
            <ArrowLink href="/resources/business-systems-friction-checklist">
              Use the friction checklist
            </ArrowLink>
          </div>
        </Container>
      </Section>

      <Section className={styles.formSection} tone="secondary">
        <Container>
          <SystemsReviewForm />
        </Container>
      </Section>
    </>
  );
}
