import type { Metadata } from "next";
import Link from "next/link";

import { Stagger, StaggerItem } from "@/components/marketing/motion-primitives";
import {
  ArrowLink,
  Container,
  Eyebrow,
  PageIntro,
  Section,
} from "@/components/marketing/site-primitives";
import styles from "@/components/marketing/trexiti-site.module.css";
import { engagementShapes, services } from "@/lib/content/services";

export const metadata: Metadata = {
  title: "Capabilities",
  description:
    "Business analysis, digital experiences, custom software, operational systems, automation, and integrations from Trexiti.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Capabilities | Trexiti",
    description:
      "Business analysis, digital experiences, custom software, operational systems, automation, and integrations from Trexiti.",
    type: "website",
    siteName: "Trexiti",
    url: "/services",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Capabilities | Trexiti",
    description:
      "Business analysis, digital experiences, custom software, operational systems, automation, and integrations from Trexiti.",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Capabilities"
        title="The right system starts with the right question."
        description="We combine systems thinking, design, and engineering to solve the business problem—not simply deliver a list of features."
      />

      <Section className={styles.listingSection}>
        <Container>
          <Stagger className={styles.serviceRows} step={0.07}>
            {services.map((service) => (
              <StaggerItem key={service.slug}>
                <article className={styles.serviceRow}>
                  <span>{service.index}</span>
                  <h2>{service.title}</h2>
                  <div className={styles.serviceRowCopy}>
                    <p>{service.summary}</p>
                    <ArrowLink href={`/services/${service.slug}`}>
                      Explore capability
                    </ArrowLink>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="secondary">
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <Eyebrow>Engagement shapes</Eyebrow>
            </div>
            <div>
              <h2>Start with the boundary the problem requires.</h2>
              <p>
                We work with businesses at different stages. Some need one
                focused improvement; others need a connected operating system.
                The right engagement is shaped by the problem—not the size of
                the company.
              </p>
            </div>
          </div>

          <Stagger className={styles.capabilityList} role="list" step={0.055}>
            {engagementShapes.map((shape) => (
              <StaggerItem key={shape.title} role="listitem">
                <Link className={styles.capabilityItem} href={shape.href}>
                  <span>{shape.index}</span>
                  <h3>{shape.title}</h3>
                  <p>{shape.description}</p>
                  <span aria-hidden="true">{"\u2197"}</span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>
    </>
  );
}
