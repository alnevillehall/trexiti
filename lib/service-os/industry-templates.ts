export type IndustryTemplateKey =
  | "appliance-hvac"
  | "plumbing"
  | "electrical"
  | (string & {});

export type IndustryTemplatePrismaKey = string;

export type ConfigFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "BOOLEAN"
  | "SELECT"
  | "MULTI_SELECT";

export type ChecklistItemType =
  | "BOOLEAN"
  | "TEXT"
  | "NUMBER"
  | "PHOTO"
  | "SIGNATURE"
  | "SINGLE_SELECT"
  | "MULTI_SELECT";

export type WorkOrderLifecycle =
  | "REQUESTED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type TemplateAssetField = {
  name: string;
  slug: string;
  type: ConfigFieldType;
  required?: boolean;
  options?: string[];
};

export type TemplateAssetType = {
  name: string;
  slug: string;
  fields: string[];
};

export type TemplateJobType = {
  name: string;
  slug: string;
  defaultDurationMin: number;
  description: string;
};

export type TemplateChecklist = {
  name: string;
  slug: string;
  jobTypeSlug?: string;
  description: string;
  items: {
    label: string;
    type?: ChecklistItemType;
    required?: boolean;
  }[];
};

export type TemplateJobStatus = {
  name: string;
  slug: string;
  lifecycle: WorkOrderLifecycle;
  color: string;
  isDefault?: boolean;
  isTerminal?: boolean;
};

export type TemplateQuoteLineItem = {
  name: string;
  slug: string;
  description: string;
  defaultUnitPrice?: string;
  taxable?: boolean;
};

export type TemplateInvoiceTerm = {
  name: string;
  slug: string;
  terms: string;
  dueDays: number;
};

export type TemplateInventoryCategory = {
  name: string;
  slug: string;
  description: string;
};

export type TemplateIssueSymptom = {
  name: string;
  slug: string;
  serviceCategorySlug?: string;
  priorityHint: string;
};

export type TemplatePriorityLabel = {
  name: string;
  slug: string;
  color: string;
  level: number;
  description: string;
};

export type TemplateSlaResponseTime = {
  name: string;
  slug: string;
  prioritySlug: string;
  responseMinutes: number;
  resolutionMinutes: number;
};

export type IndustryTemplateConfig = {
  key: IndustryTemplateKey;
  prismaKey: IndustryTemplatePrismaKey;
  name: string;
  description: string;
  version: number;
  serviceCategories: string[];
  assetTypes: TemplateAssetType[];
  assetFields: TemplateAssetField[];
  jobTypes: string[];
  jobTypeDefaults: TemplateJobType[];
  technicianChecklists: TemplateChecklist[];
  jobStatuses: TemplateJobStatus[];
  quoteItems: string[];
  quoteLineItems: TemplateQuoteLineItem[];
  invoiceTerms: TemplateInvoiceTerm[];
  invoiceDefaults: {
    taxLabel: string;
    paymentTerms: string;
    warrantyNote: string;
  };
  inventoryCategories: TemplateInventoryCategory[];
  issueSymptoms: TemplateIssueSymptom[];
  priorityLabels: TemplatePriorityLabel[];
  slaResponseTimes: TemplateSlaResponseTime[];
  workflowLabels: {
    request: string;
    scheduled: string;
    inProgress: string;
    review: string;
    complete: string;
  };
};

const defaultJobStatuses: TemplateJobStatus[] = [
  {
    name: "New request",
    slug: "new-request",
    lifecycle: "REQUESTED",
    color: "#2563eb",
    isDefault: true,
  },
  {
    name: "Scheduled",
    slug: "scheduled",
    lifecycle: "SCHEDULED",
    color: "#4f46e5",
  },
  {
    name: "In progress",
    slug: "in-progress",
    lifecycle: "IN_PROGRESS",
    color: "#059669",
  },
  {
    name: "Awaiting parts or approval",
    slug: "awaiting-parts-or-approval",
    lifecycle: "ON_HOLD",
    color: "#d97706",
  },
  {
    name: "Completed",
    slug: "completed",
    lifecycle: "COMPLETED",
    color: "#16a34a",
    isTerminal: true,
  },
  {
    name: "Cancelled",
    slug: "cancelled",
    lifecycle: "CANCELLED",
    color: "#64748b",
    isTerminal: true,
  },
];

