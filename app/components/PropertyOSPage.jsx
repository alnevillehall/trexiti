"use client";

import { useEffect, useRef, useState } from "react";

const navItems = [
  ["Overview", "#overview"],
  ["Features", "#features"],
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Process", "/process"],
  ["About", "/about"],
  ["Audit", "/contact"],
];

const heroMetrics = [
  ["Property portfolio overview", "128", "Assets monitored"],
  ["Maintenance tickets", "42", "Open work orders"],
  ["Tenant requests", "316", "This month"],
  ["Contractor assignments", "18", "Active jobs"],
  ["AI assistant", "Online", "Routing support"],
  ["Rent status", "94%", "Current"],
  ["Owner reports", "Live", "Auto-generated"],
  ["Inspection schedule", "27", "Upcoming"],
  ["Task priority levels", "High", "3 flagged"],
];

const features = [
  [
    "Tenant Management",
    "Keep tenant profiles, lease information, contact details, and communication history organized.",
  ],
  [
    "Maintenance Requests",
    "Allow tenants or managers to submit requests, upload photos, track status, and receive updates.",
  ],
  [
    "Contractor Dispatch",
    "Assign work orders to contractors, monitor progress, upload completion photos, and track job history.",
  ],
  [
    "Owner Dashboards",
    "Give owners visibility into property performance, expenses, maintenance history, and reports.",
  ],
  [
    "Rent and Payment Tracking",
    "Track rent status, due dates, payment history, balances, and follow-ups.",
  ],
  [
    "Inspection Records",
    "Create inspection checklists, upload images, store reports, and maintain a complete property history.",
  ],
  [
    "AI Support Assistant",
    "Use AI to summarize requests, suggest priority levels, draft responses, and help route tasks.",
  ],
  ["Reports and Analytics", "Turn property operations into clear dashboards for better decisions."],
];

const roles = ["Property Managers", "Tenants", "Contractors", "Owners", "Administrators"];

function Brand() {
  return (
    <a className="brand" href="/" aria-label="Trexiti home">
      <span className="brand-mark" aria-hidden="true">
        <span />
      </span>
      <span className="brand-text">Trexiti</span>
    </a>
  );
}

