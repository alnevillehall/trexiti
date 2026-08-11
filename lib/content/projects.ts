export const workFilters = [
  "All",
  "Digital Experiences",
  "Business Systems",
  "Custom Software",
  "Platforms",
] as const;

export type WorkFilter = (typeof workFilters)[number];
export type ProjectCategory = Exclude<WorkFilter, "All">;
export type ProjectVisual = "marbella" | "delta" | "aster";

export type ProjectEvidence = {
  label: "Live Website" | "Private Client System" | "Concept Project";
  description: string;
  externalUrl?: string;
  externalLabel?: string;
};

export type ProjectImage = {
  src: string;
  alt: string;
  caption: string;
  representative?: boolean;
};

export type AtlasOperationsDetail = {
  scenarioSources: readonly string[];
  problems: readonly string[];
  objective: string;
  analysisFocus: readonly {
    title: string;
    description: string;
  }[];
  roles: readonly {
    title: string;
    responsibility: string;
  }[];
  modules: readonly string[];
  dashboard: {
    period: string;
    disclosure: string;
    kpis: readonly {
      label: string;
      value: string;
      context: string;
    }[];
    jobStatus: readonly { label: string; value: number }[];
    revenue: readonly { label: string; value: number }[];
    workByEmployee: readonly { label: string; value: number }[];
    inventoryAlerts: readonly {
      item: string;
      status: string;
      level: string;
    }[];
    recentActivity: readonly {
      time: string;
      event: string;
      reference: string;
    }[];
  };
  customerRecord: {
    name: string;
    reference: string;
    contact: readonly { label: string; value: string }[];
    sections: readonly string[];
    activity: readonly { title: string; meta: string }[];
  };
  jobLifecycle: readonly {
    title: string;
    owner: string;
    rule: string;
  }[];
  architectureChain: readonly {
    title: string;
    description: string;
  }[];
  integrations: readonly string[];
  automation: readonly { event: string; action: string }[];
};

export type CaseStudyProject = {
  index: string;
  title: string;
  slug: string;
  year: string;
  industry: string;
  projectType: string;
  descriptor: string;
  category: string;
  categories: readonly ProjectCategory[];
  summary: string;
  visual: ProjectVisual;
  evidence: ProjectEvidence;
  coverImage?: ProjectImage;
  media?: readonly ProjectImage[];
  services: readonly string[];
  technologies: readonly string[];
  overview: readonly string[];
  challenge: readonly string[];
  understandingBusiness: {
    introduction: string;
    findings: readonly {
      title: string;
      description: string;
    }[];
  };
  strategy: {
    statement: string;
    principles: readonly {
      title: string;
      description: string;
    }[];
  };
  architecture: {
    summary: string;
    layers: readonly {
      title: string;
      description: string;
    }[];
  };
  keyFeatures: readonly {
    title: string;
    description: string;
  }[];
  screens: readonly {
    title: string;
    description: string;
    variant: "primary" | "workflow" | "detail";
  }[];
  engineering: readonly string[];
  technicalNotes: readonly string[];
  result: readonly string[];
  concept: boolean;
  disclaimer: string;
  atlasDetail?: AtlasOperationsDetail;
};

export type ProjectSummary = Pick<
  CaseStudyProject,
  | "index"
  | "title"
  | "slug"
  | "year"
  | "industry"
  | "projectType"
  | "descriptor"
  | "category"
  | "categories"
  | "summary"
  | "visual"
  | "evidence"
  | "coverImage"
  | "concept"
>;

const conceptDisclaimer =
  "This concept demonstrates how Trexiti would approach the business, product and system architecture for this type of organization.";

