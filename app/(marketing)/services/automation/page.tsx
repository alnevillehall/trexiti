import type { Metadata } from "next";

import { Stagger, StaggerItem } from "@/components/marketing/motion-primitives";
import {
  ButtonLink,
  Container,
  Eyebrow,
  Reveal,
  Section,
} from "@/components/marketing/site-primitives";
import {
  IntegrationMap,
  Workflow,
} from "@/components/marketing/system-visuals";
import {
  automationArchitectureStages,
  automationMethod,
  automationUseCases,
  integrationTypes,
  reliabilityControls,
} from "@/lib/content/automation";
import { siteConfig } from "@/lib/content/site";

import styles from "./automation-page.module.css";

const pageDescription =
  "Trexiti connects business software, automates repetitive operational workflows, and builds reliable processes between people, data, and applications.";

export const metadata: Metadata = {
  title: "Automation & Integration",
  description: pageDescription,
  alternates: { canonical: "/services/automation" },
  openGraph: {
    title: "Automation & Integration | Trexiti",
    description: pageDescription,
    type: "website",
    siteName: "Trexiti",
    url: "/services/automation",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Automation & Integration | Trexiti",
    description: pageDescription,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Business Automation and Systems Integration",
  description: pageDescription,
  url: `${siteConfig.url}/services/automation`,
  areaServed: "Global",
  serviceType: [
    "Business process automation",
    "Software integration",
    "API and webhook development",
    "Workflow orchestration",
    "Operational monitoring",
  ],
  provider: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
};

export default function AutomationPage() {
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
              <Eyebrow>Automation / Systems integration</Eyebrow>
              <h1 className={styles.heroTitle}>
                Make your systems work <span>together.</span>
              </h1>
            </Reveal>

            <div className={styles.heroSupport}>
              <Reveal delay={100}>
                <p>
                  Trexiti connects the software your business already uses,
                  automates repetitive workflows and builds reliable processes
                  between people, data and applications.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <ButtonLink href="/start-a-project">
                  Find What Can Be Automated
                </ButtonLink>
              </Reveal>
            </div>
          </div>

          <Reveal className={styles.heroWorkflow} delay={140} distance={18}>
            <Workflow
              ariaLabel="An automation workflow from event through validation, decision, execution, and recorded outcome"
              caption="Human control remains available while each outcome is monitored and recorded."
              label="Automation architecture"
              layout="vertical"
              meta="Monitored / controllable"
              steps={automationArchitectureStages.map(
                ([, title, description]) => ({
                  detail: description,
                  label: title,
                }),
              )}
              tone="inverse"
            />
          </Reveal>
        </Container>
      </section>

      <Section>
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>Operational use cases</Eyebrow>
            </div>
            <Reveal>
              <h2>One event. The right sequence follows.</h2>
            </Reveal>
          </div>

          <Stagger className={styles.useCaseList} role="list" step={0.055}>
            {automationUseCases.map((useCase) => (
              <StaggerItem key={useCase.trigger} role="listitem">
                <article className={styles.useCase}>
                  <div className={styles.useCaseTrigger}>
                    <span>{useCase.index}</span>
                    <h3>{useCase.trigger}</h3>
                  </div>
                  <ol className={styles.useCaseSequence}>
                    {useCase.steps.map((step, index) => (
                      <li key={step}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{step}</strong>
                      </li>
                    ))}
                  </ol>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section className={styles.integrationSection} tone="secondary">
        <Container>
          <div className={styles.integrationIntro}>
            <div>
              <Eyebrow>Integration types</Eyebrow>
              <Reveal>
                <h2>Connect the systems already doing useful work.</h2>
              </Reveal>
            </div>
            <p>
              Better operations do not always require replacing the tools the
              business already knows. Trexiti establishes the right source of
              truth, then connects each platform where information or action
              needs to move.
            </p>
          </div>

          <IntegrationMap
            ariaLabel="The Trexiti integration layer connecting twelve classes of business software and infrastructure"
            caption="Existing platforms remain useful at the edges while the integration layer governs how data and actions move between them."
            className={styles.systemIntegrationMap}
            coreDetail="Validation, routing, activity history, failure handling, and human intervention."
            coreLabel="Reliable movement of data and work"
            integrations={integrationTypes}
            label="Connected system surface"
            meta="12 integration classes"
          />
        </Container>
      </Section>

      <Section className={styles.methodSection} tone="inverse">
        <Container>
          <div className={styles.methodIntro}>
            <div>
              <Eyebrow>Automation method</Eyebrow>
              <Reveal>
                <h2>
                  Automation should eliminate work
                  <span> — not create complexity.</span>
                </h2>
              </Reveal>
            </div>
            <p>
              The objective is not the largest number of automations. It is a
              smaller, clearer operating process that removes repetitive effort
              without hiding failures or taking control away from the team.
            </p>
          </div>

          <Stagger className={styles.methodGrid} role="list" step={0.045}>
            {automationMethod.map((step) => (
              <StaggerItem key={step.title} role="listitem">
                <article className={styles.methodStep}>
                  <span>{step.index}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>

          <div className={styles.controlPlane}>
            <div className={styles.controlPlaneHeader}>
              <span>Operational control plane</span>
              <strong>Reliability is part of the build</strong>
            </div>
            <div className={styles.controlPlaneBody}>
              <div className={styles.systemBoundary}>
                <span>Inputs</span>
                <strong>People / data / applications</strong>
              </div>
              <div className={styles.orchestrationBoundary}>
                <span>Trexiti automation layer</span>
                <div>
                  <strong>Validate</strong>
                  <strong>Route</strong>
                  <strong>Execute</strong>
                </div>
              </div>
              <div className={styles.systemBoundary}>
                <span>Outcomes</span>
                <strong>Records / actions / notifications</strong>
              </div>
            </div>
            <div className={styles.reliabilityControls} role="list">
              {reliabilityControls.map((control) => (
                <div key={control} role="listitem">
                  <i aria-hidden="true" />
                  <span>{control}</span>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className={styles.finalCta} tone="accent">
        <Container>
          <Eyebrow>Reduce the work between the work</Eyebrow>
          <Reveal>
            <h2>Find what can be automated.</h2>
          </Reveal>
          <div className={styles.finalCtaAction}>
            <p>
              Bring us the repetitive process, the disconnected systems, and
              the exceptions your team handles every day. We will identify the
              right automation boundary and a reliable path forward.
            </p>
            <ButtonLink href="/start-a-project" variant="inverse">
              Discuss Your Workflow
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
