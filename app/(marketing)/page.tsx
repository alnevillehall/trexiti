import type { Metadata } from "next";
import Link from "next/link";

import { HomepageProjectVisual } from "@/components/marketing/homepage-project-visual";
import {
  MediaReveal,
  Stagger,
  StaggerItem,
  WordReveal,
} from "@/components/marketing/motion-primitives";
import {
  ButtonLink,
  Container,
  Eyebrow,
  Reveal,
  Section,
  TextLink,
} from "@/components/marketing/site-primitives";
import { SystemsMethod } from "@/components/marketing/systems-method";
import { BusinessFunctionMap } from "@/components/marketing/system-visuals";
import styles from "@/components/marketing/trexiti-site.module.css";
import {
  businessProblems,
  engineeringCapabilities,
  homepageProjects,
  positioningInputs,
  technologyStack,
} from "@/lib/content/home";
import { industryLinks } from "@/lib/content/industries";
import { services } from "@/lib/content/services";
import { siteConfig, trexitiDiscoverUrl } from "@/lib/content/site";
import { organizationSocialProfileUrls } from "@/lib/marketing/contact";

export const metadata: Metadata = {
  title: {
    absolute: "Trexiti — Digital systems for ambitious businesses",
  },
  description:
    "Trexiti designs and engineers websites, software, operational systems, and automation around how ambitious businesses actually work.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Trexiti — Digital systems for ambitious businesses",
    description:
      "Trexiti designs and engineers websites, software, operational systems, and automation around how ambitious businesses actually work.",
    type: "website",
    siteName: siteConfig.name,
    url: "/",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trexiti — Digital systems for ambitious businesses",
    description:
      "Trexiti designs and engineers websites, software, operational systems, and automation around how ambitious businesses actually work.",
    images: ["/brand/trexiti_social_banner_1500x500.png"],
  },
};

