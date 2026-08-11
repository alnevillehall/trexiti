import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  FileChartColumn,
  HardHat,
  MessageSquareText,
  UsersRound,
  Wrench,
} from "lucide-react";

import {
  MarketingFooter,
  MarketingHeader,
  type MarketingNavItem,
} from "./marketing-chrome";
import { TREXITI_CONTACT_EMAIL } from "@/lib/marketing/contact";
import styles from "./marketing-site.module.css";

const propertyOsDemoUrl = `mailto:${TREXITI_CONTACT_EMAIL}?subject=PropertyOS%20Demo%20Request`;

const navItems: readonly MarketingNavItem[] = [
  { label: "Home", href: "/" },
  { label: "ServiceOS", href: "/service-businesses" },
  { label: "PropertyOS", href: "/propertyos" },
  { label: "Features", href: "#features" },
  { label: "Roles", href: "#roles" },
];

const features = [
  {
    title: "Tenant management",
    copy: "Keep tenant profiles, lease information, contact details and communication history organized.",
    icon: UsersRound,
  },
  {
    title: "Maintenance requests",
    copy: "Capture requests, photos, priorities, status and updates in one structured workflow.",
    icon: Wrench,
  },
  {
    title: "Contractor dispatch",
    copy: "Assign work, share instructions, monitor progress and preserve completion records.",
    icon: HardHat,
  },
  {
    title: "Owner dashboards",
    copy: "Give owners visibility into property activity, expenses, maintenance history and reports.",
    icon: FileChartColumn,
  },
  {
    title: "Rent and payment tracking",
    copy: "Track due dates, payment history, balances and follow-up without rebuilding the picture manually.",
    icon: CircleDollarSign,
  },
  {
    title: "Inspection records",
    copy: "Store checklists, images, reports and a complete operational history for every property.",
    icon: ClipboardCheck,
  },
] as const;

export function PropertyOSPage() {
  return (
    <div className={styles.marketingPage}>
      <MarketingHeader
        navItems={navItems}
        cta={{
          label: "Request a Demo",
          href: propertyOsDemoUrl,
        }}
      />

      <main>
        <section className={`${styles.section} ${styles.propertyHero}`}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>PropertyOS by Trexiti</p>
            <h1>
              One system for modern{" "}
              <span>real estate operations.</span>
            </h1>
            <p className={styles.heroText}>
              Manage tenants, maintenance, contractors, owners, inspections,
              requests, documents, rent visibility and portfolio reporting from
              one connected platform built for serious real estate operators.
            </p>
            <div className={styles.heroActions}>
              <a
                className={`${styles.button} ${styles.primaryButton}`}
                href={propertyOsDemoUrl}
              >
                Request a Demo
                <ArrowRight aria-hidden="true" />
              </a>
              <Link
                className={`${styles.button} ${styles.secondaryButton}`}
                href="#features"
              >
                See Features
              </Link>
            </div>
          </div>

          <div className={styles.propertyDashboard}>
            <div className={styles.dashboardLabel}>
              <span>Illustrative product interface</span>
              <span>PropertyOS</span>
            </div>
            <div className={styles.propertyMap}>
              <div className={styles.propertyMapGrid} aria-hidden="true" />
              <span className={styles.mapPointOne} />
              <span className={styles.mapPointTwo} />
              <span className={styles.mapPointThree} />
              <div>
                <Building2 aria-hidden="true" />
                <strong>Portfolio command</strong>
                <span>Properties, people and work in one view</span>
              </div>
            </div>
            <div className={styles.propertyMetricGrid}>
              {[
                "Tenant requests",
                "Maintenance",
                "Contractors",
                "Owner reports",
                "Rent visibility",
                "Inspections",
              ].map((metric) => (
                <span key={metric}>{metric}</span>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.propertyProblem}`}>
          <div>
            <p className={styles.eyebrow}>The operational problem</p>
            <h2>
              Real estate operations break down when information is scattered.
            </h2>
          </div>
          <p>
            Tenant messages live in WhatsApp. Maintenance requests get lost.
            Owners want updates. Contractors need instructions. Managers rely
            on memory, calls and spreadsheets. PropertyOS brings the operation
            into one structured system without losing the context behind the
            work.
          </p>
        </section>

        <section
          className={`${styles.section} ${styles.capabilitySection}`}
          id="features"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Core PropertyOS capabilities</p>
            <h2>Control across the complete property workflow.</h2>
            <p>
              Designed for operators managing real assets, service risk, tenant
              expectations and owner confidence.
            </p>
          </div>
          <div className={styles.capabilityGrid}>
            {features.map(({ title, copy, icon: Icon }, index) => (
              <article key={title}>
                <div className={styles.cardIcon}>
                  <Icon aria-hidden="true" />
                </div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.rolesSection}`} id="roles">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Connected roles</p>
            <h2>Built for every part of the property operation.</h2>
          </div>
          <div className={styles.roleList}>
            {[
              "Property managers",
              "Tenants",
              "Contractors",
              "Owners",
              "Administrators",
            ].map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.propertyAutomation}`}>
          <div>
            <p className={styles.eyebrow}>Practical automation</p>
            <h2>Intelligence inside the workflow, where it helps.</h2>
          </div>
          <div className={styles.automationSteps}>
            <article>
              <MessageSquareText aria-hidden="true" />
              <strong>Summarize</strong>
              <p>Turn long requests and updates into clear context.</p>
            </article>
            <article>
              <Bot aria-hidden="true" />
              <strong>Prioritize</strong>
              <p>Support urgency decisions with issue and risk context.</p>
            </article>
            <article>
              <ArrowRight aria-hidden="true" />
              <strong>Route</strong>
              <p>Move work to the right manager, contractor or report.</p>
            </article>
          </div>
        </section>

        <section className={`${styles.section} ${styles.finalCta}`}>
          <div>
            <p className={styles.eyebrow}>PropertyOS demo</p>
            <h2>Bring your property operations into one connected system.</h2>
            <p>
              See how PropertyOS can centralize tenant communication,
              maintenance, contractors, owner reports and portfolio visibility.
            </p>
          </div>
          <a
            className={`${styles.button} ${styles.primaryButton}`}
            href={propertyOsDemoUrl}
          >
            Request a PropertyOS Demo
            <ArrowRight aria-hidden="true" />
          </a>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