export default function PropertyOSPage() {
  const canvasRef = useRef(null);
  const [navOpen, setNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#overview");

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
        });
      },
      {
        rootMargin: "-36% 0px -58% 0px",
        threshold: 0.01,
      },
    );

    navItems
      .filter(([, href]) => href.startsWith("#"))
      .map(([, href]) => document.querySelector(href))
      .filter(Boolean)
      .forEach((section) => sectionObserver.observe(section));

    return () => {
      revealObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    let width = 0;
    let height = 0;
    let particles = [];
    let animationFrame = 0;
    let lastTime = 0;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const count = Math.min(104, Math.max(46, Math.floor(width / 17)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        size: index % 8 === 0 ? 2.15 : 1 + Math.random() * 1.3,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const drawParticles = (time) => {
      const delta = Math.min(34, time - lastTime || 16);
      lastTime = time;

      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(width * 0.7, height * 0.24, 0, width * 0.7, height * 0.24, width * 0.75);
      gradient.addColorStop(0, "rgba(0, 229, 255, 0.09)");
      gradient.addColorStop(0.44, "rgba(10, 125, 255, 0.03)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.pulse += 0.015 * delta;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;
      });

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];

        for (let j = i + 1; j < particles.length; j += 1) {
          const next = particles[j];
          const distance = Math.hypot(particle.x - next.x, particle.y - next.y);

          if (distance < 128) {
            const opacity = (1 - distance / 128) * 0.16;
            context.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(next.x, next.y);
            context.stroke();
          }
        }

        const glow = 0.38 + Math.sin(particle.pulse) * 0.16;
        context.fillStyle = `rgba(0, 229, 255, ${glow})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      if (!prefersReducedMotion) animationFrame = requestAnimationFrame(drawParticles);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    drawParticles(0);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="system-canvas" aria-hidden="true" />

      <header className={`site-header${isScrolled ? " is-scrolled" : ""}${navOpen ? " nav-open" : ""}`}>
        <Brand />

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

        <nav className="site-nav" aria-label="PropertyOS navigation">
          {navItems.map(([label, href]) => (
            <a key={href} href={href} className={activeSection === href ? "is-active" : undefined} onClick={() => setNavOpen(false)}>
              {label}
            </a>
          ))}
          <a className="nav-cta" href="#demo" onClick={() => setNavOpen(false)}>
            Request Demo
          </a>
        </nav>
      </header>

      <main>
        <section className="property-product-hero section-shell" id="overview">
          <div className="hero-grid" aria-hidden="true" />
          <div className="orbital-ring ring-one" aria-hidden="true" />
          <div className="orbital-ring ring-two" aria-hidden="true" />

          <div className="property-hero-copy reveal">
            <div className="wordmark-panel">
              <div className="wordmark-icon" aria-hidden="true">
                <span />
              </div>
              <div>
                <p className="eyebrow">PropertyOS by Trexiti</p>
                <p className="wordmark">Real estate command layer</p>
              </div>
            </div>
            <h1>PropertyOS - One system for modern real estate operations.</h1>
            <p className="hero-subtitle">
              Manage tenants, maintenance, contractors, owners, inspections, requests, documents, and reports from one intelligent platform.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#demo">
                Request a Demo
              </a>
              <a className="button button-secondary" href="#features">
                See Features
              </a>
            </div>
          </div>

          <div className="property-dashboard-wrap reveal" data-tilt>
            <div className="property-dashboard">
              <div className="dashboard-topbar">
                <span />
                <span />
                <span />
                <p>PropertyOS Operations Console</p>
              </div>

              <div className="portfolio-overview">
                <div>
                  <span>Property portfolio overview</span>
                  <strong>128 units</strong>
                  <p>Maintenance, rent, inspections, documents, owners, and contractors in one view.</p>
                </div>
                <div className="portfolio-map" aria-hidden="true">
                  <span className="map-pulse pulse-a" />
                  <span className="map-pulse pulse-b" />
                  <span className="map-pulse pulse-c" />
                </div>
              </div>

              <div className="product-metric-grid">
                {heroMetrics.slice(1).map(([label, value, detail]) => (
                  <article className="product-metric-card" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                    <i>{detail}</i>
                  </article>
                ))}
              </div>

              <div className="priority-lane">
                <span>Task priority levels</span>
                <div>
                  <b>High</b>
                  <b>Medium</b>
                  <b>Routine</b>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="split-section product-problem section-shell" id="problem">
          <div className="section-copy reveal">
            <p className="eyebrow">The Problem</p>
            <h2>Real estate operations break down when information is scattered.</h2>
          </div>
          <div className="problem-statement reveal">
            <p>
              Tenant messages live in WhatsApp. Maintenance requests get lost. Owners want updates. Contractors need instructions. Managers rely on
              memory, calls, and spreadsheets. PropertyOS brings everything into one structured system.
            </p>
          </div>
        </section>

        <section className="product-features section-shell" id="features">
          <div className="section-heading reveal">
            <p className="eyebrow">Core Features</p>
            <h2>Everything your property operation needs to stay visible, organized, and moving.</h2>
          </div>
          <div className="product-feature-grid">
            {features.map(([title, copy], index) => (
              <article className="product-feature-card reveal" key={title}>
                <span className="build-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="roles-section section-shell" id="roles">
          <div className="section-heading reveal">
            <p className="eyebrow">User Roles</p>
            <h2>Built for every part of the property workflow.</h2>
          </div>
          <div className="role-grid reveal">
            {roles.map((role) => (
              <article className="role-card" key={role}>
                <span />
                <h3>{role}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="ai-advantage section-shell" id="ai-advantage">
          <div className="ai-advantage-panel reveal">
            <p className="eyebrow">AI Advantage</p>
            <h2>Not just management software. Intelligent operation control.</h2>
            <p>
              PropertyOS uses automation and AI-assisted workflows to reduce manual follow-up, improve response speed, and create better visibility
              across the entire property operation.
            </p>
          </div>
          <div className="ai-flow reveal">
            <article>
              <span>01</span>
              <strong>Summarize</strong>
              <p>Turn long tenant messages and contractor updates into clear operational context.</p>
            </article>
            <article>
              <span>02</span>
              <strong>Prioritize</strong>
              <p>Suggest urgency levels based on issue type, risk, history, and response requirements.</p>
            </article>
            <article>
              <span>03</span>
              <strong>Route</strong>
              <p>Move requests to the right manager, contractor, owner report, or follow-up workflow.</p>
            </article>
          </div>
        </section>

        <section className="product-cta section-shell" id="demo">
          <div className="cta-content reveal">
            <p className="eyebrow">Request a Demo</p>
            <h2>Bring your property operations into one intelligent system.</h2>
            <a className="button button-primary" href="mailto:hello@trexiti.com?subject=PropertyOS%20Demo%20Request">
              Request a PropertyOS Demo
            </a>
          </div>
          <div className="cta-console reveal">
            <div className="dashboard-topbar">
              <span />
              <span />
              <span />
              <p>PropertyOS Demo Scope</p>
            </div>
            <div className="audit-signal">
              <strong>Replace fragmented property workflows.</strong>
              <p>See how PropertyOS can centralize tenant communication, maintenance, contractors, owner reports, and AI-assisted operations.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <Brand />
        <p>PropertyOS - Intelligent real estate operations by Trexiti</p>
        <a href="#demo">Request a Demo</a>
      </footer>
    </>
  );
}
