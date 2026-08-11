export const softwareCategories = [
  {
    index: "01",
    title: "Customer Portals",
    description:
      "Account experiences where customers can access services, documents, payments, requests and information.",
    mode: "Customer access",
  },
  {
    index: "02",
    title: "Internal Applications",
    description:
      "Purpose-built tools for employees and management.",
    mode: "Team operations",
  },
  {
    index: "03",
    title: "Platforms",
    description:
      "Multi-user products connecting customers, providers, businesses or other stakeholders.",
    mode: "Multi-sided product",
  },
  {
    index: "04",
    title: "Booking Systems",
    description:
      "Availability, scheduling, reservations, payments, management and communication.",
    mode: "Transaction flow",
  },
  {
    index: "05",
    title: "Marketplaces",
    description:
      "Discovery, profiles, listings, transactions, administration and operational workflows.",
    mode: "Exchange platform",
  },
  {
    index: "06",
    title: "Dashboards",
    description:
      "Operational, financial, customer and performance visibility.",
    mode: "Decision support",
  },
  {
    index: "07",
    title: "Workflow Applications",
    description:
      "Applications that coordinate complex multi-stage processes.",
    mode: "Process orchestration",
  },
] as const;

export const engineeringDisciplines = [
  {
    index: "01",
    title: "Define",
    description: "Turn the business objective into a product model.",
    items: ["Product discovery", "UX architecture", "System architecture"],
  },
  {
    index: "02",
    title: "Engineer",
    description: "Build the application, rules, identities, and data foundation.",
    items: [
      "Database architecture",
      "API development",
      "Authentication",
      "Roles / permissions",
    ],
  },
  {
    index: "03",
    title: "Connect",
    description: "Make the product useful inside the wider technology estate.",
    items: [
      "Third-party integrations",
      "Payments",
      "Notifications",
      "Analytics",
    ],
  },
  {
    index: "04",
    title: "Operate",
    description: "Release it reliably and understand how it behaves in use.",
    items: ["Deployment", "Monitoring"],
  },
] as const;

export const architectureLayers = [
  {
    index: "01",
    label: "People",
    value: "Customers / staff / operators",
  },
  {
    index: "02",
    label: "Experience",
    value: "Portal / workflow / product",
  },
  {
    index: "03",
    label: "Application",
    value: "Logic / permissions / states",
  },
  {
    index: "04",
    label: "Services",
    value: "APIs / integrations / payments",
  },
  {
    index: "05",
    label: "Data",
    value: "Structure / events / analytics",
  },
  {
    index: "06",
    label: "Runtime",
    value: "Deployment / monitoring",
  },
] as const;

export const durableProductConcerns = [
  {
    title: "Maintainability",
    description: "Clear boundaries and code that can be understood, changed, and extended.",
  },
  {
    title: "Scalability",
    description: "Architecture that can grow with users, data, transactions, and product scope.",
  },
  {
    title: "Permissions",
    description: "Roles and access rules designed around real responsibilities.",
  },
  {
    title: "Security",
    description: "Responsible identity, data protection, and operational safeguards.",
  },
  {
    title: "Data Structure",
    description: "A durable information model that supports the product beyond today’s screens.",
  },
  {
    title: "Future Integrations",
    description: "Interfaces and boundaries that keep new connections possible.",
  },
  {
    title: "Administrative Workflows",
    description: "The controls, exceptions, and support tools needed behind the customer experience.",
  },
  {
    title: "Operational Support",
    description: "Monitoring, ownership, and practical paths for resolving issues after launch.",
  },
] as const;

export const softwareDevelopmentProcess = [
  {
    title: "Discover",
    description: "Understand the problem, users, business model, constraints, and evidence.",
  },
  {
    title: "Scope",
    description: "Define the product boundary, critical journeys, requirements, and release strategy.",
  },
  {
    title: "Prototype",
    description: "Make the riskiest interactions and assumptions tangible before full engineering.",
  },
  {
    title: "Engineer",
    description: "Build the experience, application, data, integrations, and operational controls.",
  },
  {
    title: "Test",
    description: "Validate behavior, usability, permissions, performance, and failure paths.",
  },
  {
    title: "Launch",
    description: "Release deliberately with deployment, migration, monitoring, and team readiness.",
  },
  {
    title: "Iterate",
    description: "Use real product and operational evidence to decide what should improve next.",
  },
] as const;