const defaultPriorityLabels: TemplatePriorityLabel[] = [
  {
    name: "Low",
    slug: "low",
    color: "#64748b",
    level: 1,
    description: "Can be scheduled into normal route capacity.",
  },
  {
    name: "Normal",
    slug: "normal",
    color: "#2563eb",
    level: 2,
    description: "Standard service response for booked jobs.",
  },
  {
    name: "High",
    slug: "high",
    color: "#d97706",
    level: 3,
    description: "Time-sensitive issue that should be prioritized today.",
  },
  {
    name: "Emergency",
    slug: "emergency",
    color: "#dc2626",
    level: 4,
    description: "Safety, property damage, or business-critical outage.",
  },
];

const defaultSlaResponseTimes: TemplateSlaResponseTime[] = [
  {
    name: "Low priority",
    slug: "low-priority",
    prioritySlug: "low",
    responseMinutes: 1440,
    resolutionMinutes: 10080,
  },
  {
    name: "Normal priority",
    slug: "normal-priority",
    prioritySlug: "normal",
    responseMinutes: 480,
    resolutionMinutes: 4320,
  },
  {
    name: "High priority",
    slug: "high-priority",
    prioritySlug: "high",
    responseMinutes: 120,
    resolutionMinutes: 1440,
  },
  {
    name: "Emergency priority",
    slug: "emergency-priority",
    prioritySlug: "emergency",
    responseMinutes: 30,
    resolutionMinutes: 480,
  },
];

const applianceAssetFieldNames = [
  "Brand",
  "Model number",
  "Serial number",
  "Appliance type",
  "Residential/commercial",
  "Warranty status",
  "Installation date",
  "Last service date",
  "Error code",
  "Voltage",
  "Customer complaint",
];

const plumbingAssetFieldNames = [
  "Fixture type",
  "Pipe material",
  "Water source",
  "Location in property",
  "Pressure issue",
  "Leak severity",
  "Installation age",
  "Previous repairs",
];

const electricalAssetFieldNames = [
  "Voltage",
  "Phase",
  "Breaker size",
  "Circuit location",
  "Load type",
  "Fault symptom",
  "Safety risk",
  "Last inspection date",
];

