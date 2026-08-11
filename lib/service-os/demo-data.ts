import type { IndustryTemplateKey } from "@/lib/service-os/industry-templates";
import { getIndustryTemplate } from "@/lib/service-os/industry-templates";

export type DemoRole =
  | "Platform Owner"
  | "Company Admin"
  | "Dispatcher"
  | "Technician"
  | "Sales"
  | "Accountant";

export type DemoRoleKey =
  | "PLATFORM_OWNER"
  | "COMPANY_ADMIN"
  | "DISPATCHER"
  | "TECHNICIAN"
  | "SALES"
  | "ACCOUNTANT";

export const demoTenant = {
  id: "org-island-cooling",
  name: "Island Cooling & Appliance",
  slug: "island-cooling",
  status: "Trial",
  industryTemplateKey: "appliance-hvac",
  location: "Kingston, Jamaica",
  currency: "JMD",
  timezone: "America/Jamaica",
} as const satisfies {
  id: string;
  name: string;
  slug: string;
  status: string;
  industryTemplateKey: IndustryTemplateKey;
  location: string;
  currency: string;
  timezone: string;
};

export const demoSession = {
  user: {
    id: "user-demo",
    name: "Ari Campbell",
    email: "ari@trexiti.local",
    initials: "AC",
  },
  organization: demoTenant,
  role: "Company Admin" satisfies DemoRole,
  roleKey: "COMPANY_ADMIN" as DemoRoleKey,
  permissions: [
    "customers:manage",
    "jobs:manage",
    "quotes:manage",
    "invoices:view",
    "settings:manage",
  ],
  industryTemplate: getIndustryTemplate(demoTenant.industryTemplateKey),
};

export const dashboardMetrics = [
  {
    label: "Open jobs",
    value: "38",
    helper: "12 scheduled today",
    trend: "+8%",
  },
  {
    label: "Unassigned requests",
    value: "7",
    helper: "Oldest waiting 2h 14m",
    trend: "-3",
  },
  {
    label: "Quote pipeline",
    value: "JMD 4.8M",
    helper: "18 active estimates",
    trend: "+12%",
  },
  {
    label: "Outstanding invoices",
    value: "JMD 2.1M",
    helper: "6 overdue balances",
    trend: "Watch",
  },
];

export const jobBoard = [
  {
    status: "Request intake",
    color: "bg-sky-500",
    jobs: [
      {
        id: "WO-1048",
        title: "AC not cooling",
        customer: "Mona Heights Villas",
        priority: "Urgent",
        window: "Today 10:30 AM",
      },
      {
        id: "WO-1049",
        title: "Washer leaking",
        customer: "Janet Blake",
        priority: "Normal",
        window: "Today 1:00 PM",
      },
    ],
  },
  {
    status: "Technician scheduled",
    color: "bg-indigo-500",
    jobs: [
      {
        id: "WO-1039",
        title: "Preventive maintenance",
        customer: "North Coast Foods",
        priority: "Normal",
        window: "Today 9:00 AM",
      },
      {
        id: "WO-1042",
        title: "Fridge compressor check",
        customer: "Harbour Pharmacy",
        priority: "High",
        window: "Today 2:30 PM",
      },
    ],
  },
  {
    status: "On site",
    color: "bg-emerald-500",
    jobs: [
      {
        id: "WO-1037",
        title: "Mini split service",
        customer: "Orchid Suites",
        priority: "Normal",
        window: "In progress",
      },
    ],
  },
  {
    status: "Awaiting parts or approval",
    color: "bg-amber-500",
    jobs: [
      {
        id: "WO-1026",
        title: "Oven control board",
        customer: "Blue Mountain Cafe",
        priority: "High",
        window: "Quote sent",
      },
    ],
  },
];

export const upcomingSchedule = [
  {
    time: "08:30",
    technician: "Nia Roberts",
    job: "WO-1037",
    area: "New Kingston",
    type: "Maintenance",
  },
  {
    time: "10:30",
    technician: "Dwayne Miller",
    job: "WO-1048",
    area: "Mona",
    type: "Emergency callout",
  },
  {
    time: "13:00",
    technician: "Nia Roberts",
    job: "WO-1049",
    area: "Half Way Tree",
    type: "Diagnostic visit",
  },
  {
    time: "14:30",
    technician: "Andre Lewis",
    job: "WO-1042",
    area: "Downtown",
    type: "Repair",
  },
];

