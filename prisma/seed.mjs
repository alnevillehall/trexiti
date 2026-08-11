import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
  ["PLATFORM_OWNER", "Platform Owner", "Trexiti admin with access across tenant companies."],
  ["COMPANY_ADMIN", "Company Admin", "Owner or manager of a tenant service business."],
  ["DISPATCHER", "Dispatcher", "Creates jobs, assigns technicians, and coordinates follow-up."],
  ["TECHNICIAN", "Technician", "Works assigned jobs and updates field progress."],
  ["SALES", "Sales", "Creates customers, quotes, invoices, and lead follow-ups."],
  ["ACCOUNTANT", "Accountant", "Views invoices, payments, balances, and reports."],
];

const businessHours = {
  monday: { open: "08:00", close: "17:00", closed: false },
  tuesday: { open: "08:00", close: "17:00", closed: false },
  wednesday: { open: "08:00", close: "17:00", closed: false },
  thursday: { open: "08:00", close: "17:00", closed: false },
  friday: { open: "08:00", close: "17:00", closed: false },
  saturday: { open: "09:00", close: "13:00", closed: false },
  sunday: { open: "00:00", close: "00:00", closed: true },
};

const defaultStatuses = [
  status("New Request", "REQUESTED", "#2563eb", { isDefault: true }),
  status("Needs Assessment", "REQUESTED", "#0ea5e9"),
  status("Scheduled", "SCHEDULED", "#4f46e5"),
  status("Assigned", "SCHEDULED", "#7c3aed"),
  status("Technician En Route", "SCHEDULED", "#0891b2"),
  status("In Progress", "IN_PROGRESS", "#059669"),
  status("Awaiting Quote Approval", "ON_HOLD", "#d97706"),
  status("Awaiting Parts", "ON_HOLD", "#f59e0b"),
  status("Completed", "COMPLETED", "#16a34a", { isTerminal: true }),
  status("Invoiced", "COMPLETED", "#0f766e"),
  status("Paid", "COMPLETED", "#15803d", { isTerminal: true }),
  status("Cancelled", "CANCELLED", "#64748b", { isTerminal: true }),
];

const defaultPriorities = [
  priority("Low", "#64748b", 1, "Can be scheduled into normal route capacity."),
  priority("Normal", "#2563eb", 2, "Standard service response for booked jobs."),
  priority("High", "#d97706", 3, "Time-sensitive issue that should be prioritized today."),
  priority("Emergency", "#dc2626", 4, "Safety, property damage, or business-critical outage."),
];

const defaultSlas = [
  sla("Low priority", "low", 1440, 10080),
  sla("Normal priority", "normal", 480, 4320),
  sla("High priority", "high", 120, 1440),
  sla("Emergency priority", "emergency", 30, 480),
];

const applianceFields = [
  field("Brand", "TEXT", true),
  field("Model number", "TEXT", true),
  field("Serial number", "TEXT"),
  field("Appliance type", "SELECT", false, [
    "Kitchen appliance",
    "Laundry appliance",
    "Air conditioning",
    "Commercial refrigeration",
  ]),
  field("Residential/commercial", "SELECT", true, ["Residential", "Commercial"]),
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
];

const plumbingFields = [
  field("Fixture type", "TEXT", true),
  field("Pipe material", "SELECT", false, ["PVC", "CPVC", "PEX", "Copper", "Galvanized", "Other"]),
  field("Water source", "SELECT", false, ["NWC", "Tank", "Well", "Pump", "Unknown"]),
  field("Location in property", "TEXT", true),
  field("Pressure issue", "TEXT"),
  field("Leak severity", "SELECT", false, ["Minor", "Moderate", "Severe", "Active flooding"]),
  field("Installation age", "TEXT"),
  field("Previous repairs", "TEXT"),
];

const electricalFields = [
  field("Voltage", "TEXT", true),
  field("Phase", "SELECT", false, ["Single phase", "Three phase", "Unknown"]),
  field("Breaker size", "TEXT"),
  field("Circuit location", "TEXT", true),
  field("Load type", "TEXT"),
  field("Fault symptom", "TEXT"),
  field("Safety risk", "SELECT", false, ["Low", "Moderate", "High", "Immediate danger"]),
  field("Last inspection date", "DATE"),
];

const templates = [
  {
    key: "APPLIANCE_HVAC",
    name: "Appliance/HVAC",
    description:
      "Reusable defaults for appliance repair, AC service, AC installation, refrigeration, and preventive maintenance companies.",
    version: 1,
    workflowLabels: {
      request: "Request intake",
      scheduled: "Technician scheduled",
      inProgress: "On site",
      review: "Awaiting parts or approval",
      complete: "Service complete",
    },
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
    ],
    assetFields: applianceFields,
    jobTypes: [
      jobType("Diagnostic visit", 90, "Inspect the unit, identify the fault, and recommend next steps."),
      jobType("Repair", 120, "Complete approved labor and parts replacement."),
      jobType("Installation", 240, "Install and commission new equipment."),
      jobType("Preventive maintenance", 90, "Perform routine service and condition checks."),
      jobType("Emergency callout", 120, "Respond to urgent cooling, refrigeration, or appliance failure."),
      jobType("Warranty service", 90, "Handle covered service calls with warranty documentation."),
    ],
    checklists: [
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
    jobStatuses: defaultStatuses,
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
    priorityLabels: defaultPriorities,
    slaResponseTimes: defaultSlas,
  },
  {
    key: "PLUMBING",
    name: "Plumbing",
    description:
      "Reusable defaults for plumbing contractors handling leak repair, fixtures, pumps, drains, tanks, and emergency dispatch.",
    version: 1,
    workflowLabels: {
      request: "Request intake",
      scheduled: "Visit booked",
      inProgress: "Repair in progress",
      review: "Needs approval",
      complete: "Water restored",
    },
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
    ],
    assetFields: plumbingFields,
    jobTypes: [
      jobType("Leak repair", 120, "Trace, isolate, and repair active leaks."),
      jobType("Pipe installation", 240, "Install or replace pipe runs and fittings."),
      jobType("Drain cleaning", 90, "Clear blockages and test drainage flow."),
      jobType("Fixture repair", 90, "Repair toilets, faucets, sinks, and showers."),
      jobType("Pump service", 120, "Diagnose and repair pump or pressure issues."),
      jobType("Preventive inspection", 90, "Inspect fixtures, valves, tanks, and visible pipework."),
      jobType("Emergency callout", 120, "Respond to urgent leaks, flooding, or failed water systems."),
    ],
    checklists: [
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
    jobStatuses: defaultStatuses,
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
    priorityLabels: defaultPriorities,
    slaResponseTimes: defaultSlas,
  },
  {
    key: "ELECTRICAL",
    name: "Electrical",
    description:
      "Reusable defaults for electrical contractors handling inspections, wiring, panels, generators, lighting, and emergency faults.",
    version: 1,
    workflowLabels: {
      request: "Request intake",
      scheduled: "Electrician assigned",
      inProgress: "Work in progress",
      review: "Inspection or approval",
      complete: "Energized and complete",
    },
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
    ],
    assetFields: electricalFields,
    jobTypes: [
      jobType("Fault diagnosis", 90, "Trace electrical faults and recommend corrective work."),
      jobType("Inspection", 120, "Inspect electrical systems and document compliance or risks."),
      jobType("Panel service", 180, "Repair, label, or upgrade breaker panels."),
      jobType("Wiring repair", 180, "Repair or replace unsafe or failed wiring."),
      jobType("Installation", 180, "Install outlets, lighting, switches, or protection devices."),
      jobType("Generator connection", 240, "Connect generator, transfer switch, or backup power equipment."),
      jobType("Emergency callout", 120, "Respond to urgent faults, safety risks, or outages."),
    ],
    checklists: [
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
    jobStatuses: defaultStatuses,
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
      warrantyNote: "Electrical work warranty assumes no unauthorized modification after completion.",
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
    priorityLabels: defaultPriorities,
    slaResponseTimes: defaultSlas,
  },
];

const demoCompanies = [
  {
    id: "org-island-cooling",
    name: "Island Cooling & Appliance",
    slug: "island-cooling",
    templateKey: "APPLIANCE_HVAC",
    phone: "+1 (876) 555-0101",
    email: "ops@islandcooling.example",
    addressLine1: "15 Hope Road",
    city: "Kingston",
    parish: "St. Andrew",
    numberOfTechnicians: 8,
  },
  {
    id: "org-blue-pipe-plumbing",
    name: "Blue Pipe Plumbing",
    slug: "blue-pipe-plumbing",
    templateKey: "PLUMBING",
    phone: "+1 (876) 555-0102",
    email: "dispatch@bluepipe.example",
    addressLine1: "22 Market Street",
    city: "Montego Bay",
    parish: "St. James",
    numberOfTechnicians: 5,
  },
  {
    id: "org-bright-circuit-electrical",
    name: "Bright Circuit Electrical",
    slug: "bright-circuit-electrical",
    templateKey: "ELECTRICAL",
    phone: "+1 (876) 555-0103",
    email: "office@brightcircuit.example",
    addressLine1: "8 Harbour Street",
    city: "Kingston",
    parish: "Kingston",
    numberOfTechnicians: 6,
  },
];

