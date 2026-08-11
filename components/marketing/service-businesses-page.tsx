import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  MarketingFooter,
  MarketingHeader,
  type MarketingNavItem,
} from "./marketing-chrome";
import { ServiceLeadForm } from "./service-lead-form";
import styles from "./marketing-site.module.css";

const navItems: readonly MarketingNavItem[] = [
  { label: "Home", href: "/" },
  { label: "ServiceOS", href: "/service-businesses" },
  { label: "PropertyOS", href: "/propertyos" },
  { label: "How it works", href: "#workflow" },
  { label: "Pricing", href: "#pricing" },
];

const workflow = [
  ["01", "Customer enquiry", "Capture the request"],
  ["02", "Estimate and booking", "Confirm the work"],
  ["03", "Job assignment", "Send the right technician"],
  ["04", "Customer updates", "Keep everyone informed"],
  ["05", "Completion and payment", "Close the loop"],
  ["06", "Review and follow-up", "Bring customers back"],
] as const;

const capabilities: readonly {
  title: string;
  copy: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Lead Inbox",
    copy: "Capture and organize new calls, forms and WhatsApp-friendly enquiries.",
    icon: Inbox,
  },
  {
    title: "Customer Records",
    copy: "Keep contact information, addresses, notes, equipment and complete job history.",
    icon: UsersRound,
  },
  {
    title: "Job Board",
    copy: "See what is new, scheduled, in progress, overdue, completed or awaiting payment.",
    icon: Wrench,
  },
  {
    title: "Estimates and Invoices",
    copy: "Create professional, branded estimates and invoices from the same workflow.",
    icon: FileText,
  },
  {
    title: "Customer Updates",
    copy: "Send appointment reminders and clear job-status notifications.",
    icon: MessageSquareText,
  },
  {
    title: "Owner Dashboard",
    copy: "Track jobs, outstanding payments, technician activity and operational performance.",
    icon: LayoutDashboard,
  },
] as const;

const industries = [
  {
    name: "Plumbing",
    copy: "Move leak reports from initial message to site visit, estimate, repair record and payment follow-up.",
  },
  {
    name: "Electrical services",
    copy: "Keep inspection notes, assigned electricians, materials, job status and customer approvals together.",
  },
  {
    name: "Air conditioning and refrigeration",
    copy: "Track equipment history, service visits, recurring maintenance and technician assignments by location.",
  },
  {
    name: "Cleaning services",
    copy: "Coordinate recurring schedules, team assignments, special instructions and completed-service confirmation.",
  },
  {
    name: "General contracting",
    copy: "Organize site requests, estimates, scheduled work, progress updates and outstanding invoices.",
  },
  {
    name: "Repairs and field services",
    copy: "Give mobile teams one place for customer details, job notes, status changes and completion records.",
  },
] as const;

type PricingPlan = {
  name: string;
  price: string;
  cadence: string;
  setup: string;
  description: string;
  featured?: boolean;
  features: readonly string[];
};

