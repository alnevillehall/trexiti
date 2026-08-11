import type { Metadata } from "next";

import {
  Stagger,
  StaggerItem,
} from "@/components/marketing/motion-primitives";
import {
  ButtonLink,
  Container,
  Eyebrow,
  Reveal,
  Section,
} from "@/components/marketing/site-primitives";
import { ArchitectureDiagram } from "@/components/marketing/system-visuals";
import {
  architectureLayers,
  durableProductConcerns,
  engineeringDisciplines,
  softwareCategories,
  softwareDevelopmentProcess,
} from "@/lib/content/custom-software";
import { siteConfig } from "@/lib/content/site";

import styles from "./custom-software-page.module.css";

const pageDescription =
  "Trexiti designs and engineers substantial custom software products, including customer portals, internal applications, platforms, booking systems, marketplaces, dashboards, and workflow applications.";

export const metadata: Metadata = {
  title: "Custom Software",
  description: pageDescription,
  alternates: { canonical: "/services/custom-software" },
  openGraph: {
    title: "Custom Software | Trexiti",
    description: pageDescription,
    type: "website",
    siteName: "Trexiti",
    url: "/services/custom-software",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Software | Trexiti",
    description: pageDescription,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Custom Software Development",
  description: pageDescription,
  url: `${siteConfig.url}/services/custom-software`,
  areaServed: "Global",
  serviceType: [
    "Custom software development",
    "Product discovery",
    "UX architecture",
    "System architecture",
    "Application engineering",
    "API development",
    "Software deployment and monitoring",
  ],
  provider: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
};

const releaseCycle = [
  ["01", "Release"],
  ["02", "Use"],
  ["03", "Evidence"],
  ["04", "Next release"],
] as const;

export default function CustomSoftwarePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className={styles.hero}>
        <Container className={styles.heroGrid}>
          <div>
            <Reveal>
              <Eyebrow>Custom software / Product engineering</Eyebrow>
              <h1 className={styles.heroTitle}>
                Software designed around the problem
                <span> — not the template.</span>
              </h1>
            </Reveal>

            <div className={styles.heroSupport}>
              <Reveal delay={120}>
                <p>
                  From customer portals and booking platforms to internal
                  applications and marketplaces, Trexiti designs and engineers
                  software around specific users, workflows and business
                  objectives.
                </p>
              </Reveal>
              <Reveal delay={210}>
                <ButtonLink
                  className={styles.heroAction}
                  href="/start-a-project"
                  variant="inverse"
                >
                  Discuss Your Software Project
                </ButtonLink>
              </Reveal>
            </div>
          </div>

          <Reveal className={styles.heroArchitectureDiagram} delay={160}>
            <ArchitectureDiagram
              ariaLabel="Product architecture connecting people, experience, application logic, services, data, and runtime operations"
              caption="The product is designed as a connected operating system, not a collection of interface screens."
              foundation="Identity / Permissions / Data integrity / Monitoring"
              label="Product architecture"
              layers={architectureLayers.map((layer) => ({
                detail: layer.value,
                emphasis: layer.label === "Application",
                label: layer.label,
              }))}
              meta="Problem to product"
              tone="inverse"
            />
          </Reveal>
        </Container>
      </section>

      <Section>
        <Container>
          <div className={styles.sectionHeader}>
            <div>
              <Eyebrow>Software categories</Eyebrow>
            </div>
            <div>
              <Reveal>
                <h2>Different products. One product-engineering discipline.</h2>
              </Reveal>
              <p>
                Trexiti starts with the people, decisions, transactions, and
                workflows the product must support. The interface and technical
                system are designed as one coherent response.
              </p>
            </div>
          </div>

          <Stagger className={styles.categoryList} role="list" step={0.055}>
            {softwareCategories.map((category) => (
              <StaggerItem key={category.title} role="listitem">
                <article className={styles.categoryItem}>
                  <span className={styles.categoryIndex}>{category.index}</span>
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                  <span className={styles.categoryMode}>{category.mode}</span>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="inverse">
        <Container>
          <div className={styles.disciplineIntro}>
            <div>
              <Eyebrow>Full product capability</Eyebrow>
              <Reveal>
                <h2>The interface is only one layer.</h2>
              </Reveal>
            </div>
            <p>
              Substantial software requires more than screens. Trexiti connects
              product definition, experience design, application engineering,
              data, integrations, and live operation into one delivery
              discipline.
            </p>
          </div>

          <Stagger className={styles.disciplineGrid} role="list" step={0.07}>
            {engineeringDisciplines.map((discipline) => (
              <StaggerItem key={discipline.title} role="listitem">
                <article className={styles.disciplineGroup}>
                  <div className={styles.disciplineMeta}>
                    <span>{discipline.index}</span>
                    <span>Capability layer</span>
                  </div>
                  <div>
                    <h3>{discipline.title}</h3>
                    <p>{discipline.description}</p>
                    <ul className={styles.disciplineList}>
                      {discipline.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>

          <div className={styles.disciplineFooter}>
            <span>End-to-end scope</span>
            <p>
              Product discovery, UX architecture, system and database
              architecture, APIs, authentication, permissions, integrations,
              payments, notifications, analytics, deployment, and monitoring
              are considered as parts of the same product—not disconnected
              technical tasks.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="accent">
        <Container>
          <div className={styles.longevityIntro}>
            <div>
              <Eyebrow>Product longevity</Eyebrow>
              <Reveal>
                <h2>Built beyond the first release.</h2>
              </Reveal>
            </div>
            <p>
              Launch is the point where evidence becomes real. Trexiti designs
              the product so it can be operated, supported, understood, and
              improved after version one.
            </p>
          </div>

          <div
            aria-label="Product release cycle"
            className={styles.releaseTrack}
            role="list"
          >
            {releaseCycle.map(([index, label]) => (
              <div key={label} role="listitem">
                <i aria-hidden="true" />
                <span>{index}</span>
                <strong>{label}</strong>
              </div>
            ))}
          </div>

          <Stagger className={styles.durabilityGrid} role="list" step={0.05}>
            {durableProductConcerns.map((concern, index) => (
              <StaggerItem key={concern.title} role="listitem">
                <article className={styles.durabilityItem}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{concern.title}</h3>
                    <p>{concern.description}</p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="secondary">
        <Container>
          <div className={styles.processHeader}>
            <div>
              <Eyebrow>Development process</Eyebrow>
            </div>
            <div>
              <Reveal>
                <h2>A disciplined path from idea to operation.</h2>
              </Reveal>
              <p>
                The process reduces uncertainty early, protects the critical
                product decisions, and carries responsibility through launch
                into real-world iteration.
              </p>
            </div>
          </div>

          <Stagger className={styles.processGrid} role="list" step={0.055}>
            {softwareDevelopmentProcess.map((step, index) => (
              <StaggerItem key={step.title} role="listitem">
                <article className={styles.processStep}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section className={styles.finalCta} tone="inverse">
        <Container>
          <Eyebrow>Start the right product conversation</Eyebrow>
          <Reveal>
            <h2>What should the software make possible?</h2>
          </Reveal>
          <div className={styles.finalCtaAction}>
            <p>
              Bring us the problem, the users, and the business objective. We
              will help define the right product, scope, and path to a reliable
              release.
            </p>
            <ButtonLink href="/start-a-project" variant="inverse">
              Discuss Your Software Project
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