const demoCustomersByCompany = {
  APPLIANCE_HVAC: [
    {
      id: "cust-mona-villas",
      displayName: "Mona Heights Villas",
      type: "PROPERTY_MANAGER",
      status: "ACTIVE",
      primaryName: "Marsha Lewis",
      phone: "+18765550118",
      email: "facilities@monaheights.example",
      notesSummary: "Coordinate with security before arrival and call the site contact on entry.",
      location: {
        id: "loc-mona-villas-main",
        label: "Airbnb/villa",
        addressLine1: "42 Skyline Drive",
        city: "Kingston",
        parish: "St. Andrew",
        contactName: "Marsha Lewis",
        contactPhone: "+18765550118",
        accessNotes: "Call 20 minutes before arrival.",
        securityNotes: "Security gate requires visitor log.",
        preferredTimes: "Weekdays, 9:00 AM to 3:00 PM",
      },
      asset: {
        id: "asset-mona-commercial-ac",
        typeName: "Commercial AC",
        name: "Lobby commercial AC",
        manufacturer: "Carrier",
        modelNumber: "CAC-48000",
        serialNumber: "AC-MONA-48000",
      },
      jobTitle: "AC not cooling",
      quoteTitle: "Compressor and control repair",
      balanceDue: "240000",
    },
    {
      id: "cust-janet-blake",
      displayName: "Janet Blake",
      type: "RESIDENTIAL",
      status: "ACTIVE",
      primaryName: "Janet Blake",
      phone: "8765550124",
      email: "janet.blake@example.com",
      notesSummary: "Prefers WhatsApp reminders before technician arrival.",
      location: {
        id: "loc-janet-home",
        label: "Home",
        addressLine1: "9 Waterloo Road",
        city: "Kingston",
        parish: "St. Andrew",
        contactName: "Janet Blake",
        contactPhone: "8765550124",
        accessNotes: "Use front gate and call on arrival.",
        preferredTimes: "Afternoons after 1:00 PM",
      },
      asset: {
        id: "asset-janet-washer",
        typeName: "Washing machine",
        name: "Laundry room washer",
        manufacturer: "Whirlpool",
        modelNumber: "WFW-8620",
        serialNumber: "WM-JB-8620",
      },
      jobTitle: "Washer leaking",
      quoteTitle: "Washer drain hose repair",
      balanceDue: "18500",
    },
  ],
  PLUMBING: [
    {
      id: "cust-rose-hall-villa",
      displayName: "Rose Hall Villa Group",
      type: "COMMERCIAL",
      status: "ACTIVE",
      primaryName: "Camille Brown",
      phone: "+18765550172",
      email: "maintenance@rosehallvillas.example",
      notesSummary: "Villa manager approves emergency plumbing work up to JMD 75,000.",
      location: {
        id: "loc-rose-hall-main",
        label: "Airbnb/villa",
        addressLine1: "Lot 6 Coral Gardens",
        city: "Montego Bay",
        parish: "St. James",
        contactName: "Camille Brown",
        contactPhone: "+18765550172",
        accessNotes: "Check in at villa office before entering guest areas.",
        securityNotes: "Guest privacy restrictions apply.",
        preferredTimes: "Between guest check-out and check-in windows",
      },
      asset: {
        id: "asset-rose-hall-pump",
        typeName: "Water pump",
        name: "Main pressure pump",
        manufacturer: "Grundfos",
        modelNumber: "SCALA2",
        serialNumber: "PUMP-RH-2201",
      },
      jobTitle: "Low water pressure",
      quoteTitle: "Pump pressure repair",
      balanceDue: "125000",
    },
    {
      id: "cust-seaview-rentals",
      displayName: "Seaview Rentals",
      type: "LANDLORD",
      status: "PROSPECT",
      primaryName: "Devon Clarke",
      phone: "+18765550146",
      email: "devon@seaviewrentals.example",
      notesSummary: "Landlord has multiple rental units and wants preventive inspection pricing.",
      location: {
        id: "loc-seaview-rental",
        label: "Rental property",
        addressLine1: "18 Ocean View Avenue",
        city: "Montego Bay",
        parish: "St. James",
        contactName: "Tenant contact: Alicia Green",
        contactPhone: "+18765550147",
        accessNotes: "Tenant must confirm access before dispatch.",
        preferredTimes: "Saturdays preferred",
      },
      asset: {
        id: "asset-seaview-water-heater",
        typeName: "Water heater",
        name: "Bathroom water heater",
        manufacturer: "Rheem",
        modelNumber: "RH-40",
        serialNumber: "WH-SV-0040",
      },
      jobTitle: "Water heater not heating",
      quoteTitle: "Water heater element replacement",
      balanceDue: "0",
    },
  ],
  ELECTRICAL: [
    {
      id: "cust-kingston-tech-park",
      displayName: "Kingston Tech Park",
      type: "COMMERCIAL",
      status: "ACTIVE",
      primaryName: "Rohan Ellis",
      phone: "+18765550188",
      email: "facilities@ktechpark.example",
      notesSummary: "Requires work permits and after-hours scheduling for panel work.",
      location: {
        id: "loc-kingston-tech-main",
        label: "Commercial site",
        addressLine1: "5 Innovation Drive",
        city: "Kingston",
        parish: "Kingston",
        contactName: "Rohan Ellis",
        contactPhone: "+18765550188",
        accessNotes: "Facilities desk issues work permits.",
        securityNotes: "Technicians need ID and PPE.",
        preferredTimes: "After 6:00 PM for shutdown work",
      },
      asset: {
        id: "asset-kingston-tech-panel",
        typeName: "Breaker panel",
        name: "Server room breaker panel",
        manufacturer: "Square D",
        modelNumber: "QO-225",
        serialNumber: "BP-KTP-225",
      },
      jobTitle: "Breaker tripping",
      quoteTitle: "Panel load balancing and breaker replacement",
      balanceDue: "315000",
    },
    {
      id: "cust-melissa-reid",
      displayName: "Melissa Reid",
      type: "TENANT",
      status: "ACTIVE",
      primaryName: "Melissa Reid",
      phone: "+18765550193",
      email: "melissa.reid@example.com",
      notesSummary: "Tenant can approve access; landlord approves quotes over JMD 25,000.",
      location: {
        id: "loc-melissa-apartment",
        label: "Rental property",
        addressLine1: "Apartment 3B, 12 Hope Road",
        city: "Kingston",
        parish: "St. Andrew",
        contactName: "Melissa Reid",
        contactPhone: "+18765550193",
        accessNotes: "Call from downstairs intercom.",
        securityNotes: "Building access code changes monthly.",
        preferredTimes: "Evenings after 5:30 PM",
      },
      asset: {
        id: "asset-melissa-outlet",
        typeName: "Outlet",
        name: "Kitchen GFCI outlet",
        manufacturer: "Leviton",
        modelNumber: "GFCI-20A",
        serialNumber: "OUT-MR-20A",
      },
      jobTitle: "Outlet not working",
      quoteTitle: "Kitchen outlet replacement",
      balanceDue: "0",
    },
  ],
};

async function main() {
  for (const [key, name, description] of roles) {
    await prisma.role.upsert({
      where: { key },
      update: { name, description },
      create: { key, name, description },
    });
  }

  const seededTemplates = new Map();

  for (const templateConfig of templates) {
    const template = await seedIndustryTemplate(templateConfig);
    seededTemplates.set(templateConfig.key, template);
  }

  const platformOwnerRole = await prisma.role.findUniqueOrThrow({
    where: { key: "PLATFORM_OWNER" },
  });
  const companyAdminRole = await prisma.role.findUniqueOrThrow({
    where: { key: "COMPANY_ADMIN" },
  });
  const dispatcherRole = await prisma.role.findUniqueOrThrow({
    where: { key: "DISPATCHER" },
  });
  const technicianRole = await prisma.role.findUniqueOrThrow({
    where: { key: "TECHNICIAN" },
  });

  const platformOwner = await prisma.user.upsert({
    where: { email: "owner@trexiti.example" },
    update: { name: "Trexiti Platform Owner", active: true },
    create: {
      email: "owner@trexiti.example",
      name: "Trexiti Platform Owner",
      externalAuthId: "seed_platform_owner",
      active: true,
    },
  });

  for (const company of demoCompanies) {
    const template = seededTemplates.get(company.templateKey);

    const organization = await prisma.organization.upsert({
      where: { slug: company.slug },
      update: {
        name: company.name,
        status: "ACTIVE",
        phone: company.phone,
        email: company.email,
        addressLine1: company.addressLine1,
        city: company.city,
        parish: company.parish,
        currency: "JMD",
        taxLabel: "GCT",
        taxRate: "15",
        industryTemplateId: template.id,
      },
      create: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        status: "ACTIVE",
        phone: company.phone,
        email: company.email,
        addressLine1: company.addressLine1,
        city: company.city,
        parish: company.parish,
        currency: "JMD",
        taxLabel: "GCT",
        taxRate: "15",
        industryTemplateId: template.id,
      },
    });

    await prisma.companySettings.upsert({
      where: { organizationId: organization.id },
      update: {
        businessPhone: company.phone,
        businessEmail: company.email,
        addressLine1: company.addressLine1,
        city: company.city,
        parish: company.parish,
        currency: "JMD",
        taxEnabled: true,
        taxLabel: "GCT",
        taxRate: "15",
        businessHours,
        numberOfTechnicians: company.numberOfTechnicians,
        onboardingCompletedAt: new Date(),
      },
      create: {
        organizationId: organization.id,
        businessPhone: company.phone,
        businessEmail: company.email,
        addressLine1: company.addressLine1,
        city: company.city,
        parish: company.parish,
        currency: "JMD",
        taxEnabled: true,
        taxLabel: "GCT",
        taxRate: "15",
        businessHours,
        numberOfTechnicians: company.numberOfTechnicians,
        onboardingCompletedAt: new Date(),
      },
    });

    await copyTemplateToCompany(organization.id, template.id, platformOwner.id);

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId_roleId: {
          organizationId: organization.id,
          userId: platformOwner.id,
          roleId: platformOwnerRole.id,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        userId: platformOwner.id,
        roleId: platformOwnerRole.id,
        title: "Trexiti Admin",
        joinedAt: new Date(),
      },
    });

    const admin = await prisma.user.upsert({
      where: { email: `admin@${company.slug}.example` },
      update: { name: `${company.name} Admin`, active: true },
      create: {
        email: `admin@${company.slug}.example`,
        name: `${company.name} Admin`,
        externalAuthId: `seed_${company.slug}_admin`,
        active: true,
      },
    });

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId_roleId: {
          organizationId: organization.id,
          userId: admin.id,
          roleId: companyAdminRole.id,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        userId: admin.id,
        roleId: companyAdminRole.id,
        title: "Company Admin",
        joinedAt: new Date(),
      },
    });

    const team = await seedDemoTeam(
      organization.id,
      company,
      dispatcherRole.id,
      technicianRole.id,
    );

    await seedDemoCustomers(
      organization.id,
      company.templateKey,
      team.dispatcher.id,
      team.technicians,
    );

    await prisma.activityLog.create({
      data: {
        organizationId: organization.id,
        actorId: platformOwner.id,
        entityType: "ORGANIZATION",
        entityId: organization.id,
        action: "seed.organization.created",
        message: `${company.name} demo tenant seeded.`,
        metadata: { industryTemplate: template.key },
      },
    });
  }

  await seedAdminCrm();
}

