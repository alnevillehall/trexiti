import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AtlasOperationsDeepDive } from "@/components/marketing/atlas-operations-deep-dive";
import { MarketingViewEvent } from "@/components/marketing/analytics-provider";
import { CaseStudyScreen } from "@/components/marketing/case-study-screen";
import { HomepageProjectVisual } from "@/components/marketing/homepage-project-visual";
import { MediaReveal, Stagger, StaggerItem } from "@/components/marketing/motion-primitives";
import {
  ButtonLink,
  Container,
  Eyebrow,
  Reveal,
  Section,
} from "@/components/marketing/site-primitives";
import { ArchitectureDiagram } from "@/components/marketing/system-visuals";
import {
  getNextProject,
  getProject,
  projects,
} from "@/lib/content/projects";
import { siteConfig } from "@/lib/content/site";

import styles from "./case-study-page.module.css";

type WorkPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return {};
  }

  const description = `${project.summary} ${project.concept ? "Concept project by Trexiti." : "Case study by Trexiti."}`;

  return {
    title: `${project.title} — ${project.projectType}`,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: `${project.title} | Trexiti Work`,
      description,
      type: "article",
      siteName: "Trexiti",
      url: `/work/${project.slug}`,
      images: ["/brand/trexiti_social_banner_1500x500.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} | Trexiti Work`,
      description,
      images: ["/brand/trexiti_social_banner_1500x500.png"],
    },
  };
}

