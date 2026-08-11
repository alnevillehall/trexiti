import type {
  JobSource,
  Prisma,
  WorkOrderLifecycle,
  WorkOrderPaymentStatus,
  WorkOrderPriority,
} from "@prisma/client";

import { compactAddress, demoCustomerProfiles } from "@/lib/service-os/customers";
import { slugify } from "@/lib/service-os/assets";

export type StatusTone = "neutral" | "blue" | "green" | "amber" | "red";

export const defaultWorkOrderStatuses = [
  status("New Request", "new-request", "REQUESTED", "#2563eb", {
    isDefault: true,
  }),
  status("Needs Assessment", "needs-assessment", "REQUESTED", "#0ea5e9"),
  status("Scheduled", "scheduled", "SCHEDULED", "#4f46e5"),
  status("Assigned", "assigned", "SCHEDULED", "#7c3aed"),
  status("Technician En Route", "technician-en-route", "SCHEDULED", "#0891b2"),
  status("In Progress", "in-progress", "IN_PROGRESS", "#059669"),
  status("Awaiting Quote Approval", "awaiting-quote-approval", "ON_HOLD", "#d97706"),
  status("Awaiting Parts", "awaiting-parts", "ON_HOLD", "#f59e0b"),
  status("Completed", "completed", "COMPLETED", "#16a34a", {
    isTerminal: true,
  }),
  status("Invoiced", "invoiced", "COMPLETED", "#0f766e"),
  status("Paid", "paid", "COMPLETED", "#15803d", {
    isTerminal: true,
  }),
  status("Cancelled", "cancelled", "CANCELLED", "#64748b", {
    isTerminal: true,
  }),
] as const;

export const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
  { value: "EMERGENCY", label: "Emergency" },
] as const;

export const jobSourceOptions = [
  { value: "PHONE", label: "Phone" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "REPEAT_CUSTOMER", label: "Repeat customer" },
  { value: "OTHER", label: "Other" },
] as const;

export const paymentStatusOptions = [
  { value: "NOT_INVOICED", label: "Not invoiced" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
] as const;

export const smartFilterOptions = [
  { value: "unassigned", label: "Unassigned" },
  { value: "overdue", label: "Overdue" },
  { value: "awaiting-parts", label: "Awaiting parts" },
  { value: "awaiting-quote-approval", label: "Awaiting quote approval" },
  { value: "completed-not-invoiced", label: "Completed not invoiced" },
  { value: "invoiced-unpaid", label: "Invoiced unpaid" },
] as const;

export type SmartFilterValue = (typeof smartFilterOptions)[number]["value"];
export type PriorityValue = (typeof priorityOptions)[number]["value"];
export type JobSourceValue = (typeof jobSourceOptions)[number]["value"];
export type PaymentStatusValue = (typeof paymentStatusOptions)[number]["value"];

export type WorkOrderStatusOption = {
  id?: string;
  name: string;
  slug: string;
  lifecycle: WorkOrderLifecycle;
  color?: string | null;
  sortOrder: number;
  isDefault?: boolean;
  isTerminal?: boolean;
};

export type JobFilters = {
  q?: string;
  status?: string;
  priority?: string;
  payment?: string;
  smart?: SmartFilterValue | string;
};

export type JobListRow = {
  id: string;
  number: string;
  title: string;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  location: string;
  assetName?: string | null;
  serviceCategory: string;
  jobType?: string | null;
  priority: WorkOrderPriority;
  statusName: string;
  statusSlug: string;
  statusLifecycle: WorkOrderLifecycle;
  statusColor?: string | null;
  scheduledStart?: string | Date | null;
  scheduledEnd?: string | Date | null;
  preferredStart?: string | Date | null;
  preferredEnd?: string | Date | null;
  assignedTechnicians: string[];
  paymentStatus: WorkOrderPaymentStatus;
  source: JobSource;
  hasQuote: boolean;
  hasInvoice: boolean;
  balanceDue: number;
  isOverdue: boolean;
};

export type JobProfile = JobListRow & {
  description?: string | null;
  customerComplaint?: string | null;
  internalNotes?: string | null;
  requestedAt: string | Date;
  completedAt?: string | Date | null;
  estimatedDurationMin?: number | null;
  createdBy?: string | null;
  customer: {
    id: string;
    name: string;
    primaryName?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    type: string;
  };
  customerLocation?: {
    id: string;
    label: string;
    address: string;
    mapUrl?: string | null;
    accessNotes?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    securityNotes?: string | null;
    preferredTimes?: string | null;
  } | null;
  asset?: {
    id: string;
    name: string;
    assetType: string;
    manufacturer?: string | null;
    modelNumber?: string | null;
    serialNumber?: string | null;
    warrantyStatus?: string | null;
    lastServiceAt?: string | Date | null;
  } | null;
  assignments: {
    id: string;
    technicianName: string;
    technicianPhone?: string | null;
    status: string;
    assignedAt: string | Date;
  }[];
  checklist: {
    id: string;
    name: string;
    items: {
      id: string;
      label: string;
      type: string;
      required: boolean;
      response?: string | null;
      note?: string | null;
      completedAt?: string | Date | null;
    }[];
  } | null;
  notes: {
    id: string;
    body: string;
    pinned: boolean;
    createdAt: string | Date;
  }[];
  attachments: {
    id: string;
    fileName: string;
    mimeType: string;
    url: string;
    createdAt: string | Date;
  }[];
  quotes: {
    id: string;
    number: string;
    title: string;
    status: string;
    total: number;
  }[];
  invoices: {
    id: string;
    number: string;
    status: string;
    total: number;
    balanceDue: number;
  }[];
  activity: {
    id: string;
    action: string;
    message?: string | null;
    createdAt: string | Date;
  }[];
};

export type JobCustomerOption = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  locations: {
    id: string;
    label: string;
    address: string;
    city?: string | null;
    parish?: string | null;
  }[];
  assets: {
    id: string;
    name: string;
    locationId: string;
    assetType?: string | null;
  }[];
};

