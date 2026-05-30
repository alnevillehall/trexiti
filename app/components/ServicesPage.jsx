"use client";

import { useEffect, useRef, useState } from "react";

const navItems = [
  ["Overview", "#overview"],
  ["Services", "#services"],
  ["PropertyOS", "/propertyos"],
  ["Industries", "/industries"],
  ["Process", "/process"],
  ["About", "/about"],
  ["Audit", "/contact"],
];

const services = [
  [
    "Custom Software Development",
    "We design and build tailored platforms that match how your business actually operates, from internal dashboards to full-scale business systems.",
    "01",
  ],
  [
    "AI Workflow Automation",
    "We integrate AI into repetitive workflows, communication, reporting, routing, and decision support so your team can operate with less manual drag.",
    "02",
  ],
  [
    "Web Application Development",
    "We build fast, modern, secure web applications for businesses that need more than a basic website.",
    "03",
  ],
  [
    "Mobile App Development",
    "We create mobile apps for teams, customers, contractors, field staff, and business operations.",
    "04",
  ],
  [
    "Business Dashboards",
    "We transform scattered data into clear dashboards that give owners and managers real visibility.",
    "05",
  ],
  [
    "Cloud Systems and Integrations",
    "We connect tools, databases, APIs, and workflows so your business systems work together instead of creating more complexity.",
    "06",
  ],
  [
    "Process Optimization",
    "We analyze your current operations, identify bottlenecks, and design smarter workflows supported by technology.",
    "07",
  ],
  [
    "Real Estate Systems",
    "We build platforms for property management, maintenance tracking, tenant communication, owner reporting, and real estate operations.",
    "08",
  ],
];

const systemSignals = [
  ["Workflow intelligence", "Automated routing"],
  ["Operational control", "Live dashboards"],
  ["Data visibility", "Connected systems"],
  ["Execution layer", "Reliable software"],
];

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

export default function ServicesPage() {
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
    const elements = [...document.querySelectorAll("[data-tilt]")];
    const cleanups = elements.map((card) => {
      const onPointerMove = (event) => {
        if (window.matchMedia("(max-width: 860px)").matches) return;

        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--tilt-x", `${y * -3.5}deg`);
        card.style.setProperty("--tilt-y", `${x * 4.5}deg`);
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

      const count = Math.min(108, Math.max(48, Math.floor(width / 16)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        size: index % 7 === 0 ? 2.2 : 1.05 + Math.random() * 1.2,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const drawParticles = (time) => {
      const delta = Math.min(34, time - lastTime || 16);
      lastTime = time;

      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(width * 0.74, height * 0.18, 0, width * 0.74, height * 0.18, width * 0.72);
      gradient.addColorStop(0, "rgba(0, 229, 255, 0.085)");
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

          if (distance < 130) {
            const opacity = (1 - distance / 130) * 0.17;
            context.strokeStyle = `rgba(0, 229, 255, ${opacity})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(particle.x, particle.y);
            context.lineTo(next.x, next.y);
            context.stroke();
          }
        }

        const glow = 0.4 + Math.sin(particle.pulse) * 0.16;
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

        <nav className="site-nav" aria-label="Services navigation">
          {navItems.map(([label, href]) => (
            <a key={href} href={href} className={activeSection === href ? "is-active" : undefined} onClick={() => setNavOpen(false)}>
              {label}
            </a>
          ))}
          <a className="nav-cta" href="#audit" onClick={() => setNavOpen(false)}>
            Book Audit
          </a>
        </nav>
      </header>

      <main>
        <section className="services-product-hero section-shell" id="overview">
          <div className="hero-grid" aria-hidden="true" />
          <div className="orbital-ring ring-one" aria-hidden="true" />
          <div className="orbital-ring ring-two" aria-hidden="true" />

          <div className="services-hero-copy reveal">
            <div className="wordmark-panel">
              <div className="wordmark-icon" aria-hidden="true">
                <span />
              </div>
              <div>
                <p className="eyebrow">Trexiti Services</p>
                <p className="wordmark">Intelligent business infrastructure</p>
              </div>
            </div>
            <h1>Technology services built for real business operations.</h1>
            <p className="hero-subtitle">
              From custom software to AI automation, Trexiti designs and builds the systems businesses need to operate smarter, faster, and with
              greater control.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#audit">
                Book a Systems Audit
              </a>
              <a className="button button-secondary" href="#services">
                View Services
              </a>
            </div>
          </div>

          <div className="services-command-wrap reveal" data-tilt>
            <div className="services-command-panel">
              <div className="dashboard-topbar">
                <span />
                <span />
                <span />
                <p>Trexiti Systems Console</p>
              </div>

              <div className="services-radar" aria-hidden="true">
                <div className="services-core">
                  <strong>OPS</strong>
                  <span>Control layer</span>
                </div>
                <span className="service-node service-node-a">Software</span>
                <span className="service-node service-node-b">AI routing</span>
                <span className="service-node service-node-c">Dashboards</span>
                <span className="service-node service-node-d">Cloud APIs</span>
              </div>

              <div className="services-signal-grid">
                {systemSignals.map(([title, detail]) => (
                  <article key={title}>
                    <span>{title}</span>
                    <strong>{detail}</strong>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="services-page-section section-shell" id="services">
          <div className="section-heading reveal">
            <p className="eyebrow">Services</p>
            <h2>Build the systems your business actually needs.</h2>
          </div>

          <div className="services-page-grid">
            {services.map(([title, copy, number]) => (
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

        <section className="systems-not-screens section-shell" id="systems">
          <div className="systems-copy reveal">
            <p className="eyebrow">Systems, not screens</p>
            <h2>We build systems, not just screens.</h2>
            <p>
              A website shows your business. A system runs it. Trexiti focuses on the infrastructure behind growth: workflows, automation,
              dashboards, data, communication, and operational control.
            </p>
          </div>

          <div className="systems-map-panel reveal" data-tilt>
            <div className="systems-map">
              <div className="map-center">
                <strong>Business OS</strong>
                <span>Built around operations</span>
              </div>
              <span className="map-chip chip-a">Workflow</span>
              <span className="map-chip chip-b">Automation</span>
              <span className="map-chip chip-c">Dashboards</span>
              <span className="map-chip chip-d">Communication</span>
              <span className="map-chip chip-e">Data</span>
              <span className="map-chip chip-f">Control</span>
            </div>
          </div>
        </section>

        <section className="services-page-cta section-shell" id="audit">
          <div className="cta-content reveal">
            <p className="eyebrow">Systems Audit</p>
            <h2>Let's find the system your business is missing.</h2>
            <p>
              Trexiti reviews your current workflows, identifies operational bottlenecks, and shows where software, automation, dashboards, and AI
              can improve how your company runs.
            </p>
            <a className="button button-primary" href="mailto:hello@trexiti.com?subject=Trexiti%20Systems%20Audit">
              Book a Systems Audit
            </a>
          </div>

          <div className="cta-console reveal">
            <div className="dashboard-topbar">
              <span />
              <span />
              <span />
              <p>Audit Scope</p>
            </div>
            <div className="audit-signal">
              <strong>Operational friction becomes system architecture.</strong>
              <p>No generic pitch. The audit is designed to clarify what should be automated, connected, built, or redesigned.</p>
            </div>
            <div className="audit-list">
              <span>Workflow review</span>
              <span>Automation map</span>
              <span>Dashboard model</span>
              <span>Build roadmap</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <Brand />
        <p>Engineering Intelligent Systems for the Real World</p>
        <a href="#audit">Book a Systems Audit</a>
      </footer>
    </>
  );
}