async function seedAdminCrm() {
  const externalAuthId = process.env.ADMIN_SEED_CLERK_USER_ID || "seed_admin_disabled";
  const admin = await prisma.adminUser.upsert({
    where: { email: process.env.ADMIN_SEED_EMAIL || "owner@trexiti.com" },
    update: {
      externalAuthId,
      name: "Al Neville Hall",
      role: "OWNER",
      active: Boolean(process.env.ADMIN_SEED_CLERK_USER_ID),
    },
    create: {
      externalAuthId,
      email: process.env.ADMIN_SEED_EMAIL || "owner@trexiti.com",
      name: "Al Neville Hall",
      role: "OWNER",
      active: Boolean(process.env.ADMIN_SEED_CLERK_USER_ID),
    },
  });
  await prisma.adminDailyTargetConfig.upsert({
    where: { userId: admin.id },
    update: {
      researchTarget: 10,
      personalizedOutreachTarget: 20,
      followUpTarget: 10,
    },
    create: {
      userId: admin.id,
      researchTarget: 10,
      personalizedOutreachTarget: 20,
      followUpTarget: 10,
    },
  });

  const fixtures = [
    {
      reference: "TRX-DEMO-001",
      company: {
        name: "Northstar Facilities Group",
        domain: "northstar-facilities.example",
        website: "https://northstar-facilities.example",
        industry: "Facilities Management",
        country: "Jamaica",
        estimatedSize: "50–100 employees",
      },
      contact: {
        name: "Maya Bennett",
        title: "Operations Director",
        email: "maya@northstar-facilities.example",
      },
      opportunity: {
        direction: "OUTBOUND",
        stage: "DISCOVERY",
        type: "OPERATIONS_PLATFORM",
        title: "Multi-team operations platform",
        source: "Seed data — fictional account",
        identifiedProblem:
          "Scheduling, work ownership, technician submissions, and invoice follow-up are fragmented across spreadsheets and messaging threads.",
        opportunity:
          "A unified operating layer connecting customer records, jobs, dispatch, field updates, finance, and management reporting.",
        estimatedValue: 42000,
        budget: "$25,000–$50,000",
        timeline: "3–6 months",
        probability: 50,
        nextAction: "Prepare a process-mapping agenda for the discovery workshop.",
        reasonForContact:
          "The operating model has enough coordination complexity to benefit from an integrated system.",
        personalizationAngle:
          "Reference the company’s multi-location service coverage and the operational cost of fragmented dispatch.",
      },
      scores: [5, 3, 5, 4, 4],
    },
    {
      reference: "TRX-DEMO-002",
      company: {
        name: "Harbour Health Network",
        domain: "harbour-health.example",
        website: "https://harbour-health.example",
        industry: "Healthcare",
        country: "Caribbean",
        estimatedSize: "20–50 employees",
      },
      contact: {
        name: "Andre Lewis",
        title: "Managing Director",
        email: "andre@harbour-health.example",
      },
      opportunity: {
        direction: "INBOUND",
        stage: "PROPOSAL",
        type: "CUSTOMER_PORTAL",
        title: "Patient access and booking platform",
        source: "Seed data — fictional account",
        identifiedProblem:
          "Patients cannot reliably coordinate appointments, documents, payments, and follow-up through one experience.",
        opportunity:
          "Design a secure patient-facing portal connected to scheduling, practitioner workflows, billing, and notifications.",
        estimatedValue: 30000,
        budget: "$25,000–$50,000",
        timeline: "3–6 months",
        probability: 65,
        nextAction: "Confirm proposal scope and data-handling boundaries.",
        reasonForContact: "Inbound project qualification identified a defined service and operational need.",
        personalizationAngle: "Keep the proposal centered on patient experience and operational governance.",
      },
      scores: [4, 4, 4, 4, 5],
    },
    {
      reference: "TRX-DEMO-003",
      company: {
        name: "Cedar Point Developments",
        domain: "cedar-point-developments.example",
        website: "https://cedar-point-developments.example",
        industry: "Property Development",
        country: "Jamaica",
        estimatedSize: "10–20 employees",
      },
      contact: {
        name: "Sofia Grant",
        title: "Commercial Lead",
        email: "sofia@cedar-point-developments.example",
      },
      opportunity: {
        direction: "OUTBOUND",
        stage: "CONTACTED",
        type: "PROPERTY_PLATFORM",
        title: "Development sales and buyer platform",
        source: "Seed data — fictional account",
        identifiedProblem:
          "The current digital presence does not connect inventory, lead qualification, broker communication, documents, or payment schedules.",
        opportunity:
          "A premium development experience supported by buyer CRM, residence availability, document workflows, and sales visibility.",
        estimatedValue: 18500,
        budget: "$10,000–$25,000",
        timeline: "1–3 months",
        probability: 10,
        nextAction: "Send a concise observation about the residence enquiry journey.",
        reasonForContact: "A visible conversion problem connects directly to sales operations.",
        personalizationAngle: "Use the active development positioning; avoid generic website language.",
      },
      scores: [4, 5, 3, 3, 3],
    },
  ];

  for (const fixture of fixtures) {
    const company = await prisma.adminCompany.upsert({
      where: { domain: fixture.company.domain },
      update: { ...fixture.company, status: "ACTIVE" },
      create: { ...fixture.company, status: "TARGET" },
    });
    const contact = await prisma.adminContact.upsert({
      where: {
        companyId_email: {
          companyId: company.id,
          email: fixture.contact.email,
        },
      },
      update: { ...fixture.contact, isDecisionMaker: true },
      create: {
        companyId: company.id,
        ...fixture.contact,
        isDecisionMaker: true,
      },
    });
    await prisma.adminContactMethod.createMany({
      data: [
        {
          contactId: contact.id,
          channel: "EMAIL",
          value: fixture.contact.email,
          label: "Work email",
          preferred: true,
        },
        {
          contactId: contact.id,
          channel: "LINKEDIN",
          value: `https://linkedin.com/in/${fixture.contact.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          label: "LinkedIn",
        },
      ],
      skipDuplicates: true,
    });
    const opportunity = await prisma.adminOpportunity.upsert({
      where: { reference: fixture.reference },
      update: {
        companyId: company.id,
        primaryContactId: contact.id,
        assignedOwnerId: admin.id,
        ...fixture.opportunity,
      },
      create: {
        reference: fixture.reference,
        companyId: company.id,
        primaryContactId: contact.id,
        assignedOwnerId: admin.id,
        ...fixture.opportunity,
      },
    });
    const [financialCapacityScore, problemSeverityScore, strategicFitScore, urgencyScore, decisionMakerAccessScore] = fixture.scores;
    const totalScore = fixture.scores.reduce((sum, score) => sum + score, 0);
    await prisma.adminProspectResearch.upsert({
      where: { opportunityId: opportunity.id },
      update: {
        financialCapacityScore,
        problemSeverityScore,
        strategicFitScore,
        urgencyScore,
        decisionMakerAccessScore,
        totalScore,
        currentWebsiteQuality: 3,
        operationalMaturity: 3,
        observedProblems: fixture.opportunity.identifiedProblem,
        recentBusinessActivity: "Fictional seed activity used to exercise the research workflow.",
        notes: "Fictional research notes for interface and workflow testing.",
        websiteReviewed: true,
        mobileReviewed: true,
        businessModelUnderstood: true,
        decisionMakerIdentified: true,
        specificProblemIdentified: true,
        personalizationPrepared: true,
        contactMethodFound: true,
        readyForOutreachAt: new Date(),
      },
      create: {
        opportunityId: opportunity.id,
        financialCapacityScore,
        problemSeverityScore,
        strategicFitScore,
        urgencyScore,
        decisionMakerAccessScore,
        totalScore,
        currentWebsiteQuality: 3,
        operationalMaturity: 3,
        observedProblems: fixture.opportunity.identifiedProblem,
        recentBusinessActivity: "Fictional seed activity used to exercise the research workflow.",
        notes: "Fictional research notes for interface and workflow testing.",
        websiteReviewed: true,
        mobileReviewed: true,
        businessModelUnderstood: true,
        decisionMakerIdentified: true,
        specificProblemIdentified: true,
        personalizationPrepared: true,
        contactMethodFound: true,
        readyForOutreachAt: new Date(),
      },
    });

    await prisma.adminTask.deleteMany({ where: { opportunityId: opportunity.id } });
    await prisma.adminActivity.deleteMany({ where: { opportunityId: opportunity.id } });
    await prisma.adminMessage.deleteMany({ where: { opportunityId: opportunity.id } });
    await prisma.adminOutreachSequence.deleteMany({ where: { opportunityId: opportunity.id } });
    await prisma.adminOpportunityNote.deleteMany({ where: { opportunityId: opportunity.id } });

    const dueAt = new Date(Date.now() + (fixtures.indexOf(fixture) - 1) * 24 * 60 * 60 * 1000);
    await prisma.adminTask.create({
      data: {
        opportunityId: opportunity.id,
        companyId: company.id,
        contactId: contact.id,
        ownerId: admin.id,
        type: fixture.opportunity.stage === "PROPOSAL" ? "PROPOSAL" : "FOLLOW_UP",
        priority: totalScore >= 20 ? "HIGH" : "MEDIUM",
        title: fixture.opportunity.nextAction,
        dueAt,
        notes: "Seed task for the fictional demonstration account.",
      },
    });
    await prisma.adminActivity.createMany({
      data: [
        {
          opportunityId: opportunity.id,
          actorId: admin.id,
          kind: "CREATED",
          summary: "Fictional demonstration opportunity created.",
        },
        {
          opportunityId: opportunity.id,
          actorId: admin.id,
          kind: "STAGE_CHANGED",
          summary: `Opportunity moved to ${fixture.opportunity.stage.toLowerCase()}.`,
        },
      ],
    });
    await prisma.adminOpportunityNote.create({
      data: {
        opportunityId: opportunity.id,
        authorId: admin.id,
        body: "This is fictional seed data for testing the Trexiti opportunity system.",
      },
    });
    if (fixture.reference === "TRX-DEMO-001") {
      const startedAt = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      const sequence = await prisma.adminOutreachSequence.create({
        data: { opportunityId: opportunity.id, startedAt },
      });
      const steps = await Promise.all([
        [1, 0, "Initial personalized outreach"],
        [2, 3, "Follow-up"],
        [3, 7, "Value follow-up / insight"],
        [4, 14, "Final follow-up"],
      ].map(([stepNumber, dayOffset, label]) =>
        prisma.adminOutreachStep.create({
          data: {
            sequenceId: sequence.id,
            stepNumber,
            dayOffset,
            label,
            scheduledFor: new Date(startedAt.getTime() + dayOffset * 24 * 60 * 60 * 1000),
            status: stepNumber === 1 ? "COMPLETED" : stepNumber === 2 ? "READY" : "PENDING",
            completedAt: stepNumber === 1 ? new Date(startedAt.getTime() + 2 * 60 * 60 * 1000) : null,
            channel: stepNumber === 1 ? "EMAIL" : null,
          },
        }),
      ));
      await prisma.adminMessage.create({
        data: {
          opportunityId: opportunity.id,
          recordedById: admin.id,
          sequenceStepId: steps[0].id,
          channel: "EMAIL",
          direction: "OUTBOUND",
          subject: "Initial personalized outreach",
          body: "Fictional example outreach recorded for workflow testing.",
          nextAction: fixture.opportunity.nextAction,
          occurredAt: steps[0].completedAt,
        },
      });
    } else {
      await prisma.adminMessage.create({
        data: {
          opportunityId: opportunity.id,
          recordedById: admin.id,
          channel: "EMAIL",
          direction: "OUTBOUND",
          subject: "Initial personalized outreach",
          body: "Fictional example outreach recorded for workflow testing.",
          nextAction: fixture.opportunity.nextAction,
        },
      });
    }
  }

  const proposalOpportunity = await prisma.adminOpportunity.findUnique({
    where: { reference: "TRX-DEMO-002" },
  });
  if (proposalOpportunity) {
    await prisma.adminProposal.upsert({
      where: {
        opportunityId_version: {
          opportunityId: proposalOpportunity.id,
          version: 1,
        },
      },
      update: {
        title: "Patient platform discovery and first release",
        amount: 30000,
        status: "SENT",
        sentAt: new Date(),
      },
      create: {
        opportunityId: proposalOpportunity.id,
        createdById: admin.id,
        version: 1,
        title: "Patient platform discovery and first release",
        amount: 30000,
        status: "SENT",
        sentAt: new Date(),
        validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        notes: "Fictional proposal used for interface and workflow testing.",
      },
    });
  }
}

async function seedDemoTeam(organizationId, company, dispatcherRoleId, technicianRoleId) {
  const dispatcher = await prisma.user.upsert({
    where: { email: `dispatch@${company.slug}.example` },
    update: { name: `${company.name} Dispatcher`, active: true },
    create: {
      email: `dispatch@${company.slug}.example`,
      name: `${company.name} Dispatcher`,
      externalAuthId: `seed_${company.slug}_dispatcher`,
      active: true,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId_roleId: {
        organizationId,
        userId: dispatcher.id,
        roleId: dispatcherRoleId,
      },
    },
    update: {},
    create: {
      organizationId,
      userId: dispatcher.id,
      roleId: dispatcherRoleId,
      title: "Dispatcher",
      joinedAt: new Date(),
    },
  });

  const technicians = [];
  const namesByIndustry = {
    APPLIANCE_HVAC: [
      ["Nia Roberts", "Kingston and St. Andrew", ["AC service", "Appliance repair"]],
      ["Dwayne Miller", "Portmore and Spanish Town", ["Commercial AC", "Refrigeration"]],
    ],
    PLUMBING: [
      ["Alicia Grant", "Montego Bay", ["Leak repair", "Pumps"]],
      ["Omar Bennett", "St. James and Trelawny", ["Drain cleaning", "Water heaters"]],
    ],
    ELECTRICAL: [
      ["Rohan Ellis", "Kingston", ["Panels", "Fault diagnosis"]],
      ["Keisha Morgan", "St. Andrew", ["Wiring", "Generator connections"]],
    ],
  };
  const technicianConfigs = namesByIndustry[company.templateKey] ?? namesByIndustry.APPLIANCE_HVAC;

  for (const [index, [name, serviceArea, skills]] of technicianConfigs.entries()) {
    const emailName = name.toLowerCase().replace(/[^a-z]+/g, ".");
    const user = await prisma.user.upsert({
      where: { email: `${emailName}@${company.slug}.example` },
      update: {
        name,
        phone: `+18765550${180 + index}`,
        active: true,
      },
      create: {
        email: `${emailName}@${company.slug}.example`,
        name,
        phone: `+18765550${180 + index}`,
        externalAuthId: `seed_${company.slug}_tech_${index + 1}`,
        active: true,
      },
    });

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId_roleId: {
          organizationId,
          userId: user.id,
          roleId: technicianRoleId,
        },
      },
      update: {},
      create: {
        organizationId,
        userId: user.id,
        roleId: technicianRoleId,
        title: "Technician",
        joinedAt: new Date(),
      },
    });

    const profile = await prisma.technicianProfile.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        },
      },
      update: {
        displayName: name,
        phone: user.phone,
        serviceArea,
        skills,
        active: true,
      },
      create: {
        organizationId,
        userId: user.id,
        displayName: name,
        phone: user.phone,
        serviceArea,
        skills,
        active: true,
      },
    });

    technicians.push(profile);
  }

  return { dispatcher, technicians };
}

async function seedDemoCustomers(organizationId, templateKey, actorId, technicians = []) {
  const customers = demoCustomersByCompany[templateKey] ?? [];
  const statuses = await seedWorkOrderStatuses(organizationId);

  for (const [index, customerConfig] of customers.entries()) {
    const customer = await prisma.customer.upsert({
      where: { id: customerConfig.id },
      update: {
        organizationId,
        displayName: customerConfig.displayName,
        type: customerConfig.type,
        status: customerConfig.status,
        primaryName: customerConfig.primaryName,
        phone: customerConfig.phone,
        whatsapp: customerConfig.phone,
        email: customerConfig.email,
        source: "Demo seed",
        tags: customerConfig.type === "COMMERCIAL" ? ["Commercial", "Account terms"] : ["Service customer"],
        notesSummary: customerConfig.notesSummary,
      },
      create: {
        id: customerConfig.id,
        organizationId,
        displayName: customerConfig.displayName,
        type: customerConfig.type,
        status: customerConfig.status,
        primaryName: customerConfig.primaryName,
        phone: customerConfig.phone,
        whatsapp: customerConfig.phone,
        email: customerConfig.email,
        source: "Demo seed",
        tags: customerConfig.type === "COMMERCIAL" ? ["Commercial", "Account terms"] : ["Service customer"],
        notesSummary: customerConfig.notesSummary,
      },
    });

    const location = await prisma.customerLocation.upsert({
      where: { id: customerConfig.location.id },
      update: {
        organizationId,
        customerId: customer.id,
        label: customerConfig.location.label,
        addressLine1: customerConfig.location.addressLine1,
        city: customerConfig.location.city,
        parish: customerConfig.location.parish,
        country: "Jamaica",
        mapUrl: "https://maps.google.com",
        accessNotes: customerConfig.location.accessNotes,
        contactName: customerConfig.location.contactName,
        contactPhone: customerConfig.location.contactPhone,
        securityNotes: customerConfig.location.securityNotes,
        preferredTimes: customerConfig.location.preferredTimes,
      },
      create: {
        id: customerConfig.location.id,
        organizationId,
        customerId: customer.id,
        label: customerConfig.location.label,
        addressLine1: customerConfig.location.addressLine1,
        city: customerConfig.location.city,
        parish: customerConfig.location.parish,
        country: "Jamaica",
        mapUrl: "https://maps.google.com",
        accessNotes: customerConfig.location.accessNotes,
        contactName: customerConfig.location.contactName,
        contactPhone: customerConfig.location.contactPhone,
        securityNotes: customerConfig.location.securityNotes,
        preferredTimes: customerConfig.location.preferredTimes,
      },
    });

    const assetType = await prisma.assetType.upsert({
      where: {
        organizationId_slug: {
          organizationId,
          slug: slugify(customerConfig.asset.typeName),
        },
      },
      update: {
        name: customerConfig.asset.typeName,
      },
      create: {
        organizationId,
        name: customerConfig.asset.typeName,
        slug: slugify(customerConfig.asset.typeName),
      },
    });

    const asset = await prisma.asset.upsert({
      where: { id: customerConfig.asset.id },
      update: {
        organizationId,
        customerId: customer.id,
        customerLocationId: location.id,
        assetTypeId: assetType.id,
        name: customerConfig.asset.name,
        manufacturer: customerConfig.asset.manufacturer,
        modelNumber: customerConfig.asset.modelNumber,
        serialNumber: customerConfig.asset.serialNumber,
        installedAt: new Date("2025-02-12T00:00:00.000Z"),
        warrantyExpiresAt: new Date("2027-02-12T00:00:00.000Z"),
        warrantyStatus: customerConfig.balanceDue === "0" ? "Unknown" : "Under warranty",
        lastServiceAt: new Date("2026-06-20T18:00:00.000Z"),
        notesSummary: "Seeded equipment profile with industry-specific custom fields.",
        status: "ACTIVE",
        customFields: assetCustomFields(templateKey, customerConfig.asset.typeName),
      },
      create: {
        id: customerConfig.asset.id,
        organizationId,
        customerId: customer.id,
        customerLocationId: location.id,
        assetTypeId: assetType.id,
        name: customerConfig.asset.name,
        manufacturer: customerConfig.asset.manufacturer,
        modelNumber: customerConfig.asset.modelNumber,
        serialNumber: customerConfig.asset.serialNumber,
        installedAt: new Date("2025-02-12T00:00:00.000Z"),
        warrantyExpiresAt: new Date("2027-02-12T00:00:00.000Z"),
        warrantyStatus: customerConfig.balanceDue === "0" ? "Unknown" : "Under warranty",
        lastServiceAt: new Date("2026-06-20T18:00:00.000Z"),
        notesSummary: "Seeded equipment profile with industry-specific custom fields.",
        status: "ACTIVE",
        customFields: assetCustomFields(templateKey, customerConfig.asset.typeName),
      },
    });

    const serviceCategoryName = serviceCategoryForJob(templateKey, customerConfig.jobTitle);
    const serviceCategory = await prisma.serviceCategory.upsert({
      where: {
        organizationId_slug: {
          organizationId,
          slug: slugify(serviceCategoryName),
        },
      },
      update: {
        name: serviceCategoryName,
      },
      create: {
        organizationId,
        name: serviceCategoryName,
        slug: slugify(serviceCategoryName),
      },
    });
    const assignedStatus = statuses.get("assigned") ?? statuses.get("scheduled");
    const newRequestStatus = statuses.get("new-request");
    const inProgressStatus = statuses.get("in-progress");
    const awaitingPartsStatus = statuses.get("awaiting-parts");
    const awaitingQuoteStatus = statuses.get("awaiting-quote-approval");
    const completedStatus = statuses.get("completed");
    const primaryTechnician = technicians[index % Math.max(technicians.length, 1)];
    const secondaryTechnician = technicians[(index + 1) % Math.max(technicians.length, 1)];

    const openWorkOrder = await prisma.workOrder.upsert({
      where: { id: `${customer.id}-wo-open` },
      update: {
        organizationId,
        number: `WO-${templateKey.slice(0, 2)}${index + 1048}`,
        customerId: customer.id,
        customerLocationId: location.id,
        assetId: asset.id,
        serviceCategoryId: serviceCategory.id,
        statusId: (index % 2 === 0 ? inProgressStatus : assignedStatus).id,
        createdById: actorId,
        title: customerConfig.jobTitle,
        jobType: templateKey === "PLUMBING" ? "Repair" : "Diagnostic visit",
        priority: customerConfig.balanceDue === "0" ? "NORMAL" : "HIGH",
        source: index % 2 === 0 ? "WHATSAPP" : "PHONE",
        paymentStatus: customerConfig.balanceDue === "0" ? "PAID" : "PARTIALLY_PAID",
        customerComplaint: complaintForJob(templateKey, customerConfig.jobTitle),
        internalNotes: "Seeded active work order with realistic dispatch context.",
        requestedAt: new Date("2026-06-25T14:00:00.000Z"),
        preferredStart: new Date("2026-07-01T08:00:00.000Z"),
        preferredEnd: new Date("2026-07-01T12:00:00.000Z"),
        scheduledStart: new Date(`2026-07-01T${index % 2 === 0 ? "10:30" : "13:00"}:00.000Z`),
        scheduledEnd: new Date(`2026-07-01T${index % 2 === 0 ? "12:00" : "14:30"}:00.000Z`),
        estimatedDurationMin: 90,
        customFields: { seeded: true },
      },
      create: {
        id: `${customer.id}-wo-open`,
        organizationId,
        number: `WO-${templateKey.slice(0, 2)}${index + 1048}`,
        customerId: customer.id,
        customerLocationId: location.id,
        assetId: asset.id,
        serviceCategoryId: serviceCategory.id,
        statusId: (index % 2 === 0 ? inProgressStatus : assignedStatus).id,
        createdById: actorId,
        title: customerConfig.jobTitle,
        jobType: templateKey === "PLUMBING" ? "Repair" : "Diagnostic visit",
        priority: customerConfig.balanceDue === "0" ? "NORMAL" : "HIGH",
        source: index % 2 === 0 ? "WHATSAPP" : "PHONE",
        paymentStatus: customerConfig.balanceDue === "0" ? "PAID" : "PARTIALLY_PAID",
        customerComplaint: complaintForJob(templateKey, customerConfig.jobTitle),
        internalNotes: "Seeded active work order with realistic dispatch context.",
        requestedAt: new Date("2026-06-25T14:00:00.000Z"),
        preferredStart: new Date("2026-07-01T08:00:00.000Z"),
        preferredEnd: new Date("2026-07-01T12:00:00.000Z"),
        scheduledStart: new Date(`2026-07-01T${index % 2 === 0 ? "10:30" : "13:00"}:00.000Z`),
        scheduledEnd: new Date(`2026-07-01T${index % 2 === 0 ? "12:00" : "14:30"}:00.000Z`),
        estimatedDurationMin: 90,
        customFields: { seeded: true },
      },
    });

    await assignSeededWorkOrder(
      organizationId,
      openWorkOrder.id,
      primaryTechnician?.id,
      actorId,
      index % 2 === 0 ? "ACCEPTED" : "ASSIGNED",
    );

    const completedWorkOrder = await prisma.workOrder.upsert({
      where: { id: `${customer.id}-wo-complete` },
      update: {
        organizationId,
        number: `WO-${templateKey.slice(0, 2)}${index + 1018}`,
        customerId: customer.id,
        customerLocationId: location.id,
        assetId: asset.id,
        serviceCategoryId: serviceCategory.id,
        statusId: completedStatus.id,
        createdById: actorId,
        title: "Preventive service visit",
        jobType: "Preventive maintenance",
        priority: "NORMAL",
        source: "REPEAT_CUSTOMER",
        paymentStatus: "NOT_INVOICED",
        customerComplaint: "Scheduled preventive maintenance and condition check.",
        internalNotes: "Completed job intentionally left uninvoiced for reporting demo.",
        requestedAt: new Date("2026-06-03T13:00:00.000Z"),
        scheduledStart: new Date("2026-06-20T09:00:00.000Z"),
        scheduledEnd: new Date("2026-06-20T10:30:00.000Z"),
        estimatedDurationMin: 90,
        completedAt: new Date("2026-06-20T18:00:00.000Z"),
        customFields: { seeded: true },
      },
      create: {
        id: `${customer.id}-wo-complete`,
        organizationId,
        number: `WO-${templateKey.slice(0, 2)}${index + 1018}`,
        customerId: customer.id,
        customerLocationId: location.id,
        assetId: asset.id,
        serviceCategoryId: serviceCategory.id,
        statusId: completedStatus.id,
        createdById: actorId,
        title: "Preventive service visit",
        jobType: "Preventive maintenance",
        priority: "NORMAL",
        source: "REPEAT_CUSTOMER",
        paymentStatus: "NOT_INVOICED",
        customerComplaint: "Scheduled preventive maintenance and condition check.",
        internalNotes: "Completed job intentionally left uninvoiced for reporting demo.",
        requestedAt: new Date("2026-06-03T13:00:00.000Z"),
        scheduledStart: new Date("2026-06-20T09:00:00.000Z"),
        scheduledEnd: new Date("2026-06-20T10:30:00.000Z"),
        estimatedDurationMin: 90,
        completedAt: new Date("2026-06-20T18:00:00.000Z"),
        customFields: { seeded: true },
      },
    });

    await assignSeededWorkOrder(
      organizationId,
      completedWorkOrder.id,
      secondaryTechnician?.id,
      actorId,
      "COMPLETED",
    );

    const holdStatus = index % 2 === 0 ? awaitingPartsStatus : awaitingQuoteStatus;
    const holdWorkOrder = await prisma.workOrder.upsert({
      where: { id: `${customer.id}-wo-hold` },
      update: {
        organizationId,
        number: `WO-${templateKey.slice(0, 2)}${index + 1068}`,
        customerId: customer.id,
        customerLocationId: location.id,
        assetId: asset.id,
        serviceCategoryId: serviceCategory.id,
        statusId: holdStatus.id,
        createdById: actorId,
        title: index % 2 === 0 ? "Parts required follow-up" : "Quote approval follow-up",
        jobType: "Repair",
        priority: index % 2 === 0 ? "HIGH" : "NORMAL",
        source: "PHONE",
        paymentStatus: "NOT_INVOICED",
        customerComplaint:
          index % 2 === 0
            ? "Technician needs parts before the work can be completed."
            : "Customer is waiting on approval before work proceeds.",
        internalNotes: "Seeded hold-state work order for smart filters.",
        requestedAt: new Date("2026-06-24T13:00:00.000Z"),
        scheduledStart: new Date("2026-06-29T14:00:00.000Z"),
        scheduledEnd: new Date("2026-06-29T16:00:00.000Z"),
        estimatedDurationMin: 120,
        customFields: { seeded: true },
      },
      create: {
        id: `${customer.id}-wo-hold`,
        organizationId,
        number: `WO-${templateKey.slice(0, 2)}${index + 1068}`,
        customerId: customer.id,
        customerLocationId: location.id,
        assetId: asset.id,
        serviceCategoryId: serviceCategory.id,
        statusId: holdStatus.id,
        createdById: actorId,
        title: index % 2 === 0 ? "Parts required follow-up" : "Quote approval follow-up",
        jobType: "Repair",
        priority: index % 2 === 0 ? "HIGH" : "NORMAL",
        source: "PHONE",
        paymentStatus: "NOT_INVOICED",
        customerComplaint:
          index % 2 === 0
            ? "Technician needs parts before the work can be completed."
            : "Customer is waiting on approval before work proceeds.",
        internalNotes: "Seeded hold-state work order for smart filters.",
        requestedAt: new Date("2026-06-24T13:00:00.000Z"),
        scheduledStart: new Date("2026-06-29T14:00:00.000Z"),
        scheduledEnd: new Date("2026-06-29T16:00:00.000Z"),
        estimatedDurationMin: 120,
        customFields: { seeded: true },
      },
    });

    await assignSeededWorkOrder(
      organizationId,
      holdWorkOrder.id,
      secondaryTechnician?.id,
      actorId,
      "ASSIGNED",
    );

    await prisma.workOrder.upsert({
      where: { id: `${customer.id}-wo-unassigned` },
      update: {
        organizationId,
        number: `WO-${templateKey.slice(0, 2)}${index + 1088}`,
        customerId: customer.id,
        customerLocationId: location.id,
        assetId: asset.id,
        serviceCategoryId: serviceCategory.id,
        statusId: newRequestStatus.id,
        createdById: actorId,
        title: "Unassigned customer request",
        jobType: "Diagnostic visit",
        priority: index % 2 === 0 ? "URGENT" : "NORMAL",
        source: "WHATSAPP",
        paymentStatus: "NOT_INVOICED",
        customerComplaint: "Customer requested a callback and available technician assignment.",
        internalNotes: "Seeded unassigned overdue job for dispatcher smart filters.",
        requestedAt: new Date("2026-06-28T13:00:00.000Z"),
        preferredStart: new Date("2026-06-30T08:00:00.000Z"),
        preferredEnd: new Date("2026-06-30T12:00:00.000Z"),
        estimatedDurationMin: 90,
        customFields: { seeded: true },
      },
      create: {
        id: `${customer.id}-wo-unassigned`,
        organizationId,
        number: `WO-${templateKey.slice(0, 2)}${index + 1088}`,
        customerId: customer.id,
        customerLocationId: location.id,
        assetId: asset.id,
        serviceCategoryId: serviceCategory.id,
        statusId: newRequestStatus.id,
        createdById: actorId,
        title: "Unassigned customer request",
        jobType: "Diagnostic visit",
        priority: index % 2 === 0 ? "URGENT" : "NORMAL",
        source: "WHATSAPP",
        paymentStatus: "NOT_INVOICED",
        customerComplaint: "Customer requested a callback and available technician assignment.",
        internalNotes: "Seeded unassigned overdue job for dispatcher smart filters.",
        requestedAt: new Date("2026-06-28T13:00:00.000Z"),
        preferredStart: new Date("2026-06-30T08:00:00.000Z"),
        preferredEnd: new Date("2026-06-30T12:00:00.000Z"),
        estimatedDurationMin: 90,
        customFields: { seeded: true },
      },
    });

    const quote = await prisma.quote.upsert({
      where: {
        organizationId_number: {
          organizationId,
          number: `QT-${templateKey.slice(0, 2)}${index + 2039}`,
        },
      },
      update: {
        customerId: customer.id,
        customerLocationId: location.id,
        workOrderId: openWorkOrder.id,
        title: customerConfig.quoteTitle,
        status: "SENT",
        subtotal: customerConfig.balanceDue === "0" ? "45000" : customerConfig.balanceDue,
        taxAmount: "0",
        total: customerConfig.balanceDue === "0" ? "45000" : customerConfig.balanceDue,
        expiresAt: new Date("2026-07-10T17:00:00.000Z"),
      },
      create: {
        organizationId,
        number: `QT-${templateKey.slice(0, 2)}${index + 2039}`,
        customerId: customer.id,
        customerLocationId: location.id,
        workOrderId: openWorkOrder.id,
        title: customerConfig.quoteTitle,
        status: "SENT",
        subtotal: customerConfig.balanceDue === "0" ? "45000" : customerConfig.balanceDue,
        taxAmount: "0",
        total: customerConfig.balanceDue === "0" ? "45000" : customerConfig.balanceDue,
        expiresAt: new Date("2026-07-10T17:00:00.000Z"),
      },
    });

    const invoice = await prisma.invoice.upsert({
      where: {
        organizationId_number: {
          organizationId,
          number: `INV-${templateKey.slice(0, 2)}${index + 3044}`,
        },
      },
      update: {
        customerId: customer.id,
        customerLocationId: location.id,
        quoteId: quote.id,
        workOrderId: openWorkOrder.id,
        status: customerConfig.balanceDue === "0" ? "PAID" : "PARTIALLY_PAID",
        subtotal: customerConfig.balanceDue === "0" ? "87500" : customerConfig.balanceDue,
        taxAmount: "0",
        total: customerConfig.balanceDue === "0" ? "87500" : customerConfig.balanceDue,
        balanceDue: customerConfig.balanceDue,
        issuedAt: new Date("2026-06-21T15:00:00.000Z"),
        dueAt: new Date("2026-07-05T15:00:00.000Z"),
      },
      create: {
        organizationId,
        number: `INV-${templateKey.slice(0, 2)}${index + 3044}`,
        customerId: customer.id,
        customerLocationId: location.id,
        quoteId: quote.id,
        workOrderId: openWorkOrder.id,
        status: customerConfig.balanceDue === "0" ? "PAID" : "PARTIALLY_PAID",
        subtotal: customerConfig.balanceDue === "0" ? "87500" : customerConfig.balanceDue,
        taxAmount: "0",
        total: customerConfig.balanceDue === "0" ? "87500" : customerConfig.balanceDue,
        balanceDue: customerConfig.balanceDue,
        issuedAt: new Date("2026-06-21T15:00:00.000Z"),
        dueAt: new Date("2026-07-05T15:00:00.000Z"),
      },
    });

    await prisma.payment.upsert({
      where: { id: `${customer.id}-payment-1` },
      update: {
        organizationId,
        invoiceId: invoice.id,
        customerId: customer.id,
        status: "COMPLETED",
        method: "BANK_TRANSFER",
        amount: customerConfig.balanceDue === "0" ? "87500" : "50000",
        reference: `BANK-${customer.id.toUpperCase()}`,
        paidAt: new Date("2026-06-22T16:00:00.000Z"),
      },
      create: {
        id: `${customer.id}-payment-1`,
        organizationId,
        invoiceId: invoice.id,
        customerId: customer.id,
        status: "COMPLETED",
        method: "BANK_TRANSFER",
        amount: customerConfig.balanceDue === "0" ? "87500" : "50000",
        reference: `BANK-${customer.id.toUpperCase()}`,
        paidAt: new Date("2026-06-22T16:00:00.000Z"),
      },
    });

    await prisma.note.deleteMany({
      where: { organizationId, entityType: "CUSTOMER", entityId: customer.id },
    });
    await prisma.attachment.deleteMany({
      where: { organizationId, entityType: "CUSTOMER", entityId: customer.id },
    });
    await prisma.attachment.deleteMany({
      where: { organizationId, entityType: "ASSET", entityId: asset.id },
    });
    await prisma.activityLog.deleteMany({
      where: { organizationId, entityType: "CUSTOMER", entityId: customer.id },
    });
    await prisma.activityLog.deleteMany({
      where: { organizationId, entityType: "ASSET", entityId: asset.id },
    });

    await prisma.note.create({
      data: {
        organizationId,
        entityType: "CUSTOMER",
        entityId: customer.id,
        body: customerConfig.notesSummary,
        pinned: true,
      },
    });

    await prisma.attachment.create({
      data: {
        organizationId,
        entityType: "CUSTOMER",
        entityId: customer.id,
        fileName: `${slugify(customer.displayName)}-site-photo.jpg`,
        mimeType: "image/jpeg",
        url: "https://example.com/site-photo.jpg",
        sizeBytes: 142000,
      },
    });

    await prisma.attachment.create({
      data: {
        organizationId,
        entityType: "ASSET",
        entityId: asset.id,
        fileName: `${slugify(asset.name)}-asset-label.jpg`,
        mimeType: "image/jpeg",
        url: "https://example.com/asset-label.jpg",
        sizeBytes: 124000,
      },
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        entityType: "CUSTOMER",
        entityId: customer.id,
        action: "seed.customer.created",
        message: `${customer.displayName} demo customer seeded.`,
        metadata: { templateKey },
      },
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        actorId,
        entityType: "ASSET",
        entityId: asset.id,
        action: "seed.asset.created",
        message: `${asset.name} demo asset seeded.`,
        metadata: { templateKey, assetType: customerConfig.asset.typeName },
      },
    });
  }
}

async function seedIndustryTemplate(config) {
  const template = await prisma.industryTemplate.upsert({
    where: { key: config.key },
    update: {
      name: config.name,
      description: config.description,
      version: config.version,
      active: true,
      workflowLabels: config.workflowLabels,
      assetFieldSchema: { fields: config.assetFields.map((item) => item.name) },
      jobTypeDefaults: config.jobTypes.map((item) => item.name),
      quoteItemDefaults: config.quoteLineItems.map((item) => item.name),
      invoiceDefaults: config.invoiceDefaults,
    },
    create: {
      key: config.key,
      name: config.name,
      description: config.description,
      version: config.version,
      active: true,
      workflowLabels: config.workflowLabels,
      assetFieldSchema: { fields: config.assetFields.map((item) => item.name) },
      jobTypeDefaults: config.jobTypes.map((item) => item.name),
      quoteItemDefaults: config.quoteLineItems.map((item) => item.name),
      invoiceDefaults: config.invoiceDefaults,
    },
  });

  const checklistTemplates = await prisma.industryTechnicianChecklistTemplate.findMany({
    where: { industryTemplateId: template.id },
    select: { id: true },
  });
  const checklistTemplateIds = checklistTemplates.map((item) => item.id);

  await prisma.$transaction([
    prisma.industryTechnicianChecklistItem.deleteMany({
      where: { checklistTemplateId: { in: checklistTemplateIds } },
    }),
    prisma.industryTechnicianChecklistTemplate.deleteMany({
      where: { industryTemplateId: template.id },
    }),
    prisma.industryAssetField.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industryAssetType.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industryServiceCategory.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industryJobType.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industryJobStatus.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industryQuoteLineItem.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industryInvoiceTerm.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industryInventoryCategory.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industryIssueSymptom.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industryPriorityLabel.deleteMany({ where: { industryTemplateId: template.id } }),
    prisma.industrySlaResponseTime.deleteMany({ where: { industryTemplateId: template.id } }),
  ]);

  await prisma.industryServiceCategory.createMany({
    data: config.serviceCategories.map((name, sortOrder) => ({
      industryTemplateId: template.id,
      name,
      slug: slugify(name),
      sortOrder,
    })),
  });

  for (const [sortOrder, name] of config.assetTypes.entries()) {
    await prisma.industryAssetType.create({
      data: {
        industryTemplateId: template.id,
        name,
        slug: slugify(name),
        sortOrder,
      },
    });
  }

  await prisma.industryAssetField.createMany({
    data: config.assetFields.map((item, sortOrder) => ({
      industryTemplateId: template.id,
      name: item.name,
      slug: item.slug,
      type: item.type,
      required: item.required,
      options: item.options ? { values: item.options } : undefined,
      sortOrder,
    })),
  });

  await prisma.industryJobType.createMany({
    data: config.jobTypes.map((item, sortOrder) => ({
      industryTemplateId: template.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      defaultDurationMin: item.defaultDurationMin,
      sortOrder,
    })),
  });

  for (const [sortOrder, item] of config.checklists.entries()) {
    const checklistTemplate = await prisma.industryTechnicianChecklistTemplate.create({
      data: {
        industryTemplateId: template.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        jobTypeSlug: item.jobTypeSlug,
        sortOrder,
      },
    });

    await prisma.industryTechnicianChecklistItem.createMany({
      data: item.items.map((checklistItem, itemSortOrder) => ({
        checklistTemplateId: checklistTemplate.id,
        label: checklistItem.label,
        type: checklistItem.type,
        required: checklistItem.required,
        sortOrder: itemSortOrder,
      })),
    });
  }

  await prisma.industryJobStatus.createMany({
    data: config.jobStatuses.map((item, sortOrder) => ({
      industryTemplateId: template.id,
      name: item.name,
      slug: item.slug,
      lifecycle: item.lifecycle,
      color: item.color,
      sortOrder,
      isDefault: item.isDefault,
      isTerminal: item.isTerminal,
    })),
  });

  await prisma.industryQuoteLineItem.createMany({
    data: config.quoteLineItems.map((item, sortOrder) => ({
      industryTemplateId: template.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      defaultUnitPrice: item.defaultUnitPrice,
      taxable: item.taxable,
      sortOrder,
    })),
  });

  await prisma.industryInvoiceTerm.createMany({
    data: config.invoiceTerms.map((item, sortOrder) => ({
      industryTemplateId: template.id,
      name: item.name,
      slug: item.slug,
      terms: item.terms,
      dueDays: item.dueDays,
      sortOrder,
    })),
  });

  await prisma.industryInventoryCategory.createMany({
    data: config.inventoryCategories.map((item, sortOrder) => ({
      industryTemplateId: template.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      sortOrder,
    })),
  });

  await prisma.industryIssueSymptom.createMany({
    data: config.issueSymptoms.map((item, sortOrder) => ({
      industryTemplateId: template.id,
      name: item.name,
      slug: item.slug,
      serviceCategorySlug: item.serviceCategorySlug,
      priorityHint: item.priorityHint,
      sortOrder,
    })),
  });

  await prisma.industryPriorityLabel.createMany({
    data: config.priorityLabels.map((item, sortOrder) => ({
      industryTemplateId: template.id,
      name: item.name,
      slug: item.slug,
      color: item.color,
      level: item.level,
      description: item.description,
      sortOrder,
    })),
  });

  await prisma.industrySlaResponseTime.createMany({
    data: config.slaResponseTimes.map((item, sortOrder) => ({
      industryTemplateId: template.id,
      name: item.name,
      slug: item.slug,
      prioritySlug: item.prioritySlug,
      responseMinutes: item.responseMinutes,
      resolutionMinutes: item.resolutionMinutes,
      sortOrder,
    })),
  });

  return template;
}

async function copyTemplateToCompany(organizationId, industryTemplateId, actorId) {
  const template = await prisma.industryTemplate.findUniqueOrThrow({
    where: { id: industryTemplateId },
    include: {
      templateServiceCategories: true,
      templateJobTypes: true,
      templateAssetTypes: { include: { fields: true } },
      templateAssetFields: { where: { assetTypeId: null } },
      templateChecklistTemplates: { include: { items: true } },
      templateJobStatuses: true,
      templateQuoteLineItems: true,
      templateInvoiceTerms: true,
      templateInventoryCategories: true,
      templateIssueSymptoms: true,
      templatePriorityLabels: true,
      templateSlaResponseTimes: true,
    },
  });

  const companyChecklists = await prisma.companyTechnicianChecklistTemplate.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const companyChecklistIds = companyChecklists.map((item) => item.id);

  await prisma.$transaction(async (tx) => {
    await tx.companyTechnicianChecklistItem.deleteMany({
      where: { checklistTemplateId: { in: companyChecklistIds } },
    });
    await tx.companyTechnicianChecklistTemplate.deleteMany({ where: { organizationId } });
    await tx.companyAssetField.deleteMany({ where: { organizationId } });
    await tx.companyAssetType.deleteMany({ where: { organizationId } });
    await tx.companyServiceCategory.deleteMany({ where: { organizationId } });
    await tx.companyJobType.deleteMany({ where: { organizationId } });
    await tx.companyJobStatus.deleteMany({ where: { organizationId } });
    await tx.companyQuoteLineItem.deleteMany({ where: { organizationId } });
    await tx.companyInvoiceTerm.deleteMany({ where: { organizationId } });
    await tx.companyInventoryCategory.deleteMany({ where: { organizationId } });
    await tx.companyIssueSymptom.deleteMany({ where: { organizationId } });
    await tx.companyPriorityLabel.deleteMany({ where: { organizationId } });
    await tx.companySlaResponseTime.deleteMany({ where: { organizationId } });

    await tx.organization.update({
      where: { id: organizationId },
      data: { industryTemplateId },
    });

    await tx.companyIndustrySettings.upsert({
      where: { organizationId },
      update: {
        sourceIndustryTemplateId: industryTemplateId,
        sourceTemplateVersion: template.version,
        copiedAt: new Date(),
      },
      create: {
        organizationId,
        sourceIndustryTemplateId: industryTemplateId,
        sourceTemplateVersion: template.version,
      },
    });

    for (const category of template.templateServiceCategories) {
      await tx.companyServiceCategory.create({
        data: {
          organizationId,
          sourceTemplateConfigId: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          sortOrder: category.sortOrder,
          active: category.active,
        },
      });
    }

    for (const item of template.templateJobTypes) {
      await tx.companyJobType.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          defaultDurationMin: item.defaultDurationMin,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    for (const item of template.templateAssetTypes) {
      await tx.companyAssetType.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    for (const item of template.templateAssetFields) {
      await tx.companyAssetField.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          type: item.type,
          required: item.required,
          options: item.options,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    for (const checklist of template.templateChecklistTemplates) {
      const copiedChecklist = await tx.companyTechnicianChecklistTemplate.create({
        data: {
          organizationId,
          sourceTemplateConfigId: checklist.id,
          name: checklist.name,
          slug: checklist.slug,
          description: checklist.description,
          jobTypeSlug: checklist.jobTypeSlug,
          sortOrder: checklist.sortOrder,
          active: checklist.active,
        },
      });

      for (const item of checklist.items) {
        await tx.companyTechnicianChecklistItem.create({
          data: {
            checklistTemplateId: copiedChecklist.id,
            sourceTemplateConfigId: item.id,
            label: item.label,
            helpText: item.helpText,
            type: item.type,
            required: item.required,
            sortOrder: item.sortOrder,
            options: item.options,
          },
        });
      }
    }

    for (const item of template.templateJobStatuses) {
      await tx.companyJobStatus.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          lifecycle: item.lifecycle,
          color: item.color,
          sortOrder: item.sortOrder,
          isDefault: item.isDefault,
          isTerminal: item.isTerminal,
        },
      });
    }

    for (const item of template.templateQuoteLineItems) {
      await tx.companyQuoteLineItem.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          defaultQuantity: item.defaultQuantity,
          defaultUnitPrice: item.defaultUnitPrice,
          taxable: item.taxable,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    for (const item of template.templateInvoiceTerms) {
      await tx.companyInvoiceTerm.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          terms: item.terms,
          dueDays: item.dueDays,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    for (const item of template.templateInventoryCategories) {
      await tx.companyInventoryCategory.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    for (const item of template.templateIssueSymptoms) {
      await tx.companyIssueSymptom.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          serviceCategorySlug: item.serviceCategorySlug,
          priorityHint: item.priorityHint,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    for (const item of template.templatePriorityLabels) {
      await tx.companyPriorityLabel.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          color: item.color,
          level: item.level,
          description: item.description,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    for (const item of template.templateSlaResponseTimes) {
      await tx.companySlaResponseTime.create({
        data: {
          organizationId,
          sourceTemplateConfigId: item.id,
          name: item.name,
          slug: item.slug,
          prioritySlug: item.prioritySlug,
          responseMinutes: item.responseMinutes,
          resolutionMinutes: item.resolutionMinutes,
          description: item.description,
          sortOrder: item.sortOrder,
          active: item.active,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        organizationId,
        actorId,
        entityType: "ORGANIZATION",
        entityId: organizationId,
        action: "industry_template.copied",
        message: `${template.name} template copied into company settings.`,
        metadata: {
          industryTemplateId,
          sourceTemplateVersion: template.version,
        },
      },
    });
  });
}

async function seedWorkOrderStatuses(organizationId) {
  const statuses = new Map();

  for (const [sortOrder, item] of defaultStatuses.entries()) {
    const saved = await prisma.workOrderStatus.upsert({
      where: {
        organizationId_slug: {
          organizationId,
          slug: item.slug,
        },
      },
      update: {
        name: item.name,
        lifecycle: item.lifecycle,
        color: item.color,
        sortOrder,
        isDefault: item.isDefault,
        isTerminal: item.isTerminal,
      },
      create: {
        organizationId,
        name: item.name,
        slug: item.slug,
        lifecycle: item.lifecycle,
        color: item.color,
        sortOrder,
        isDefault: item.isDefault,
        isTerminal: item.isTerminal,
      },
    });

    statuses.set(saved.slug, saved);
  }

  return statuses;
}

async function assignSeededWorkOrder(
  organizationId,
  workOrderId,
  technicianProfileId,
  assignedById,
  statusValue,
) {
  await prisma.workOrderAssignment.deleteMany({
    where: { organizationId, workOrderId },
  });

  if (!technicianProfileId) {
    return;
  }

  await prisma.workOrderAssignment.create({
    data: {
      organizationId,
      workOrderId,
      technicianProfileId,
      assignedById,
      status: statusValue,
    },
  });
}

function serviceCategoryForJob(templateKey, title) {
  const normalized = title.toLowerCase();

  if (templateKey === "APPLIANCE_HVAC") {
    if (normalized.includes("washer")) return "Washing machine repair";
    if (normalized.includes("fridge") || normalized.includes("refrigerator")) return "Refrigerator repair";
    if (normalized.includes("maintenance")) return "Preventive maintenance";
    return "AC repair";
  }

  if (templateKey === "PLUMBING") {
    if (normalized.includes("pressure") || normalized.includes("pump")) return "Pump repair";
    if (normalized.includes("heater")) return "Water heater service";
    if (normalized.includes("drain")) return "Drain cleaning";
    return "Leak repair";
  }

  if (normalized.includes("breaker") || normalized.includes("panel")) return "Breaker panel service";
  if (normalized.includes("outlet")) return "Outlet installation";
  if (normalized.includes("generator")) return "Generator connection";
  return "Fault diagnosis";
}

function complaintForJob(templateKey, title) {
  const normalized = title.toLowerCase();

  if (templateKey === "APPLIANCE_HVAC") {
    if (normalized.includes("washer")) {
      return "Customer reports water leaking during the spin cycle and wants a technician after lunch.";
    }

    return "Customer reports the unit is running but not cooling the room properly.";
  }

  if (templateKey === "PLUMBING") {
    if (normalized.includes("pressure")) {
      return "Customer reports low water pressure across the upper floor and intermittent pump cycling.";
    }

    return "Customer reports fixture issue and wants the leak checked before further damage occurs.";
  }

  if (normalized.includes("breaker")) {
    return "Customer reports breaker tripping repeatedly under load and needs a safety check.";
  }

  return "Customer reports the electrical point is not working and needs diagnosis.";
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function field(name, type, required = false, options) {
  return {
    name,
    slug: slugify(name),
    type,
    required,
    options,
  };
}

function status(name, lifecycle, color, options = {}) {
  return {
    name,
    slug: slugify(name),
    lifecycle,
    color,
    isDefault: options.isDefault ?? false,
    isTerminal: options.isTerminal ?? false,
  };
}

function priority(name, color, level, description) {
  return {
    name,
    slug: slugify(name),
    color,
    level,
    description,
  };
}

function sla(name, prioritySlug, responseMinutes, resolutionMinutes) {
  return {
    name,
    slug: slugify(name),
    prioritySlug,
    responseMinutes,
    resolutionMinutes,
  };
}

function jobType(name, defaultDurationMin, description) {
  return {
    name,
    slug: slugify(name),
    defaultDurationMin,
    description,
  };
}

function checklist(name, jobTypeSlug, labels) {
  return {
    name,
    slug: slugify(name),
    jobTypeSlug,
    description: `${name} technician workflow.`,
    items: labels.map((label) => ({
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

function quoteItem(name, description, defaultUnitPrice) {
  return {
    name,
    slug: slugify(name),
    description,
    defaultUnitPrice,
    taxable: true,
  };
}

function invoiceTerm(name, terms, dueDays) {
  return {
    name,
    slug: slugify(name),
    terms,
    dueDays,
  };
}

function inventoryCategory(name, description) {
  return {
    name,
    slug: slugify(name),
    description,
  };
}

function symptom(name, serviceCategorySlug, priorityHint) {
  return {
    name,
    slug: slugify(name),
    serviceCategorySlug,
    priorityHint,
  };
}

function assetCustomFields(templateKey, assetTypeName) {
  const assetSlug = slugify(assetTypeName);

  if (templateKey === "APPLIANCE_HVAC" && assetSlug.includes("ac")) {
    return {
      btu: "24000",
      acType: assetTypeName,
      refrigerantType: "R410A",
      indoorUnitLocation: "Living room",
      outdoorUnitLocation: "North wall",
      lastCleaningDate: "2026-06-20",
    };
  }

  if (templateKey === "APPLIANCE_HVAC" && assetSlug.includes("washing")) {
    return {
      errorCode: "E4",
      drainingIssue: "Intermittent",
      spinningIssue: "No",
      waterIntakeIssue: "Slow fill",
    };
  }

  if (templateKey === "PLUMBING" && assetSlug.includes("pump")) {
    return {
      horsepower: "1.5",
      waterSource: "Tank",
      pressureIssue: "Low pressure at upper floor",
      lastServiceDate: "2026-06-20",
    };
  }

  if (templateKey === "PLUMBING" && assetSlug.includes("heater")) {
    return {
      capacity: "40 gallon",
      fuelType: "Electric",
      installationDate: "2025-02-12",
      leakIssue: "No active leak",
    };
  }

  if (templateKey === "ELECTRICAL" && assetSlug.includes("panel")) {
    return {
      amperage: "225",
      phase: "Three phase",
      numberOfBreakers: "36",
      faultSymptom: "Breaker tripping under server load",
    };
  }

  if (templateKey === "ELECTRICAL" && assetSlug.includes("outlet")) {
    return {
      roomArea: "Kitchen",
      loadType: "Small appliance",
      faultSymptom: "No power at outlet",
    };
  }

  return {
    condition: "Good",
    customerComplaint: "Seeded demo equipment record.",
  };
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
