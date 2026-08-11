import type { Metadata } from "next";

import {
  ArrowLink,
  Container,
  Eyebrow,
  PageIntro,
  Section,
} from "@/components/marketing/site-primitives";
import styles from "@/components/marketing/trexiti-site.module.css";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Trexiti perspectives on business systems, digital products, automation, and operational design.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "Insights | Trexiti",
    description:
      "Trexiti perspectives on business systems, digital products, automation, and operational design.",
    type: "website",
    siteName: "Trexiti",
    url: "/insights",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Insights | Trexiti",
    description:
      "Trexiti perspectives on business systems, digital products, automation, and operational design.",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

export default function InsightsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Insights"
        title="Notes on making businesses work better."
        description="A publishing foundation for field notes, systems thinking, product decisions, and practical lessons from the work."
      />

      <Section className={styles.listingSection}>
        <Container>
          <div className={styles.insightsEmpty}>
            <Eyebrow>Publishing infrastructure / Ready</Eyebrow>
            <div>
              <h2>The first field notes are being prepared.</h2>
              <p>
                Future articles will live here with structured metadata,
                editorial categories, and a route model designed to expand
                without restructuring the site.
              </p>
              <ArrowLink href="/start-a-project">
                Discuss a business system
              </ArrowLink>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
