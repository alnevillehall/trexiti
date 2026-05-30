"use client";

import { useEffect, useRef, useState } from "react";
import {
  ClientExampleShowcase,
  CTABanner,
  FloatingDashboardMockup,
  Footer,
  FounderMissionBlock,
  GlassFeatureCard,
  IndustryCard,
  LeadReadinessBlock,
  Navbar,
  ProcessTimeline,
  ProductShowcaseBlock,
  ServiceCard,
  StatsStrip,
} from "./BrandSystem";

const navItems = [
  ["Home", "#home"],
  ["PropertyOS", "/propertyos"],
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Process", "/process"],
  ["About", "/about"],
  ["Audit", "/contact"],
];

const trustItems = ["Operational software", "Real estate systems", "AI workflow automation", "PropertyOS", "Systems audit"];

const heroPanels = [
  ["Property requests", "1,284", "Unified intake"],
  ["Maintenance tracking", "248", "Live ticket flow"],
  ["AI workflow routing", "91%", "Auto-classified"],
  ["Contractor dispatch", "37", "Vendor actions"],
  ["Owner reporting", "Live", "Portfolio updates"],
  ["System health", "99.8%", "Stable operations"],
  ["Revenue visibility", "$4.2M", "Tracked pipeline"],
  ["Automated communication", "6.8k", "Messages handled"],
];

const buildItems = [
  ["01", "Real Estate Operation Systems", "Portfolio platforms for requests, maintenance, tenants, contractors, owners, and reporting."],
  ["02", "AI Workflow Automation", "Routing, classification, reminders, drafting, scheduling, escalation, and decision support inside the workflow."],
  ["03", "Custom Software Platforms", "Purpose-built portals, admin systems, internal tools, and digital products for modern businesses."],
  ["04", "Business Dashboards", "Executive command layers that expose performance, bottlenecks, costs, revenue, and operational health."],
  ["05", "Mobile Applications", "Field-ready mobile experiences for teams, tenants, contractors, customers, and operators."],
  ["06", "Cloud Integrations", "Connected data pipelines across CRMs, accounting tools, messaging, storage, APIs, and databases."],
];

const propertyFeatures = [
  "Tenant management",
  "Maintenance requests",
  "Contractor assignment",
  "Owner dashboards",
  "Rent and payment tracking",
  "Inspection records",
  "AI support assistant",
  "Automated reporting",
];

const layerItems = [
  ["Route", "Send work to the right place", "AI classifies requests, detects urgency, and routes tasks to teams or contractors."],
  ["Communicate", "Reduce manual follow-up", "Automated updates keep tenants, owners, managers, and vendors aligned."],
  ["Schedule", "Coordinate the moving parts", "Systems manage availability, dispatch, reminders, approvals, and status changes."],
  ["Report", "Turn activity into visibility", "Operational data becomes dashboards, summaries, owner reports, and decision support."],
];

const services = [
  ["Custom Software Development", "Secure, premium web platforms, internal systems, portals, and products designed around real workflows."],
  ["AI Automation", "Practical AI for intake, routing, summarization, document handling, communication, and operational assistance."],
  ["Workflow Systems", "Structured processes that replace spreadsheets, message threads, paper forms, and scattered manual follow-ups."],
  ["Web and Mobile Apps", "Responsive applications for managers, teams, tenants, customers, contractors, and executives."],
  ["Data Dashboards", "Command-center visibility into operations, revenue, service levels, risk, and performance."],
  ["Business Process Consulting", "Systems audits, workflow mapping, automation strategy, and implementation planning."],
  ["Cloud Systems and Integrations", "Cloud architecture, databases, APIs, third-party integrations, and reliable operational infrastructure."],
];

const stats = [
  ["01", "Systems-first thinking", "Every engagement begins with workflows, roles, data, and operational pressure."],
  ["AI", "Practical intelligence", "Automation is placed inside real processes, not presented as decoration."],
  ["OS", "Operating layers", "Trexiti builds platforms that help businesses run, measure, and improve."],
  ["360", "Business visibility", "Dashboards turn fragmented activity into decisions owners can trust."],
];

