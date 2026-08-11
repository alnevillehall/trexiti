import type { Metadata } from "next";

import { Stagger, StaggerItem } from "@/components/marketing/motion-primitives";
import {
  ArrowLink,
  Container,
  PageIntro,
  Section,
} from "@/components/marketing/site-primitives";
import styles from "@/components/marketing/trexiti-site.module.css";
import { services } from "@/lib/content/services";

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
    </>
  );
}
