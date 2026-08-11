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
import siteStyles from "@/components/marketing/trexiti-site.module.css";
import { siteConfig } from "@/lib/content/site";

import styles from "./about-page.module.css";

const pageDescription =
  "Trexiti combines business analysis, product thinking, systems design, and software engineering to build technology around how a business actually operates.";

export const metadata: Metadata = {
  title: "About",
  description: pageDescription,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Trexiti",
    description: pageDescription,
    type: "website",
    siteName: "Trexiti",
    url: "/about",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Trexiti",
    description: pageDescription,
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

const fragmentedTools = [
  "Spreadsheets",
  "Manual processes",
  "WhatsApp groups",
  "Standalone applications",
  "Paper",
  "Email",
  "Legacy systems",
] as const;

const businessElements = [
  {
    index: "01",
    title: "People",
    description: "The people doing the work, making decisions, and using the system.",
  },
  {
    index: "02",
    title: "Processes",
    description: "The sequence of actions, approvals, handoffs, and exceptions.",
  },
  {
    index: "03",
    title: "Customers",
    description: "The experience outside the business and every promise made to them.",
  },
  {
    index: "04",
    title: "Data",
    description: "The information the operation needs to act, measure, and improve.",
  },
] as const;

const founderDisciplines = [
  "Business systems analysis",
  "Software engineering",
  "Product architecture",
  "Process improvement",
  "Operational systems",
  "Digital product development",
] as const;

const principles = [
  {
    title: "Understand before building.",
    description:
      "Start with the business, the users, and the constraint—not a predetermined solution.",
  },
  {
    title: "Simplify before automating.",
    description:
      "Automation should strengthen a sound process, not make a confusing one run faster.",
  },
  {
    title: "Integrate before replacing.",
    description:
      "Keep useful tools where they work, then connect or replace only what the operating model requires.",
  },
  {
    title: "Build for the people using it.",
    description:
      "The system must make real work clearer for the people responsible for doing it.",
  },
  {
    title: "Design for operations, not screenshots.",
    description:
      "A polished interface matters, but reliability, handoffs, permissions, and exceptions matter more.",
  },
  {
    title: "Technology should create leverage.",
    description:
      "The outcome should be better visibility, less friction, and greater capacity across the business.",
  },
] as const;

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Trexiti",
  description: pageDescription,
  url: `${siteConfig.url}/about`,
  mainEntity: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    slogan: siteConfig.tagline,
    founder: {
      "@type": "Person",
      name: "Al Neville Hall",
      jobTitle: "Founder / Business Systems & Software",
    },
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className={styles.hero}>
        <Container>
          <div className={styles.heroMeta}>
            <Eyebrow>About Trexiti</Eyebrow>
            <span>Business analysis / Systems design / Engineering</span>
          </div>

          <Reveal>
            <h1 className={styles.heroTitle}>
              Software works better when you understand the business first.
            </h1>
          </Reveal>

          <div className={styles.heroOpening}>
            <Reveal delay={90}>
              <p className={styles.heroLead}>
                Trexiti combines business analysis, product thinking, systems
                design and software engineering.
              </p>
            </Reveal>
            <Reveal delay={150}>
              <p className={styles.heroDetail}>
                We work backwards from the way customers, employees,
                information and money move through a company — then determine
                what technology should exist around them.
              </p>
            </Reveal>
            <Reveal className={styles.heroSequence} delay={210}>
              <span>Operating model</span>
              <i aria-hidden="true" />
              <span>System</span>
              <i aria-hidden="true" />
              <strong>Software</strong>
            </Reveal>
          </div>
        </Container>
      </section>

      <Section className={styles.whySection} tone="secondary">
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>Why Trexiti exists</Eyebrow>
              <span className={styles.sectionIndex}>01 / Fragmentation</span>
            </div>
            <Reveal>
              <h2>Businesses rarely become disconnected all at once.</h2>
            </Reveal>
          </div>

          <div className={styles.whyLayout}>
            <div className={styles.whyCopy}>
              <p>
                Tools and workarounds accumulate as the business changes. Each
                one may solve an immediate problem, but over time the operating
                model becomes distributed across places that do not share
                context.
              </p>
              <p>
                Eventually, information becomes fragmented and employees
                become the integration layer—copying, chasing, reconciling, and
                remembering what the systems do not.
              </p>
              <p>
                Trexiti helps redesign this: first by making the operating model
                visible, then by deciding what should be simplified, connected,
                automated, or built.
              </p>
            </div>

            <Reveal className={styles.fragmentationFigure} delay={110}>
              <figure aria-labelledby="fragmentation-title">
                <div className={styles.figureHeader}>
                  <span id="fragmentation-title">Fragmented operating model</span>
                  <span>Before redesign</span>
                </div>
                <ul className={styles.toolGrid}>
                  {fragmentedTools.map((tool, index) => (
                    <li key={tool}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{tool}</strong>
                    </li>
                  ))}
                </ul>
                <div className={styles.integrationLayer}>
                  <div>
                    <span>Manual connection layer</span>
                    <strong>Employees</strong>
                  </div>
                  <ul aria-label="Manual coordination tasks">
                    <li>Copy</li>
                    <li>Chase</li>
                    <li>Reconcile</li>
                    <li>Remember</li>
                  </ul>
                </div>
                <figcaption>
                  The problem is not any single tool. It is the missing system
                  between them.
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </Container>
      </Section>

      <Section className={styles.frameworkSection} tone="inverse">
        <Container>
          <div className={styles.sectionIntroInverse}>
            <div>
              <Eyebrow>Business before technology</Eyebrow>
              <span className={styles.sectionIndex}>02 / Design order</span>
            </div>
            <div>
              <Reveal>
                <h2>Technology should fit the operating model.</h2>
              </Reveal>
              <p>
                Trexiti looks at the business as a connected system. The first
                questions are about what must happen, who is involved, what
                customers need, and which information has to move.
              </p>
            </div>
          </div>

          <Reveal className={styles.frameworkFigure} delay={100}>
            <figure aria-labelledby="framework-title">
              <div className={styles.technologyFrame}>
                <div className={styles.technologyLabel}>
                  <span>05</span>
                  <div>
                    <strong id="framework-title">Technology</strong>
                    <small>The enabling layer</small>
                  </div>
                </div>
                <div className={styles.businessCore}>
                  {businessElements.map((element) => (
                    <article key={element.title}>
                      <span>{element.index}</span>
                      <h3>{element.title}</h3>
                      <p>{element.description}</p>
                    </article>
                  ))}
                </div>
              </div>
              <figcaption>
                Technology sits around people, processes, customers and data —
                not the other way around.
              </figcaption>
            </figure>
          </Reveal>
        </Container>
      </Section>

      <Section className={styles.founderSection}>
        <Container>
          <div className={styles.founderGrid}>
            <div className={styles.founderIdentity}>
              <div className={styles.founderMark} aria-hidden="true">
                ANH
              </div>
              <Eyebrow>Founder-led</Eyebrow>
              <h2>Al Neville Hall</h2>
              <p>Founder / Business Systems &amp; Software</p>
            </div>

            <div className={styles.founderStory}>
              <Reveal>
                <h3>Close to the problem. Accountable to the outcome.</h3>
              </Reveal>
              <p>
                Trexiti is a founder-led consultancy. Al leads the work across
                business analysis, product definition, systems thinking, and
                software delivery—keeping the original business problem close
                to the decisions made throughout a project.
              </p>
              <p>
                The role is not to arrive with a predetermined product. It is
                to understand the operation, shape the right response, and
                connect commercial intent to a system people can actually use.
              </p>

              <Stagger
                className={styles.disciplineList}
                role="list"
                step={0.055}
              >
                {founderDisciplines.map((discipline, index) => (
                  <StaggerItem key={discipline} role="listitem">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{discipline}</strong>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </Container>
      </Section>

      <Section className={styles.principlesSection} tone="secondary">
        <Container>
          <div className={styles.sectionIntro}>
            <div>
              <Eyebrow>How we think</Eyebrow>
              <span className={styles.sectionIndex}>03 / Principles</span>
            </div>
            <Reveal>
              <h2>A practical standard for better systems.</h2>
            </Reveal>
          </div>

          <Stagger className={styles.principlesList} role="list" step={0.06}>
            {principles.map((principle, index) => (
              <StaggerItem key={principle.title} role="listitem">
                <article>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{principle.title}</h3>
                  <p>{principle.description}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section
        className={`${siteStyles.homeFinalCta} ${styles.finalCta}`}
        tone="accent"
      >
        <Container>
          <Eyebrow>Begin with the business</Eyebrow>
          <Reveal>
            <h2>Let&apos;s understand what your business needs next.</h2>
          </Reveal>
          <div className={styles.finalCtaAction}>
            <p>
              Bring the operation, the friction, and the ambition. We will start
              by understanding what should work differently.
            </p>
            <ButtonLink href="/start-a-project" variant="inverse">
              Start a Project
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
