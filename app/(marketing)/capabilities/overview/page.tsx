import type { Metadata } from "next";
import Link from "next/link";

import {
  BrandDocumentView,
  CapabilityPrintButton,
} from "@/components/marketing/brand-document-actions";
import styles from "@/components/marketing/brand-documents.module.css";
import { capabilityStatement } from "@/lib/content/capability-statement";
import { siteConfig } from "@/lib/content/site";

const description =
  "A concise overview of Trexiti's digital experiences, custom software, business systems, automation and engagement process.";

export const metadata: Metadata = {
  title: "Capability Statement",
  description,
  alternates: { canonical: "/capabilities/overview" },
  openGraph: {
    title: "Trexiti Capability Statement",
    description,
    type: "website",
    siteName: "Trexiti",
    url: "/capabilities/overview",
    images: ["/brand/trexiti_icon_transparent_1024.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trexiti Capability Statement",
    description,
    images: ["/brand/trexiti_icon_transparent_1024.png"],
  },
};

const capabilityJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: siteConfig.name,
  url: `${siteConfig.url}/capabilities/overview`,
  description: siteConfig.description,
  email: siteConfig.email,
  areaServed: "Global",
  serviceType: capabilityStatement.capabilities.map(
    (capability) => capability.title,
  ),
};

export default function CapabilityOverviewPage() {
  const [email, website, serviceArea] = capabilityStatement.contact;

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(capabilityJsonLd).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
      <div className={styles.documentPage}>
      <BrandDocumentView event="capability_statement_view" route="/capabilities/overview" />
      <div className={styles.documentInner}>
        <div className={styles.screenToolbar} aria-label="Capability statement actions">
          <div className={styles.toolbarMeta}>
            <strong>Trexiti Capability Statement</strong>
            <span>Web / Outreach / Browser PDF</span>
          </div>
          <div className={styles.toolbarActions}>
            <Link className={styles.secondaryAction} href="/media-kit">Open media kit</Link>
            <CapabilityPrintButton className={styles.primaryAction} />
          </div>
        </div>

        <article className={styles.capabilitySheet} aria-labelledby="capability-title">
          <header className={styles.capabilityHero}>
            <div>
              <span className={styles.documentLabel}>Trexiti / Capability Statement / 2026</span>
              <h1 id="capability-title">{capabilityStatement.descriptor}</h1>
            </div>
            <div className={styles.heroCopy}>
              {capabilityStatement.introduction.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </header>

          <section className={styles.documentSection} aria-labelledby="capabilities-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>01 / Capabilities</span>
              <h2 id="capabilities-title">What we build</h2>
            </div>
            <div className={styles.capabilityGrid}>
              {capabilityStatement.capabilities.map((capability) => (
                <article className={styles.capabilityCard} key={capability.title}>
                  <h3>{capability.title}</h3>
                  <p>{capability.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.documentSection} aria-labelledby="fit-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>02 / Fit</span>
              <h2 id="fit-title">When Trexiti makes sense</h2>
            </div>
            <ul className={styles.fitList}>
              {capabilityStatement.fitSignals.map((signal, index) => (
                <li key={signal}><span>{String(index + 1).padStart(2, "0")}</span>{signal}</li>
              ))}
            </ul>
          </section>

          <section className={`${styles.documentSection} ${styles.printBreak}`} aria-labelledby="process-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>03 / Process</span>
              <h2 id="process-title">How we work</h2>
            </div>
            <ol className={styles.processList}>
              {capabilityStatement.process.map((step, index) => (
                <li key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.documentSection} aria-labelledby="engagement-title">
            <div className={styles.sectionHeading}>
              <span className={styles.sectionIndex}>04 / Engagement</span>
              <h2 id="engagement-title">Engagement shapes</h2>
            </div>
            <div className={styles.engagementGrid}>
              {capabilityStatement.engagementShapes.map((shape) => (
                <article className={styles.engagementCard} key={shape.title}>
                  <h3>{shape.title}</h3>
                  <p>{shape.description}</p>
                </article>
              ))}
            </div>
            <p className={styles.engagementPrinciple}>{capabilityStatement.engagementPrinciple}</p>
          </section>

          <section className={styles.capabilityCta} aria-labelledby="capability-cta">
            <div>
              <span className={styles.documentLabel}>Start with one question</span>
              <h2 id="capability-cta">{capabilityStatement.cta}</h2>
            </div>
            <address className={styles.capabilityContact}>
              <a href={`mailto:${email}`}>{email}</a>
              <a href={siteConfig.url}>{website}</a>
              <span>{serviceArea}</span>
            </address>
          </section>
        </article>
      </div>
      </div>
    </>
  );
}
