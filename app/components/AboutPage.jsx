"use client";

import { useEffect, useRef, useState } from "react";

const navItems = [
  ["Overview", "#overview"],
  ["PropertyOS", "/propertyos"],
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Process", "/process"],
  ["Contact", "/contact"],
];

const values = [
  ["Intelligence", "Smarter systems for better decisions."],
  ["Execution", "Ideas only matter when they become working systems."],
  ["Innovation", "We build beyond the obvious."],
  ["Clarity", "Good technology should simplify operations, not create more confusion."],
  ["Impact", "Every system should improve how a business actually works."],
];

const infrastructureSignals = ["Real estate operations", "Workflow automation", "AI support", "Dashboards", "Cloud systems", "Data visibility"];

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

export default function AboutPage() {
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

      const count = Math.min(106, Math.max(46, Math.floor(width / 17)));
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        size: index % 8 === 0 ? 2.2 : 1.05 + Math.random() * 1.24,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const drawParticles = (time) => {
      const delta = Math.min(34, time - lastTime || 16);
      lastTime = time;

      context.clearRect(0, 0, width, height);

      const gradient = context.createRadialGradient(width * 0.72, height * 0.2, 0, width * 0.72, height * 0.2, width * 0.72);
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

        <nav className="site-nav" aria-label="About navigation">
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
        <section className="about-product-hero section-shell" id="overview">
          <div className="hero-grid" aria-hidden="true" />
          <div className="orbital-ring ring-one" aria-hidden="true" />
          <div className="orbital-ring ring-two" aria-hidden="true" />

          <div className="about-hero-copy reveal">
            <div className="wordmark-panel">
              <div className="wordmark-icon" aria-hidden="true">
                <span />
              </div>
              <div>
                <p className="eyebrow">About Trexiti</p>
                <p className="wordmark">Real-world intelligent systems</p>
              </div>
            </div>
            <h1>Building the operating systems behind modern business.</h1>
            <p className="hero-subtitle">
              Trexiti was created to help real estate and corporate operators move beyond manual workflows, disconnected tools, and outdated
              processes by building intelligent systems that create clarity, speed, control, and scale.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#audit">
                Book a Systems Audit
              </a>
              <a className="button button-secondary" href="#mission">
                Read the Mission
              </a>
            </div>
          </div>

          <div className="about-infrastructure-wrap reveal" data-tilt>
            <div className="about-infrastructure-panel">
              <div className="dashboard-topbar">
                <span />
                <span />
                <span />
                <p>Trexiti Infrastructure Map</p>
              </div>
              <div className="infrastructure-map" aria-hidden="true">
                <div className="infrastructure-core">
                  <strong>Trexiti</strong>
                  <span>Systems company</span>
                </div>
                {infrastructureSignals.map((signal, index) => (
                  <span className={`infrastructure-chip chip-${index + 1}`} key={signal}>
                    {signal}
                  </span>
                ))}
              </div>
              <div className="infrastructure-proof">
                <article>
                  <span>Focus</span>
                  <strong>Operational clarity</strong>
                </article>
                <article>
                  <span>Method</span>
                  <strong>Practical AI systems</strong>
                </article>
                <article>
                  <span>Direction</span>
                  <strong>Infrastructure for scale</strong>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="about-mission-section section-shell" id="mission">
          <div className="about-statement-card reveal">
            <p className="eyebrow">Our Mission</p>
            <h2>Our Mission</h2>
            <p>
              Trexiti exists to engineer intelligent systems for the real world. We help companies with real assets, revenue pressure, teams, clients,
              owners, and reporting needs turn fragmented operations into connected, automated, and data-driven infrastructure.
            </p>
          </div>
          <div className="about-signal-card reveal">
            <span>01</span>
            <strong>From fragmented work to connected infrastructure.</strong>
          </div>
        </section>

        <section className="about-vision-section section-shell" id="vision">
          <div className="vision-console reveal" data-tilt>
            <div className="dashboard-topbar">
              <span />
              <span />
              <span />
              <p>Future Operating Layer</p>
            </div>
            <div className="vision-grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className="about-statement-card reveal">
            <p className="eyebrow">Our Vision</p>
            <h2>Our Vision</h2>
            <p>
              The future belongs to businesses that can see clearly, move quickly, and adapt intelligently. Trexiti is building toward a future where
              software, automation, dashboards, and AI become the operational backbone of modern real estate and enterprise companies.
            </p>
          </div>
        </section>

        <section className="founder-section section-shell" id="founder">
          <div className="founder-copy reveal">
            <p className="eyebrow">Founder-Led</p>
            <h2>Founder-Led. Systems-Driven.</h2>
            <p>
              Trexiti is led by a builder's mindset: solve real operational problems, design practical technology, and create systems businesses can
              depend on. The company starts with real estate operations because the pain is concrete: properties, owners, tenants, contractors,
              reporting, revenue, and time-sensitive service all need better infrastructure.
            </p>
          </div>
          <div className="founder-principles reveal">
            <article>
              <span>01</span>
              <strong>Build what operations can depend on.</strong>
            </article>
            <article>
              <span>02</span>
              <strong>Make technology practical enough to be used every day.</strong>
            </article>
            <article>
              <span>03</span>
              <strong>Start focused, then expand into broader infrastructure.</strong>
            </article>
          </div>
        </section>

        <section className="values-section section-shell" id="values">
          <div className="section-heading reveal">
            <p className="eyebrow">Values</p>
            <h2>The principles behind the systems.</h2>
          </div>
          <div className="values-grid">
            {values.map(([title, copy], index) => (
              <article className="value-card reveal" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-page-cta section-shell" id="audit">
          <div className="cta-content reveal">
            <p className="eyebrow">Work with Trexiti</p>
            <h2>Work with Trexiti</h2>
            <p>If your business is ready to replace manual chaos with intelligent systems, start with a Systems Audit.</p>
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
              <strong>Manual chaos can become intelligent infrastructure.</strong>
              <p>Trexiti maps the work, identifies friction, and defines the system your business needs next.</p>
            </div>
            <div className="audit-list">
              <span>Workflow clarity</span>
              <span>Automation targets</span>
              <span>Data visibility</span>
              <span>System roadmap</span>
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
