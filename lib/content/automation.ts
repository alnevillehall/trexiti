export const automationUseCases = [
  {
    index: "01",
    trigger: "Lead arrives",
    steps: [
      "CRM record created",
      "Sales team notified",
      "Follow-up scheduled",
    ],
  },
  {
    index: "02",
    trigger: "Job completed",
    steps: [
      "Invoice generated",
      "Customer notified",
      "Payment tracked",
      "Dashboard updated",
    ],
  },
  {
    index: "03",
    trigger: "Booking confirmed",
    steps: [
      "Calendar updated",
      "Customer confirmation sent",
      "Internal team notified",
    ],
  },
  {
    index: "04",
    trigger: "Payment received",
    steps: [
      "Invoice marked paid",
      "Receipt generated",
      "Accounting updated",
    ],
  },
  {
    index: "05",
    trigger: "Customer submits request",
    steps: [
      "Case created",
      "Responsible employee assigned",
      "Status tracked",
    ],
  },
] as const;

export const integrationTypes = [
  "Payments",
  "Email",
  "WhatsApp",
  "Calendars",
  "CRM",
  "Accounting",
  "Maps",
  "Cloud storage",
  "Analytics",
  "Authentication",
  "External APIs",
  "Webhooks",
] as const;

export const automationMethod = [
  {
    index: "01",
    title: "Understand the workflow",
    description:
      "Trace the real sequence, ownership, decisions, exceptions, and business outcome before changing it.",
  },
  {
    index: "02",
    title: "Identify repetitive actions",
    description:
      "Find the manual steps that are frequent, rule-based, slow, or vulnerable to avoidable error.",
  },
  {
    index: "03",
    title: "Determine the system of record",
    description:
      "Define where the authoritative customer, job, payment, or operational state must live.",
  },
  {
    index: "04",
    title: "Design the automation",
    description:
      "Specify triggers, rules, data movement, actions, timing, ownership, and the expected result.",
  },
  {
    index: "05",
    title: "Handle failure states",
    description:
      "Plan for missing data, unavailable services, duplicates, rejected actions, and safe retries.",
  },
  {
    index: "06",
    title: "Log activity",
    description:
      "Keep a visible operational record of what ran, what changed, and where attention is needed.",
  },
  {
    index: "07",
    title: "Allow human intervention",
    description:
      "Give the team a clear way to review, approve, correct, pause, or resume consequential work.",
  },
  {
    index: "08",
    title: "Monitor reliability",
    description:
      "Track execution and failures so the workflow remains dependable as systems and volume change.",
  },
] as const;

export const automationArchitectureStages = [
  ["01", "Event", "A meaningful change starts the workflow."],
  ["02", "Validate", "Required context and data are checked."],
  ["03", "Decide", "Business rules determine the next action."],
  ["04", "Execute", "Connected systems are updated deliberately."],
  ["05", "Record", "The outcome is logged and made visible."],
] as const;

export const reliabilityControls = [
  "Failure queue",
  "Activity log",
  "Human review",
  "Reliability monitoring",
] as const;