export type ServiceCategoryOption = {
  id?: string;
  name: string;
  slug: string;
};

export type JobTypeOption = {
  name: string;
  slug: string;
  defaultDurationMin?: number | null;
};

export type TechnicianOption = {
  id: string;
  name: string;
  phone?: string | null;
  serviceArea?: string | null;
};

export type JobFormOptions = {
  customers: JobCustomerOption[];
  serviceCategories: ServiceCategoryOption[];
  jobTypes: JobTypeOption[];
  statuses: WorkOrderStatusOption[];
  technicians: TechnicianOption[];
};

export function priorityLabel(value: string) {
  return priorityOptions.find((priority) => priority.value === value)?.label ?? value;
}

export function priorityTone(value: string): StatusTone {
  switch (value) {
    case "EMERGENCY":
    case "URGENT":
      return "red";
    case "HIGH":
      return "amber";
    case "NORMAL":
      return "blue";
    default:
      return "neutral";
  }
}

export function paymentStatusLabel(value: string) {
  return paymentStatusOptions.find((statusOption) => statusOption.value === value)?.label ?? value;
}

export function paymentStatusTone(value: string): StatusTone {
  switch (value) {
    case "PAID":
      return "green";
    case "PARTIALLY_PAID":
      return "amber";
    case "INVOICED":
      return "blue";
    default:
      return "neutral";
  }
}

export function sourceLabel(value: string) {
  return jobSourceOptions.find((sourceOption) => sourceOption.value === value)?.label ?? value;
}

export function statusTone(lifecycle: string, slug?: string): StatusTone {
  if (slug === "cancelled" || lifecycle === "CANCELLED") {
    return "red";
  }

  if (lifecycle === "COMPLETED") {
    return "green";
  }

  if (lifecycle === "ON_HOLD") {
    return "amber";
  }

  if (lifecycle === "IN_PROGRESS" || lifecycle === "SCHEDULED") {
    return "blue";
  }

  return "neutral";
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatTimeWindow(
  start?: string | Date | null,
  end?: string | Date | null,
) {
  if (!start) {
    return "No time set";
  }

  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;

  if (!endDate || Number.isNaN(endDate.getTime())) {
    return formatDateTime(startDate);
  }

  const datePart = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(startDate);
  const timePart = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).formatRange(startDate, endDate);

  return `${datePart}, ${timePart}`;
}

