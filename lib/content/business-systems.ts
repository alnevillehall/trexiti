export const businessSystemCapabilities = [
  {
    index: "01",
    title: "CRM Systems",
    description:
      "Manage prospects, customers, communication and sales pipelines from one connected system.",
    domain: "Customer lifecycle",
  },
  {
    index: "02",
    title: "Operations Platforms",
    description:
      "Coordinate work, customers, staff, schedules, tasks and operational activity.",
    domain: "Core operations",
  },
  {
    index: "03",
    title: "Job / Work Order Systems",
    description:
      "Track jobs from request through assignment, execution, completion, invoicing and payment.",
    domain: "Work delivery",
  },
  {
    index: "04",
    title: "Inventory Systems",
    description:
      "Track items, parts, locations, movement, usage, purchasing and stock levels.",
    domain: "Stock control",
  },
  {
    index: "05",
    title: "Sales Systems",
    description:
      "Lead management, quoting, pipeline visibility, follow-up and conversion workflows.",
    domain: "Revenue operations",
  },
  {
    index: "06",
    title: "Finance Operations",
    description:
      "Quotes, invoices, receipts, outstanding balances, payment status and management reporting.",
    domain: "Commercial control",
  },
  {
    index: "07",
    title: "Staff Systems",
    description:
      "Assignments, activity, permissions, workload and operational accountability.",
    domain: "Team coordination",
  },
  {
    index: "08",
    title: "Management Dashboards",
    description:
      "Real-time visibility into performance, revenue, work, customers and operational bottlenecks.",
    domain: "Decision visibility",
  },
  {
    index: "09",
    title: "Customer Portals",
    description:
      "Give customers access to bookings, documents, payments, project progress, requests and communication.",
    domain: "Customer access",
  },
  {
    index: "10",
    title: "Document Systems",
    description:
      "Generate, organize, route and store business documents.",
    domain: "Information control",
  },
] as const;

export const systemsAnalysisSteps = [
  "Stakeholder interviews",
  "Workflow observation",
  "Process mapping",
  "Requirements definition",
  "Bottleneck identification",
  "Data architecture",
  "Permissions and roles",
  "Integration planning",
  "Solution architecture",
] as const;

export const customSystemSignals = [
  "Workflows are unique",
  "Multiple systems need coordination",
  "The business has outgrown generic tools",
  "Operational complexity is increasing",
  "Manual work is expensive",
  "Visibility is poor",
] as const;

export const operatingDomains = [
  "Customers",
  "Sales",
  "Operations",
  "Staff",
  "Inventory",
  "Finance",
  "Reporting",
  "Integrations",
] as const;