export const industryTemplates: IndustryTemplateConfig[] = [
  {
    key: "appliance-hvac",
    prismaKey: "APPLIANCE_HVAC",
    name: "Appliance/HVAC",
    description:
      "Reusable defaults for appliance repair, AC service, AC installation, refrigeration, and preventive maintenance companies.",
    version: 1,
    serviceCategories: [
      "Refrigerator repair",
      "Washing machine repair",
      "Dryer repair",
      "Stove/oven repair",
      "Microwave repair",
      "Dishwasher repair",
      "AC servicing",
      "AC installation",
      "AC repair",
      "Preventive maintenance",
    ],
    assetTypes: [
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
    ].map((name) => ({
      name,
      slug: slugify(name),
      fields: applianceAssetFieldNames,
    })),
    assetFields: [
      field("Brand", "TEXT", true),
      field("Model number", "TEXT", true),
      field("Serial number", "TEXT"),
      field("Appliance type", "SELECT", false, [
        "Kitchen appliance",
        "Laundry appliance",
        "Air conditioning",
        "Commercial refrigeration",
      ]),
      field("Residential/commercial", "SELECT", true, [
        "Residential",
        "Commercial",
      ]),
      field("Warranty status", "SELECT", false, [
        "Under warranty",
        "Out of warranty",
        "Unknown",
      ]),
      field("Installation date", "DATE"),
      field("Last service date", "DATE"),
      field("Error code", "TEXT"),
      field("Voltage", "TEXT"),
      field("Customer complaint", "TEXT"),
    ],
    jobTypes: [
      "Diagnostic visit",
      "Repair",
      "Installation",
      "Preventive maintenance",
      "Emergency callout",
      "Warranty service",
    ],
    jobTypeDefaults: [
      jobType("Diagnostic visit", 90, "Inspect the unit, identify the fault, and recommend next steps."),
      jobType("Repair", 120, "Complete approved labor and parts replacement."),
      jobType("Installation", 240, "Install and commission new equipment."),
      jobType("Preventive maintenance", 90, "Perform routine service and condition checks."),
      jobType("Emergency callout", 120, "Respond to urgent cooling, refrigeration, or appliance failure."),
      jobType("Warranty service", 90, "Handle covered service calls with warranty documentation."),
    ],
    technicianChecklists: [
      checklist("Appliance diagnostic", "diagnostic-visit", [
        "Confirm unit details and customer complaint",
        "Record brand, model number, and serial number",
        "Check power supply and voltage",
        "Capture error codes or visible damage",
        "Add before photos",
      ]),
      checklist("AC service closeout", "preventive-maintenance", [
        "Clean filters, coils, and drain line",
        "Check airflow and temperature split",
        "Record voltage and operating condition",
        "Add after photos",
        "Collect customer signature",
      ]),
    ],
    jobStatuses: defaultJobStatuses,
    quoteItems: [
      "Diagnostic fee",
      "Labor",
      "Replacement part",
      "AC cleaning",
      "Installation materials",
      "Preventive maintenance visit",
    ],
    quoteLineItems: [
      quoteItem("Diagnostic fee", "Technician visit and fault diagnosis.", "6500"),
      quoteItem("Labor", "Approved repair labor.", "8500"),
      quoteItem("Replacement part", "Customer-approved replacement component."),
      quoteItem("AC cleaning", "Indoor/outdoor unit cleaning and drain service.", "12000"),
      quoteItem("Installation materials", "Mounting, piping, drain, and electrical consumables."),
      quoteItem("Preventive maintenance visit", "Scheduled maintenance visit.", "9500"),
    ],
    invoiceTerms: [
      invoiceTerm("Due on completion", "Payment is due when the service visit is completed.", 0),
      invoiceTerm("Account terms", "Approved account customers are due within 14 days.", 14),
    ],
    invoiceDefaults: {
      taxLabel: "GCT",
      paymentTerms: "Due on completion unless account terms are approved.",
      warrantyNote: "Service labor warranty applies to the repaired fault only.",
    },
    inventoryCategories: [
      inventoryCategory("Motors and fans", "Fan motors, blower wheels, and condenser motors."),
      inventoryCategory("Electrical controls", "Relays, capacitors, boards, sensors, and switches."),
      inventoryCategory("Refrigeration parts", "Valves, refrigerant accessories, dryers, and copper fittings."),
      inventoryCategory("Filters and cleaning", "Filters, coil cleaner, brushes, and drain supplies."),
      inventoryCategory("Installation materials", "Line sets, brackets, insulation, fasteners, and drain hose."),
    ],
    issueSymptoms: [
      symptom("Not cooling", "ac-repair", "high"),
      symptom("Leaking water", "ac-servicing", "normal"),
      symptom("No power", "stove-oven-repair", "high"),
      symptom("Error code displayed", "refrigerator-repair", "normal"),
      symptom("Unusual noise", "washing-machine-repair", "normal"),
      symptom("Burning smell", "dryer-repair", "emergency"),
    ],
    priorityLabels: defaultPriorityLabels,
    slaResponseTimes: defaultSlaResponseTimes,
    workflowLabels: {
      request: "Request intake",
      scheduled: "Technician scheduled",
      inProgress: "On site",
      review: "Awaiting parts or approval",
      complete: "Service complete",
    },
  },
  {
    key: "plumbing",
    prismaKey: "PLUMBING",
    name: "Plumbing",
    description:
      "Reusable defaults for plumbing contractors handling leak repair, fixtures, pumps, drains, tanks, and emergency dispatch.",
    version: 1,
    serviceCategories: [
      "Leak repair",
      "Pipe installation",
      "Drain cleaning",
      "Toilet repair",
      "Faucet repair",
      "Water heater service",
      "Pump repair",
      "Tank installation",
      "Emergency plumbing",
      "Preventive inspection",
    ],
    assetTypes: [
      "Water heater",
      "Water pump",
      "Toilet",
      "Faucet",
      "Sink",
      "Shower",
      "Water tank",
      "Drainage system",
      "Pipe network",
    ].map((name) => ({
      name,
      slug: slugify(name),
      fields: plumbingAssetFieldNames,
    })),
    assetFields: [
      field("Fixture type", "TEXT", true),
      field("Pipe material", "SELECT", false, ["PVC", "CPVC", "PEX", "Copper", "Galvanized", "Other"]),
      field("Water source", "SELECT", false, ["NWC", "Tank", "Well", "Pump", "Unknown"]),
      field("Location in property", "TEXT", true),
      field("Pressure issue", "TEXT"),
      field("Leak severity", "SELECT", false, ["Minor", "Moderate", "Severe", "Active flooding"]),
      field("Installation age", "TEXT"),
      field("Previous repairs", "TEXT"),
    ],
    jobTypes: [
      "Leak repair",
      "Pipe installation",
      "Drain cleaning",
      "Fixture repair",
      "Pump service",
      "Preventive inspection",
      "Emergency callout",
    ],
    jobTypeDefaults: [
      jobType("Leak repair", 120, "Trace, isolate, and repair active leaks."),
      jobType("Pipe installation", 240, "Install or replace pipe runs and fittings."),
      jobType("Drain cleaning", 90, "Clear blockages and test drainage flow."),
      jobType("Fixture repair", 90, "Repair toilets, faucets, sinks, and showers."),
      jobType("Pump service", 120, "Diagnose and repair pump or pressure issues."),
      jobType("Preventive inspection", 90, "Inspect fixtures, valves, tanks, and visible pipework."),
      jobType("Emergency callout", 120, "Respond to urgent leaks, flooding, or failed water systems."),
    ],
    technicianChecklists: [
      checklist("Leak repair", "leak-repair", [
        "Identify source and isolate water",
        "Record leak severity and access needs",
        "Photograph damaged area before repair",
        "Pressure test completed repair",
        "Document restoration or follow-up needs",
      ]),
      checklist("Drain cleaning", "drain-cleaning", [
        "Confirm affected fixtures",
        "Run cable, auger, or jetting procedure",
        "Test flow after clearing",
        "Photograph cleanout or affected area",
        "Recommend prevention steps",
      ]),
    ],
    jobStatuses: defaultJobStatuses,
    quoteItems: [
      "Callout fee",
      "Leak repair labor",
      "Pipe and fittings",
      "Drain cleaning",
      "Fixture replacement",
      "Pump replacement",
    ],
    quoteLineItems: [
      quoteItem("Callout fee", "Technician visit and initial diagnosis.", "6000"),
      quoteItem("Leak repair labor", "Labor to isolate and repair a leak.", "9500"),
      quoteItem("Pipe and fittings", "Pipe, elbows, couplings, valves, and connectors."),
      quoteItem("Drain cleaning", "Drain cable, auger, or jetting service.", "11000"),
      quoteItem("Fixture replacement", "Install customer-approved toilet, faucet, sink, or shower fixture."),
      quoteItem("Pump replacement", "Replace water pump or related pressure equipment."),
    ],
    invoiceTerms: [
      invoiceTerm("Due on completion", "Payment is due when water service is restored or the visit is completed.", 0),
      invoiceTerm("Commercial account", "Approved commercial accounts are due within 14 days.", 14),
    ],
    invoiceDefaults: {
      taxLabel: "GCT",
      paymentTerms: "Due on completion for residential jobs.",
      warrantyNote: "Warranty excludes recurring blockages caused by foreign objects.",
    },
    inventoryCategories: [
      inventoryCategory("Pipes and fittings", "PVC, CPVC, PEX, copper, elbows, tees, and couplings."),
      inventoryCategory("Valves and controls", "Ball valves, check valves, pressure switches, and regulators."),
      inventoryCategory("Fixtures", "Faucets, toilets, sinks, traps, and fixture repair kits."),
      inventoryCategory("Pumps and tanks", "Pump parts, pressure tanks, float switches, and tank fittings."),
      inventoryCategory("Drain service supplies", "Cables, augers, cleanout caps, and drain chemicals."),
    ],
    issueSymptoms: [
      symptom("Active leak", "leak-repair", "high"),
      symptom("Blocked drain", "drain-cleaning", "normal"),
      symptom("Low water pressure", "pump-repair", "normal"),
      symptom("No water", "pump-repair", "high"),
      symptom("Overflowing toilet", "toilet-repair", "emergency"),
      symptom("Water heater not heating", "water-heater-service", "normal"),
    ],
    priorityLabels: defaultPriorityLabels,
    slaResponseTimes: defaultSlaResponseTimes,
    workflowLabels: {
      request: "Request intake",
      scheduled: "Visit booked",
      inProgress: "Repair in progress",
      review: "Needs approval",
      complete: "Water restored",
    },
  },
  {
    key: "electrical",
    prismaKey: "ELECTRICAL",
    name: "Electrical",
    description:
      "Reusable defaults for electrical contractors handling inspections, wiring, panels, generators, lighting, and emergency faults.",
    version: 1,
    serviceCategories: [
      "Electrical inspection",
      "Breaker panel service",
      "Wiring repair",
      "Outlet installation",
      "Lighting installation",
      "Generator connection",
      "Surge protection",
      "Fault diagnosis",
      "Emergency electrical",
      "Preventive maintenance",
    ],
    assetTypes: [
      "Breaker panel",
      "Generator",
      "Outlet",
      "Light fixture",
      "Switch",
      "Surge protector",
      "Inverter system",
      "Meter base",
      "Wiring circuit",
    ].map((name) => ({
      name,
      slug: slugify(name),
      fields: electricalAssetFieldNames,
    })),
    assetFields: [
      field("Voltage", "TEXT", true),
      field("Phase", "SELECT", false, ["Single phase", "Three phase", "Unknown"]),
      field("Breaker size", "TEXT"),
      field("Circuit location", "TEXT", true),
      field("Load type", "TEXT"),
      field("Fault symptom", "TEXT"),
      field("Safety risk", "SELECT", false, ["Low", "Moderate", "High", "Immediate danger"]),
      field("Last inspection date", "DATE"),
    ],
    jobTypes: [
      "Fault diagnosis",
      "Inspection",
      "Panel service",
      "Wiring repair",
      "Installation",
      "Generator connection",
      "Emergency callout",
    ],
    jobTypeDefaults: [
      jobType("Fault diagnosis", 90, "Trace electrical faults and recommend corrective work."),
      jobType("Inspection", 120, "Inspect electrical systems and document compliance or risks."),
      jobType("Panel service", 180, "Repair, label, or upgrade breaker panels."),
      jobType("Wiring repair", 180, "Repair or replace unsafe or failed wiring."),
      jobType("Installation", 180, "Install outlets, lighting, switches, or protection devices."),
      jobType("Generator connection", 240, "Connect generator, transfer switch, or backup power equipment."),
      jobType("Emergency callout", 120, "Respond to urgent faults, safety risks, or outages."),
    ],
    technicianChecklists: [
      checklist("Electrical fault diagnosis", "fault-diagnosis", [
        "Confirm circuit and customer complaint",
        "Isolate power safely",
        "Record voltage readings",
        "Identify safety risks",
        "Photograph completed work",
      ]),
      checklist("Panel service", "panel-service", [
        "Confirm breaker schedule",
        "Check torque and labeling",
        "Verify grounding and bonding",
        "Test affected circuits under load",
        "Capture panel photo after closeout",
      ]),
    ],
    jobStatuses: defaultJobStatuses,
    quoteItems: [
      "Diagnostic fee",
      "Breaker replacement",
      "Wiring repair labor",
      "Outlet installation",
      "Lighting installation",
      "Generator transfer switch",
    ],
    quoteLineItems: [
      quoteItem("Diagnostic fee", "Electrician visit and fault diagnosis.", "7000"),
      quoteItem("Breaker replacement", "Supply and install approved breaker."),
      quoteItem("Wiring repair labor", "Labor to repair or replace affected wiring.", "11000"),
      quoteItem("Outlet installation", "Install outlet, box, plate, and wiring materials.", "9500"),
      quoteItem("Lighting installation", "Install approved light fixture or lighting circuit."),
      quoteItem("Generator transfer switch", "Supply or install generator transfer switching equipment."),
    ],
    invoiceTerms: [
      invoiceTerm("Due on completion", "Payment is due once work is tested and completed.", 0),
      invoiceTerm("Materials deposit", "Deposit may be required before materials procurement.", 0),
      invoiceTerm("Account terms", "Approved account customers are due within 14 days.", 14),
    ],
    invoiceDefaults: {
      taxLabel: "GCT",
      paymentTerms: "Deposit may be required before materials procurement.",
      warrantyNote:
        "Electrical work warranty assumes no unauthorized modification after completion.",
    },
    inventoryCategories: [
      inventoryCategory("Breakers and panels", "Breakers, panel accessories, bus bars, and labels."),
      inventoryCategory("Wire and conduit", "Cable, conduit, trunking, fittings, and connectors."),
      inventoryCategory("Outlets and switches", "Receptacles, plates, switches, boxes, and covers."),
      inventoryCategory("Lighting", "Fixtures, bulbs, drivers, sensors, and mounting accessories."),
      inventoryCategory("Protection and backup power", "Surge devices, transfer switches, inverters, and generator supplies."),
    ],
    issueSymptoms: [
      symptom("Breaker tripping", "breaker-panel-service", "high"),
      symptom("No power", "fault-diagnosis", "high"),
      symptom("Burning smell", "emergency-electrical", "emergency"),
      symptom("Flickering lights", "lighting-installation", "normal"),
      symptom("Outlet not working", "outlet-installation", "normal"),
      symptom("Generator not transferring", "generator-connection", "high"),
    ],
    priorityLabels: defaultPriorityLabels,
    slaResponseTimes: defaultSlaResponseTimes,
    workflowLabels: {
      request: "Request intake",
      scheduled: "Electrician assigned",
      inProgress: "Work in progress",
      review: "Inspection or approval",
      complete: "Energized and complete",
    },
  },
];