export function formatDuration(minutes?: number | null) {
  if (!minutes) {
    return "Not estimated";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function isJobOverdue(job: {
  statusLifecycle: WorkOrderLifecycle | string;
  scheduledStart?: string | Date | null;
  preferredStart?: string | Date | null;
}) {
  if (["COMPLETED", "CANCELLED"].includes(job.statusLifecycle)) {
    return false;
  }

  const due = job.scheduledStart ?? job.preferredStart;

  if (!due) {
    return false;
  }

  const dueDate = typeof due === "string" ? new Date(due) : due;
  return dueDate.getTime() < Date.now();
}

export function filterDemoJobs(filters: JobFilters) {
  const q = filters.q?.trim().toLowerCase();

  return demoJobRows.filter((job) => {
    const matchesQuery = q
      ? [
          job.number,
          job.title,
          job.customerName,
          job.location,
          job.assetName,
          job.serviceCategory,
          job.assignedTechnicians.join(" "),
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(q))
      : true;
    const matchesStatus =
      filters.status && filters.status !== "all" ? job.statusSlug === filters.status : true;
    const matchesPriority =
      filters.priority && filters.priority !== "all" ? job.priority === filters.priority : true;
    const matchesPayment =
      filters.payment && filters.payment !== "all" ? job.paymentStatus === filters.payment : true;

    return (
      matchesQuery &&
      matchesStatus &&
      matchesPriority &&
      matchesPayment &&
      matchesSmartFilter(job, filters.smart)
    );
  });
}

export function getDemoJobProfile(id: string) {
  return demoJobProfiles.find((job) => job.id === id) ?? null;
}

export function getDemoJobFormOptions(): JobFormOptions {
  return {
    customers: demoCustomerProfiles.map((customer) => ({
      id: customer.id,
      name: customer.displayName,
      phone: customer.phone,
      email: customer.email,
      locations: customer.locations.map((location) => ({
        id: location.id,
        label: location.label,
        address: compactAddress(location),
        city: location.city,
        parish: location.parish,
      })),
      assets: customer.assets.map((asset) => ({
        id: asset.id,
        name: asset.name,
        locationId: `${customer.id}-main-site`,
        assetType: asset.name,
      })),
    })),
    serviceCategories: [
      "AC repair",
      "AC servicing",
      "Refrigerator repair",
      "Preventive maintenance",
    ].map((name) => ({ name, slug: slugify(name) })),
    jobTypes: [
      { name: "Diagnostic visit", slug: "diagnostic-visit", defaultDurationMin: 90 },
      { name: "Repair", slug: "repair", defaultDurationMin: 120 },
      { name: "Preventive maintenance", slug: "preventive-maintenance", defaultDurationMin: 90 },
      { name: "Emergency callout", slug: "emergency-callout", defaultDurationMin: 120 },
    ],
    statuses: [...defaultWorkOrderStatuses],
    technicians: demoTechnicians,
  };
}

export function defaultStatusBySlug(slug: string) {
  return defaultWorkOrderStatuses.find((statusOption) => statusOption.slug === slug);
}

export function decimalToNumber(value: number | Prisma.Decimal | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (!value) {
    return 0;
  }

  return Number(value.toString());
}

function status(
  name: string,
  slug: string,
  lifecycle: WorkOrderLifecycle,
  color: string,
  options: { isDefault?: boolean; isTerminal?: boolean } = {},
) {
  return {
    name,
    slug,
    lifecycle,
    color,
    sortOrder: defaultSortOrder(slug),
    isDefault: options.isDefault ?? false,
    isTerminal: options.isTerminal ?? false,
  };
}

function defaultSortOrder(slug: string) {
  const index = [
    "new-request",
    "needs-assessment",
    "scheduled",
    "assigned",
    "technician-en-route",
    "in-progress",
    "awaiting-quote-approval",
    "awaiting-parts",
    "completed",
    "invoiced",
    "paid",
    "cancelled",
  ].indexOf(slug);

  return index === -1 ? 100 : index;
}

function matchesSmartFilter(job: JobListRow, smart?: string) {
  switch (smart) {
    case "unassigned":
      return job.assignedTechnicians.length === 0;
    case "overdue":
      return job.isOverdue;
    case "awaiting-parts":
      return job.statusSlug === "awaiting-parts";
    case "awaiting-quote-approval":
      return job.statusSlug === "awaiting-quote-approval";
    case "completed-not-invoiced":
      return job.statusLifecycle === "COMPLETED" && !job.hasInvoice;
    case "invoiced-unpaid":
      return job.hasInvoice && job.balanceDue > 0;
    default:
      return true;
  }
}

const demoTechnicians: TechnicianOption[] = [
  {
    id: "tech-nia-roberts",
    name: "Nia Roberts",
    phone: "+18765550177",
    serviceArea: "Kingston and St. Andrew",
  },
  {
    id: "tech-dwayne-miller",
    name: "Dwayne Miller",
    phone: "+18765550178",
    serviceArea: "Portmore and Spanish Town",
  },
];

export const demoJobRows: JobListRow[] = [
  demoJob({
    id: "cust-mona-villas-wo-open",
    number: "WO-AH1048",
    title: "AC not cooling",
    customerId: "cust-mona-villas",
    customerName: "Mona Heights Villas",
    customerPhone: "+18765550118",
    location: "42 Skyline Drive, Mona, Kingston",
    assetName: "Lobby commercial AC",
    serviceCategory: "AC repair",
    jobType: "Diagnostic visit",
    priority: "URGENT",
    statusSlug: "in-progress",
    scheduledStart: "2026-07-01T10:30:00-05:00",
    scheduledEnd: "2026-07-01T12:00:00-05:00",
    assignedTechnicians: ["Dwayne Miller"],
    paymentStatus: "PARTIALLY_PAID",
    source: "WHATSAPP",
    hasQuote: true,
    hasInvoice: true,
    balanceDue: 240000,
  }),
  demoJob({
    id: "cust-janet-blake-wo-open",
    number: "WO-AH1049",
    title: "Washer leaking",
    customerId: "cust-janet-blake",
    customerName: "Janet Blake",
    customerPhone: "8765550124",
    location: "9 Waterloo Road, Kingston",
    assetName: "Laundry room washer",
    serviceCategory: "Washing machine repair",
    jobType: "Repair",
    priority: "NORMAL",
    statusSlug: "assigned",
    scheduledStart: "2026-07-01T13:00:00-05:00",
    scheduledEnd: "2026-07-01T14:30:00-05:00",
    assignedTechnicians: ["Nia Roberts"],
    paymentStatus: "NOT_INVOICED",
    source: "PHONE",
    hasQuote: false,
    hasInvoice: false,
    balanceDue: 0,
  }),
  demoJob({
    id: "cust-harbour-pharmacy-wo-awaiting-parts",
    number: "WO-AH1050",
    title: "Fridge compressor check",
    customerId: "cust-harbour-pharmacy",
    customerName: "Harbour Pharmacy",
    customerPhone: "+18765550131",
    location: "17 Harbour Street, Kingston",
    assetName: "Commercial AC",
    serviceCategory: "Refrigerator repair",
    jobType: "Diagnostic visit",
    priority: "HIGH",
    statusSlug: "awaiting-parts",
    scheduledStart: "2026-06-30T14:30:00-05:00",
    scheduledEnd: "2026-06-30T16:00:00-05:00",
    assignedTechnicians: ["Nia Roberts"],
    paymentStatus: "NOT_INVOICED",
    source: "REPEAT_CUSTOMER",
    hasQuote: false,
    hasInvoice: false,
    balanceDue: 0,
  }),
  demoJob({
    id: "cust-north-coast-foods-wo-quote",
    number: "WO-AH1051",
    title: "Oven control board",
    customerId: "cust-north-coast-foods",
    customerName: "North Coast Foods",
    customerPhone: "+18765550162",
    location: "Bogue Industrial Estate, Montego Bay",
    assetName: "Refrigerator",
    serviceCategory: "Stove/oven repair",
    jobType: "Repair",
    priority: "HIGH",
    statusSlug: "awaiting-quote-approval",
    scheduledStart: "2026-06-29T09:00:00-05:00",
    scheduledEnd: "2026-06-29T11:00:00-05:00",
    assignedTechnicians: ["Dwayne Miller"],
    paymentStatus: "NOT_INVOICED",
    source: "REFERRAL",
    hasQuote: true,
    hasInvoice: false,
    balanceDue: 0,
  }),
  demoJob({
    id: "cust-seaview-landlord-wo-unassigned",
    number: "WO-AH1052",
    title: "Preventive inspection request",
    customerId: "cust-seaview-landlord",
    customerName: "Seaview Rentals",
    customerPhone: "+18765550146",
    location: "Lot 6 Coral Gardens, Montego Bay",
    assetName: "Split AC",
    serviceCategory: "Preventive maintenance",
    jobType: "Preventive maintenance",
    priority: "NORMAL",
    statusSlug: "new-request",
    preferredStart: "2026-06-30T09:00:00-05:00",
    preferredEnd: "2026-06-30T12:00:00-05:00",
    assignedTechnicians: [],
    paymentStatus: "NOT_INVOICED",
    source: "WEBSITE",
    hasQuote: false,
    hasInvoice: false,
    balanceDue: 0,
  }),
  demoJob({
    id: "cust-mona-villas-wo-complete",
    number: "WO-AH1018",
    title: "Preventive service visit",
    customerId: "cust-mona-villas",
    customerName: "Mona Heights Villas",
    customerPhone: "+18765550118",
    location: "42 Skyline Drive, Mona, Kingston",
    assetName: "Lobby commercial AC",
    serviceCategory: "Preventive maintenance",
    jobType: "Preventive maintenance",
    priority: "NORMAL",
    statusSlug: "completed",
    scheduledStart: "2026-06-20T09:00:00-05:00",
    scheduledEnd: "2026-06-20T10:30:00-05:00",
    assignedTechnicians: ["Nia Roberts"],
    paymentStatus: "NOT_INVOICED",
    source: "REPEAT_CUSTOMER",
    hasQuote: false,
    hasInvoice: false,
    balanceDue: 0,
  }),
];

const demoJobProfiles: JobProfile[] = demoJobRows.map((job) => ({
  ...job,
  description: `${job.title} for ${job.customerName}.`,
  customerComplaint:
    job.statusSlug === "awaiting-parts"
      ? "Technician identified a failed component and needs parts before completion."
      : "Customer reported the issue by phone or WhatsApp and requested the earliest available visit.",
  internalNotes:
    job.assignedTechnicians.length > 0
      ? "Confirm arrival update and close out checklist before billing."
      : "Dispatcher needs to assign a technician and confirm the service window.",
  requestedAt: "2026-06-25T14:00:00-05:00",
  completedAt: job.statusSlug === "completed" ? "2026-06-20T10:30:00-05:00" : null,
  estimatedDurationMin: job.jobType?.includes("Preventive") ? 90 : 120,
  createdBy: "Ari Campbell",
  customer: {
    id: job.customerId,
    name: job.customerName,
    primaryName: demoCustomerProfiles.find((customer) => customer.id === job.customerId)?.primaryName,
    phone: job.customerPhone,
    whatsapp: job.customerPhone,
    email: demoCustomerProfiles.find((customer) => customer.id === job.customerId)?.email,
    type: demoCustomerProfiles.find((customer) => customer.id === job.customerId)?.type ?? "RESIDENTIAL",
  },
  customerLocation: {
    id: `${job.customerId}-main-site`,
    label: "Main site",
    address: job.location,
    mapUrl: "https://maps.google.com",
    accessNotes: "Call 20 minutes before arrival.",
    contactName: demoCustomerProfiles.find((customer) => customer.id === job.customerId)?.primaryName,
    contactPhone: job.customerPhone,
    securityNotes: job.customerName.includes("Villas") ? "Security gate requires visitor log." : null,
    preferredTimes: "Weekdays, 9:00 AM to 3:00 PM",
  },
  asset: job.assetName
    ? {
        id: `${job.customerId}-asset-1`,
        name: job.assetName,
        assetType: job.assetName.includes("AC") ? "Split AC" : "Equipment",
        manufacturer: job.assetName.includes("AC") ? "Carrier" : "Whirlpool",
        modelNumber: "DEMO-2048",
        serialNumber: "SN-DEMO-2048",
        warrantyStatus: "Under warranty",
        lastServiceAt: "2026-06-20T10:30:00-05:00",
      }
    : null,
  assignments: job.assignedTechnicians.map((technician, index) => ({
    id: `${job.id}-assignment-${index}`,
    technicianName: technician,
    technicianPhone: demoTechnicians[index]?.phone,
    status: job.statusSlug === "in-progress" ? "ACCEPTED" : "ASSIGNED",
    assignedAt: "2026-06-30T16:00:00-05:00",
  })),
  checklist: {
    id: `${job.id}-checklist`,
    name: job.serviceCategory.includes("AC") ? "AC service closeout" : "Service visit checklist",
    items: [
      {
        id: `${job.id}-check-1`,
        label: "Confirm customer complaint and asset details",
        type: "BOOLEAN",
        required: true,
        response: job.statusLifecycle === "REQUESTED" ? null : "PASS",
        completedAt: job.statusLifecycle === "REQUESTED" ? null : "2026-07-01T10:45:00-05:00",
      },
      {
        id: `${job.id}-check-2`,
        label: "Capture before photos",
        type: "PHOTO",
        required: true,
        response: job.statusSlug === "completed" ? "PASS" : null,
      },
      {
        id: `${job.id}-check-3`,
        label: "Record diagnosis and recommended next action",
        type: "TEXT",
        required: true,
        response: job.statusSlug === "awaiting-parts" ? "FAIL" : null,
        note: job.statusSlug === "awaiting-parts" ? "Replacement part required." : null,
      },
    ],
  },
  notes: [
    {
      id: `${job.id}-note-1`,
      body: "Customer prefers WhatsApp updates before technician arrival.",
      pinned: true,
      createdAt: "2026-06-25T14:05:00-05:00",
    },
  ],
  attachments: [
    {
      id: `${job.id}-attachment-1`,
      fileName: "before-photo.jpg",
      mimeType: "image/jpeg",
      url: "https://example.com/before-photo.jpg",
      createdAt: "2026-06-25T14:10:00-05:00",
    },
  ],
  quotes: job.hasQuote
    ? [
        {
          id: `${job.id}-quote`,
          number: "QT-2039",
          title: `${job.title} estimate`,
          status: job.statusSlug === "awaiting-quote-approval" ? "SENT" : "APPROVED",
          total: job.balanceDue || 186000,
        },
      ]
    : [],
  invoices: job.hasInvoice
    ? [
        {
          id: `${job.id}-invoice`,
          number: "INV-3044",
          status: job.balanceDue > 0 ? "PARTIALLY_PAID" : "PAID",
          total: job.balanceDue || 87500,
          balanceDue: job.balanceDue,
        },
      ]
    : [],
  activity: [
    {
      id: `${job.id}-activity-1`,
      action: "job.created",
      message: `${job.number} created from ${sourceLabel(job.source)} request.`,
      createdAt: "2026-06-25T14:00:00-05:00",
    },
    {
      id: `${job.id}-activity-2`,
      action: "job.status_changed",
      message: `Status moved to ${job.statusName}.`,
      createdAt: "2026-06-30T16:00:00-05:00",
    },
  ],
}));

function demoJob(
  input: Omit<JobListRow, "statusName" | "statusLifecycle" | "statusColor" | "isOverdue">,
): JobListRow {
  const statusOption = defaultStatusBySlug(input.statusSlug) ?? defaultWorkOrderStatuses[0];
  const job = {
    ...input,
    statusName: statusOption.name,
    statusLifecycle: statusOption.lifecycle,
    statusColor: statusOption.color,
    isOverdue: false,
  };

  return {
    ...job,
    isOverdue: isJobOverdue(job),
  };
}
