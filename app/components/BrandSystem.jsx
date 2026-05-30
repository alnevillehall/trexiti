"use client";

export function Brand({ href = "/" }) {
  return (
    <a className="brand" href={href} aria-label="Trexiti home">
      <span className="brand-mark" aria-hidden="true">
        <span />
      </span>
      <span className="brand-text">Trexiti</span>
    </a>
  );
}

export function Navbar({ activeSection, isScrolled, navOpen, navItems, onToggle, onNavigate }) {
  return (
    <header className={`site-header${isScrolled ? " is-scrolled" : ""}${navOpen ? " nav-open" : ""}`}>
      <Brand href="#home" />

      <button
        className="nav-toggle"
        type="button"
        aria-label={navOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={navOpen}
        onClick={onToggle}
      >
        <span />
        <span />
      </button>

      <nav className="site-nav" aria-label="Primary navigation">
        {navItems.map(([label, href]) => (
          <a key={href} href={href} className={activeSection === href ? "is-active" : undefined} onClick={onNavigate}>
            {label}
          </a>
        ))}
        <a className="nav-cta" href="/contact" onClick={onNavigate}>
          Book Audit
        </a>
      </nav>
    </header>
  );
}

export function FloatingDashboardMockup({ panels }) {
  return (
    <div className="hero-visual command-center reveal" data-tilt>
      <div className="command-shell premium-command-shell">
        <div className="dashboard-topbar">
          <span />
          <span />
          <span />
          <p>Trexiti Command Center</p>
        </div>

        <div className="command-radar">
          <div className="radar-ring ring-a" />
          <div className="radar-ring ring-b" />
          <div className="radar-core">
            <strong>AI</strong>
            <span>Routing engine</span>
          </div>
          <div className="system-node node-a">Intake</div>
          <div className="system-node node-b">Dispatch</div>
          <div className="system-node node-c">Reports</div>
          <div className="system-node node-d">Health</div>
        </div>

        <div className="command-card-grid">
          {panels.map(([label, value, detail], index) => (
            <article className="command-card" key={label} style={{ "--delay": `${index * 0.35}s` }}>
              <span>{label}</span>
              <strong>{value}</strong>
              <i>{detail}</i>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsStrip({ stats }) {
  return (
    <section className="stats-strip section-shell reveal" aria-label="Trexiti operating signals">
      {stats.map(([value, label, detail]) => (
        <article key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
          <p>{detail}</p>
        </article>
      ))}
    </section>
  );
}

export function GlassFeatureCard({ number, title, copy }) {
  return (
    <article className="build-card reveal">
      <div className="card-glow" />
      <span className="build-index">{number}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

export function ServiceCard({ title, copy }) {
  return (
    <article className="service-card reveal">
      <span>Service</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

export function ProductShowcaseBlock({ features }) {
  return (
    <section className="propertyos section-shell" id="propertyos">
      <div className="property-visual reveal" data-tilt>
        <div className="mock-window premium-product-window">
          <div className="mock-sidebar">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="mock-main">
            <div className="mock-header">
              <p>PropertyOS</p>
              <span>Live operations</span>
            </div>
            <div className="mock-kpis">
              <article>
                <span>Requests routed</span>
                <strong>1,284</strong>
              </article>
              <article>
                <span>Avg response</span>
                <strong>18h</strong>
              </article>
              <article>
                <span>Owner visibility</span>
                <strong>94%</strong>
              </article>
            </div>
            <div className="workflow-lane">
              <div>
                <strong>Tenant request captured</strong>
                <span>Issue, property, priority, photos, and history structured automatically</span>
              </div>
              <div>
                <strong>Contractor assigned</strong>
                <span>Availability, category, SLA, and dispatch rules applied</span>
              </div>
              <div>
                <strong>Owner reporting updated</strong>
                <span>Cost, status, resolution notes, and reporting timeline synchronized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="section-copy reveal">
        <p className="eyebrow">Product Showcase</p>
        <h2>PropertyOS - Real estate operations, redesigned.</h2>
        <p>A unified platform for property managers, tenants, contractors, owners, and administrators.</p>
        <div className="feature-card-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature}>
              <span />
              <p>{feature}</p>
            </article>
          ))}
        </div>
        <a className="text-link" href="/propertyos">
          Explore PropertyOS
        </a>
      </div>
    </section>
  );
}

export function ProcessTimeline({ steps }) {
  return (
    <div className="timeline process-grid">
      {steps.map(([number, title, copy]) => (
        <article className="timeline-item reveal" key={number}>
          <span>{number}</span>
          <div>
            <h3>{title}</h3>
            <p>{copy}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function IndustryCard({ title, copy, index }) {
  return (
    <article className="industry-card reveal">
      <span>{String(index + 1).padStart(2, "0")}</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

export function ClientExampleShowcase() {
  return (
    <section className="client-example-showcase case-study-placeholder section-shell">
      <div className="case-copy reveal">
        <p className="eyebrow">Example Transformation</p>
        <h2>What a Trexiti system can look like in the real world.</h2>
        <p>
          A property management company receives tenant requests through WhatsApp, tracks maintenance in spreadsheets, calls contractors manually,
          and sends owners updates only when someone asks. Trexiti turns that scattered operation into a structured system with request intake,
          AI-assisted routing, contractor dispatch, owner visibility, and management dashboards.
        </p>
        <a className="button button-secondary" href="/propertyos">
          See the PropertyOS Example
        </a>
      </div>
      <div className="case-console reveal">
        <div className="dashboard-topbar">
          <span />
          <span />
          <span />
          <p>Example System Snapshot</p>
        </div>
        <div className="case-metrics">
          <article>
            <span>Before</span>
            <strong>WhatsApp, calls, and spreadsheets</strong>
          </article>
          <article>
            <span>System</span>
            <strong>Tenant portal, contractor flow, owner dashboard</strong>
          </article>
          <article>
            <span>Control</span>
            <strong>Every request visible from intake to resolution</strong>
          </article>
        </div>
      </div>
    </section>
  );
}

export function LeadReadinessBlock() {
  const profiles = [
    ["Real estate operators", "Property managers, landlords, and developers managing requests, tenants, contractors, owners, and reporting."],
    ["Operations-heavy businesses", "Companies where work gets stuck between spreadsheets, messages, manual approvals, and disconnected apps."],
    ["Growing teams", "Owners and managers who need dashboards, automation, and better visibility before complexity becomes expensive."],
  ];

  const triggers = [
    "Requests are coming from too many channels.",
    "Managers cannot see the status of work in one place.",
    "Staff spend hours copying data, chasing updates, or sending reminders.",
    "Owners or customers ask for updates before the team has clear answers.",
    "The business has outgrown basic websites and needs operational software.",
  ];

  return (
    <section className="lead-readiness section-shell" id="lead-fit">
      <div className="section-heading reveal">
        <p className="eyebrow">Best Fit</p>
        <h2>Built for teams where operations have outgrown scattered tools.</h2>
        <p>
          The strongest fit is a business that already feels operational friction: requests spread across channels, reporting lagging behind reality,
          and teams relying on memory to keep work moving. Trexiti gives those companies a clear path from diagnosis to intelligent systems.
        </p>
      </div>

      <div className="lead-readiness-grid">
        <div className="lead-profile-stack">
          {profiles.map(([title, copy], index) => (
            <article className="lead-profile-card reveal" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>

        <div className="lead-trigger-panel reveal">
          <div className="dashboard-topbar">
            <span />
            <span />
            <span />
            <p>Qualification Signals</p>
          </div>
          <h3>Your business may be ready if one of these sounds familiar.</h3>
          <ul>
            {triggers.map((trigger) => (
              <li key={trigger}>{trigger}</li>
            ))}
          </ul>
          <a className="button button-primary" href="/contact">
            Book a Systems Audit
          </a>
        </div>
      </div>
    </section>
  );
}

export function FounderMissionBlock() {
  return (
    <section className="founder-mission-block section-shell" id="mission">
      <div className="mission-panel reveal">
        <p className="eyebrow">Founder Mission</p>
        <h2>Built with a systems-first mindset.</h2>
        <p>
          Trexiti is led by a builder's mindset: solve real operational problems, design practical technology, and create systems businesses can
          depend on. The company starts with real estate operations and expands into broader intelligent infrastructure for the future of business.
        </p>
      </div>
      <div className="mission-stat reveal">
        <span>Core belief</span>
        <strong>A website shows your business. A system runs it.</strong>
        <p>Trexiti focuses on the infrastructure behind growth: workflows, automation, dashboards, data, communication, and operational control.</p>
      </div>
    </section>
  );
}

export function CTABanner() {
  return (
    <section className="final-cta section-shell" id="contact">
      <div className="cta-content reveal">
        <p className="eyebrow">Systems Audit</p>
        <h2>Ready to modernize how your business operates?</h2>
        <p>Start with a Trexiti Systems Audit and discover where automation, software, and AI can remove friction from your company.</p>
        <a className="button button-primary" href="/contact">
          Book a Systems Audit
        </a>
      </div>

      <div className="cta-console reveal">
        <div className="dashboard-topbar">
          <span />
          <span />
          <span />
          <p>Audit Readiness</p>
        </div>
        <div className="audit-signal">
          <strong>Systems opportunity detected</strong>
          <p>Manual follow-ups, disconnected tools, and hidden operational drag are ready for automation.</p>
        </div>
        <div className="audit-list">
          <span>Workflow map</span>
          <span>Automation plan</span>
          <span>Dashboard model</span>
          <span>PropertyOS fit</span>
        </div>
      </div>
    </section>
  );
}

export function ContactForm() {
  return (
    <form className="audit-form reusable-contact-form">
      <label>
        <span>Name</span>
        <input type="text" placeholder="Your name" />
      </label>
      <label>
        <span>Email</span>
        <input type="email" placeholder="you@company.com" />
      </label>
      <label>
        <span>Operational challenge</span>
        <textarea placeholder="What workflow needs to become clearer, faster, or more automated?" />
      </label>
      <button className="button button-primary" type="button">
        Request My Systems Audit
      </button>
    </form>
  );
}

export function Footer() {
  return (
    <footer className="site-footer section-shell">
      <Brand href="#home" />
      <p>Engineering Intelligent Systems for the Real World</p>
      <a href="/contact">Book a Systems Audit</a>
    </footer>
  );
}