export const defaultIndustryTemplate = industryTemplates[0];

export function getIndustryTemplate(key: IndustryTemplateKey) {
  return industryTemplates.find((template) => template.key === key) ?? defaultIndustryTemplate;
}

export function getIndustryTemplateByPrismaKey(key: IndustryTemplatePrismaKey) {
  return industryTemplates.find((template) => template.prismaKey === key) ?? defaultIndustryTemplate;
}

export function templateKeyToPrismaKey(key: IndustryTemplateKey) {
  return getIndustryTemplate(key).prismaKey;
}

export function templateCounts(template: IndustryTemplateConfig) {
  return {
    serviceCategories: template.serviceCategories.length,
    jobTypes: template.jobTypes.length,
    assetTypes: template.assetTypes.length,
    assetFields: template.assetFields.length,
    checklists: template.technicianChecklists.length,
    jobStatuses: template.jobStatuses.length,
    quoteLineItems: template.quoteLineItems.length,
    invoiceTerms: template.invoiceTerms.length,
    inventoryCategories: template.inventoryCategories.length,
    issueSymptoms: template.issueSymptoms.length,
    priorityLabels: template.priorityLabels.length,
    slaResponseTimes: template.slaResponseTimes.length,
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function field(
  name: string,
  type: ConfigFieldType,
  required = false,
  options?: string[],
): TemplateAssetField {
  return {
    name,
    slug: slugify(name),
    type,
    required,
    options,
  };
}

function jobType(
  name: string,
  defaultDurationMin: number,
  description: string,
): TemplateJobType {
  return {
    name,
    slug: slugify(name),
    defaultDurationMin,
    description,
  };
}

function checklist(
  name: string,
  jobTypeSlug: string,
  items: string[],
): TemplateChecklist {
  return {
    name,
    slug: slugify(name),
    jobTypeSlug,
    description: `${name} technician workflow.`,
    items: items.map((label) => ({
      label,
      type: label.toLowerCase().includes("photo")
        ? "PHOTO"
        : label.toLowerCase().includes("signature")
          ? "SIGNATURE"
          : "BOOLEAN",
      required: true,
    })),
  };
}

function quoteItem(
  name: string,
  description: string,
  defaultUnitPrice?: string,
): TemplateQuoteLineItem {
  return {
    name,
    slug: slugify(name),
    description,
    defaultUnitPrice,
    taxable: true,
  };
}

function invoiceTerm(
  name: string,
  terms: string,
  dueDays: number,
): TemplateInvoiceTerm {
  return {
    name,
    slug: slugify(name),
    terms,
    dueDays,
  };
}

function inventoryCategory(
  name: string,
  description: string,
): TemplateInventoryCategory {
  return {
    name,
    slug: slugify(name),
    description,
  };
}

function symptom(
  name: string,
  serviceCategorySlug: string,
  priorityHint: string,
): TemplateIssueSymptom {
  return {
    name,
    slug: slugify(name),
    serviceCategorySlug,
    priorityHint,
  };
}
