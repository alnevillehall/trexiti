import type { Service } from "@/lib/content/types";

export const engagementShapes = [
  {
    index: "01",
    title: "Focused Build",
    description:
      "One clearly bounded improvement tied to a meaningful business outcome, controlled timeline, and defined revision scope. The boundary is smaller; the standard of analysis, design, and engineering is not.",
    href: "/systems-review",
  },
  {
    index: "02",
    title: "Connected Experience",
    description:
      "A customer-facing website or digital product designed together with the forms, CRM, booking, payment, analytics, and operational handoffs behind it.",
    href: "/services/digital-experiences",
  },
  {
    index: "03",
    title: "Custom System",
    description:
      "Purpose-built software for a distinct operating model, with the workflows, data, permissions, integrations, and controls the business needs to own.",
    href: "/services/business-systems",
  },
  {
    index: "04",
    title: "Systems Partnership",
    description:
      "An ongoing relationship for businesses improving several connected systems over time, guided by operational evidence and a shared roadmap.",
    href: "/start-a-project",
  },
] as const;

export const services = [
  {
    slug: "digital-experiences",
    index: "01",
    title: "Digital Experiences",
    shortTitle: "Experiences",
    summary:
      "Premium websites and digital products that communicate clearly, convert effectively, and strengthen the company's position.",
    proposition:
      "We turn positioning, content, and interaction into a digital experience that helps the right people understand your value and take the next step.",
    capabilities: [
      "Corporate and product websites",
      "Property and development websites",
      "Ecommerce experiences",
      "High-conversion landing experiences",
      "Content systems and design systems",
      "Performance and accessibility engineering",
    ],
    outcomes: [
      "A clearer market position",
      "Higher-quality enquiries",
      "A credible platform for growth",
    ],
    process: [
      {
        title: "Frame the commercial story",
        description:
          "We align audience, positioning, conversion goals, and content before defining screens.",
      },
      {
        title: "Design the experience",
        description:
          "We establish the visual system, interaction model, and responsive content hierarchy.",
      },
      {
        title: "Engineer for longevity",
        description:
          "We build a fast, accessible platform your team can operate and evolve with confidence.",
      },
    ],
  },
  {
    slug: "custom-software",
    index: "02",
    title: "Custom Software",
    shortTitle: "Software",
    summary:
      "Purpose-built applications, portals, dashboards, and platforms built around specific business requirements.",
    proposition:
      "When off-the-shelf software forces the wrong workflow, we design the application around the business instead.",
    capabilities: [
      "Web applications",
      "Customer, vendor, and staff portals",
      "Booking platforms and marketplaces",
      "Management dashboards",
      "Product strategy and prototyping",
      "Application modernization",
    ],
    outcomes: [
      "Software aligned to the operation",
      "Less friction for customers and staff",
      "A maintainable platform that can grow",
    ],
    process: [
      {
        title: "Model the real workflow",
        description:
          "We translate roles, decisions, exceptions, and business rules into a shared system model.",
      },
      {
        title: "Prove the critical path",
        description:
          "We prototype the highest-risk journeys early so the product is useful before it is elaborate.",
      },
      {
        title: "Build in dependable increments",
        description:
          "We ship a secure foundation, validate it with real users, and expand from evidence.",
      },
    ],
  },
  {
    slug: "business-systems",
    index: "03",
    title: "Business Systems",
    shortTitle: "Operations",
    summary:
      "Operational software connecting sales, customers, jobs, inventory, staff, finance, and management reporting.",
    proposition:
      "We make the day-to-day operation visible: the work, ownership, money, exceptions, and decisions leaders need to manage.",
    capabilities: [
      "CRM and customer lifecycle systems",
      "Job and work-order management",
      "Inventory and staff management",
      "Quotations, invoicing, and payments",
      "Scheduling and operations management",
      "Reporting and ERP-style internal systems",
    ],
    outcomes: [
      "One reliable operational record",
      "Clear ownership and fewer missed handoffs",
      "Better visibility for leadership",
    ],
    process: [
      {
        title: "Observe the operation",
        description:
          "We trace how information, work, and responsibility move across the business today.",
      },
      {
        title: "Redesign the system",
        description:
          "We simplify states, approvals, roles, and data before translating them into software.",
      },
      {
        title: "Introduce change deliberately",
        description:
          "We roll out around real teams and processes, with adoption treated as part of the build.",
      },
    ],
  },
  {
    slug: "automation",
    index: "04",
    title: "Automation & Integration",
    shortTitle: "Automation",
    summary:
      "Connect existing tools, remove repetitive work, and create reliable workflows between systems.",
    proposition:
      "We connect the systems your business depends on and automate the repeatable steps that create avoidable delay or error.",
    capabilities: [
      "Workflow and email automation",
      "API and data integrations",
      "Payment and accounting integrations",
      "WhatsApp and calendar integrations",
      "Data synchronization",
      "AI-assisted workflows where useful",
    ],
    outcomes: [
      "Less repetitive administration",
      "Faster, more consistent handoffs",
      "Connected data across core tools",
    ],
    process: [
      {
        title: "Find the right leverage",
        description:
          "We identify high-volume, rule-based work where automation has a clear operational return.",
      },
      {
        title: "Design for exceptions",
        description:
          "We define safeguards, failure paths, and human review before connecting live systems.",
      },
      {
        title: "Measure and improve",
        description:
          "We monitor the workflow, resolve weak points, and extend only where the evidence supports it.",
      },
    ],
  },
] as const satisfies readonly Service[];

export function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}
