import type { Metadata } from "next";

import { WorkIndex } from "@/components/marketing/work-index";
import {
  Container,
  Eyebrow,
  Reveal,
  Section,
} from "@/components/marketing/site-primitives";
import { projectSummaries, workFilters } from "@/lib/content/projects";

import styles from "./work-page.module.css";

const pageDescription =
  "Digital experiences, software and systems designed by Trexiti around real business problems.";

export const metadata: Metadata = {
  title: "Selected Work",
  description: pageDescription,
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Selected Work | Trexiti",
    description: pageDescription,
    type: "website",
    siteName: "Trexiti",
    url: "/work",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Selected Work | Trexiti",
    description: pageDescription,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

export default function WorkPage() {
  return (
    <>
      <section className={styles.hero}>
        <Container>
          <Reveal>
            <Eyebrow>Trexiti / Work</Eyebrow>
            <h1>Selected work.</h1>
          </Reveal>
          <div className={styles.heroSupport}>
            <Reveal delay={100}>
              <p>
                Digital experiences, software and systems designed around real
                business problems.
              </p>
            </Reveal>
            <dl>
              <div>
                <dt>Engagement lens</dt>
                <dd>Business / Product / System</dd>
              </div>
              <div>
                <dt>Current collection</dt>
                <dd>{projectSummaries.length} Selected projects</dd>
              </div>
            </dl>
          </div>
        </Container>
      </section>

      <Section className={styles.indexSection} tone="inverse">
        <Container>
          <div className={styles.indexHeader}>
            <div>
              <Eyebrow>Engagements</Eyebrow>
              <h2>From business context to working architecture.</h2>
            </div>
            <p>
              Each study examines the operation, audience, product decisions,
              system boundary, interface, and engineering implications behind
              the brief.
            </p>
          </div>

          <WorkIndex filters={workFilters} projects={projectSummaries} />
        </Container>
      </Section>

      <Section tone="secondary">
        <Container className={styles.disclosure} size="standard">
          <Eyebrow>About this collection</Eyebrow>
          <div>
            <h2>Concepts are labeled. Claims are not invented.</h2>
            <p>
              Live work, private client systems, and original concepts are
              labeled separately. No case study implies a measured commercial
              outcome unless evidence is explicitly provided.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