export default async function WorkDetailPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    notFound();
  }

  const nextProject = getNextProject(slug);
  const caseStudyJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    headline: `${project.title} — ${project.projectType}`,
    description: project.summary,
    url: `${siteConfig.url}/work/${project.slug}`,
    dateCreated: project.year,
    genre: project.categories,
    abstract: project.disclaimer,
    creator: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <>
      <MarketingViewEvent
        event="case_study_view"
        route={`/work/${project.slug}`}
        slug={project.slug}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(caseStudyJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className={styles.hero}>
        <Container>
          <div className={styles.heroTopline}>
            <Eyebrow>
              Work {project.index} / {project.projectType}
            </Eyebrow>
            {project.concept ? (
              <span className={styles.conceptLabel}>Concept Project</span>
            ) : null}
          </div>

          <Reveal>
            <h1>{project.title}</h1>
          </Reveal>

          <div className={styles.heroDetails}>
            <Reveal>
              <p>{project.summary}</p>
            </Reveal>
            <dl>
              <div>
                <dt>Industry</dt>
                <dd>{project.industry}</dd>
              </div>
              <div>
                <dt>Year</dt>
                <dd>{project.year}</dd>
              </div>
              <div>
                <dt>Services</dt>
                <dd>{project.services.slice(0, 3).join(" / ")}</dd>
              </div>
            </dl>
          </div>
        </Container>
      </section>

      <Container className={styles.heroVisual} size="full">
        <MediaReveal>
          <HomepageProjectVisual project={project} />
        </MediaReveal>
      </Container>

      {project.concept ? (
        <div className={styles.disclaimerBand}>
          <Container>
            <strong>Concept Project</strong>
            <p>{project.disclaimer}</p>
          </Container>
        </div>
      ) : null}

      <Section>
        <Container className={styles.overviewGrid}>
          <div>
            <Eyebrow>Overview</Eyebrow>
          </div>
          <div className={styles.overviewNarrative}>
            {project.overview.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <aside className={styles.projectScope}>
            <h2>Project scope</h2>
            <div>
              <h3>Services</h3>
              <ul>
                {project.services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Technologies</h3>
              <ul>
                {project.technologies.map((technology) => (
                  <li key={technology}>{technology}</li>
                ))}
              </ul>
            </div>
          </aside>
        </Container>
      </Section>

      <Section tone="secondary">
        <Container className={styles.narrativeSection}>
          <div>
            <Eyebrow>The challenge</Eyebrow>
            <Reveal>
              <h2>A business problem before a design problem.</h2>
            </Reveal>
          </div>
          <div className={styles.narrativeCopy}>
            {project.challenge.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="inverse">
        <Container>
          <div className={styles.sectionHeader}>
            <div>
              <Eyebrow>Understanding the business</Eyebrow>
              <Reveal>
                <h2>Model the reality behind the brief.</h2>
              </Reveal>
            </div>
            <p>{project.understandingBusiness.introduction}</p>
          </div>

          <Stagger className={styles.findingGrid} role="list" step={0.07}>
            {project.understandingBusiness.findings.map((finding, index) => (
              <StaggerItem key={finding.title} role="listitem">
                <article className={styles.finding}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{finding.title}</h3>
                    <p>{finding.description}</p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section tone="accent">
        <Container>
          <div className={styles.strategyHeader}>
            <Eyebrow>System / Experience strategy</Eyebrow>
            <Reveal>
              <h2>{project.strategy.statement}</h2>
            </Reveal>
          </div>

          <div className={styles.strategyPrinciples} role="list">
            {project.strategy.principles.map((principle, index) => (
              <article key={principle.title} role="listitem">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{principle.title}</h3>
                <p>{principle.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      {project.atlasDetail ? (
        <AtlasOperationsDeepDive detail={project.atlasDetail} />
      ) : (
        <Section>
        <Container>
          <div className={styles.architectureIntro}>
            <div>
              <Eyebrow>Architecture</Eyebrow>
              <Reveal>
                <h2>One coherent system. Deliberate boundaries.</h2>
              </Reveal>
            </div>
            <p>{project.architecture.summary}</p>
          </div>

          <ArchitectureDiagram
            ariaLabel={`The proposed ${project.title} architecture connecting business inputs, system layers, and technical edges`}
            caption="The architecture translates the operating model into explicit product boundaries, shared data, and managed connections."
            className={styles.systemArchitecture}
            foundation="Permissions / Data / Reliability / Governance"
            label={`${project.title} / Proposed architecture`}
            layers={project.architecture.layers.map((layer, index) => ({
              detail: layer.description,
              emphasis:
                index === Math.floor(project.architecture.layers.length / 2),
              label: layer.title,
            }))}
            leftRail={{
              items: project.services.slice(0, 4),
              label: "Business and product inputs",
            }}
            meta="Business to system"
            rightRail={{
              items: project.technologies.slice(0, 4),
              label: "Technical edges",
            }}
          />
        </Container>
        </Section>
      )}

      <Section tone="inverse">
        <Container>
          <div className={styles.featuresHeader}>
            <Eyebrow>Core features</Eyebrow>
            <Reveal>
              <h2>Capabilities tied to the operating model.</h2>
            </Reveal>
          </div>

          <Stagger className={styles.featureGrid} role="list" step={0.055}>
            {project.keyFeatures.map((feature, index) => (
              <StaggerItem key={feature.title} role="listitem">
                <article className={styles.feature}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      <Section className={styles.gallerySection}>
        <Container>
          <div className={styles.galleryHeader}>
            <div>
              <Eyebrow>Interface gallery</Eyebrow>
              <Reveal>
                <h2>Interfaces as expressions of the system.</h2>
              </Reveal>
            </div>
            <p>
              These concept screens communicate hierarchy, workflow, and
              interaction direction. They are not representations of a live
              deployed product.
            </p>
          </div>

          <div className={styles.gallery}>
            {project.screens.map((screen, index) => (
              <MediaReveal key={screen.title}>
                <CaseStudyScreen
                  index={index}
                  project={project}
                  screen={screen}
                />
              </MediaReveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="inverse">
        <Container>
          <div className={styles.engineeringHeader}>
            <div>
              <Eyebrow>Engineering</Eyebrow>
              <Reveal>
                <h2>Designed beyond the interface.</h2>
              </Reveal>
            </div>
            <div>
              {project.engineering.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className={styles.technicalNotes}>
            <div>
              <span>Technical notes</span>
              <strong>Proposed engineering direction</strong>
            </div>
            <ol>
              {project.technicalNotes.map((note, index) => (
                <li key={note}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{note}</p>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section tone="accent">
        <Container className={styles.outcomeGrid}>
          <div>
            <Eyebrow>Outcome</Eyebrow>
            <Reveal>
              <h2>A credible direction, without invented results.</h2>
            </Reveal>
          </div>
          <div>
            {project.result.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {project.concept ? (
              <div className={styles.outcomeDisclaimer}>
                <strong>Concept Project</strong>
                <p>{project.disclaimer}</p>
              </div>
            ) : null}
          </div>
        </Container>
      </Section>

      {nextProject ? (
        <section className={styles.nextProject}>
          <Link href={`/work/${nextProject.slug}`}>
            <Container>
              <div className={styles.nextProjectMeta}>
                <span>Next project</span>
                <span>{nextProject.index} / {nextProject.projectType}</span>
              </div>
              <div className={styles.nextProjectTitle}>
                <h2>{nextProject.title}</h2>
                <span aria-hidden="true">↗</span>
              </div>
            </Container>
          </Link>
        </section>
      ) : null}

      <Section className={styles.finalCta} tone="inverse">
        <Container>
          <Eyebrow>Build the next system</Eyebrow>
          <Reveal>
            <h2>What should work better in your business?</h2>
          </Reveal>
          <div className={styles.finalCtaAction}>
            <p>
              Start with the business problem, workflow, or customer experience
              that has become too important to leave fragmented.
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
