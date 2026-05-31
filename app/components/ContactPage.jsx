"use client";

import { useEffect, useRef, useState } from "react";

const navItems = [
  ["Overview", "#overview"],
  ["PropertyOS", "/propertyos"],
  ["Services", "/services"],
  ["Industries", "/industries"],
  ["Process", "/process"],
  ["About", "/about"],
];

const auditFindings = [
  "Manual processes slowing your team down",
  "Tools that are disconnected",
  "Repetitive tasks that can be automated",
  "Revenue, portfolio, or client data your business is not properly tracking",
  "Customer or tenant communication gaps",
  "Workflow opportunities for custom software",
  "Areas where AI can improve speed, reporting, and visibility",
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

export default function ContactPage() {
  const canvasRef = useRef(null);
  const [navOpen, setNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("#overview");
  const [status, setStatus] = useState("");

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = [
      "Trexiti Systems Audit Request",
      "",
      `Name: ${data.get("name")}`,
      `Company: ${data.get("company")}`,
      `Email: ${data.get("email")}`,
      `Phone / WhatsApp: ${data.get("phone")}`,
      `Industry: ${data.get("industry")}`,
      `Business size: ${data.get("businessSize")}`,
      `Portfolio / company scale: ${data.get("scale")}`,
      `Investment readiness: ${data.get("readiness")}`,
      `Trying to improve: ${data.get("improvement")}`,
      `Interest: ${data.get("interest")}`,
      `Preferred contact method: ${data.get("contactMethod")}`,
    ].join("\n");

    window.location.href = `mailto:hello@trexiti.com?subject=${encodeURIComponent("Trexiti Systems Audit Request")}&body=${encodeURIComponent(body)}`;
    setStatus("Your audit request is ready in your email client.");
  };

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

        <nav className="site-nav" aria-label="Contact navigation">
          {navItems.map(([label, href]) => (
            <a key={href} href={href} className={activeSection === href ? "is-active" : undefined} onClick={() => setNavOpen(false)}>
              {label}
            </a>
          ))}
          <a className="nav-cta" href="#form" onClick={() => setNavOpen(false)}>
            Request Audit
          </a>
        </nav>
      </header>

      <main>
        <section className="contact-hero section-shell" id="overview">
          <div className="hero-grid" aria-hidden="true" />
          <div className="orbital-ring ring-one" aria-hidden="true" />
          <div className="orbital-ring ring-two" aria-hidden="true" />

          <div className="contact-intro reveal" id="audit">
            <div className="wordmark-panel">
              <div className="wordmark-icon" aria-hidden="true">
                <span />
              </div>
              <div>
                <p className="eyebrow">Trexiti Systems Audit</p>
                <p className="wordmark">Operational clarity starts here</p>
              </div>
            </div>
            <h1>Book a Trexiti Systems Audit.</h1>
            <p className="hero-subtitle">
              We'll review your current workflows, identify operational bottlenecks, and show where software, automation, dashboards, and AI can help
              your real estate or corporate operation protect time, revenue, visibility, and service quality.
            </p>
            <div className="trust-copy">
              <strong>Built for serious operators.</strong>
              <span>No generic pitch. The audit is designed to show where your company can operate with more control, clearer reporting, and less manual drag.</span>
            </div>
          </div>

          <div className="contact-panel reveal" id="audit-details">
            <div className="dashboard-topbar">
              <span />
              <span />
              <span />
              <p>Audit Intelligence Map</p>
            </div>
            <div className="contact-system-map" aria-hidden="true">
              <div className="contact-map-core">
                <strong>Audit</strong>
                <span>System opportunities</span>
              </div>
              <span className="contact-map-node node-process">Process</span>
              <span className="contact-map-node node-tools">Tools</span>
              <span className="contact-map-node node-data">Data</span>
              <span className="contact-map-node node-ai">AI</span>
            </div>
            <div className="audit-explainer">
              <h2>A Trexiti Systems Audit helps uncover:</h2>
              <ul>
                {auditFindings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </div>
          </div>

          <form className="audit-form contact-form reveal" id="form" onSubmit={handleSubmit}>
            <div className="form-header">
              <p className="eyebrow">Request Audit</p>
              <h2>Tell us what your business needs to improve.</h2>
            </div>
            <div className="form-grid">
              <label>
                <span>Name</span>
                <input name="name" type="text" placeholder="Your name" required />
              </label>
              <label>
                <span>Company</span>
                <input name="company" type="text" placeholder="Company name" required />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" placeholder="you@company.com" required />
              </label>
              <label>
                <span>Phone / WhatsApp</span>
                <input name="phone" type="tel" placeholder="+1 876 000 0000" />
              </label>
              <label>
                <span>Industry</span>
                <input name="industry" type="text" placeholder="Brokerage, property management, development, corporate..." />
              </label>
              <label>
                <span>Business size</span>
                <select name="businessSize" defaultValue="">
                  <option value="" disabled>
                    Select size
                  </option>
                  <option>1-10 people</option>
                  <option>11-50 people</option>
                  <option>51-200 people</option>
                  <option>200+ people</option>
                </select>
              </label>
              <label>
                <span>Portfolio / company scale</span>
                <input name="scale" type="text" placeholder="Units, listings, properties, locations, or team size" />
              </label>
              <label>
                <span>Investment readiness</span>
                <select name="readiness" defaultValue="">
                  <option value="" disabled>
                    Select readiness
                  </option>
                  <option>Exploring options</option>
                  <option>Ready to scope a system</option>
                  <option>Need urgent operational fix</option>
                  <option>Corporate planning / budget review</option>
                </select>
              </label>
              <label className="form-wide">
                <span>What are you trying to improve?</span>
                <textarea name="improvement" placeholder="Describe the revenue, reporting, property, client, team, or workflow problem you want to improve." />
              </label>
              <label className="form-wide">
                <span>What are you interested in?</span>
                <select name="interest" defaultValue="">
                  <option value="" disabled>
                    Select primary interest
                  </option>
                  <option>PropertyOS</option>
                  <option>Custom software</option>
                  <option>AI automation</option>
                  <option>General tech services</option>
                  <option>Not sure yet</option>
                </select>
              </label>
              <label>
                <span>Preferred contact method</span>
                <select name="contactMethod" defaultValue="">
                  <option value="" disabled>
                    Select method
                  </option>
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                  <option>Video call</option>
                </select>
              </label>
            </div>
            <button className="button button-primary" type="submit">
              Request My Systems Audit
            </button>
            <p className="form-status" aria-live="polite">
              {status}
            </p>
          </form>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <Brand />
        <p>Engineering Intelligent Systems for the Real World</p>
        <a href="#form">Request My Systems Audit</a>
      </footer>
    </>
  );
}