export const projects: readonly CaseStudyProject[] = [
  {
    index: "01",
    title: "Marbella",
    slug: "marbella",
    year: "2026",
    industry: "Property development",
    projectType: "Property Development Website",
    descriptor: "Live Property Website",
    category: "Digital Experience / Property Technology",
    categories: ["Digital Experiences", "Platforms"],
    summary:
      "A live, image-led property website that introduces Marbella Apartments, explains the Long Lane location, presents residences and floor plans, and turns interest into private-viewing enquiries.",
    visual: "marbella",
    evidence: {
      label: "Live Website",
      description:
        "Public website created by Trexiti for Marbella Apartments in Long Lane, Kingston, Jamaica.",
      externalUrl: "https://www.marbellaja.com/",
      externalLabel: "Visit marbellaja.com",
    },
    coverImage: {
      src: "/work/marbella/marbella-exterior.webp",
      alt: "Architectural rendering of the Marbella Apartments exterior against a green hillside.",
      caption: "Marbella Apartments exterior imagery from the live website.",
    },
    media: [
      {
        src: "/work/marbella/marbella-rooftop.webp",
        alt: "Rendered rooftop lounge and terrace at Marbella Apartments.",
        caption: "The rooftop amenity story is part of the live property experience.",
      },
      {
        src: "/work/marbella/marbella-facade.webp",
        alt: "Architectural rendering of the Marbella Apartments facade and landscaped entrance.",
        caption: "Facade imagery supports the development narrative and visual identity.",
      },
    ],
    services: [
      "Experience strategy",
      "Information architecture",
      "Interface design",
      "Responsive development",
      "Content architecture",
      "Enquiry journey design",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "Responsive web",
      "Optimized image delivery",
      "Enquiry forms",
      "WhatsApp handoff",
      "Search metadata",
    ],
    overview: [
      "Marbella is a live digital sales experience for an apartment development in Long Lane, Kingston. It moves from an atmospheric introduction into location context, amenities, residence details, floor plans, a visual gallery, and a private-viewing request.",
      "Trexiti shaped the information hierarchy, responsive interface, image presentation, and conversion journey so the development could feel premium while remaining practical to evaluate.",
    ],
    challenge: [
      "Property developments need to communicate an emotional vision while helping prospective residents and investors evaluate practical information. The experience had to connect place, amenities, residence options, floor plans, availability context, and direct contact without losing its sense of calm.",
      "The design challenge is to preserve a premium atmosphere without making essential information difficult to find or the conversion journey feel aggressive.",
    ],
    understandingBusiness: {
      introduction:
        "Trexiti mapped the questions a prospective buyer would ask, then organized the website around a progressive journey from aspiration to practical evaluation and direct contact.",
      findings: [
        {
          title: "Multiple audiences",
          description:
            "Owner-occupiers, investors, agents, and partners enter with different questions and evidence needs.",
        },
        {
          title: "Long consideration",
          description:
            "The experience must maintain context across repeat visits, document review, comparison, and human follow-up.",
        },
        {
          title: "Living information",
          description:
            "Residences, availability, milestones, and supporting documents need structured ownership and clear update paths.",
        },
      ],
    },
    strategy: {
      statement:
        "Position the website as the digital sales environment for the development: editorial enough to create desire, structured enough to support evaluation, and connected enough to improve every enquiry handoff.",
      principles: [
        {
          title: "Lead with place",
          description:
            "Establish the character, setting, and proposition before asking the audience to process detail.",
        },
        {
          title: "Reveal detail progressively",
          description:
            "Move from development story to residences, specifications, availability, and documents without overwhelming the journey.",
        },
        {
          title: "Carry context forward",
          description:
            "Pass residence interest, audience intent, and source information into the sales workflow with the enquiry.",
        },
      ],
    },
    architecture: {
      summary:
        "The website separates editorial storytelling, structured residence information, gallery media, and enquiry actions while presenting them as one continuous buyer journey.",
      layers: [
        {
          title: "Experience layer",
          description:
            "Editorial pages, residence exploration, location context, investment content, and enquiry journeys.",
        },
        {
          title: "Content layer",
          description:
            "Development information, amenities, residences, specifications, available units, floor plans, and gallery imagery.",
        },
        {
          title: "Commercial layer",
          description:
            "Private-viewing requests, residence interest, direct contact, and WhatsApp conversation paths.",
        },
        {
          title: "Insight layer",
          description:
            "Search metadata, responsive delivery, accessible interactions, and maintainable page structure.",
        },
      ],
    },
    keyFeatures: [
      {
        title: "Development narrative",
        description:
          "An editorial structure for the development, architecture, location, amenities, and lifestyle proposition.",
      },
      {
        title: "Residence explorer",
        description:
          "Structured comparison of residence types, plans, specifications, and availability states.",
      },
      {
        title: "Investor information",
        description:
          "Travel-time context for Manor Park, New Kingston, hospitals, universities, shopping, and the airport.",
      },
      {
        title: "Qualified enquiries",
        description:
          "A focused private-viewing form that captures residence interest and the details needed for follow-up.",
      },
      {
        title: "Sales handoff",
        description:
          "Direct enquiry and WhatsApp paths that move a considered website visit into a human conversation.",
      },
      {
        title: "Content operations",
        description:
          "Clear content groupings for residence types, available units, floor plans, amenities, and contact information.",
      },
    ],
    screens: [
      {
        title: "Development arrival",
        description:
          "An editorial first impression that establishes place, tone, and the central proposition.",
        variant: "primary",
      },
      {
        title: "Residence exploration",
        description:
          "A structured comparison experience for typologies, plans, specifications, and availability.",
        variant: "workflow",
      },
      {
        title: "Investment enquiry",
        description:
          "A focused handoff that preserves the visitor’s context for the sales team.",
        variant: "detail",
      },
    ],
    engineering: [
      "The live website uses a responsive, component-driven presentation that keeps image-rich sections usable across desktop and mobile screens.",
      "Content, floor-plan, gallery, enquiry, and contact sections are deliberately separated so visitors can scan the development or evaluate it in detail without losing their place.",
    ],
    technicalNotes: [
      "Component-driven responsive frontend",
      "Optimized delivery for high-resolution architectural imagery",
      "Structured residence and floor-plan presentation",
      "Keyboard-accessible gallery and enquiry interactions",
      "Direct private-viewing and WhatsApp contact paths",
      "Search and social metadata for the public property website",
    ],
    result: [
      "The delivered website gives Marbella one public experience for its location story, amenities, residences, floor plans, gallery, and private-viewing journey.",
      "The project is live at marbellaja.com. No traffic, sales, or conversion result is stated because those measurements have not been supplied for this case study.",
    ],
    concept: false,
    disclaimer:
      "Live public website created by Trexiti. Architectural imagery belongs to the Marbella project; no commercial performance claim is made.",
  },
  {
    index: "02",
    title: "Delta Appliances",
    slug: "delta-appliances",
    year: "Private",
    industry: "Appliance operations",
    projectType: "Business Operations System",
    descriptor: "Private Operations System",
    category: "Business Systems / Custom Software",
    categories: ["Business Systems", "Custom Software", "Platforms"],
    summary:
      "A private operations system created for Delta Appliances. The public case study explains the systems thinking at a representative level while withholding the live product, business data, integrations, and internal workflows.",
    visual: "delta",
    evidence: {
      label: "Private Client System",
      description:
        "A real operational system created for Delta Appliances. Access, client data, live screens, and implementation details remain private.",
    },
    coverImage: {
      src: "/work/delta-appliances/delta-operations-system.png",
      alt: "Representative dark operations dashboard on a desktop monitor with a field-service tablet beside it.",
      caption:
        "Representative visualization created for this case study; it is not a screenshot of Delta Appliances’ private system.",
      representative: true,
    },
    atlasDetail: {
      scenarioSources: [
        "WhatsApp",
        "Spreadsheets",
        "Calendars",
        "Paper",
        "Accounting software",
        "Employee notes",
        "Email",
      ],
      problems: [
        "Jobs could be forgotten",
        "Follow-ups were inconsistent",
        "Job ownership was unclear",
        "Outstanding invoices were difficult to track",
        "Technician and staff submissions were incomplete",
        "Inventory visibility was poor",
        "Customer information was fragmented",
        "Management lacked operational visibility",
        "Duplicate data entry consumed time",
      ],
      objective: "Create a unified operational system.",
      analysisFocus: [
        {
          title: "Business analysis",
          description:
            "Define how value moves through the organization, where decisions are made, and which failures carry the greatest operational cost.",
        },
        {
          title: "Process mapping",
          description:
            "Trace work from enquiry to payment, including handoffs, exceptions, dependencies, and evidence required at each state.",
        },
        {
          title: "Data architecture",
          description:
            "Establish governed records for customers, jobs, people, inventory, documents, and commercial transactions.",
        },
        {
          title: "Role-based workflows",
          description:
            "Give each role the decisions, permissions, queues, and required actions that match its operational responsibility.",
        },
        {
          title: "Operational visibility",
          description:
            "Turn workflow activity into reliable views of workload, exceptions, revenue, outstanding action, and risk.",
        },
        {
          title: "Automation",
          description:
            "Remove repeat entry and status chasing where deterministic events can trigger safe, visible actions.",
        },
        {
          title: "System integration",
          description:
            "Keep established tools where they add value, with the operational core coordinating data movement and preserving a clear system of record.",
        },
      ],
      roles: [
        {
          title: "Intake",
          responsibility: "Qualify requests and create complete customer and job records.",
        },
        {
          title: "Dispatch",
          responsibility: "Plan work, resolve conflicts, and maintain clear ownership.",
        },
        {
          title: "Field team",
          responsibility: "Execute assigned work and submit required evidence and usage.",
        },
        {
          title: "Finance",
          responsibility: "Control quotes, invoices, receipts, balances, and reconciliation.",
        },
        {
          title: "Management",
          responsibility: "See throughput, exceptions, capacity, revenue, and intervention needs.",
        },
      ],
      modules: [
        "Dashboard",
        "CRM",
        "Customers",
        "Leads",
        "Jobs",
        "Scheduling",
        "Dispatch",
        "Inventory",
        "Quotes",
        "Invoices",
        "Receipts",
        "Payments",
        "Staff",
        "Reporting",
        "Notifications",
        "Documents",
        "Integrations",
      ],
      dashboard: {
        period: "Illustrative operating period / 01–30 Jun",
        disclosure:
          "Sample scenario data created to demonstrate information hierarchy. It is not a client result or performance claim.",
        kpis: [
          { label: "Jobs Completed", value: "42", context: "of 60 active jobs" },
          { label: "Jobs Outstanding", value: "18", context: "5 require action" },
          { label: "Revenue", value: "$128.4k", context: "invoiced this period" },
          { label: "Outstanding Payments", value: "$21.8k", context: "across 11 invoices" },
          { label: "Average Completion Time", value: "2.6d", context: "request to completion" },
        ],
        jobStatus: [
          { label: "New", value: 7 },
          { label: "Scheduled", value: 9 },
          { label: "In progress", value: 6 },
          { label: "Awaiting parts", value: 4 },
          { label: "Completed", value: 18 },
          { label: "Invoiced", value: 11 },
        ],
        revenue: [
          { label: "W1", value: 38 },
          { label: "W2", value: 54 },
          { label: "W3", value: 46 },
          { label: "W4", value: 72 },
          { label: "W5", value: 84 },
          { label: "W6", value: 78 },
          { label: "W7", value: 96 },
          { label: "W8", value: 91 },
        ],
        workByEmployee: [
          { label: "A. Morgan", value: 84 },
          { label: "L. Brown", value: 72 },
          { label: "S. Grant", value: 64 },
          { label: "D. Chen", value: 58 },
          { label: "M. Reid", value: 44 },
        ],
        inventoryAlerts: [
          { item: "Filter assembly / FA-18", status: "Reorder", level: "04 left" },
          { item: "Control relay / CR-09", status: "Reserved", level: "02 free" },
          { item: "Copper fitting / CF-22", status: "Below par", level: "11 left" },
        ],
        recentActivity: [
          { time: "10:42", event: "Completion evidence submitted", reference: "JOB-1048" },
          { time: "10:16", event: "Invoice marked paid", reference: "INV-2207" },
          { time: "09:58", event: "Technician reassigned", reference: "JOB-1053" },
          { time: "09:31", event: "Quote approved", reference: "QTE-1184" },
        ],
      },
      customerRecord: {
        name: "Illustrative Service Account",
        reference: "CUS-00841 / Illustrative account",
        contact: [
          { label: "Primary contact", value: "Sample contact" },
          { label: "Email", value: "operations@example.com" },
          { label: "Telephone", value: "Withheld" },
          { label: "Service sites", value: "3 active locations" },
        ],
        sections: [
          "Contact information",
          "Jobs",
          "Payments",
          "Documents",
          "Communication history",
          "Quotes",
          "Invoices",
          "Notes",
          "Activity",
        ],
        activity: [
          { title: "Preventive service completed", meta: "JOB-1048 / Today, 10:42" },
          { title: "Payment reconciled", meta: "INV-2207 / Today, 10:16" },
          { title: "Site access note added", meta: "Maya Bennett / Yesterday" },
          { title: "Quarterly quote approved", meta: "QTE-1184 / 18 Jun" },
        ],
      },
      jobLifecycle: [
        { title: "New", owner: "Intake", rule: "Customer, site, scope, source, and priority captured." },
        { title: "Scheduled", owner: "Dispatch", rule: "Time window and resource requirements confirmed." },
        { title: "Assigned", owner: "Dispatch", rule: "Accountable team member accepts the work." },
        { title: "In Progress", owner: "Field team", rule: "Work begins with live status and activity history." },
        { title: "Awaiting Parts", owner: "Inventory", rule: "Dependency, expected date, and owner remain visible." },
        { title: "Completed", owner: "Field team", rule: "Checklist, notes, usage, and evidence are submitted." },
        { title: "Invoiced", owner: "Finance", rule: "Approved work produces a traceable commercial record." },
        { title: "Paid", owner: "Finance", rule: "Receipt and payment reconcile to the invoice and job." },
        { title: "Closed", owner: "System", rule: "Required records are complete and reporting is updated." },
      ],
      architectureChain: [
        { title: "Customer", description: "Requests, locations, contacts, context, and communication." },
        { title: "CRM", description: "One governed customer record and relationship history." },
        { title: "Job Management", description: "Scope, state, ownership, activity, evidence, and exceptions." },
        { title: "Scheduling / Staff / Inventory", description: "Coordinated capacity, assignment, availability, and materials." },
        { title: "Finance", description: "Quotes, invoices, payments, receipts, and outstanding balances." },
        { title: "Reporting", description: "Operational measures derived from the underlying workflow." },
      ],
      integrations: [
        "WhatsApp",
        "Email",
        "Accounting",
        "Payments",
        "Calendars",
        "Maps",
        "Cloud storage",
        "APIs / Webhooks",
      ],
      automation: [
        { event: "Job assigned", action: "Notify staff and place work in the correct queue." },
        { event: "Parts required", action: "Reserve available stock or create a purchasing alert." },
        { event: "Work completed", action: "Validate evidence and prepare the invoice workflow." },
        { event: "Payment received", action: "Reconcile the invoice, issue a receipt, and update reporting." },
      ],
    },
    services: [
      "Business systems analysis",
      "Process mapping",
      "Product strategy",
      "UX architecture",
      "System architecture",
      "Application engineering",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "REST APIs",
      "Webhooks",
      "Vercel",
    ],
    overview: [
      "Atlas Operations explores a shared operational platform for a service business that has outgrown coordination through spreadsheets, messaging, calendars, and separate accounting records.",
      "The product model centers every activity on a durable job record, then connects the people, resources, documents, money, and management information needed to move that work from request to completion.",
    ],
    challenge: [
      "Operational complexity grows faster than headcount when customer information, schedules, job status, inventory use, and payment state all live in different places. Teams compensate with repeated entry, status chasing, and knowledge held by individuals.",
      "The core challenge is not drawing a dashboard. It is defining a reliable operating model: states, ownership, exceptions, permissions, and information boundaries that reflect how the business actually works.",
    ],
    understandingBusiness: {
      introduction:
        "Trexiti would study the operation in motion—following work from first request through scheduling, delivery, evidence, invoicing, and management review.",
      findings: [
        {
          title: "Work changes hands",
          description:
            "Every handoff needs an owner, a clear state, required information, and a visible next action.",
        },
        {
          title: "Exceptions are normal",
          description:
            "Rescheduling, missing materials, access issues, approvals, and rework must be modeled rather than hidden.",
        },
        {
          title: "Money follows work",
          description:
            "Quotes, changes, completion evidence, invoices, and payment status need to remain connected to the job.",
        },
      ],
    },
    strategy: {
      statement:
        "Create one operational spine around the job lifecycle, with specialized views for each role and explicit integrations where established tools should remain in place.",
      principles: [
        {
          title: "One record of work",
          description:
            "Customer, scope, status, assignments, materials, evidence, and money remain connected to the same job context.",
        },
        {
          title: "Role-specific clarity",
          description:
            "Dispatch, field staff, finance, and management see the decisions and actions relevant to their responsibilities.",
        },
        {
          title: "Visible exceptions",
          description:
            "The system surfaces blocked work and ownership instead of presenting an artificially clean happy path.",
        },
      ],
    },
    architecture: {
      summary:
        "A modular operations platform keeps core customer and job data central while isolating scheduling, inventory, finance, and reporting into maintainable domain boundaries.",
      layers: [
        {
          title: "Experience layer",
          description:
            "Role-based workspaces for intake, coordination, field delivery, finance, and leadership.",
        },
        {
          title: "Workflow layer",
          description:
            "Job states, assignments, approvals, exception handling, notifications, and activity history.",
        },
        {
          title: "Domain layer",
          description:
            "Customers, jobs, people, inventory, documents, quotes, invoices, and payments.",
        },
        {
          title: "Integration layer",
          description:
            "Accounting, payments, email, calendars, mapping, file storage, APIs, and webhooks.",
        },
      ],
    },
    keyFeatures: [
      {
        title: "Structured intake",
        description:
          "Create a complete work request with customer, location, priority, scope, and supporting information.",
      },
      {
        title: "Planning and dispatch",
        description:
          "Coordinate skills, availability, location, dependencies, and changing priorities.",
      },
      {
        title: "Field workspace",
        description:
          "Give assigned staff the context, checklist, communication, and evidence capture needed to complete work.",
      },
      {
        title: "Inventory movement",
        description:
          "Track planned and actual item use against jobs, people, locations, and purchasing needs.",
      },
      {
        title: "Commercial workflow",
        description:
          "Connect quotes, approved changes, completion, invoicing, receipts, and outstanding balances.",
      },
      {
        title: "Operational reporting",
        description:
          "Build management visibility from governed workflow data rather than disconnected manual summaries.",
      },
    ],
    screens: [
      {
        title: "Operations command",
        description:
          "A role-aware overview of work requiring decisions, coordination, or intervention.",
        variant: "primary",
      },
      {
        title: "Job lifecycle",
        description:
          "One connected record for scope, schedule, assignment, activity, evidence, and commercial status.",
        variant: "workflow",
      },
      {
        title: "Management visibility",
        description:
          "Governed operational reporting focused on throughput, exceptions, workload, and outstanding action.",
        variant: "detail",
      },
    ],
    engineering: [
      "The proposed architecture separates domain rules from interface components and third-party services so the system can evolve without embedding critical logic in individual screens or integrations.",
      "Workflow transitions would be validated on the server, written to an activity history, and protected by role-based permissions. Integrations would use explicit retry, failure, and reconciliation paths.",
    ],
    technicalNotes: [
      "Relational data model centered on customers, jobs, assignments, and transactions",
      "Role and permission model aligned to operational responsibility",
      "Server-validated workflow transitions with auditable activity history",
      "Background processing for notifications and external integrations",
      "Failure queues and reconciliation for consequential data movement",
      "Responsive field experience with constrained-connectivity considerations",
    ],
    result: [
      "The concept demonstrates how a fragmented service operation could be translated into one understandable system boundary with clearer ownership, fewer repeated handoffs, and more trustworthy management information.",
      "No operational improvement is claimed. The proposed model would need to be tested against stakeholder interviews, workflow observation, representative exceptions, and a staged implementation with real teams.",
    ],
    concept: true,
    disclaimer: conceptDisclaimer,
  },
  {
    index: "03",
    title: "Aster Health",
    slug: "aster-health",
    year: "2026",
    industry: "Healthcare services",
    projectType: "Healthcare Platform",
    descriptor: "Healthcare Platform",
    category: "Custom Software / Customer Experience",
    categories: ["Digital Experiences", "Custom Software", "Platforms"],
    summary:
      "A connected healthcare service platform designed around discovery, booking, preparation, patient access, communication, and the administrative work behind care delivery.",
    visual: "aster",
    services: [
      "Service experience strategy",
      "Journey mapping",
      "UX architecture",
      "Platform design",
      "System architecture",
      "Integration planning",
    ],
    technologies: [
      "Next.js",
      "TypeScript",
      "PostgreSQL",
      "Authentication",
      "Scheduling API",
      "Notification services",
      "Cloud infrastructure",
    ],
    overview: [
      "Aster Health explores how a multi-service healthcare organization could connect its public experience and administrative workflows without presenting care as a generic ecommerce journey.",
      "The concept gives patients a clearer path from understanding services to booking and preparation while giving the organization a more structured way to manage requests, schedules, communication, documents, and follow-up.",
    ],
    challenge: [
      "Healthcare journeys involve anxiety, personal information, clinical boundaries, changing schedules, and communication across several roles. A polished booking interface alone does not solve the operational work required to deliver a dependable service.",
      "The system must make the next step clear for patients while protecting sensitive information, preserving administrative control, and respecting the policies and regulatory requirements of the operating jurisdiction.",
    ],
    understandingBusiness: {
      introduction:
        "Trexiti would map the service journey from public information through booking, preparation, arrival, follow-up, and the administrative exceptions surrounding each stage.",
      findings: [
        {
          title: "Clarity reduces friction",
          description:
            "Service fit, preparation, location, timing, cost context, and next steps should be understandable before a request is submitted.",
        },
        {
          title: "Booking has conditions",
          description:
            "Availability, provider rules, prerequisites, approvals, and rescheduling make healthcare scheduling more than a calendar slot.",
        },
        {
          title: "Trust is operational",
          description:
            "Privacy, accurate communication, visible status, and responsible access matter as much as interface polish.",
        },
      ],
    },
    strategy: {
      statement:
        "Design one service journey with clear boundaries between public information, patient-controlled activity, administrative coordination, and any clinical systems that should remain separate.",
      principles: [
        {
          title: "Explain before asking",
          description:
            "Help people understand services, suitability, preparation, and process before collecting information.",
        },
        {
          title: "Design for reassurance",
          description:
            "Use clear status, expectations, and communication to reduce uncertainty across the journey.",
        },
        {
          title: "Protect the boundary",
          description:
            "Collect only necessary information and keep clinical, administrative, and marketing systems deliberately separated.",
        },
      ],
    },
    architecture: {
      summary:
        "A service platform coordinates the public, patient, and administrative experience while integrating selectively with scheduling, communication, payment, and approved record systems.",
      layers: [
        {
          title: "Public experience",
          description:
            "Services, locations, providers, preparation guidance, policies, and accessible booking entry points.",
        },
        {
          title: "Patient access",
          description:
            "Authentication, requests, appointments, documents, payments, preferences, and communication status.",
        },
        {
          title: "Service operations",
          description:
            "Availability, triage rules, assignments, confirmations, changes, administrative tasks, and follow-up.",
        },
        {
          title: "Protected integrations",
          description:
            "Explicit interfaces to scheduling, payments, notifications, and authorized record systems with controlled data scope.",
        },
      ],
    },
    keyFeatures: [
      {
        title: "Service discovery",
        description:
          "Plain-language paths that help people understand options and choose an appropriate next step.",
      },
      {
        title: "Condition-aware booking",
        description:
          "Availability and request flows that account for prerequisites, service rules, and administrative review.",
      },
      {
        title: "Preparation journeys",
        description:
          "Timely instructions, documents, reminders, and confirmations tied to the appointment context.",
      },
      {
        title: "Patient account",
        description:
          "A secure place for appointments, requests, documents, payments, preferences, and communication history.",
      },
      {
        title: "Administrative queues",
        description:
          "Clear ownership for requests that need review, clarification, rescheduling, or follow-up.",
      },
      {
        title: "Communication controls",
        description:
          "Templates, consent, delivery status, and escalation paths for service communications.",
      },
    ],
    screens: [
      {
        title: "Service discovery",
        description:
          "A calm, structured entry point that explains services and routes people toward the right action.",
        variant: "primary",
      },
      {
        title: "Booking journey",
        description:
          "A progressive request flow designed around service rules, clarity, and minimal necessary information.",
        variant: "workflow",
      },
      {
        title: "Patient and operations view",
        description:
          "Connected but permissioned views of appointments, tasks, documents, communication, and status.",
        variant: "detail",
      },
    ],
    engineering: [
      "The proposed technical approach would minimize sensitive data collection, define strict access boundaries, and separate service orchestration from any clinical system of record.",
      "Security, privacy, retention, audit, availability, and regulatory requirements would be defined with qualified stakeholders for the operating jurisdiction before implementation—not inferred from a visual concept.",
    ],
    technicalNotes: [
      "Proposed least-privilege role and permission model",
      "Explicit separation of public, administrative, and protected data domains",
      "Server-side validation for requests, scheduling rules, and state changes",
      "Audit-oriented activity history for consequential administrative actions",
      "Accessible interface targets and plain-language content structure",
      "Jurisdiction-specific security and regulatory review required before build",
    ],
    result: [
      "The concept establishes a credible system direction for joining patient clarity with the administrative coordination behind a healthcare service.",
      "It does not represent a deployed healthcare product or a claim of clinical, regulatory, or commercial outcomes. Those would depend on formal discovery, governance, specialist review, testing, and controlled implementation.",
    ],
    concept: true,
    disclaimer: conceptDisclaimer,
  },
] as const satisfies readonly CaseStudyProject[];

export const projectSummaries: readonly ProjectSummary[] = projects.map(
  ({
    index,
    title,
    slug,
    year,
    industry,
    projectType,
    descriptor,
    category,
    categories,
    summary,
    visual,
    concept,
  }) => ({
    index,
    title,
    slug,
    year,
    industry,
    projectType,
    descriptor,
    category,
    categories,
    summary,
    visual,
    concept,
  }),
);

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getNextProject(slug: string) {
  const currentIndex = projects.findIndex((project) => project.slug === slug);

  if (currentIndex < 0) {
    return undefined;
  }

  return projects[(currentIndex + 1) % projects.length];
}
