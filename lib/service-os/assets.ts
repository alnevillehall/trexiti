import type { Prisma } from "@prisma/client";

import {
  compactAddress,
  demoCustomerProfiles,
  formatDate,
} from "@/lib/service-os/customers";
import type { IndustryTemplateKey } from "@/lib/service-os/industry-templates";

export const assetStatuses = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "NEEDS_REPLACEMENT", label: "Needs replacement" },
] as const;

export const warrantyStatuses = [
  "Unknown",
  "Under warranty",
  "Out of warranty",
  "Expired",
  "Manufacturer warranty",
  "Service warranty",
] as const;

export type AssetStatusValue = (typeof assetStatuses)[number]["value"];

export type AssetFieldType = "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT";

export type AssetCustomFieldDefinition = {
  key: string;
  label: string;
  type: AssetFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type AssetTypeOption = {
  id?: string;
  name: string;
  slug: string;
};

export type AssetCustomerOption = {
  id: string;
  name: string;
  locations: {
    id: string;
    label: string;
    address: string;
  }[];
};

export type AssetListRow = {
  id: string;
  name: string;
  assetType: string;
  customer: string;
  location: string;
  brand?: string | null;
  modelNumber?: string | null;
  serialNumber?: string | null;
  warrantyStatus?: string | null;
  lastServiceAt?: string | Date | null;
  status: AssetStatusValue;
  jobsCount: number;
};

export type AssetProfile = AssetListRow & {
  customerId: string;
  locationId: string;
  assetTypeId?: string | null;
  installedAt?: string | Date | null;
  warrantyExpiresAt?: string | Date | null;
  notesSummary?: string | null;
  customFields: Record<string, unknown>;
  attachments: {
    id: string;
    fileName: string;
    mimeType: string;
    url: string;
    sizeBytes?: number | null;
    createdAt: string | Date;
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
  activity: {
    id: string;
    action: string;
    message?: string | null;
    createdAt: string | Date;
  }[];
};

export type AssetFilters = {
  q?: string;
  type?: string;
  status?: string;
};

const defaultFields: AssetCustomFieldDefinition[] = [
  { key: "condition", label: "Condition", type: "SELECT", options: ["Good", "Fair", "Poor", "Unknown"] },
  { key: "customerComplaint", label: "Customer complaint", type: "TEXT" },
];

const industryAssetFields: Record<string, Record<string, AssetCustomFieldDefinition[]>> = {
  "appliance-hvac": {
    refrigerator: [
      field("errorCode", "Error code"),
      field("coolingIssue", "Cooling issue"),
      field("freezerIssue", "Freezer issue"),
      field("voltage", "Voltage"),
    ],
    "washing-machine": [
      field("errorCode", "Error code"),
      field("drainingIssue", "Draining issue"),
      field("spinningIssue", "Spinning issue"),
      field("waterIntakeIssue", "Water intake issue"),
    ],
    dryer: [
      field("errorCode", "Error code"),
      field("heatingIssue", "Heating issue"),
      field("ventingIssue", "Venting issue"),
      field("voltage", "Voltage"),
    ],
    "split-ac": acFields(),
    "window-ac": acFields(),
    "commercial-ac": acFields(),
    ac: acFields(),
  },
  plumbing: {
    "water-pump": [
      field("horsepower", "Horsepower", "NUMBER"),
      select("waterSource", "Water source", ["NWC", "Tank", "Well", "Pump", "Unknown"]),
      field("pressureIssue", "Pressure issue"),
      field("lastServiceDate", "Last service date", "DATE"),
    ],
    "water-heater": [
      field("capacity", "Capacity"),
      select("fuelType", "Fuel type", ["Electric", "Gas", "Solar", "Other"]),
      field("installationDate", "Installation date", "DATE"),
      field("leakIssue", "Leak issue"),
    ],
    drain: drainFields(),
    "drainage-system": drainFields(),
  },
  electrical: {
    "breaker-panel": [
      field("amperage", "Amperage", "NUMBER"),
      select("phase", "Phase", ["Single phase", "Three phase", "Unknown"]),
      field("numberOfBreakers", "Number of breakers", "NUMBER"),
      field("faultSymptom", "Fault symptom"),
    ],
    generator: [
      field("capacity", "Capacity"),
      select("fuelType", "Fuel type", ["Diesel", "Gasoline", "LPG", "Other"]),
      select("transferSwitch", "Transfer switch", ["Manual", "Automatic", "None", "Unknown"]),
      field("serviceInterval", "Service interval"),
    ],
    circuit: circuitFields(),
    "wiring-circuit": circuitFields(),
  },
};

export function getAssetFieldDefinitions(
  industryKey: string,
  assetTypeName?: string | null,
) {
  const industryFields = industryAssetFields[industryKey] ?? {};
  const slug = slugify(assetTypeName ?? "");
  const direct = industryFields[slug];

  if (direct) {
    return direct;
  }

  if (industryKey === "appliance-hvac" && slug.includes("ac")) {
    return acFields();
  }

  if (industryKey === "plumbing" && slug.includes("drain")) {
    return drainFields();
  }

  if (industryKey === "electrical" && slug.includes("circuit")) {
    return circuitFields();
  }

  return defaultFields;
}

export function getAssetTypeOptions(industryKey: IndustryTemplateKey): AssetTypeOption[] {
  const fallback: Record<string, string[]> = {
    "appliance-hvac": [
      "Refrigerator",
      "Washing machine",
      "Dryer",
      "Stove",
      "Oven",
      "Microwave",
      "Dishwasher",
      "Split AC",
      "Window AC",
      "Commercial AC",
      "Freezer",
    ],
    plumbing: [
      "Water heater",
      "Water pump",
      "Toilet",
      "Faucet",
      "Sink",
      "Shower",
      "Water tank",
      "Drainage system",
      "Pipe network",
    ],
    electrical: [
      "Breaker panel",
      "Generator",
      "Outlet",
      "Light fixture",
      "Switch",
      "Surge protector",
      "Inverter system",
      "Meter base",
      "Wiring circuit",
    ],
  };

  return (fallback[industryKey] ?? fallback["appliance-hvac"]).map((name) => ({
    name,
    slug: slugify(name),
  }));
}

export function assetStatusLabel(value: string) {
  return assetStatuses.find((status) => status.value === value)?.label ?? value;
}

export function assetStatusTone(value: string) {
  switch (value) {
    case "ACTIVE":
      return "green" as const;
    case "NEEDS_REPLACEMENT":
      return "amber" as const;
    default:
      return "neutral" as const;
  }
}

export function formatCustomFieldValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not captured";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value instanceof Date) {
    return formatDate(value);
  }

  return String(value);
}

