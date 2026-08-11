import type { Metadata } from "next";

import { Stagger, StaggerItem } from "@/components/marketing/motion-primitives";
import {
  ButtonLink,
  Container,
  Eyebrow,
  Reveal,
  Section,
} from "@/components/marketing/site-primitives";
import { PublishedInsightLink } from "@/components/marketing/published-insight-link";
import {
  connectedExperienceFlow,
  digitalExperienceCapabilities,
  digitalExperienceProjectTypes,
  digitalQualityPrinciples,
  websiteTypes,
} from "@/lib/content/digital-experiences";
import { siteConfig } from "@/lib/content/site";

import styles from "./digital-experiences-page.module.css";

const pageDescription =
  "Trexiti creates premium digital experiences that communicate value, strengthen trust, convert attention, and connect into the systems behind the business.";

export const metadata: Metadata = {
  title: "Digital Experiences",
  description: pageDescription,
  alternates: { canonical: "/services/digital-experiences" },
  openGraph: {
    title: "Digital Experiences | Trexiti",
    description: pageDescription,
    type: "website",
    siteName: "Trexiti",
    url: "/services/digital-experiences",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Experiences | Trexiti",
    description: pageDescription,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Digital Experience Design and Development",
  description: pageDescription,
  url: `${siteConfig.url}/services/digital-experiences`,
  areaServed: "Global",
  serviceType: [
    "Premium website design and development",
    "Digital experience strategy",
    "User experience and interface design",
    "Responsive web development",
    "Website systems integration",
    "Conversion and performance optimization",
  ],
  provider: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  },
};

const experiencePrinciples = [
  ["01", "Position", "Make the value unmistakable."],
  ["02", "Structure", "Give every audience a clear path."],
  ["03", "Experience", "Turn the story into interaction."],
  ["04", "Action", "Connect attention to the business."],
] as const;

export default function DigitalExperiencesPage() {
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
              <Eyebrow>Digital experiences / Websites</Eyebrow>
              <h1 className={styles.heroTitle}>
                Your website should do more than <span>exist.</span>
              </h1>
            </Reveal>

            <div className={styles.heroSupport}>
              <Reveal delay={100}>
                <p>
                  Trexiti creates digital experiences that communicate the
                  value of the business, strengthen trust and turn attention
                  into action.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <ButtonLink href="/start-a-project">Start a Project</ButtonLink>
              </Reveal>
            </div>
          </div>

          <Reveal className={styles.experienceModel} delay={140} distance={18}>
            <div className={styles.modelHeader}>
              <span>Digital experience system</span>
              <span>Value → action</span>
            </div>
            <div className={styles.modelStatement}>
              <span>Communicate</span>
              <strong>VALUE</strong>
              <span>Strengthen</span>
              <strong>TRUST</strong>
              <span>Enable</span>
              <strong>ACTION</strong>
            </div>
            <div className={styles.modelPrinciples}>
              {experiencePrinciples.map(([index, title, description]) => (
                <div key={title}>
                  <span>{index}</span>
                  <strong>{title}</strong>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <Section tone="secondary">
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>Target project types</Eyebrow>
            </div>
            <Reveal>
              <h2>
                Built for moments when the digital experience carries real
                commercial weight.
              </h2>
            </Reveal>
          </div>

          <Stagger className={styles.projectTypeGrid} role="list" step={0.045}>
            {digitalExperienceProjectTypes.map((projectType, index) => (
              <StaggerItem key={projectType} role="listitem">
                <div className={styles.projectType}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{projectType}</h3>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section className={styles.connectedSection} tone="inverse">
        <Container>
          <div className={styles.connectedIntro}>
            <div>
              <Eyebrow>The connected experience</Eyebrow>
              <Reveal>
                <h2>More than pages.</h2>
              </Reveal>
            </div>
            <p>
              A serious website can be{" "}
              <PublishedInsightLink slug="the-website-is-not-the-end-of-the-customer-journey">
                the entry point to the systems that qualify demand, book work,
                take payment, serve customers, and give the business better
                visibility
              </PublishedInsightLink>
              .
            </p>
          </div>

          <Stagger
            className={styles.connectedFlow}
            role="list"
            step={0.05}
          >
            {connectedExperienceFlow.map((step, index) => (
              <StaggerItem key={step} role="listitem">
                <div className={styles.flowStep}>
                  <div>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <i aria-hidden="true" />
                  </div>
                  <strong>{step}</strong>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className={styles.connectedConclusion}>
            <strong>Not an isolated brochure.</strong>
            <p>
              Trexiti designs the public experience and the connections behind
              it as one system—so interest can become a qualified lead, a
              booking, a payment, or an operational next step without losing
              context along the way.
            </p>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.capabilityIntro}>
            <div>
              <Eyebrow>Capabilities</Eyebrow>
              <Reveal>
                <h2>Strategy, experience, engineering, and connection.</h2>
              </Reveal>
            </div>
            <p>
              Trexiti brings the commercial story, content system, interaction
              model, technical platform, and connected workflows into one
              disciplined delivery process.
            </p>
          </div>

          <Stagger className={styles.capabilityMatrix} role="list" step={0.035}>
            {digitalExperienceCapabilities.map((capability, index) => (
              <StaggerItem key={capability} role="listitem">
                <div className={styles.capabilityCell}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{capability}</strong>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="accent">
        <Container>
          <div className={styles.websiteTypeIntro}>
            <Eyebrow>Website types</Eyebrow>
            <Reveal>
              <h2>Different contexts. The same standard of intent.</h2>
            </Reveal>
          </div>

          <Stagger className={styles.websiteTypeGrid} role="list" step={0.055}>
            {websiteTypes.map((websiteType, index) => (
              <StaggerItem key={websiteType.title} role="listitem">
                <article className={styles.websiteType}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{websiteType.title}</h3>
                    <p>{websiteType.description}</p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section className={styles.qualitySection} tone="inverse">
        <Container>
          <div className={styles.qualityHeader}>
            <Eyebrow>Quality, engineered in</Eyebrow>
            <p>
              The standard is not a visual layer added at the end. It shapes
              the structure, code, content, and operating model from the start.
            </p>
          </div>

          <Stagger className={styles.qualityList} role="list" step={0.06}>
            {digitalQualityPrinciples.map((principle, index) => (
              <StaggerItem key={principle.title} role="listitem">
                <article className={styles.qualityItem}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2>{principle.title}</h2>
                  <p>{principle.description}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section className={styles.finalCta}>
        <Container>
          <Eyebrow>Start the project</Eyebrow>
          <Reveal>
            <h2>Build something worth arriving at.</h2>
          </Reveal>
          <div className={styles.finalCtaAction}>
            <p>
              Bring us the ambition, the audience, and what should happen after
              they arrive. We will shape the right digital experience and the
              system around it.
            </p>
            <ButtonLink href="/start-a-project">Start a Project</ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