const industries = [
  ["Real Estate", "Property management, maintenance, tenant communication, owner reporting, inspections, and portfolio operations."],
  ["Logistics", "Dispatch, routing, scheduling, service visibility, handoffs, and operational dashboards."],
  ["Field Services", "Work orders, contractor coordination, customer updates, job history, and mobile workflows."],
  ["Business Operations", "Internal systems, approval flows, data visibility, team workflows, and process automation."],
  ["Diagnostics", "Data intake, analysis workflows, reporting systems, and intelligent support tools."],
  ["AI Infrastructure", "Structured automation layers, connected data, workflow intelligence, and decision support systems."],
];

const processSteps = [
  ["01", "Audit", "Understand current tools, teams, workflows, friction, risks, and manual drag."],
  ["02", "Map", "Turn messy operations into a clear process map with data, roles, triggers, and handoffs."],
  ["03", "Design", "Define the system architecture, screens, automations, dashboards, and rollout path."],
  ["04", "Build", "Develop the software layer, integrate core tools, and test real operational scenarios."],
  ["05", "Automate", "Add AI routing, communications, alerts, reporting, approvals, and repeatable workflows."],
  ["06", "Scale", "Measure adoption, improve performance, expand capabilities, and harden the infrastructure."],
];

export default function TrexitiSite() {
  const canvasRef = useRef(null);
  const [navOpen, setNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#home");

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

    const alignHashTarget = () => {
      if (!window.location.hash) return;

      const target = document.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView({ block: "start" });
        target.classList.add("is-visible");
        target.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => window.setTimeout(alignHashTarget, 80));
    } else {
      window.setTimeout(alignHashTarget, 80);
    }

    return () => {
      revealObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const elements = [...document.querySelectorAll("[data-tilt]")];
    const cleanups = elements.map((card) => {
      const onPointerMove = (event) => {
        if (window.matchMedia("(max-width: 860px)").matches) return;

        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", `${y * -4}deg`);
        card.style.setProperty("--tilt-y", `${x * 5}deg`);
        card.style.transform = "rotateX(var(--tilt-x)) rotateY(var(--tilt-y))";
      };
      const onPointerLeave = () => {
        card.style.transform = "";
      };

      card.addEventListener("pointermove", onPointerMove);
      card.addEventListener("pointerleave", onPointerLeave);

      return () => {
        card.removeEventListener("pointermove", onPointerMove);
        card.removeEventListener("pointerleave", onPointerLeave);
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
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

      const count = Math.min(112, Math.max(48, Math.floor(width / 16)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: index % 8 === 0 ? 2.25 : 1.05 + Math.random() * 1.35,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const drawParticles = (time) => {
      const delta = Math.min(34, time - lastTime || 16);
      lastTime = time;

      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(width * 0.72, height * 0.18, 0, width * 0.72, height * 0.18, width * 0.7);
      gradient.addColorStop(0, "rgba(0, 229, 255, 0.08)");
      gradient.addColorStop(0.45, "rgba(10, 125, 255, 0.025)");
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

          if (distance < 132) {
            const opacity = (1 - distance / 132) * 0.18;
            context.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(next.x, next.y);
            context.stroke();
          }
        }

        const glow = 0.42 + Math.sin(particle.pulse) * 0.18;
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

      <Navbar
        activeSection={activeSection}
        isScrolled={isScrolled}
        navItems={navItems}
        navOpen={navOpen}
        onNavigate={() => setNavOpen(false)}
        onToggle={() => setNavOpen((open) => !open)}
      />

      <main>
        <section className="hero section-shell" id="home">
          <div className="hero-grid" aria-hidden="true" />
          <div className="orbital-ring ring-one" aria-hidden="true" />
          <div className="orbital-ring ring-two" aria-hidden="true" />

          <div className="hero-content reveal">
            <div className="wordmark-panel">
              <div className="wordmark-icon" aria-hidden="true">
                <span />
              </div>
              <div>
                <p className="eyebrow">Futuristic AI systems company</p>
                <p className="wordmark">Trexiti</p>
              </div>
            </div>

            <h1>Engineering Intelligent Systems for the Real World.</h1>
            <p className="hero-subtitle">
              Trexiti builds AI-powered software, automation, and operational platforms for real estate companies and modern businesses that need
              clarity, control, and scale.
            </p>

            <div className="hero-actions">
              <a className="button button-primary" href="/contact">
                Book a Systems Audit
              </a>
              <a className="button button-secondary" href="/propertyos">
                Explore PropertyOS
              </a>
            </div>

            <div className="hero-proof">
              <div>
                <strong>Built for operational complexity</strong>
                <span>Real estate, services, field teams, approvals, reporting, and high-volume workflows.</span>
              </div>
              <div>
                <strong>Software beyond surface-level web</strong>
                <span>Trexiti builds the operating layer that makes work visible, automated, and measurable.</span>
              </div>
            </div>
          </div>

          <FloatingDashboardMockup panels={heroPanels} />
        </section>

        <section className="trust-strip section-shell reveal" aria-label="Trexiti positioning">
          {trustItems.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </section>

        <StatsStrip stats={stats} />

        <section className="split-section problem-section section-shell" id="problem">
          <div className="section-copy reveal">
            <p className="eyebrow">Problem</p>
            <h2>Most businesses are running modern operations on outdated systems.</h2>
          </div>
          <div className="problem-statement reveal">
            <p>
              Spreadsheets, WhatsApp threads, paper forms, disconnected apps, and manual follow-ups create hidden operational drag. Trexiti replaces
              fragmented workflows with intelligent systems built for speed, visibility, and scale.
            </p>
          </div>
        </section>

        <section className="builds section-shell" id="builds">
          <div className="section-heading reveal">
            <p className="eyebrow">What We Build</p>
            <h2>Software that becomes the operating layer of your business.</h2>
          </div>

          <div className="build-grid build-grid-six">
            {buildItems.map(([number, title, copy]) => (
              <GlassFeatureCard copy={copy} key={number} number={number} title={title} />
            ))}
          </div>
        </section>

        <ProductShowcaseBlock features={propertyFeatures} />

        <section className="ai-layer section-shell" id="ai-layer">
          <div className="section-heading reveal">
            <p className="eyebrow">AI Layer</p>
            <h2>Intelligence built into the workflow.</h2>
            <p>
              Trexiti integrates AI into business operations to assist with routing, communication, scheduling, reporting, and decision support.
            </p>
          </div>

          <div className="layer-grid reveal">
            {layerItems.map(([label, title, copy]) => (
              <article key={label}>
                <span>{label}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="services section-shell" id="services">
          <div className="section-heading reveal">
            <p className="eyebrow">Services</p>
            <h2>Build the systems your business actually needs.</h2>
          </div>

          <div className="services-grid services-grid-seven">
            {services.map(([title, copy]) => (
              <ServiceCard copy={copy} key={title} title={title} />
            ))}
          </div>
        </section>

        <section className="industries-showcase section-shell" id="industries">
          <div className="section-heading reveal">
            <p className="eyebrow">Industries</p>
            <h2>Intelligent systems for businesses with real operational complexity.</h2>
            <p>Trexiti builds for companies where work moves through people, properties, requests, assets, approvals, data, and deadlines.</p>
          </div>

          <div className="industry-card-grid">
            {industries.map(([title, copy], index) => (
              <IndustryCard copy={copy} index={index} key={title} title={title} />
            ))}
          </div>
        </section>

        <section className="process section-shell" id="process">
          <div className="section-heading reveal">
            <p className="eyebrow">Process</p>
            <h2>From operational chaos to intelligent infrastructure.</h2>
          </div>

          <ProcessTimeline steps={processSteps} />
        </section>

        <ClientExampleShowcase />
        <LeadReadinessBlock />
        <FounderMissionBlock />
        <CTABanner />
      </main>

      <Footer />
    </>
  );
}
