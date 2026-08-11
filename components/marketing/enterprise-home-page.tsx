import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChartNoAxesCombined,
  Network,
  ShieldCheck,
  Workflow,
} from "lucide-react";

import {
  MarketingFooter,
  MarketingHeader,
  type MarketingNavItem,
} from "./marketing-chrome";
import styles from "./marketing-site.module.css";

const navItems: readonly MarketingNavItem[] = [
  { label: "Home", href: "/" },
  { label: "ServiceOS", href: "/service-businesses" },
  { label: "PropertyOS", href: "/propertyos" },
  { label: "Systems", href: "#systems" },
  { label: "About", href: "#about" },
];

export function EnterpriseHomePage() {
  return (
    <div className={styles.marketingPage}>
      <MarketingHeader
        navItems={navItems}
        cta={{ label: "Book a Systems Audit", href: "mailto:hello@trexiti.com" }}
      />

      <main>
        <section className={`${styles.section} ${styles.enterpriseHero}`}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.enterpriseHeroCopy}>
            <p className={styles.eyebrow}>
              Intelligent systems for real-world operations
            </p>
            <h1>
              Build the operating system{" "}
              <span>behind your business.</span>
            </h1>
            <p className={styles.heroText}>
              Trexiti designs operational software, automation and executive
              dashboards for real estate portfolios, field-service teams and
              growing enterprises that need more control.
            </p>
            <div className={styles.heroActions}>
              <a
                className={`${styles.button} ${styles.primaryButton}`}
                href="mailto:hello@trexiti.com?subject=Trexiti%20Systems%20Audit"
              >
                Book a Systems Audit
                <ArrowRight aria-hidden="true" />
              </a>
              <Link
                className={`${styles.button} ${styles.secondaryButton}`}
                href="/propertyos"
              >
                Explore PropertyOS
              </Link>
            </div>
            <p className={styles.trustLine}>
              <ShieldCheck aria-hidden="true" />
              Purpose-built around operational clarity, security and measurable
              business control.
            </p>
          </div>

          <div className={styles.enterpriseVisual}>
            <div className={styles.enterpriseVisualTop}>
              <span>Trexiti command layer</span>
              <i>Illustrative interface</i>
            </div>
            <div className={styles.systemOrbit}>
              <div className={styles.orbitCore}>
                <strong>Trexiti</strong>
                <span>Operations</span>
              </div>
              <span className={styles.orbitOne}>Intake</span>
              <span className={styles.orbitTwo}>Workflow</span>
              <span className={styles.orbitThree}>Reporting</span>
              <span className={styles.orbitFour}>Automation</span>
            </div>
            <div className={styles.enterpriseSignals}>
              <span>Requests structured</span>
              <span>Work assigned</span>
              <span>Risk visible</span>
              <span>Leaders informed</span>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.homeIntro}`}>
          <p className={styles.eyebrow}>From website to operating system</p>
          <h2>
            The work behind growth needs more than disconnected tools.
          </h2>
          <p>
            Trexiti turns real operational processes into software: customer
            intake, task routing, field work, reporting, payments and the
            management view that connects them.
          </p>
        </section>

        <section className={`${styles.section} ${styles.productShowcase}`} id="systems">
          <article className={styles.propertyFeature}>
            <div>
              <p className={styles.eyebrow}>Flagship real estate platform</p>
              <h2>PropertyOS</h2>
              <p>
                One intelligent command layer for tenants, maintenance,
                contractors, owners, inspections, rent visibility and portfolio
                reporting.
              </p>
              <Link className={styles.textLink} href="/propertyos">
                Explore PropertyOS
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.propertyMiniDashboard}>
              <span>Portfolio overview</span>
              <strong>Operations visible</strong>
              <div>
                <i>Tenant requests</i>
                <i>Maintenance</i>
                <i>Owner reports</i>
                <i>Rent signals</i>
              </div>
            </div>
          </article>

          <div className={styles.enterpriseServiceGrid}>
            <article>
              <Network aria-hidden="true" />
              <h3>Custom software platforms</h3>
              <p>
                Purpose-built portals, internal systems and applications
                designed around your workflow.
              </p>
            </article>
            <article>
              <Workflow aria-hidden="true" />
              <h3>Workflow automation</h3>
              <p>
                Practical routing, reminders, approvals and communication where
                they remove real operational drag.
              </p>
            </article>
            <article>
              <ChartNoAxesCombined aria-hidden="true" />
              <h3>Executive dashboards</h3>
              <p>
                Clear views of work, cost, revenue signals and performance for
                leaders who need dependable answers.
              </p>
            </article>
          </div>
        </section>

        <section className={`${styles.section} ${styles.serviceEntry}`}>
          <div className={styles.serviceEntryIcon}>
            <Building2 aria-hidden="true" />
          </div>
          <div>
            <p className={styles.eyebrow}>A focused offer for service teams</p>
            <h2>ServiceOS by Trexiti</h2>
            <p>
              A standardized monthly operating system for plumbers,
              electricians, AC technicians, cleaners, contractors and field
              service businesses—from first customer message to completed and
              paid job.
            </p>
          </div>
          <Link
            className={`${styles.button} ${styles.secondaryButton}`}
            href="/service-businesses"
          >
            See ServiceOS
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>

        <section className={`${styles.section} ${styles.homeAbout}`} id="about">
          <div>
            <p className={styles.eyebrow}>Systems-first thinking</p>
            <h2>Technology designed from the operation outward.</h2>
          </div>
          <p>
            Trexiti begins with the people, decisions, handoffs and commercial
            outcomes inside a business. The software comes next—shaped around
            the reality teams need to manage, not a generic feature checklist.
          </p>
        </section>

        <section className={`${styles.section} ${styles.finalCta}`} id="contact">
          <div>
            <p className={styles.eyebrow}>Trexiti systems audit</p>
            <h2>Ready to modernize how your business operates?</h2>
            <p>
              Start with a focused review of the workflows, visibility gaps and
              systems holding your operation back.
            </p>
          </div>
          <a
            className={`${styles.button} ${styles.primaryButton}`}
            href="mailto:hello@trexiti.com?subject=Trexiti%20Systems%20Audit"
          >
            Book a Systems Audit
            <ArrowRight aria-hidden="true" />
          </a>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
