import type { Prisma } from "@prisma/client";

export const customerTypes = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "PROPERTY_MANAGER", label: "Property Manager" },
  { value: "LANDLORD", label: "Landlord" },
  { value: "TENANT", label: "Tenant" },
] as const;

export const customerStatuses = [
  { value: "ACTIVE", label: "Active" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export const locationLabels = [
  "Home",
  "Office",
  "Rental property",
  "Airbnb/villa",
  "Commercial site",
  "Branch location",
] as const;

export type CustomerTypeValue = (typeof customerTypes)[number]["value"];
export type CustomerStatusValue = (typeof customerStatuses)[number]["value"];

export type CustomerListRow = {
  id: string;
  displayName: string;
  type: CustomerTypeValue;
  status: CustomerStatusValue;
  primaryName?: string | null;
  phone?: string | null;
  email?: string | null;
  mainLocation?: string | null;
  jobsCount: number;
  outstandingBalance: number;
  lastServiceDate?: string | Date | null;
};

export type CustomerProfile = CustomerListRow & {
  whatsapp?: string | null;
  taxId?: string | null;
  source?: string | null;
  tags: string[];
  notesSummary?: string | null;
  locations: {
    id: string;
    label: string;
    addressLine1: string;
    addressLine2?: string | null;
    city?: string | null;
    parish?: string | null;
    country: string;
    mapUrl?: string | null;
    accessNotes?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    securityNotes?: string | null;
    preferredTimes?: string | null;
  }[];
  assets: {
    id: string;
    name: string;
    manufacturer?: string | null;
    modelNumber?: string | null;
    serialNumber?: string | null;
    status: string;
    locationLabel?: string | null;
  }[];
  jobs: {
    id: string;
    number: string;
    title: string;
    lifecycle: string;
    priority: string;
    requestedAt: string | Date;
    completedAt?: string | Date | null;
  }[];
  quotes: {
    id: string;
    number: string;
    title: string;
    status: string;
    total: number;
    expiresAt?: string | Date | null;
  }[];
  invoices: {
    id: string;
    number: string;
    status: string;
    total: number;
    balanceDue: number;
    issuedAt?: string | Date | null;
  }[];
  payments: {
    id: string;
    status: string;
    method: string;
    amount: number;
    paidAt?: string | Date | null;
    reference?: string | null;
  }[];
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
    sizeBytes?: number | null;
    createdAt: string | Date;
  }[];
  activity: {
    id: string;
    action: string;
    message?: string | null;
    createdAt: string | Date;
  }[];
};

export type CustomerFilters = {
  q?: string;
  type?: string;
  status?: string;
};

export function customerTypeLabel(value: string) {
  return customerTypes.find((type) => type.value === value)?.label ?? value;
}

export function customerStatusLabel(value: string) {
  return customerStatuses.find((status) => status.value === value)?.label ?? value;
}

export function statusTone(value: string) {
  switch (value) {
    case "ACTIVE":
      return "green" as const;
    case "PROSPECT":
      return "blue" as const;
    case "INACTIVE":
      return "amber" as const;
    default:
      return "neutral" as const;
  }
}

export function formatMoney(value: number | Prisma.Decimal | null | undefined, currency: string) {
  const amount =
    typeof value === "number"
      ? value
      : value
        ? Number(value.toString())
        : 0;

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value?: string | Date | null) {
  if (!value) {
    return "No service yet";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatPhone(value?: string | null) {
  if (!value) {
    return "No phone";
  }

  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10 && (digits.startsWith("876") || digits.startsWith("658"))) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return value;
}

export function compactAddress(location?: {
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  parish?: string | null;
  country?: string | null;
} | null) {
  if (!location) {
    return "No location";
  }

  return [location.addressLine1, location.addressLine2, location.city, location.parish]
    .filter(Boolean)
    .join(", ");
}

export function filterDemoCustomers(filters: CustomerFilters) {
  const q = filters.q?.trim().toLowerCase();

  return demoCustomers.filter((customer) => {
    const matchesQuery = q
      ? [
          customer.displayName,
          customer.primaryName,
          customer.phone,
          customer.email,
          customer.mainLocation,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(q))
      : true;
    const matchesType = filters.type && filters.type !== "all"
      ? customer.type === filters.type
      : true;
    const matchesStatus = filters.status && filters.status !== "all"
      ? customer.status === filters.status
      : true;

    return matchesQuery && matchesType && matchesStatus;
  });
}

export function getDemoCustomer(id: string) {
  return demoCustomerProfiles.find((customer) => customer.id === id) ?? null;
}

export const demoCustomers: CustomerListRow[] = [
  {
    id: "cust-mona-villas",
    displayName: "Mona Heights Villas",
    type: "PROPERTY_MANAGER",
    status: "ACTIVE",
    primaryName: "Marsha Lewis",
    phone: "+18765550118",
    email: "facilities@monaheights.example",
    mainLocation: "42 Skyline Drive, Mona, Kingston",
    jobsCount: 14,
    outstandingBalance: 240000,
    lastServiceDate: "2026-06-20",
  },
  {
    id: "cust-janet-blake",
    displayName: "Janet Blake",
    type: "RESIDENTIAL",
    status: "ACTIVE",
    primaryName: "Janet Blake",
    phone: "8765550124",
    email: "janet.blake@example.com",
    mainLocation: "9 Waterloo Road, Kingston",
    jobsCount: 3,
    outstandingBalance: 18500,
    lastServiceDate: "2026-06-10",
  },
  {
    id: "cust-harbour-pharmacy",
    displayName: "Harbour Pharmacy",
    type: "COMMERCIAL",
    status: "ACTIVE",
    primaryName: "Andre Grant",
    phone: "+18765550131",
    email: "admin@harbourpharmacy.example",
    mainLocation: "17 Harbour Street, Kingston",
    jobsCount: 8,
    outstandingBalance: 0,
    lastServiceDate: "2026-05-28",
  },
  {
    id: "cust-seaview-landlord",
    displayName: "Seaview Rentals",
    type: "LANDLORD",
    status: "PROSPECT",
    primaryName: "Devon Clarke",
    phone: "+18765550146",
    email: "devon@seaviewrentals.example",
    mainLocation: "Lot 6 Coral Gardens, Montego Bay",
    jobsCount: 1,
    outstandingBalance: 0,
    lastServiceDate: "2026-04-18",
  },
  {
    id: "cust-north-coast-foods",
    displayName: "North Coast Foods",
    type: "COMMERCIAL",
    status: "ACTIVE",
    primaryName: "Camille Brown",
    phone: "+18765550162",
    email: "maintenance@northcoastfoods.example",
    mainLocation: "Bogue Industrial Estate, Montego Bay",
    jobsCount: 11,
    outstandingBalance: 315000,
    lastServiceDate: "2026-06-25",
  },
];

export const demoCustomerProfiles: CustomerProfile[] = demoCustomers.map((customer) => ({
  ...customer,
  whatsapp: customer.phone,
  taxId: customer.type === "COMMERCIAL" ? "TRN-000-123-456" : null,
  source: "Demo seed",
  tags: customer.type === "COMMERCIAL" ? ["Account terms", "Commercial"] : ["Residential"],
  notesSummary:
    customer.id === "cust-mona-villas"
      ? "Coordinate with security before arrival and call the site contact on entry."
      : "Prefers WhatsApp reminders before technician arrival.",
  locations: [
    {
      id: `${customer.id}-main-site`,
      label: customer.type === "RESIDENTIAL" ? "Home" : "Commercial site",
      addressLine1: customer.mainLocation?.split(",")[0] ?? "Main road",
      city: customer.mainLocation?.includes("Montego") ? "Montego Bay" : "Kingston",
      parish: customer.mainLocation?.includes("Montego") ? "St. James" : "Kingston",
      country: "Jamaica",
      mapUrl: "https://maps.google.com",
      accessNotes: "Call 20 minutes before arrival.",
      contactName: customer.primaryName,
      contactPhone: customer.phone,
      securityNotes: customer.type === "PROPERTY_MANAGER" ? "Security gate requires visitor log." : null,
      preferredTimes: "Weekdays, 9:00 AM to 3:00 PM",
    },
    {
      id: `${customer.id}-secondary-site`,
      label: "Branch location",
      addressLine1: "Secondary service site",
      city: "Kingston",
      parish: "St. Andrew",
      country: "Jamaica",
      accessNotes: "Confirm occupancy before scheduling.",
      contactName: "Site supervisor",
      contactPhone: "+18765550199",
      securityNotes: null,
      preferredTimes: "Mornings preferred",
    },
  ],
  assets: [
    {
      id: `${customer.id}-asset-1`,
      name: customer.type === "COMMERCIAL" ? "Commercial AC" : "Split AC",
      manufacturer: "Carrier",
      modelNumber: "INV-24000",
      serialNumber: "SN-AC-2048",
      status: "ACTIVE",
      locationLabel: customer.type === "RESIDENTIAL" ? "Home" : "Commercial site",
    },
    {
      id: `${customer.id}-asset-2`,
      name: "Refrigerator",
      manufacturer: "Whirlpool",
      modelNumber: "WRS-325",
      serialNumber: "SN-RF-9012",
      status: "ACTIVE",
      locationLabel: customer.type === "RESIDENTIAL" ? "Home" : "Commercial site",
    },
  ],
  jobs: [
    {
      id: `${customer.id}-job-1`,
      number: "WO-1048",
      title: "AC not cooling",
      lifecycle: "IN_PROGRESS",
      priority: "URGENT",
      requestedAt: "2026-06-25",
      completedAt: null,
    },
    {
      id: `${customer.id}-job-2`,
      number: "WO-1019",
      title: "Preventive maintenance",
      lifecycle: "COMPLETED",
      priority: "NORMAL",
      requestedAt: "2026-06-03",
      completedAt: customer.lastServiceDate,
    },
  ],
  quotes: [
    {
      id: `${customer.id}-quote-1`,
      number: "QT-2039",
      title: "AC compressor replacement",
      status: "SENT",
      total: 186000,
      expiresAt: "2026-07-10",
    },
  ],
  invoices: [
    {
      id: `${customer.id}-invoice-1`,
      number: "INV-3044",
      status: customer.outstandingBalance > 0 ? "PARTIALLY_PAID" : "PAID",
      total: customer.outstandingBalance || 87500,
      balanceDue: customer.outstandingBalance,
      issuedAt: "2026-06-21",
    },
  ],
  payments: [
    {
      id: `${customer.id}-payment-1`,
      status: "COMPLETED",
      method: "BANK_TRANSFER",
      amount: customer.outstandingBalance ? 50000 : 87500,
      paidAt: "2026-06-22",
      reference: "BANK-REF-2048",
    },
  ],
  notes: [
    {
      id: `${customer.id}-note-1`,
      body: "Customer prefers WhatsApp updates and a call when technician is en route.",
      pinned: true,
      createdAt: "2026-06-15",
    },
  ],
  attachments: [
    {
      id: `${customer.id}-attachment-1`,
      fileName: "site-photo.jpg",
      mimeType: "image/jpeg",
      url: "https://example.com/site-photo.jpg",
      sizeBytes: 142000,
      createdAt: "2026-06-15",
    },
  ],
  activity: [
    {
      id: `${customer.id}-activity-1`,
      action: "customer.updated",
      message: "Contact and preferred service notes updated.",
      createdAt: "2026-06-16",
    },
    {
      id: `${customer.id}-activity-2`,
      action: "job.completed",
      message: "Preventive maintenance job completed.",
      createdAt: customer.lastServiceDate ?? "2026-06-10",
    },
  ],
}));