const homeSystemFlow = [
  { label: "Customer", meta: "Demand" },
  { label: "Sales", meta: "Commercial" },
  { label: "Operations", meta: "Coordination" },
  { label: "Delivery", meta: "Execution" },
  { label: "Finance", meta: "Value" },
  { label: "Reporting", meta: "Insight", emphasis: true },
] as const;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  email: siteConfig.email,
  description: siteConfig.description,
  areaServed: "Global",
  serviceType: [
    "Digital experiences",
    "Custom software",
    "Business systems",
    "Automation and integrations",
    "Business systems analysis",
  ],
  sameAs: organizationSocialProfileUrls,
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className={styles.homeHero}>
        <Container className={styles.heroGrid}>
          <div className={styles.heroStatement}>
            <Reveal>
              <Eyebrow>Digital systems for ambitious businesses.</Eyebrow>
              <h1 className={styles.heroTitle}>
                <WordReveal
                  accentFrom={5}
                  mode="load"
                  text="Build the systems your business needs to move forward."
                />
              </h1>
            </Reveal>

            <div className={styles.heroSupport}>
              <Reveal className={styles.heroActions} delay={140}>
                <ButtonLink href="/start-a-project">Start a Project</ButtonLink>
                <TextLink href="/work">View Selected Work</TextLink>
              </Reveal>
              <Reveal className={styles.heroCopy} delay={220}>
                <p>
                  Trexiti designs and engineers websites, software,
                  operational systems and automation around how your business
                  actually works.
                </p>
              </Reveal>
            </div>
          </div>

          <Reveal className={styles.heroSystemMap} delay={260}>
            <BusinessFunctionMap
              ariaLabel="A connected business flow from customer through sales, operations, delivery, finance, and reporting"
              caption="Customer-facing products and the operating system behind them."
              functions={homeSystemFlow}
              label="One connected business"
              meta="Demand to insight"
            />
          </Reveal>
        </Container>
      </section>

      <Section tone="secondary">
        <Container className={styles.positioningGrid}>
          <div className={styles.positioningStatement}>
            <Eyebrow>One Trexiti ecosystem</Eyebrow>
            <h2>
              Get found—or build what the business needs next.
            </h2>
          </div>
          <div className={styles.positioningDetail}>
            <p>
              Consumer-facing businesses seeking visibility can be assessed for
              Trexiti Discover. Businesses that need a website, customer
              experience, automation, integration, or custom software work with
              Trexiti.
            </p>
            <p>
              Discover remains a curated, permissioned marketplace. A Trexiti
              enquiry does not automatically create an account or publish a
              business profile.
            </p>
            <div className={styles.heroActions}>
              <a href={trexitiDiscoverUrl}>Learn about Trexiti Discover</a>
              <TextLink href="/start-a-project">Work with Trexiti</TextLink>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="inverse">
        <Container>
          <div className={styles.selectedWorkHeader}>
            <div>
              <Eyebrow>Selected work</Eyebrow>
              <h2>Selected work.</h2>
              <p>
                From customer experiences to the systems behind the business.
              </p>
            </div>
            <TextLink href="/work" inverse>
              View all work
            </TextLink>
          </div>

          <Stagger className={styles.flagshipGrid} role="list" step={0.09}>
            {homepageProjects.map((project, index) => (
              <StaggerItem
                className={index === 0 ? styles.flagshipProjectLead : undefined}
                key={project.title}
                role="listitem"
              >
                <article className={styles.flagshipProject}>
                  <Link
                    className={styles.flagshipProjectLink}
                    href={`/work/${project.slug}`}
                  >
                    <MediaReveal delay={index * 70}>
                      <HomepageProjectVisual project={project} />
                    </MediaReveal>
                    <div className={styles.flagshipMeta}>
                      <span>{project.category}</span>
                      <span>{project.index}</span>
                    </div>
                    <h3>
                      {project.title}
                      <span>{project.descriptor}</span>
                    </h3>
                    <p>{project.description}</p>
                  </Link>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="secondary">
        <Container className={styles.positioningGrid}>
          <div className={styles.positioningStatement}>
            <Eyebrow>The real opportunity</Eyebrow>
            <Reveal>
              <h2>
                Most businesses don&apos;t need another piece of software.
                <span>They need their systems to work together.</span>
              </h2>
            </Reveal>
          </div>

          <div className={styles.positioningDetail}>
            <Reveal>
              <p>
                Trexiti begins with the operation—not a predetermined platform.
                We study the forces shaping the business, then design the right
                experience, workflow, and technical response.
              </p>
            </Reveal>
            <Stagger className={styles.positioningInputs} role="list" step={0.06}>
              {positioningInputs.map((input, index) => (
                <StaggerItem key={input.title} role="listitem">
                  <div className={styles.positioningInput}>
                    <span>0{index + 1}</span>
                    <strong>{input.title}</strong>
                    <p>{input.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <Eyebrow>Capabilities</Eyebrow>
            </div>
            <div>
              <h2>What we build.</h2>
              <p>
                Customer-facing products and internal systems, held together by
                one business-first discipline from analysis through engineering.
              </p>
            </div>
          </div>

          <Stagger className={styles.capabilityList} role="list" step={0.055}>
            {services.map((service) => (
              <StaggerItem key={service.slug} role="listitem">
                <Link
                  className={styles.capabilityItem}
                  href={`/services/${service.slug}`}
                >
                  <span>{service.index}</span>
                  <h3>{service.title}</h3>
                  <p>{service.summary}</p>
                  <span aria-hidden="true">{"\u2197"}</span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="inverse">
        <Container>
          <div className={styles.systemsHeading}>
            <Eyebrow>Systems thinking</Eyebrow>
            <Reveal>
              <h2>
                We don&apos;t start with technology.
                <span>We start with how the business works.</span>
              </h2>
            </Reveal>
          </div>

          <SystemsMethod />
        </Container>
      </Section>

      <Section>
        <Container className={styles.problemsLayout}>
          <div className={styles.problemsIntro}>
            <Eyebrow>Business problems</Eyebrow>
            <h2>When Trexiti makes sense.</h2>
            <p>
              The clearest opportunities are often hiding in ordinary work:
              repeated entry, missing visibility, fragmented service, and tools
              the business has quietly outgrown.
            </p>
          </div>

          <Stagger className={styles.problemsList} role="list" step={0.045}>
            {businessProblems.map((problem, index) => (
              <StaggerItem key={problem} role="listitem">
                <div className={styles.problemItem}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{problem}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="secondary">
        <Container>
          <div className={styles.engineeringHeader}>
            <div>
              <Eyebrow>Technical capability</Eyebrow>
              <h2>
                Modern engineering.
                <span>Business-first decisions.</span>
              </h2>
            </div>
            <p>
              We choose technology for reliability, maintainability, and fit.
              The stack supports the operating model; it does not become the
              story.
            </p>
          </div>

          <Stagger className={styles.engineeringGrid} role="list" step={0.065}>
            {engineeringCapabilities.map((capability, index) => (
              <StaggerItem key={capability.title} role="listitem">
                <div className={styles.engineeringGroup}>
                  <span>0{index + 1}</span>
                  <h3>{capability.title}</h3>
                  <ul>
                    {capability.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <div className={styles.technologyLine}>
            <p>Selected technologies</p>
            <div role="list">
              {technologyStack.map((technology) => (
                <span key={technology} role="listitem">
                  {technology}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <div className={styles.sectorsStrip} id="industries">
        <Container className={styles.sectorsInner}>
          <p>Working across complex sectors</p>
          <div className={styles.staticSectorList} role="list">
            {industryLinks.map((industry) => (
              <Link href={industry.href} key={industry.href} role="listitem">
                {industry.label}
              </Link>
            ))}
          </div>
        </Container>
      </div>

      <Section tone="accent">
        <Container className={styles.aboutHomeGrid} size="standard">
          <div>
            <Eyebrow>About Trexiti</Eyebrow>
            <h2>Business analysis meets software engineering.</h2>
          </div>
          <Reveal className={styles.aboutHomeCopy}>
            <p>
              Trexiti was built around a simple belief: the best software starts
              with understanding the business.
            </p>
            <p>
              We study how customers, staff, information, and money move through
              the organization, then combine process analysis, UX, systems
              architecture, software development, and automation to make those
              systems work better.
            </p>
            <TextLink href="/about" inverse>
              How Trexiti works
            </TextLink>
          </Reveal>
        </Container>
      </Section>

      <Section className={styles.homeFinalCta} tone="inverse">
        <Container>
          <Eyebrow>Start a conversation</Eyebrow>
          <Reveal>
            <h2>What should work better in your business?</h2>
            <div className={styles.homeFinalCtaActions}>
              <p>Tell us what you&apos;re trying to improve, replace, or build.</p>
              <div>
                <ButtonLink href="/start-a-project" variant="inverse">
                  Start a Project
                </ButtonLink>
                <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
