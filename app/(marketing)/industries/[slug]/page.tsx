import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/marketing/motion-primitives";
import {
  ButtonLink,
  Container,
  Eyebrow,
  Section,
} from "@/components/marketing/site-primitives";
import {
  IntegrationMap,
  SystemFlow,
} from "@/components/marketing/system-visuals";
import {
  getIndustry,
  industries,
  industryLinks,
} from "@/lib/content/industries";
import { siteConfig } from "@/lib/content/site";

import styles from "./industry-page.module.css";

type IndustryPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return industries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: IndustryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustry(slug);

  if (!industry) return {};

  const canonical = `/industries/${industry.slug}`;
  return {
    title: industry.metaTitle,
    description: industry.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: `${industry.metaTitle} | Trexiti`,
      description: industry.metaDescription,
      type: "website",
      siteName: siteConfig.name,
      url: canonical,
      images: [
        {
          url: "/brand/trexiti_social_banner_1500x500.png",
          width: 1500,
          height: 500,
          alt: `${siteConfig.name} — ${industry.title} digital systems`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${industry.metaTitle} | Trexiti`,
      description: industry.metaDescription,
      images: ["/brand/trexiti_social_banner_1500x500.png"],
    },
  };
}

const relatedServices = [
  { href: "/services/digital-experiences", label: "Digital experiences" },
  { href: "/services/business-systems", label: "Business systems" },
  { href: "/services/automation", label: "Automation and integration" },
] as const;

export default async function IndustryPage({ params }: IndustryPageProps) {
  const { slug } = await params;
  const industry = getIndustry(slug);

  if (!industry) notFound();

  const canonicalUrl = `${siteConfig.url}/industries/${industry.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `${industry.title} digital systems`,
        description: industry.metaDescription,
        url: canonicalUrl,
        areaServed: "Global",
        audience: {
          "@type": "BusinessAudience",
          audienceType: `${industry.title} businesses`,
        },
        provider: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        serviceType: [
          ...industry.digitalExperiences.map((item) => item.title),
          ...industry.operationalSystems.map((item) => item.title),
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Trexiti",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Industries",
            item: `${siteConfig.url}/#industries`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: industry.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\u003c"),
        }}
      />

      <section className={styles.hero}>
        <Container>
          <div className={styles.heroRail}>
            <span>Industry systems</span>
            <span>{industry.title}</span>
          </div>
          <div className={styles.heroGrid}>
            <Reveal>
              <Eyebrow>{industry.title} / Digital + operational</Eyebrow>
              <h1>{industry.headline}</h1>
            </Reveal>
            <div className={styles.heroSupporting}>
              <Reveal delay={100}>
                <p>{industry.summary}</p>
              </Reveal>
              <Reveal delay={170}>
                <ButtonLink href="/start-a-project">
                  Discuss your operation
                </ButtonLink>
              </Reveal>
            </div>
          </div>
          <div className={styles.heroIntroduction}>
            <span>Context / 01</span>
            <p>{industry.introduction}</p>
          </div>
        </Container>
      </section>

      <Section tone="inverse">
        <Container>
          <div className={styles.sectionHeadingInverse}>
            <div>
              <Eyebrow>Connected operating view</Eyebrow>
              <span>System / 02</span>
            </div>
            <div>
              <Reveal>
                <h2>The digital experience is one part of the system.</h2>
              </Reveal>
              <p>
                The useful question is how attention, requests, work, records,
                decisions and commercial activity should move together.
              </p>
            </div>
          </div>
          <SystemFlow
            ariaLabel={`${industry.title} system flow from ${industry.systemFlow.join(" through ")}`}
            caption="An illustrative operating sequence. The actual system boundary is defined through analysis of the organization, its users, and the platforms already in place."
            label={`${industry.title} operating sequence`}
            meta={`${String(industry.systemFlow.length).padStart(2, "0")} connected stages`}
            nodes={industry.systemFlow}
            tone="inverse"
          />
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <Eyebrow>Common operating problems</Eyebrow>
              <span>Analysis / 03</span>
            </div>
            <div>
              <Reveal>
                <h2>Where coordination commonly starts to break down.</h2>
              </Reveal>
              <p>
                These are recurring patterns Trexiti is equipped to investigate,
                not assumptions about every organization in the sector.
              </p>
            </div>
          </div>
          <ol className={styles.problemList}>
            {industry.problems.map((problem, index) => (
              <li key={problem.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{problem.title}</h3>
                <p>{problem.description}</p>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section tone="secondary">
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <Eyebrow>What Trexiti can build</Eyebrow>
              <span>Capability / 04</span>
            </div>
            <div>
              <Reveal>
                <h2>Customer-facing experiences and the operating systems behind them.</h2>
              </Reveal>
              <p>
                Scope follows the business case. An engagement may involve one
                focused experience, a connected operating layer, or a phased
                combination of both.
              </p>
            </div>
          </div>
          <div className={styles.capabilitySplit}>
            <article>
              <div className={styles.capabilityHeader}>
                <span>External</span>
                <h3>Digital experiences</h3>
              </div>
              <ol>
                {industry.digitalExperiences.map((item, index) => (
                  <li key={item.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><h4>{item.title}</h4><p>{item.description}</p></div>
                  </li>
                ))}
              </ol>
            </article>
            <article className={styles.systemsPanel}>
              <div className={styles.capabilityHeader}>
                <span>Internal</span>
                <h3>Operational systems</h3>
              </div>
              <ol>
                {industry.operationalSystems.map((item, index) => (
                  <li key={item.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div><h4>{item.title}</h4><p>{item.description}</p></div>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.sectionHeading}>
            <div>
              <Eyebrow>Workflow automation</Eyebrow>
              <span>Movement / 05</span>
            </div>
            <div>
              <Reveal>
                <h2>Automate the handoff, preserve the decision.</h2>
              </Reveal>
              <p>
                Useful automation reduces repetitive coordination while keeping
                failure states, approvals and human intervention visible.
              </p>
            </div>
          </div>
          <div className={styles.automationGrid}>
            {industry.automations.map((automation, index) => (
              <article key={automation.title}>
                <div className={styles.automationTopline}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span>Controlled workflow</span>
                </div>
                <h3>{automation.title}</h3>
                <ol aria-label={`${automation.title} workflow`}>
                  {automation.flow.map((step) => <li key={step}>{step}</li>)}
                </ol>
                <p>{automation.outcome}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="accent">
        <Container>
          <div className={styles.sectionHeadingInverse}>
            <div>
              <Eyebrow>Integration strategy</Eyebrow>
              <span>Connect / 06</span>
            </div>
            <div>
              <Reveal>
                <h2>Keep the specialist systems that already do their job well.</h2>
              </Reveal>
              <p>
                Trexiti can create the coordinating layer and integrate existing
                platforms where their supported interfaces, data quality and
                commercial fit justify it.
              </p>
            </div>
          </div>
          <IntegrationMap
            ariaLabel={`A Trexiti operating layer connecting ${industry.integrations.map((item) => item.title).join(", ")}`}
            caption="Integration feasibility depends on the interfaces, permissions, data quality, commercial terms, and technical constraints of each platform."
            coreDetail="Shared workflow, operational context, roles, and visibility."
            coreLabel={`${industry.title} operating layer`}
            integrations={industry.integrations.map((item) => item.title)}
            label="Existing system landscape"
            meta="Keep / Connect / Build"
            tone="accent"
          />
          <dl className={styles.integrationNotes}>
            {industry.integrations.map((integration) => (
              <div key={integration.title}>
                <dt>{integration.title}</dt>
                <dd>{integration.description}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className={styles.engagementGrid}>
            <div className={styles.engagementIntro}>
              <Eyebrow>Typical engagement</Eyebrow>
              <Reveal>
                <h2>Understand the operation before defining the technology.</h2>
              </Reveal>
              <p>
                The exact sequence depends on scope and evidence. A typical
                engagement moves through these four decisions before expanding.
              </p>
            </div>
            <ol className={styles.engagementSteps}>
              {industry.engagement.map((phase, index) => (
                <li key={phase.title}>
                  <div><span>{String(index + 1).padStart(2, "0")}</span><small>{phase.output}</small></div>
                  <h3>{phase.title}</h3>
                  <p>{phase.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <section className={styles.relatedSection} aria-labelledby="related-industries-title">
        <Container>
          <div className={styles.relatedHeader}>
            <div><span>Explore</span><h2 id="related-industries-title">Related industries</h2></div>
            <div className={styles.serviceLinks}>
              {relatedServices.map((service) => <Link href={service.href} key={service.href}>{service.label}</Link>)}
            </div>
          </div>
          <nav className={styles.industryLinks} aria-label="Industry pages">
            {industryLinks.map((item, index) => (
              <Link aria-current={item.href === `/industries/${industry.slug}` ? "page" : undefined} href={item.href} key={item.href}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item.label}</strong>
                <i aria-hidden="true">↗</i>
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      <Section className={styles.finalCta} tone="inverse">
        <Container>
          <Eyebrow>{industry.title} / Start with the operation</Eyebrow>
          <Reveal>
            <h2>Bring us the business problem, the workflows and the systems already in place.</h2>
          </Reveal>
          <div className={styles.finalCtaAction}>
            <p>
              We will help determine whether the right answer is a digital
              experience, an operating system, an integration, or a deliberate
              combination.
            </p>
            <ButtonLink href="/start-a-project" variant="inverse">
              Start a project
            </ButtonLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
