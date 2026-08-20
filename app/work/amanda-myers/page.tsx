import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Manrope, Newsreader } from "next/font/google";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  BriefcaseBusiness,
  Check,
  CircleCheckBig,
  Clock3,
  FileText,
  Gavel,
  HeartHandshake,
  Landmark,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Quote,
  Scale,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { ContactForm } from "./ContactForm";
import { MobileMenu } from "./MobileMenu";
import styles from "./page.module.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-amanda-serif",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-amanda-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amanda Myers — Counsel with clarity and conviction",
  description:
    "A refined law-firm website concept for Amanda Myers, pairing thoughtful counsel with representative results and practical legal resources.",
  alternates: {
    canonical: "/work/amanda-myers",
  },
  openGraph: {
    title: "Amanda Myers — Counsel with clarity and conviction",
    description:
      "Strategic legal guidance, delivered with care. Explore this modern law-firm website concept by Trexiti.",
    url: "/work/amanda-myers",
    type: "website",
    images: [
      {
        url: "/work/amanda-myers/og.jpg",
        width: 1200,
        height: 630,
        alt: "Amanda Myers law-firm website concept",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amanda Myers — Counsel with clarity and conviction",
    description:
      "A refined, modern law-firm website concept for thoughtful legal counsel.",
    images: ["/work/amanda-myers/og.jpg"],
  },
};

const practiceAreas = [
  {
    number: "01",
    title: "Family & matrimonial",
    description:
      "Steady guidance through separation, parenting arrangements, and the decisions that reshape family life.",
    clients: "Individuals, parents, and families",
    services: [
      "Separation and divorce",
      "Parenting and support arrangements",
      "Prenuptial and family agreements",
    ],
    icon: ShieldCheck,
  },
  {
    number: "02",
    title: "Estate & legacy planning",
    description:
      "Wills, trusts, and succession strategies designed to protect what matters and carry your intentions forward.",
    clients: "Individuals, families, executors, and trustees",
    services: [
      "Wills and estate planning",
      "Probate and estate administration",
      "Trust and succession guidance",
    ],
    icon: Landmark,
  },
  {
    number: "03",
    title: "Business & contracts",
    description:
      "Practical counsel for founders and established teams navigating agreements, growth, and commercial risk.",
    clients: "Founders, family businesses, and growing companies",
    services: [
      "Commercial agreements",
      "Business formation and governance",
      "Negotiation and risk review",
    ],
    icon: BriefcaseBusiness,
  },
  {
    number: "04",
    title: "Civil dispute resolution",
    description:
      "Clear-eyed advocacy and strategic negotiation when your rights, reputation, or resources are at stake.",
    clients: "Individuals, professionals, and businesses",
    services: [
      "Pre-action advice and strategy",
      "Mediation and negotiated resolution",
      "Civil and commercial proceedings",
    ],
    icon: Gavel,
  },
];

const clientNeeds = [
  ["Starting or restructuring a business", "Business & contracts"],
  ["Reviewing or negotiating an agreement", "Business & contracts"],
  ["Navigating separation or parenting", "Family & matrimonial"],
  ["Planning a will, trust, or legacy", "Estate planning"],
  ["Administering a loved one’s estate", "Probate & estates"],
  ["Resolving a civil or commercial dispute", "Dispute resolution"],
] as const;

const process = [
  {
    number: "01",
    title: "We listen closely",
    description:
      "Your first conversation gives us the full context—not just the legal issue, but what a good outcome means to you.",
    icon: MessageSquareText,
  },
  {
    number: "02",
    title: "We map the way forward",
    description:
      "You receive a candid assessment, a plain-language strategy, and a clear view of timing, cost, and trade-offs.",
    icon: FileText,
  },
  {
    number: "03",
    title: "We act with purpose",
    description:
      "Whether resolution calls for careful negotiation or firm advocacy, every move is intentional and kept in perspective.",
    icon: Scale,
  },
];

const representativeResults = [
  {
    number: "01",
    category: "Civil & commercial dispute",
    title: "Resolution reached before trial.",
    summary:
      "A focused negotiation strategy created a practical path out of a contract dispute while preserving the client’s commercial relationships.",
    role: "Lead counsel",
    resolution: "Negotiated settlement",
  },
  {
    number: "02",
    category: "Family & matrimonial",
    title: "A workable family agreement.",
    summary:
      "Clear priorities and careful preparation helped move a sensitive family matter toward a private, child-focused agreement.",
    role: "Negotiating counsel",
    resolution: "Mediated agreement",
  },
  {
    number: "03",
    category: "Estate & legacy planning",
    title: "A complete succession plan.",
    summary:
      "Wills, ownership interests, beneficiary intentions, and decision-making documents were brought into one coherent legacy plan.",
    role: "Private client counsel",
    resolution: "Plan executed",
  },
] as const;

const resources = [
  {
    category: "Private client guide",
    readingTime: "6 min read",
    title: "Preparing for your first legal consultation",
    description:
      "The documents, dates, questions, and practical context that can make an initial legal conversation more useful.",
    author: "Amanda Myers",
    published: "March 2026",
    icon: BookOpenText,
  },
  {
    category: "Business checklist",
    readingTime: "8 min read",
    title: "Before you sign a commercial agreement",
    description:
      "A plain-language checklist for reviewing obligations, risk, renewal, termination, and dispute terms.",
    author: "Amanda Myers",
    published: "February 2026",
    icon: ScrollText,
  },
  {
    category: "Family law briefing",
    readingTime: "5 min read",
    title: "How to prepare for mediation",
    description:
      "A calm, practical overview of preparation, priorities, documentation, and what the process can involve.",
    author: "Amanda Myers",
    published: "January 2026",
    icon: HeartHandshake,
  },
  {
    category: "Estate planning note",
    readingTime: "7 min read",
    title: "Building a legacy plan that stays useful",
    description:
      "Questions to revisit as family, assets, business interests, and personal responsibilities change over time.",
    author: "Amanda Myers",
    published: "December 2025",
    icon: Landmark,
  },
] as const;

export default function AmandaMyersPage() {
  return (
    <div
      className={`${styles.site} ${newsreader.variable} ${manrope.variable}`}
    >
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <div className={styles.demoNotice} role="note">
        <span className={styles.demoDot} aria-hidden="true" />
        <p>
          <strong>Trexiti showcase concept</strong>
          <span aria-hidden="true"> — </span>
          The name, portrait, credentials, testimonials, case results, resources,
          and contact details are illustrative template content.
        </p>
      </div>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Primary navigation">
          <Link className={styles.brand} href="#top" aria-label="Amanda Myers, home">
            <span className={styles.monogram} aria-hidden="true">
              AM
            </span>
            <span className={styles.brandName}>
              <strong>Amanda Myers</strong>
              <small>Attorney-at-Law</small>
            </span>
          </Link>

          <div className={styles.navLinks}>
            <Link href="#expertise">Expertise</Link>
            <Link href="#results">Results</Link>
            <Link href="#resources">Resources</Link>
            <Link href="#counsel">Counsel</Link>
          </div>

          <Link className={styles.navCta} href="#consultation">
            Let&apos;s talk
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>

          <MobileMenu />
        </nav>
      </header>

      <main id="main-content">
        <section className={styles.hero} id="top" aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true" />
              Private client &amp; family law
            </p>
            <h1 id="hero-title">
              Clarity for the decisions that shape <em>what comes next.</em>
            </h1>
            <p className={styles.heroLead}>
              Strategic legal guidance, delivered with care. Amanda Myers helps
              individuals, families, and businesses move forward with confidence
              when the stakes feel personal.
            </p>

            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="#consultation">
                Request a consultation
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <Link className={styles.secondaryButton} href="#expertise">
                Explore our expertise
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>

            <div className={styles.heroAssurance}>
              <ShieldCheck size={18} aria-hidden="true" />
              <p>
                <strong>Private by design.</strong> Every conversation begins with
                discretion and respect.
              </p>
            </div>
          </div>

          <div className={styles.heroVisual} aria-label="Amanda Myers law office">
            <div className={styles.heroImageWrap}>
              <Image
                src="/work/amanda-myers/amanda-office.jpg"
                alt="Lawyer seated at a desk in an elegant, light-filled office"
                fill
                priority
                sizes="(max-width: 900px) 94vw, 46vw"
                className={styles.heroImage}
              />
            </div>
            <div className={styles.heroFrame} aria-hidden="true" />
            <div className={styles.heroNote}>
              <span>Our promise</span>
              <p>Prepared. Present. Personal.</p>
            </div>
            <div className={styles.heroSeal} aria-hidden="true">
              <span>AM</span>
              <small>Est. 2011</small>
            </div>
          </div>

          <p className={styles.verticalCaption} aria-hidden="true">
            Counsel / Advocacy / Resolution
          </p>
        </section>

        <section
          className={styles.practiceSection}
          id="expertise"
          aria-labelledby="practice-title"
        >
          <div className={styles.sectionIntro}>
            <div>
              <p className={styles.eyebrow}>
                <span aria-hidden="true" />
                Where we can help
              </p>
              <h2 id="practice-title">
                Thoughtful counsel for life&apos;s defining chapters.
              </h2>
            </div>
            <p>
              Legal questions rarely arrive in isolation. We consider the whole
              picture, making complex issues feel clear, manageable, and human.
            </p>
          </div>

          <div className={styles.practiceGrid}>
            {practiceAreas.map((area) => {
              const Icon = area.icon;
              return (
                <article className={styles.practiceCard} key={area.title}>
                  <div className={styles.cardTopline}>
                    <span>{area.number}</span>
                    <Icon size={25} strokeWidth={1.35} aria-hidden="true" />
                  </div>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <p className={styles.practiceClients}>
                    <strong>Clients</strong>
                    {area.clients}
                  </p>
                  <ul className={styles.practiceServices}>
                    {area.services.map((service) => (
                      <li key={service}>{service}</li>
                    ))}
                  </ul>
                  <Link href="#consultation" aria-label={`Discuss ${area.title}`}>
                    Discuss your matter
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className={styles.needsSection}
          aria-labelledby="needs-title"
        >
          <div className={styles.needsHeader}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true" />
              How we can help
            </p>
            <div>
              <h2 id="needs-title">Start with what you are facing.</h2>
              <p>
                Legal services are easier to navigate when they begin with the
                client’s situation, not legal terminology.
              </p>
            </div>
          </div>

          <div className={styles.needsGrid}>
            {clientNeeds.map(([need, area], index) => (
              <Link
                className={styles.needCard}
                href="#consultation"
                key={need}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{need}</h3>
                <p>{area}</p>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.aboutSection} id="counsel" aria-labelledby="about-title">
          <div className={styles.aboutImageColumn}>
            <div className={styles.aboutImageWrap}>
              <Image
                src="/work/amanda-myers/courthouse-columns.jpg"
                alt="Classical courthouse columns in soft, warm light"
                fill
                sizes="(max-width: 840px) 92vw, 45vw"
                className={styles.aboutImage}
              />
            </div>
            <blockquote className={styles.pullQuote}>
              <Quote size={24} strokeWidth={1.2} aria-hidden="true" />
              <p>
                Good counsel should do more than answer the legal question. It
                should help you see the path ahead.
              </p>
            </blockquote>
          </div>

          <div className={styles.aboutCopy}>
            <p className={styles.eyebrowLight}>
              <span aria-hidden="true" />
              Meet your counsel
            </p>
            <p className={styles.sampleLabel}>Illustrative attorney profile</p>
            <h2 id="about-title">
              Advocacy grounded in <em>judgment and empathy.</em>
            </h2>
            <p className={styles.aboutLead}>
              Amanda Myers brings calm, rigorous thinking to matters that are
              legally complex and deeply personal. Her practice is built on the
              belief that clients deserve both formidable representation and a
              genuinely supportive experience.
            </p>
            <p>
              With experience spanning private client, family, commercial, and
              dispute work, Amanda looks beyond the immediate problem to protect
              each client&apos;s longer-term interests. She communicates plainly,
              prepares meticulously, and never loses sight of the person behind
              the case.
            </p>

            <ul className={styles.credentials}>
              <li>
                <Check size={16} aria-hidden="true" />
                Senior-level attention from first meeting to resolution
              </li>
              <li>
                <Check size={16} aria-hidden="true" />
                Plain-language advice with clear expectations
              </li>
              <li>
                <Check size={16} aria-hidden="true" />
                Negotiation-minded, litigation-ready representation
              </li>
            </ul>

            <dl className={styles.profileFacts}>
              <div>
                <dt>Admissions</dt>
                <dd>Jamaica Bar · 2011</dd>
              </div>
              <div>
                <dt>Education</dt>
                <dd>LEC, Norman Manley Law School · LL.B., UWI</dd>
              </div>
              <div>
                <dt>Professional membership</dt>
                <dd>Jamaican Bar Association · Private Client Committee</dd>
              </div>
              <div>
                <dt>Community</dt>
                <dd>Pro bono family guidance · Founder mentorship</dd>
              </div>
            </dl>
            <p className={styles.profileDisclaimer}>
              Sample admissions, education, memberships, and community roles for
              template demonstration only.
            </p>

            <Link className={styles.aboutLink} href="#approach">
              Discover our approach
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section
          className={styles.processSection}
          id="approach"
          aria-labelledby="process-title"
        >
          <div className={styles.processHeading}>
            <p className={styles.eyebrowLight}>
              <span aria-hidden="true" />
              The Myers method
            </p>
            <h2 id="process-title">A clear process for uncertain moments.</h2>
            <p>
              You will always know where your matter stands, what happens next,
              and why we recommend the path in front of you.
            </p>
          </div>

          <div className={styles.processGrid}>
            {process.map((step) => {
              const Icon = step.icon;
              return (
                <article className={styles.processCard} key={step.number}>
                  <div className={styles.processNumber}>{step.number}</div>
                  <Icon size={26} strokeWidth={1.25} aria-hidden="true" />
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className={styles.resultsSection}
          id="results"
          aria-labelledby="results-title"
        >
          <div className={styles.resultsIntro}>
            <div>
              <p className={styles.eyebrow}>
                <span aria-hidden="true" />
                Representative outcomes
              </p>
              <h2 id="results-title">
                Experience made tangible, <em>without overstating it.</em>
              </h2>
            </div>
            <div className={styles.resultsIntroCopy}>
              <p>
                Prospective clients want to understand how a firm approaches
                real-world matters. This format gives lawyers space to present
                verified, ethically approved outcomes with the context that
                makes them meaningful.
              </p>
              <span>
                Illustrative matter profiles · Not actual client results
              </span>
            </div>
          </div>

          <div className={styles.resultsGrid}>
            {representativeResults.map((result) => (
              <article className={styles.resultCard} key={result.number}>
                <div className={styles.resultTopline}>
                  <span>{result.number}</span>
                  <span>Illustrative result</span>
                </div>
                <p className={styles.resultCategory}>{result.category}</p>
                <h3>{result.title}</h3>
                <p className={styles.resultSummary}>{result.summary}</p>
                <dl className={styles.resultMeta}>
                  <div>
                    <dt>Matter</dt>
                    <dd>{result.category}</dd>
                  </div>
                  <div>
                    <dt>Resolution</dt>
                    <dd>{result.resolution}</dd>
                  </div>
                  <div>
                    <dt>Role</dt>
                    <dd>{result.role}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <div className={styles.resultsDisclosure} role="note">
            <CircleCheckBig size={22} strokeWidth={1.4} aria-hidden="true" />
            <p>
              <strong>Designed for responsible proof.</strong> A live firm would
              replace these examples with verified, jurisdiction-approved matter
              descriptions. Past results do not guarantee a similar outcome.
            </p>
          </div>
        </section>

        <section
          className={styles.testimonialsSection}
          id="testimonials"
          aria-labelledby="testimonials-title"
        >
          <div className={styles.testimonialIntro}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true" />
              Sample client experiences
            </p>
            <h2 id="testimonials-title">The measure of good counsel.</h2>
            <p>
              These illustrative testimonials show how client proof could be
              presented on a live firm website.
            </p>
          </div>

          <div className={styles.testimonialGrid}>
            <figure className={styles.testimonialCard}>
              <div className={styles.quoteRow}>
                <span className={styles.sampleBadge}>Sample testimonial</span>
                <Quote size={30} strokeWidth={1} aria-hidden="true" />
              </div>
              <blockquote>
                “Amanda brought order to a situation that had felt impossible.
                She was direct without being cold, and every recommendation felt
                measured, practical, and entirely focused on my family.”
              </blockquote>
              <figcaption>
                <span>MR</span>
                <p>
                  <strong>M. R.</strong>
                  <small>Family law client · Illustrative</small>
                </p>
              </figcaption>
            </figure>

            <figure className={styles.testimonialCard}>
              <div className={styles.quoteRow}>
                <span className={styles.sampleBadge}>Sample testimonial</span>
                <Quote size={30} strokeWidth={1} aria-hidden="true" />
              </div>
              <blockquote>
                “I never had to chase for an update or wonder what came next. The
                strategy was clear from day one, and I felt both protected and
                heard throughout the entire process.”
              </blockquote>
              <figcaption>
                <span>JD</span>
                <p>
                  <strong>J. D.</strong>
                  <small>Business client · Illustrative</small>
                </p>
              </figcaption>
            </figure>
          </div>
        </section>

        <section
          className={styles.resourcesSection}
          id="resources"
          aria-labelledby="resources-title"
        >
          <div className={styles.resourcesIntro}>
            <div>
              <p className={styles.eyebrowLight}>
                <span aria-hidden="true" />
                Resources &amp; perspectives
              </p>
              <h2 id="resources-title">
                Useful answers before the first conversation.
              </h2>
            </div>
            <p>
              A thoughtful resource library demonstrates expertise, answers the
              questions prospective clients already have, and gives every
              practice area a natural path into a consultation.
            </p>
          </div>

          <div className={styles.resourcesLayout}>
            {resources.map((resource, index) => {
              const Icon = resource.icon;

              return (
                <article
                  className={
                    index === 0
                      ? styles.featuredResource
                      : styles.resourceCard
                  }
                  key={resource.title}
                >
                  <div className={styles.resourceTopline}>
                    <span>{resource.category}</span>
                    <span>{resource.readingTime}</span>
                  </div>
                  <Icon
                    className={styles.resourceIcon}
                    size={index === 0 ? 34 : 25}
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                  <h3>{resource.title}</h3>
                  <p className={styles.resourceByline}>
                    By {resource.author} · {resource.published}
                  </p>
                  <p>{resource.description}</p>
                  <div className={styles.resourceFormat}>
                    <span>Sample resource format</span>
                    <span>CMS-ready</span>
                  </div>
                </article>
              );
            })}
          </div>

          <p className={styles.resourcesDisclosure}>
            Demonstration content only. A live resource library should be
            reviewed for accuracy, jurisdiction, currency, and legal-advice
            boundaries before publication.
          </p>
        </section>

        <section
          className={styles.consultationSection}
          id="consultation"
          aria-labelledby="consultation-title"
        >
          <div className={styles.consultationCopy}>
            <p className={styles.eyebrowLight}>
              <span aria-hidden="true" />
              Begin the conversation
            </p>
            <h2 id="consultation-title">
              Your next step can start with one <em>clear conversation.</em>
            </h2>
            <p className={styles.consultationLead}>
              Tell us a little about what you are facing. We will let you know
              whether the firm is the right fit and outline what happens next.
            </p>

            <address className={styles.contactDetails}>
              <div>
                <span>
                  <Phone size={19} aria-hidden="true" />
                </span>
                <p>
                  <small>Call</small>
                  +1 (876) 555-0148
                </p>
              </div>
              <div>
                <span>
                  <Mail size={19} aria-hidden="true" />
                </span>
                <p>
                  <small>Email</small>
                  hello@amandamyerslaw.example
                </p>
              </div>
              <div>
                <span>
                  <MapPin size={19} aria-hidden="true" />
                </span>
                <p>
                  <small>Office</small>
                  18 Harbour View, Kingston, Jamaica
                </p>
              </div>
              <div>
                <span>
                  <Clock3 size={19} aria-hidden="true" />
                </span>
                <p>
                  <small>Hours</small>
                  Monday–Friday, 8:30 a.m.–5:00 p.m.
                </p>
              </div>
            </address>
          </div>

          <ContactForm />
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <Link className={styles.footerBrand} href="#top">
            <span className={styles.monogram} aria-hidden="true">
              AM
            </span>
            <span>
              <strong>Amanda Myers</strong>
              <small>Attorney-at-Law</small>
            </span>
          </Link>
          <p>
            Thoughtful strategy. Clear communication. Representation that keeps
            the whole person in view.
          </p>
          <Link className={styles.footerCta} href="#consultation">
            Request a consultation
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className={styles.footerLinks}>
          <div>
            <h3>Practice</h3>
            <Link href="#expertise">Family &amp; matrimonial</Link>
            <Link href="#expertise">Estate &amp; legacy</Link>
            <Link href="#expertise">Business &amp; contracts</Link>
            <Link href="#expertise">Civil disputes</Link>
          </div>
          <div>
            <h3>Firm</h3>
            <Link href="#counsel">About Amanda</Link>
            <Link href="#results">Representative results</Link>
            <Link href="#resources">Resources</Link>
            <Link href="#testimonials">Client experiences</Link>
          </div>
          <div>
            <h3>Office</h3>
            <p>18 Harbour View</p>
            <p>Kingston, Jamaica</p>
            <p>+1 (876) 555-0148</p>
            <p>By appointment</p>
          </div>
          <div>
            <h3>Information</h3>
            <Link href="#legal-disclaimer">Concept disclaimer</Link>
            <p>Privacy-ready template</p>
            <p>Accessibility-first design</p>
            <Link href="#top">Back to top</Link>
          </div>
        </div>

        <div className={styles.disclaimer} id="legal-disclaimer">
          <p>
            <strong>Portfolio concept disclaimer.</strong> This website is a
            design demonstration created by Trexiti. Amanda Myers, the firm,
            credentials, address, contact details, client statements, case
            results, resources, and all related content shown here are fictional
            sample content and do not represent a real legal practice.
          </p>
          <p>
            Nothing on this concept website is legal advice. Viewing this page,
            using the sample form, or contacting any listed address does not
            create an attorney-client relationship. Do not rely on this sample
            content for legal decisions or submit confidential information.
          </p>
        </div>

        <div className={styles.footerBottom}>
          <p>© 2026 Amanda Myers Law · Demonstration concept</p>
          <p>
            Designed with care by <Link href="/">Trexiti</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