const plans: readonly PricingPlan[] = [
  {
    name: "Essential",
    price: "J$15,000",
    cadence: "/month",
    setup: "Setup from J$25,000",
    description: "For owner-led service businesses ready to replace scattered job tracking.",
    features: [
      "Up to three users",
      "Customer and lead management",
      "Job board",
      "Estimates and invoices",
      "Appointment reminders",
      "Hosting and backups",
      "One monthly support request",
    ],
  },
  {
    name: "Team",
    price: "J$25,000",
    cadence: "/month",
    setup: "Setup from J$45,000",
    description: "For growing teams coordinating technicians, customers and daily operations.",
    featured: true,
    features: [
      "Up to eight users",
      "Everything in Essential",
      "Technician assignment",
      "Customer status updates",
      "Business dashboard",
      "Two standard automations",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: " pricing",
    setup: "Scoped around your operation",
    description: "For property portfolios, multi-location teams and purpose-built systems.",
    features: [
      "PropertyOS",
      "Multiple locations",
      "Custom integrations",
      "Advanced reporting",
      "Purpose-built applications",
      "Enterprise systems audit",
    ],
  },
];

const faqs = [
  {
    question: "Is Trexiti only for large companies?",
    answer:
      "No. ServiceOS is a focused offer for small and medium-sized service businesses. It starts with the essential workflow from customer enquiry to completed and paid job, while Trexiti continues to support larger PropertyOS and enterprise projects.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Setup timing depends on the confirmed workflow, data preparation and integration scope. Trexiti defines the delivery plan before implementation begins so the business knows what is included and what happens next.",
  },
  {
    question: "Do I need to replace WhatsApp?",
    answer:
      "No. ServiceOS is WhatsApp-friendly and gives your team a clear system of record behind the conversations you already have. Any direct messaging integration is assessed separately.",
  },
  {
    question: "Can my technicians use it on their phones?",
    answer:
      "Yes. ServiceOS is designed to work in a mobile browser so technicians can review assigned work, customer details and job status while in the field.",
  },
  {
    question: "Is custom development included?",
    answer:
      "Standard plan features are included. Custom functionality, special workflows and third-party integrations are assessed and quoted separately.",
  },
  {
    question: "What happens to my existing customer information?",
    answer:
      "Trexiti reviews the format and quality of your existing records during setup. Clean spreadsheets can often be prepared for import; complex or scattered records may require a separately scoped migration.",
  },
] as const;

function DashboardVisual() {
  return (
    <div className={styles.dashboardFrame}>
      <div className={styles.dashboardLabel}>
        <span>Illustrative product interface</span>
        <span>ServiceOS</span>
      </div>
      <div className={styles.dashboardWindow}>
        <aside className={styles.dashboardSidebar} aria-hidden="true">
          <div className={styles.dashboardMiniBrand}>
            <span />
            <b>Trexiti</b>
          </div>
          {["Overview", "Enquiries", "Jobs", "Customers", "Invoices"].map(
            (item, index) => (
              <span
                className={index === 0 ? styles.dashboardNavActive : undefined}
                key={item}
              >
                {item}
              </span>
            ),
          )}
        </aside>

        <div className={styles.dashboardContent}>
          <div className={styles.dashboardHeading}>
            <div>
              <span>Monday operations</span>
              <strong>Job command centre</strong>
            </div>
            <span className={styles.livePill}>Workflow ready</span>
          </div>

          <div className={styles.operationGrid}>
            {[
              ["New enquiries", "Kitchen leak", "New"],
              ["Estimates to prepare", "Panel inspection", "Prepare"],
              ["Scheduled jobs", "AC service visit", "Scheduled"],
              ["Jobs in progress", "Pump replacement", "On site"],
              ["Awaiting payment", "Deep clean", "Follow up"],
            ].map(([label, job, status]) => (
              <article className={styles.operationCard} key={label}>
                <span>{label}</span>
                <strong>{job}</strong>
                <i>{status}</i>
              </article>
            ))}
          </div>

          <div className={styles.updatePanel}>
            <div>
              <span>Recent customer updates</span>
              <strong>A clear record of every promise.</strong>
            </div>
            <ul>
              <li>
                <span />
                Appointment window confirmed
              </li>
              <li>
                <span />
                Technician marked job in progress
              </li>
              <li>
                <span />
                Invoice ready for customer
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceBusinessesPage() {
  return (
    <div className={styles.marketingPage}>
      <MarketingHeader
        navItems={navItems}
        cta={{ label: "Get Trexiti Set Up", href: "#lead-form" }}
      />

      <main>
        <section className={`${styles.section} ${styles.hero}`} id="top">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              Job management for service businesses
            </p>
            <h1>
              Turn WhatsApp enquiries into{" "}
              <span>scheduled, completed and paid jobs.</span>
            </h1>
            <p className={styles.heroText}>
              Trexiti keeps your customers, estimates, appointments,
              technicians, job updates and payments organized in one simple
              system—so enquiries are not forgotten and customers always know
              what is happening.
            </p>
            <div className={styles.heroActions}>
              <Link
                className={`${styles.button} ${styles.primaryButton}`}
                href="#lead-form"
              >
                Get Trexiti Set Up
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                className={`${styles.button} ${styles.secondaryButton}`}
                href="#workflow"
              >
                See How It Works
              </Link>
            </div>
            <p className={styles.trustLine}>
              <ShieldCheck aria-hidden="true" />
              Designed for plumbers, electricians, AC technicians, cleaning
              teams, contractors and other service businesses. Scope and
              delivery timing are confirmed before implementation begins.
            </p>
          </div>
          <DashboardVisual />
        </section>

        <div className={styles.audienceStrip} aria-label="Designed for">
          <span>Plumbing</span>
          <span>Electrical</span>
          <span>AC & refrigeration</span>
          <span>Cleaning</span>
          <span>Contracting</span>
          <span>Field services</span>
        </div>

        <section className={`${styles.section} ${styles.problemSection}`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>The operational problem</p>
            <h2>
              Your business is not disorganized.{" "}
              <span>Your information is scattered.</span>
            </h2>
            <p>
              The enquiry is in WhatsApp. The address is in someone&apos;s
              phone. The estimate is in a notebook. The technician has not been
              updated. The customer keeps calling, and nobody is sure whether
              payment was received.
            </p>
          </div>

          <div className={styles.beforeAfter}>
            <article className={styles.beforePanel}>
              <span className={styles.panelKicker}>Before</span>
              <h3>Six places to check before anyone can answer.</h3>
              <div className={styles.scatterMap} aria-hidden="true">
                {[
                  "WhatsApp",
                  "Notebook",
                  "Phone",
                  "Calendar",
                  "Invoice",
                  "Memory",
                ].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
            <ArrowRight className={styles.comparisonArrow} aria-hidden="true" />
            <article className={styles.afterPanel}>
              <span className={styles.panelKicker}>With ServiceOS</span>
              <h3>One workflow everyone can trust.</h3>
              <div className={styles.workflowStack}>
                <span>Enquiry captured</span>
                <span>Job owner assigned</span>
                <span>Customer updated</span>
                <span>Payment visible</span>
              </div>
            </article>
          </div>
          <p className={styles.closingStatement}>
            Trexiti turns all of that into one clear workflow.
          </p>
        </section>

        <section
          className={`${styles.section} ${styles.workflowSection}`}
          id="workflow"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>A complete service workflow</p>
            <h2>From first message to paid job.</h2>
            <p>
              Every stage has a clear next action, a responsible person and a
              status the team can see.
            </p>
          </div>
          <ol className={styles.workflowList}>
            {workflow.map(([number, title, copy]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{copy}</p>
                </div>
                <ArrowRight aria-hidden="true" />
              </li>
            ))}
          </ol>
        </section>

        <section className={`${styles.section} ${styles.capabilitySection}`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>What ServiceOS organizes</p>
            <h2>The daily operating essentials, in one place.</h2>
            <p>
              Start with the work your team already does. Add automation only
              where it removes a real bottleneck.
            </p>
          </div>
          <div className={styles.capabilityGrid}>
            {capabilities.map(({ title, copy, icon: Icon }, index) => (
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
          <div className={styles.automationNote}>
            <MessageSquareText aria-hidden="true" />
            <p>
              <strong>WhatsApp-friendly by design.</strong> Keep talking to
              customers the way they prefer while ServiceOS becomes the
              reliable operational record behind those conversations.
            </p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.industrySection}`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Built around field service</p>
            <h2>One operating model, adapted to your trade.</h2>
          </div>
          <div className={styles.industryList}>
            {industries.map((industry, index) => (
              <article key={industry.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{industry.name}</h3>
                <p>{industry.copy}</p>
                <ArrowRight aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <section
          className={`${styles.section} ${styles.pricingSection}`}
          id="pricing"
        >
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Straightforward monthly plans</p>
            <h2>Start with the operating system your team needs now.</h2>
            <p>
              Hosting, backups and ongoing support are built into the monthly
              service. Setup is scoped before work begins.
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {plans.map((plan) => (
              <article
                className={plan.featured ? styles.featuredPlan : undefined}
                key={plan.name}
              >
                {plan.featured ? (
                  <span className={styles.planBadge}>Most popular</span>
                ) : null}
                <p className={styles.planName}>{plan.name}</p>
                <div className={styles.price}>
                  <strong>{plan.price}</strong>
                  <span>{plan.cadence}</span>
                </div>
                <p className={styles.setupPrice}>{plan.setup}</p>
                <p className={styles.planDescription}>{plan.description}</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  className={`${styles.button} ${
                    plan.featured
                      ? styles.primaryButton
                      : styles.secondaryButton
                  }`}
                  href="#lead-form"
                >
                  Discuss {plan.name}
                </Link>
              </article>
            ))}
          </div>
          <p className={styles.pricingNote}>
            Custom functionality and integrations are assessed and quoted
            separately. Checkout and recurring billing are not handled on this
            website.
          </p>
        </section>

        <section className={`${styles.section} ${styles.credibilitySection}`}>
          <div>
            <p className={styles.eyebrow}>Built from operational experience</p>
            <h2>Designed by someone who has lived the workflow.</h2>
          </div>
          <blockquote>
            “Trexiti was created from firsthand experience inside a Jamaican
            field-service operation—dealing with customer backlogs, technician
            scheduling, service tickets, parts, invoicing and constant requests
            for updates.”
          </blockquote>
          <div className={styles.credibilityDetails}>
            <article>
              <ClipboardCheck aria-hidden="true" />
              <strong>Operational first</strong>
              <p>The system starts with the real handoffs your team manages.</p>
            </article>
            <article>
              <CalendarCheck2 aria-hidden="true" />
              <strong>Practical setup</strong>
              <p>Standard workflows are configured before custom work is added.</p>
            </article>
            <article>
              <CircleDollarSign aria-hidden="true" />
              <strong>Commercial clarity</strong>
              <p>Completed work and outstanding payment stay visible together.</p>
            </article>
          </div>
        </section>

        <section className={`${styles.section} ${styles.leadSection}`} id="lead-form">
          <ServiceLeadForm />
        </section>

        <section className={`${styles.section} ${styles.faqSection}`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Frequently asked questions</p>
            <h2>What to know before your workflow review.</h2>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>
                  {faq.question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.finalCta}`}>
          <div>
            <p className={styles.eyebrow}>One clear system</p>
            <h2>
              Stop running completed jobs, customer promises and unpaid invoices
              from memory.
            </h2>
            <p>
              Let Trexiti give your service business one clear system from
              enquiry to payment.
            </p>
          </div>
          <Link
            className={`${styles.button} ${styles.primaryButton}`}
            href="#lead-form"
          >
            Request My Workflow Review
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
