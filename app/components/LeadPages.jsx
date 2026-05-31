"use client";

import { useEffect, useState } from "react";
import { Brand } from "./BrandSystem";

const primaryNav = [
  ["Home", "/"],
  ["PropertyOS", "/propertyos"],
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Process", "/process"],
  ["About", "/about"],
  ["Audit", "/contact"],
];

const industries = [
  [
    "Brokerages and Realtor Teams",
    "Teams that need stronger control over lead flow, listing activity, client follow-up, showing coordination, deal tasks, and sales visibility.",
  ],
  [
    "Property Management Companies",
    "Operators managing tenants, rent status, maintenance, contractors, owner communication, inspections, documents, and recurring service requests.",
  ],
  [
    "Developers and Asset Owners",
    "Real estate groups that need project updates, inspection records, capital improvement visibility, documents, stakeholder reports, and portfolio control.",
  ],
  [
    "Corporate Operations Teams",
    "Companies still depending on spreadsheets, calls, paper forms, inboxes, approvals, and manual follow-ups to keep daily work moving.",
  ],
  [
    "Field Service and Contractor Networks",
    "Teams coordinating site visits, work orders, job status, proof of completion, customer communication, and repeatable dispatch workflows.",
  ],
  [
    "AI Infrastructure for Enterprise Teams",
    "Businesses ready to use AI for routing, summaries, communication support, reporting, knowledge access, and decision support inside real workflows.",
  ],
];

const processSteps = [
  ["01", "Audit", "Review workflows, tools, handoffs, communication paths, data gaps, revenue signals, and where work currently slows down."],
  ["02", "Map", "Turn operational friction into a clear systems map: users, actions, data, automations, dashboards, ownership, and integration points."],
  ["03", "Design", "Shape the product architecture, user flows, executive dashboards, permissions, and automation logic around how the business works."],
  ["04", "Build", "Develop the platform, app, dashboard, integration layer, or automation system with a practical release path."],
  ["05", "Automate", "Add AI-assisted routing, reminders, reporting, communication support, and workflow triggers where they remove real manual drag."],
  ["06", "Scale", "Improve the system with usage feedback, better visibility, new modules, tighter integrations, and broader operational control."],
];

const auditOutcomes = [
  "A clear view of where work is breaking down.",
  "A practical roadmap for software, automation, and dashboards.",
  "A stronger reason to build the right system instead of adding another disconnected tool.",
  "A first step toward PropertyOS, a custom operating platform, or AI workflow automation.",
];

