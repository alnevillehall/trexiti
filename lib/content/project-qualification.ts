export const qualificationSteps = [
  { number: "01", label: "Primary need" },
  { number: "02", label: "Objective" },
  { number: "03", label: "Business" },
  { number: "04", label: "Current state" },
  { number: "05", label: "Friction" },
  { number: "06", label: "Systems" },
  { number: "07", label: "Boundary" },
  { number: "08", label: "Investment" },
  { number: "09", label: "Timing" },
  { number: "10", label: "Contact" },
] as const;

export const projectTypeOptions = [
  "Customer Visibility / Trexiti Discover",
  "Website / Customer Experience",
  "Operations / Automation",
  "Custom Software",
  "Not Sure Yet",
] as const;

export const projectObjectiveOptions = [
  "Generate or qualify more demand",
  "Improve customer experience",
  "Replace a manual process",
  "Connect disconnected tools",
  "Improve operational visibility",
  "Track work, invoices or payments",
  "Launch a new digital product",
  "Modernize an existing system",
  "Save staff time",
  "Other",
] as const;

export const companyStageOptions = [
  "Early",
  "Established",
  "Growing",
  "Multi-team",
  "Enterprise",
  "Not sure",
] as const;

export const existingSystemOptions = [
  "Spreadsheets",
  "WhatsApp",
  "Email",
  "Paper / manual records",
  "Calendar",
  "CRM",
  "Accounting software",
  "ERP",
  "Ecommerce platform",
  "Booking software",
  "Custom software",
  "Other",
] as const;

export const engagementShapeOptions = [
  "Focused Build",
  "Connected Experience",
  "Custom System",
  "Systems Partnership",
  "Help Me Scope It",
] as const;

export const engagementShapeDescriptions: Record<
  (typeof engagementShapeOptions)[number],
  string
> = {
  "Focused Build": "One contained improvement with a clear business outcome.",
  "Connected Experience":
    "A website or customer journey connected to CRM, booking, payments, communication or operations.",
  "Custom System": "A purpose-built application or operating platform.",
  "Systems Partnership":
    "Ongoing analysis, development, integration and improvement.",
  "Help Me Scope It":
    "Trexiti should recommend the smallest sensible starting point.",
};

export const investmentContextOptions = [
  "I have a defined range",
  "I need Trexiti to recommend a sensible scope",
  "I want to begin with the smallest valuable phase",
  "This is a strategic initiative with flexible scope",
] as const;

export const timelineOptions = [
  "As soon as a sound plan is ready",
  "Within 1–2 months",
  "Within 3–6 months",
  "More than 6 months",
  "Exploring / no fixed date",
] as const;

export const preferredContactMethodOptions = [
  "Work email",
  "Phone call",
  "WhatsApp",
] as const;

export type ProjectType = (typeof projectTypeOptions)[number];
export type ProjectObjective = (typeof projectObjectiveOptions)[number];
export type CompanyStage = (typeof companyStageOptions)[number];
export type ExistingSystem = (typeof existingSystemOptions)[number];
export type EngagementShape = (typeof engagementShapeOptions)[number];
export type InvestmentContext = (typeof investmentContextOptions)[number];
export type ProjectTimeline = (typeof timelineOptions)[number];
export type PreferredContactMethod =
  (typeof preferredContactMethodOptions)[number];
