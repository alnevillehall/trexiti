import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Stagger, StaggerItem } from "@/components/marketing/motion-primitives";
import {
  ArrowLink,
  Container,
  Eyebrow,
  Section,
} from "@/components/marketing/site-primitives";
import styles from "@/components/marketing/trexiti-site.module.css";
import { getService } from "@/lib/content/services";

type ServicePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) {
    return {};
  }

  return {
    title: service.title,
    description: service.summary,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: `${service.title} | Trexiti`,
      description: service.summary,
      type: "website",
      siteName: "Trexiti",
      url: `/services/${service.slug}`,
      images: ["/brand/trexiti_social_banner_1500x500.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title} | Trexiti`,
      description: service.summary,
      images: ["/brand/trexiti_social_banner_1500x500.png"],
    },
  };
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { slug } = await params;
  const service = getService(slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <section className={styles.serviceHero}>
        <Container className={styles.serviceHeroGrid}>
          <div>
            <Eyebrow>
              Capability {service.index} / {service.shortTitle}
            </Eyebrow>
            <h1>{service.title}</h1>
          </div>
          <div className={styles.heroDescriptor}>
            <p>{service.summary}</p>
            <dl>
              <div>
                <dt>Focus</dt>
                <dd>Business outcomes</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>Strategy to implementation</dd>
              </div>
            </dl>
          </div>
        </Container>
      </section>

      <Section>
        <Container className={styles.serviceProposition}>
          <Eyebrow>The proposition</Eyebrow>
          <p>{service.proposition}</p>
        </Container>
      </Section>

      <Section>
        <Container className={styles.capabilityColumns}>
          <div>
            <Eyebrow>What we build</Eyebrow>
            <h2>Core capability</h2>
          </div>
          <ol className={styles.numberedList}>
            {service.capabilities.map((capability) => (
              <li key={capability}>{capability}</li>
            ))}
          </ol>
          <aside className={styles.outcomePanel}>
            <h2>Built to create</h2>
            <ul>
              {service.outcomes.map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          </aside>
        </Container>
      </Section>

      <Section tone="inverse">
        <Container className={styles.methodGrid}>
          <div>
            <Eyebrow>Working method</Eyebrow>
          </div>
          <Stagger className={styles.methodList} step={0.09}>
            {service.process.map((step) => (
              <StaggerItem key={step.title}>
                <article className={styles.methodItem}>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="accent">
        <Container>
          <Eyebrow>Discuss the opportunity</Eyebrow>
          <h2 className={styles.closingStatement}>
            Bring us the business challenge, not a feature list.
          </h2>
          <div className={styles.closingAction}>
            <p>
              We will help define the right scope, system boundary, and path to
              implementation.
            </p>
            <ArrowLink href="/start-a-project" tone="light">
              Start a project
            </ArrowLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
