import type { Metadata } from "next";

import { AnalyticsPreferencesButton } from "@/components/marketing/analytics-provider";
import { Container, Eyebrow } from "@/components/marketing/site-primitives";
import { siteConfig } from "@/lib/content/site";

import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "How Trexiti handles enquiries, optional analytics, attribution and privacy choices.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const analyticsEnabled =
    process.env.NEXT_PUBLIC_TREXITI_ANALYTICS_PROVIDER === "first-party";

  return (
    <div className={styles.page}>
      <Container>
        <header className={styles.header}>
          <Eyebrow>Trexiti / Privacy</Eyebrow>
          <h1>Clear choices. Minimal collection.</h1>
          <p>
            Trexiti collects only the information needed to respond to an
            enquiry, operate the site safely, and—with permission—understand
            which public content supports useful business conversations.
          </p>
        </header>

        <div className={styles.sections}>
          <section>
            <h2>Project and Systems Review enquiries</h2>
            <p>
              Contact details, company context and workflow descriptions are
              stored only after the form’s explicit consent checkbox is
              selected. They are used to assess fit, respond to the enquiry and
              manage the resulting commercial conversation.
            </p>
          </section>

          <section>
            <h2>Optional first-party analytics</h2>
            <p>
              When enabled and allowed, Trexiti records anonymous event names,
              public page paths, CTA placements, a random session identifier
              and campaign attribution such as UTM source, medium and campaign.
              The system does not collect names, email addresses, phone
              numbers, company free text, checklist answers or form textarea
              content as analytics.
            </p>
            <p>
              There are no advertising pixels, cross-site profiles, session
              recordings or third-party analytics SDKs in this release.
              Anonymous marketing events are retained for no more than 395
              days.
            </p>
          </section>

          <section>
            <h2>Storage and attribution</h2>
            <p>
              Before permission, campaign attribution exists only in the
              current page session’s memory. If analytics is allowed, first-
              and last-touch attribution is stored in first-party browser
              storage so a later enquiry can keep its original source. First
              touch is never overwritten by a later visit.
            </p>
            <p>
              A small first-party preference value remembers whether optional
              analytics is allowed or disabled. Do Not Track is honored by
              default unless you explicitly choose to allow analytics.
            </p>
          </section>

          <section>
            <h2>Your choice</h2>
            <p>
              Disabling analytics stops new optional events and removes stored
              attribution from this browser. It does not affect form access or
              the rest of the site.
            </p>
            {analyticsEnabled ? (
              <AnalyticsPreferencesButton />
            ) : (
              <p className={styles.status}>Optional analytics is not configured.</p>
            )}
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about this notice or a stored enquiry can be sent to{" "}
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