export const recentCustomers = [
  {
    name: "Mona Heights Villas",
    type: "Property manager",
    location: "Mona, Kingston",
    assets: 18,
    balance: "JMD 240,000",
  },
  {
    name: "Harbour Pharmacy",
    type: "Commercial",
    location: "Downtown Kingston",
    assets: 6,
    balance: "JMD 0",
  },
  {
    name: "Janet Blake",
    type: "Residential",
    location: "Half Way Tree",
    assets: 2,
    balance: "JMD 18,500",
  },
];

export const technicianJobs = [
  {
    id: "WO-1037",
    title: "Mini split service",
    customer: "Orchid Suites",
    address: "17 Waterloo Road, Kingston",
    status: "On site",
    checklist: "HVAC diagnostic",
    checklistProgress: 68,
    notes: "Guest rooms 204 and 205 affected. Capture coil photos before cleaning.",
  },
  {
    id: "WO-1049",
    title: "Washer leaking",
    customer: "Janet Blake",
    address: "Half Way Tree",
    status: "Scheduled",
    checklist: "Appliance repair closeout",
    checklistProgress: 0,
    notes: "Customer available after 1 PM. Bring drain hose kit.",
  },
];

export const moduleSummaries = {
  customers: {
    title: "Customers",
    description:
      "Manage residential, commercial, and property-manager accounts with full service history.",
    cta: "Add customer",
    emptyTitle: "No customers match this view",
    emptyDescription:
      "Customer records will connect assets, jobs, quotes, invoices, inventory usage, and reports.",
  },
  jobs: {
    title: "Jobs",
    description:
      "Tenant-scoped job records will become the operating center for requests, dispatch, technician updates, and closeout.",
    cta: "Create job",
    emptyTitle: "No jobs yet",
    emptyDescription:
      "The foundation is ready for job queries that always include the current organization boundary.",
  },
  assets: {
    title: "Assets and equipment",
    description:
      "Configure tenant assets from industry templates without hardcoding trade-specific fields.",
    cta: "Register asset",
    emptyTitle: "No assets registered",
    emptyDescription:
      "Assets must include organizationId so equipment history cannot cross company boundaries.",
  },
  schedule: {
    title: "Scheduling",
    description:
      "Dispatch work by technician, service area, priority, promised window, and status.",
    cta: "Schedule job",
    emptyTitle: "No jobs on this schedule",
    emptyDescription:
      "Scheduling will be built from organization-scoped jobs and technician members.",
  },
  quotes: {
    title: "Quotes and estimates",
    description:
      "Create reusable estimate line items from the price book and convert approved quotes into invoices.",
    cta: "Create quote",
    emptyTitle: "No quotes in this view",
    emptyDescription:
      "Quotes will always be created inside the active organization context.",
  },
  invoices: {
    title: "Invoices",
    description:
      "Issue invoices, monitor balances, and connect payment history back to jobs and customers.",
    cta: "Create invoice",
    emptyTitle: "No invoices found",
    emptyDescription:
      "Invoice defaults come from each tenant's company settings and industry template.",
  },
  inventory: {
    title: "Parts/materials inventory",
    description:
      "Manage parts, materials, stock movements, reorder points, and technician job usage.",
    cta: "Add item",
    emptyTitle: "No inventory items yet",
    emptyDescription:
      "Inventory transactions can be linked to jobs for cost and margin reporting.",
  },
  technicians: {
    title: "Technicians",
    description:
      "Manage technician users, roles, business hours capacity, and field access inside one organization.",
    cta: "Invite technician",
    emptyTitle: "No technicians invited",
    emptyDescription:
      "Technicians are organization members with the TECHNICIAN role and tenant-scoped job visibility.",
  },
  reports: {
    title: "Reports",
    description:
      "Track revenue, job throughput, technician productivity, invoice balances, and customer retention.",
    cta: "Build report",
    emptyTitle: "Reports need live data",
    emptyDescription:
      "Reports must aggregate only records scoped to the active organization.",
  },
  settings: {
    title: "Settings",
    description:
      "Configure company profile, users, roles, industry template, workflow labels, taxes, and notifications.",
    cta: "Update settings",
    emptyTitle: "Settings sections are ready",
    emptyDescription:
      "Settings persist company profile, template choice, currency, taxes, hours, and technician count in CompanySettings.",
  },
} as const;

export type ModuleSlug = keyof typeof moduleSummaries;
