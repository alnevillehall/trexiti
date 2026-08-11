import type { Metadata } from "next";

import { BusinessSystemDiagram } from "@/components/marketing/business-system-diagram";
import { BusinessSystemsFlow } from "@/components/marketing/business-systems-flow";
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
import { IntegrationMap } from "@/components/marketing/system-visuals";
import {
  businessSystemCapabilities,
  customSystemSignals,
  operatingDomains,
  systemsAnalysisSteps,
} from "@/lib/content/business-systems";
import { siteConfig } from "@/lib/content/site";

import styles from "./business-systems-page.module.css";

const pageDescription =
  "Trexiti analyzes, designs, and builds connected CRM, operations, work-order, inventory, sales, finance, staff, reporting, portal, and document systems around how a business actually operates.";

export const metadata: Metadata = {
  title: "Business Systems",
  description: pageDescription,
  alternates: { canonical: "/services/business-systems" },
  openGraph: {
    title: "Business Systems | Trexiti",
    description: pageDescription,
    type: "website",
    siteName: "Trexiti",
    url: "/services/business-systems",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Systems | Trexiti",
    description: pageDescription,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Business Systems",
  description: pageDescription,
  url: `${siteConfig.url}/services/business-systems`,
  areaServed: "Global",
  serviceType: [
    "Business systems analysis",
    "Operational software",
    "CRM systems",
    "Work order systems",
    "Inventory systems",
    "Business process automation",
  ],
  provider: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
};

export default function BusinessSystemsPage() {
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
          <div className={styles.heroCopy}>
            <Reveal>
              <Eyebrow>Business systems / Operational software</Eyebrow>
              <h1 className={styles.heroTitle}>
                Software built around
                <span> how your business actually operates.</span>
              </h1>
            </Reveal>

            <div className={styles.heroSupport}>
              <Reveal delay={120}>
                <p>
                  When spreadsheets, disconnected applications, WhatsApp
                  threads and manual processes start limiting the business,
                  Trexiti designs a system around the workflows your team
                  actually needs.
                </p>
              </Reveal>
              <Reveal delay={210}>
                <ButtonLink
                  className={styles.heroAction}
                  href="/start-a-project"
                >
                  Discuss Your Operations
                </ButtonLink>
              </Reveal>
            </div>
          </div>

          <Reveal className={styles.heroSystemMap} delay={160}>
            <IntegrationMap
              ariaLabel="A central Trexiti business system connecting customers, sales, operations, staff, inventory, finance, reporting, and integrations"
              caption="One governed operating layer connects each function without assuming every specialist platform must be replaced."
              coreDetail="Shared data, workflows, permissions, and operational rules."
              coreLabel="Trexiti Business System"
              integrations={operatingDomains}
              label="Operating model"
              meta="Connected / 08 domains"
            />
          </Reveal>
        </Container>
      </section>

      <Section>
        <Container>
          <div className={styles.sectionHeader}>
            <div>
              <Eyebrow>What we build</Eyebrow>
            </div>
            <div>
              <Reveal>
                <h2>The internal technology that moves the business.</h2>
              </Reveal>
              <p>
                Not a generic dashboard over broken processes. We design the
                operational model, information structure, permissions, and
                workflows—then engineer the system that holds them together.
              </p>
            </div>
          </div>

          <Stagger className={styles.buildGrid} role="list" step={0.045}>
            {businessSystemCapabilities.map((capability) => (
              <StaggerItem key={capability.title} role="listitem">
                <article className={styles.buildItem}>
                  <span className={styles.buildIndex}>{capability.index}</span>
                  <div className={styles.buildContent}>
                    <h3>{capability.title}</h3>
                    <p>{capability.description}</p>
                  </div>
                  <span className={styles.buildDomain}>
                    {capability.domain}
                  </span>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="secondary">
        <Container>
          <div className={styles.sectionHeader}>
            <div>
              <Eyebrow>The disconnected business</Eyebrow>
            </div>
            <div>
              <Reveal>
                <h2>From fragmented tools to one operating picture.</h2>
              </Reveal>
              <p>
                The goal is not to replace every platform. It is to establish a
                reliable operational centre—and connect the specialist tools
                that still do their jobs well.
              </p>
            </div>
          </div>

          <BusinessSystemDiagram />
        </Container>
      </Section>

      <Section tone="inverse">
        <Container>
          <div className={styles.analysisIntro}>
            <div>
              <Eyebrow>Business systems analysis</Eyebrow>
              <Reveal>
                <h2>Before building software, understand the system.</h2>
              </Reveal>
            </div>
            <div className={styles.analysisLead}>
              <p>
                Trexiti studies how work, decisions, information, and money move
                through the company. That operating model becomes the basis for
                requirements, architecture, scope, and a system people can
                actually use.
              </p>
            </div>
          </div>

          <Stagger className={styles.analysisSteps} role="list" step={0.05}>
            {systemsAnalysisSteps.map((step, index) => (
              <StaggerItem key={step} role="listitem">
                <article className={styles.analysisStep}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step}</h3>
                </article>
              </StaggerItem>
            ))}
          </Stagger>

          <div className={styles.analysisOutputs}>
            <p>Analysis produces</p>
            <div>
              <strong>A shared operational model</strong>
            </div>
            <div>
              <strong>A clearly defined system boundary</strong>
            </div>
            <div>
              <strong>An evidence-based implementation roadmap</strong>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.sectionHeader}>
            <div>
              <Eyebrow>Example flow</Eyebrow>
            </div>
            <div>
              <Reveal>
                <h2>One connected path from inquiry to insight.</h2>
              </Reveal>
              <p>
                A custom business system connects each commercial and
                operational step. Select any stage to see what enters the
                system, what it coordinates, and what the next team receives.
              </p>
            </div>
          </div>

          <BusinessSystemsFlow />
        </Container>
      </Section>

      <Section tone="secondary">
        <Container>
          <div className={styles.decisionIntro}>
            <div>
              <Eyebrow>Off-the-shelf vs custom</Eyebrow>
            </div>
            <div>
              <Reveal>
                <h2>Build only where the business needs an advantage.</h2>
              </Reveal>
              <p>
                Use existing software when it solves the problem well. Custom
                software should be a deliberate response to operational fit—not
                the default answer.
              </p>
            </div>
          </div>

          <div className={styles.decisionGrid}>
            <div className={styles.existingPanel}>
              <div className={styles.decisionLabel}>
                <span>Use existing software</span>
                <span>Default / 01</span>
              </div>
              <h3>Choose the proven tool when the fit is already good.</h3>
              <div>
                <p>
                  Buying and integrating an established platform is often the
                  smartest decision. Trexiti will say so when it is.
                </p>
                <div className={styles.existingChecks}>
                  <span>The workflow is standard</span>
                  <span>The team can adopt it without costly workarounds</span>
                  <span>The economics are stronger than building</span>
                </div>
              </div>
            </div>

            <div className={styles.customPanel}>
              <div className={styles.decisionLabel}>
                <span>Build custom software</span>
                <span>When justified / 02</span>
              </div>
              <h3>Build when operational fit becomes the constraint.</h3>
              <ol className={styles.customSignals}>
                {customSystemSignals.map((signal, index) => (
                  <li key={signal}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {signal}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className={styles.decisionPrinciple}>
            <span>The Trexiti principle</span>
            <p>
              Keep what works. Integrate where coordination creates leverage.
              Build only the system boundary the business genuinely needs to
              own.
            </p>
          </div>
        </Container>
      </Section>

      <Section className={styles.finalCta} tone="inverse">
        <Container>
          <Eyebrow>Design what comes next</Eyebrow>
          <Reveal>
            <h2>
              If the business has outgrown the tools running it, let&apos;s design
              what comes next.
            </h2>
          </Reveal>
          <div className={styles.finalCtaAction}>
            <p>
              Bring us the operation, the friction, and the decisions that need
              better support. We will help define the right system response.
            </p>
            <ButtonLink href="/start-a-project" variant="inverse">
              Start a Systems Project
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