function PageNav({ current }) {
  const [navOpen, setNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${isScrolled ? " is-scrolled" : ""}${navOpen ? " nav-open" : ""}`}>
      <Brand href="/" />
      <button
        className="nav-toggle"
        type="button"
        aria-label={navOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={navOpen}
        onClick={() => setNavOpen((open) => !open)}
      >
        <span />
        <span />
      </button>
      <nav className="site-nav" aria-label="Primary navigation">
        {primaryNav.map(([label, href]) => (
          <a key={href} href={href} className={current === href ? "is-active" : undefined} onClick={() => setNavOpen(false)}>
            {label}
          </a>
        ))}
        <a className="nav-cta" href="/contact" onClick={() => setNavOpen(false)}>
          Book Audit
        </a>
      </nav>
    </header>
  );
}

function useReveal() {
  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 },
    );

    document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
    return () => revealObserver.disconnect();
  }, []);
}

function PageFooter() {
  return (
    <footer className="site-footer section-shell">
      <Brand href="/" />
      <p>Engineering Intelligent Systems for the Real World</p>
      <a href="/contact">Book a Systems Audit</a>
    </footer>
  );
}

function SignalConsole({ label, core, nodes, signals }) {
  return (
    <div className="services-command-wrap reveal" data-tilt>
      <div className="services-command-panel">
        <div className="dashboard-topbar">
          <span />
          <span />
          <span />
          <p>{label}</p>
        </div>
        <div className="services-radar">
          <div className="services-core">
            <strong>{core}</strong>
            <span>System layer</span>
          </div>
          {nodes.map((node, index) => (
            <div className={`service-node service-node-${["a", "b", "c", "d"][index]}`} key={node}>
              {node}
            </div>
          ))}
        </div>
        <div className="services-signal-grid">
          {signals.map(([title, value]) => (
            <article key={title}>
              <span>{title}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IndustriesPage() {
  useReveal();

  return (
    <>
      <PageNav current="/industries" />
      <main>
        <section className="services-product-hero section-shell" id="overview">
          <div className="services-hero-copy reveal">
            <p className="eyebrow">Industries</p>
            <h1>Intelligent systems for real estate portfolios and corporate operations.</h1>
            <p className="hero-subtitle">
              Trexiti builds for companies where money, property, clients, requests, approvals, reporting, field teams, and executive decisions all
              depend on better systems.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/contact">
                Book a Systems Audit
              </a>
              <a className="button button-secondary" href="/propertyos">
                Explore PropertyOS
              </a>
            </div>
          </div>

          <SignalConsole
            core="OPS"
            label="Industry Operating Map"
            nodes={["Requests", "Assets", "Teams", "Reports"]}
            signals={[
              ["Brokerage", "Pipeline"],
              ["Portfolio", "PropertyOS"],
              ["Visibility", "Dashboards"],
              ["AI layer", "Routing"],
            ]}
          />
        </section>

        <section className="services-page-section section-shell" id="industries">
          <div className="section-heading reveal">
            <p className="eyebrow">Where Trexiti Fits</p>
            <h2>For buyers where a basic website cannot fix the expensive operational problem.</h2>
            <p>
              The best Trexiti clients are not just looking for a new digital presence. They need systems that organize work, expose hidden friction,
              automate repeatable steps, protect service quality, and make performance visible to the people responsible for the money.
            </p>
          </div>

          <div className="services-page-grid">
            {industries.map(([title, copy], index) => (
              <article className="services-page-card reveal" key={title}>
                <div className="service-icon" aria-hidden="true">
                  <span />
                  <span />
                </div>
                <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="systems-not-screens section-shell" id="signals">
          <div className="systems-copy reveal">
            <p className="eyebrow">Buyer Signals</p>
            <h2>Trexiti is built for the point where manual coordination starts costing real money.</h2>
            <p>
              If a team is chasing updates, recreating reports, losing request history, or adding another spreadsheet to manage the last spreadsheet,
              the business is ready for a smarter operating layer.
            </p>
          </div>
          <div className="systems-map-panel reveal">
            <div className="systems-map lead-signal-map">
              <div className="map-center">
                <div>
                  <strong>Clarity</strong>
                  <span>Operating layer</span>
                </div>
              </div>
              <span className="map-chip chip-a">Requests</span>
              <span className="map-chip chip-b">Workflows</span>
              <span className="map-chip chip-c">Dashboards</span>
              <span className="map-chip chip-d">AI Support</span>
            </div>
          </div>
        </section>

        <section className="services-page-cta section-shell" id="audit">
          <div className="systems-copy reveal">
            <p className="eyebrow">Systems Audit</p>
            <h2>Find the system your operation is missing.</h2>
            <p>
              Trexiti will review how your work moves today and show where custom software, AI automation, dashboards, or PropertyOS can reduce
              friction.
            </p>
            <a className="button button-primary" href="/contact">
              Book a Systems Audit
            </a>
          </div>
          <div className="mission-stat reveal">
            <span>Core filter</span>
            <strong>If the work is important, repeated, and hard to see, it should probably become a system.</strong>
          </div>
        </section>
      </main>
      <PageFooter />
    </>
  );
}

export function ProcessPage() {
  useReveal();

  return (
    <>
      <PageNav current="/process" />
      <main>
        <section className="services-product-hero section-shell" id="overview">
          <div className="services-hero-copy reveal">
            <p className="eyebrow">Process</p>
            <h1>From operational chaos to boardroom-ready infrastructure.</h1>
            <p className="hero-subtitle">
              Trexiti starts by understanding how the business actually makes money, serves clients, reports to owners, and executes work, then
              designs the software, automation, dashboards, and AI workflows that make it easier to control.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/contact">
                Book a Systems Audit
              </a>
              <a className="button button-secondary" href="/services">
                See Services
              </a>
            </div>
          </div>

          <SignalConsole
            core="6"
            label="Trexiti Delivery Sequence"
            nodes={["Audit", "Map", "Build", "Scale"]}
            signals={[
              ["Stage 01", "Audit"],
              ["Stage 02", "Map"],
              ["Stage 03", "Build"],
              ["Stage 04", "Scale"],
            ]}
          />
        </section>

        <section className="services-page-section section-shell" id="process">
          <div className="section-heading reveal">
            <p className="eyebrow">Execution Model</p>
            <h2>A practical path from diagnosis to systems leaders can actually run the business on.</h2>
            <p>
              Trexiti does not start with a template. The process starts with the operation, then turns the highest-friction workflows into software
              infrastructure the business can actually use, measure, and justify.
            </p>
          </div>

          <div className="services-page-grid process-page-grid">
            {processSteps.map(([number, title, copy]) => (
              <article className="services-page-card reveal" key={title}>
                <div className="service-icon" aria-hidden="true">
                  <span />
                  <span />
                </div>
                <span className="service-number">{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="systems-not-screens section-shell" id="audit">
          <div className="systems-copy reveal">
            <p className="eyebrow">Audit Output</p>
            <h2>The first deliverable is clarity.</h2>
            <p>
              A Systems Audit helps leaders understand what is costing time, where reporting is weak, what should become a dashboard, what needs a
              custom platform, and where AI can support real operational decisions.
            </p>
          </div>
          <div className="lead-trigger-panel reveal">
            <div className="dashboard-topbar">
              <span />
              <span />
              <span />
              <p>Audit Outcomes</p>
            </div>
            <h3>What the audit is designed to uncover.</h3>
            <ul>
              {auditOutcomes.map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
            <a className="button button-primary" href="/contact">
              Book a Systems Audit
            </a>
          </div>
        </section>

        <section className="services-page-cta section-shell">
          <div className="systems-copy reveal">
            <p className="eyebrow">Next Step</p>
            <h2>Build the system your business should have had years ago.</h2>
            <p>
              Start with the Trexiti Systems Audit and leave with a clearer view of your workflows, data, automation opportunities, and build path.
            </p>
            <a className="button button-primary" href="/contact">
              Book a Systems Audit
            </a>
          </div>
          <div className="mission-stat reveal">
            <span>Operating principle</span>
            <strong>Good technology should make the business easier to see, easier to manage, and easier to scale.</strong>
          </div>
        </section>
      </main>
      <PageFooter />
    </>
  );
}