export function customFieldsFromJson(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function filterDemoAssets(filters: AssetFilters) {
  const q = filters.q?.trim().toLowerCase();

  return demoAssets.filter((asset) => {
    const matchesQuery = q
      ? [
          asset.name,
          asset.assetType,
          asset.customer,
          asset.location,
          asset.brand,
          asset.modelNumber,
          asset.serialNumber,
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(q))
      : true;
    const matchesType = filters.type && filters.type !== "all"
      ? slugify(asset.assetType) === filters.type
      : true;
    const matchesStatus = filters.status && filters.status !== "all"
      ? asset.status === filters.status
      : true;

    return matchesQuery && matchesType && matchesStatus;
  });
}

export function getDemoAsset(id: string) {
  return demoAssetProfiles.find((asset) => asset.id === id) ?? null;
}

export const demoAssetCustomers: AssetCustomerOption[] = demoCustomerProfiles.map((customer) => ({
  id: customer.id,
  name: customer.displayName,
  locations: customer.locations.map((location) => ({
    id: location.id,
    label: location.label,
    address: compactAddress(location),
  })),
}));

export const demoAssets: AssetListRow[] = demoCustomerProfiles.flatMap((customer) =>
  customer.assets.map((asset, index) => ({
    id: asset.id,
    name: asset.name,
    assetType: asset.name,
    customer: customer.displayName,
    location: asset.locationLabel ?? customer.mainLocation ?? "Main site",
    brand: asset.manufacturer,
    modelNumber: asset.modelNumber,
    serialNumber: asset.serialNumber,
    warrantyStatus: index === 0 ? "Under warranty" : "Unknown",
    lastServiceAt: customer.lastServiceDate,
    status: asset.status as AssetStatusValue,
    jobsCount: customer.jobs.length,
  })),
);

export const demoAssetProfiles: AssetProfile[] = demoAssets.map((asset) => ({
  ...asset,
  customerId: demoAssetCustomers[0]?.id ?? "cust-mona-villas",
  locationId: demoAssetCustomers[0]?.locations[0]?.id ?? "loc-mona-villas-main",
  installedAt: "2025-02-12",
  warrantyExpiresAt: "2027-02-12",
  notesSummary: "Keep service photos attached and confirm asset label before dispatch.",
  customFields: asset.assetType.toLowerCase().includes("ac")
    ? {
        btu: "24000",
        acType: "Split AC",
        refrigerantType: "R410A",
        indoorUnitLocation: "Living room",
        outdoorUnitLocation: "North wall",
        lastCleaningDate: "2026-06-20",
      }
    : {
        errorCode: "E4",
        coolingIssue: "Intermittent",
        freezerIssue: "None",
        voltage: "110V",
      },
  attachments: [
    {
      id: `${asset.id}-photo-1`,
      fileName: "asset-label.jpg",
      mimeType: "image/jpeg",
      url: "https://example.com/asset-label.jpg",
      sizeBytes: 124000,
      createdAt: "2026-06-20",
    },
  ],
  jobs: [
    {
      id: `${asset.id}-wo-open`,
      number: "WO-1048",
      title: `${asset.name} diagnostic`,
      lifecycle: "IN_PROGRESS",
      priority: "HIGH",
      requestedAt: "2026-06-25",
      completedAt: null,
    },
    {
      id: `${asset.id}-wo-complete`,
      number: "WO-1018",
      title: "Preventive service visit",
      lifecycle: "COMPLETED",
      priority: "NORMAL",
      requestedAt: "2026-06-03",
      completedAt: asset.lastServiceAt,
    },
  ],
  activity: [
    {
      id: `${asset.id}-activity-1`,
      action: "asset.updated",
      message: "Warranty and last service details updated.",
      createdAt: "2026-06-20",
    },
    {
      id: `${asset.id}-activity-2`,
      action: "job.linked",
      message: "Diagnostic work order linked to asset history.",
      createdAt: "2026-06-25",
    },
  ],
}));

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function field(
  key: string,
  label: string,
  type: AssetFieldType = "TEXT",
  placeholder?: string,
): AssetCustomFieldDefinition {
  return { key, label, type, placeholder };
}

function select(
  key: string,
  label: string,
  options: string[],
): AssetCustomFieldDefinition {
  return { key, label, type: "SELECT", options };
}

function acFields() {
  return [
    field("btu", "BTU", "NUMBER"),
    select("acType", "AC type", ["Split AC", "Window AC", "Commercial AC", "Other"]),
    select("refrigerantType", "Refrigerant type", ["R410A", "R32", "R22", "Unknown"]),
    field("indoorUnitLocation", "Indoor unit location"),
    field("outdoorUnitLocation", "Outdoor unit location"),
    field("lastCleaningDate", "Last cleaning date", "DATE"),
  ];
}

function drainFields() {
  return [
    field("location", "Location"),
    select("blockageSeverity", "Blockage severity", ["Minor", "Moderate", "Severe", "Emergency"]),
    select("recurringIssue", "Recurring issue", ["Yes", "No", "Unknown"]),
  ];
}

function circuitFields() {
  return [
    field("roomArea", "Room/area"),
    field("loadType", "Load type"),
    field("faultSymptom", "Fault symptom"),
  ];
}
