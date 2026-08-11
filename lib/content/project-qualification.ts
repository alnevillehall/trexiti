export const qualificationSteps = [
  { number: "01", label: "Project" },
  { number: "02", label: "Objectives" },
  { number: "03", label: "Business" },
  { number: "04", label: "Challenge" },
  { number: "05", label: "Systems" },
  { number: "06", label: "Investment" },
  { number: "07", label: "Timeline" },
  { number: "08", label: "Contact" },
] as const;

export const projectTypeOptions = [
  "Website / Digital Experience",
  "Business System",
  "Custom Software",
  "Customer Portal",
  "Automation / Integration",
  "Not Sure Yet",
] as const;

export const projectObjectiveOptions = [
  "Generate more leads",
  "Improve customer experience",
  "Replace manual processes",
  "Connect disconnected systems",
  "Improve operational visibility",
  "Launch a new product",
  "Modernize existing software",
  "Reduce repetitive work",
  "Other",
] as const;

export const existingSystemOptions = [
  "Spreadsheets",
  "WhatsApp",
  "Email",
  "CRM",
  "Accounting software",
  "ERP",
  "Paper/manual processes",
  "Custom software",
  "Other",
] as const;

export const budgetOptions = [
  "$3,000 – $5,000",
  "$5,000 – $10,000",
  "$10,000 – $25,000",
  "$25,000 – $50,000",
  "$50,000+",
  "Not sure yet",
] as const;

export const timelineOptions = [
  "Immediately",
  "1–2 months",
  "3–6 months",
  "6+ months",
  "Exploring",
] as const;

export const companySizeOptions = [
  "1–10 people",
  "11–50 people",
  "51–200 people",
  "201–500 people",
  "501+ people",
  "Pre-launch / forming",
] as const;

export type ProjectType = (typeof projectTypeOptions)[number];
export type ProjectObjective = (typeof projectObjectiveOptions)[number];
export type ExistingSystem = (typeof existingSystemOptions)[number];
export type BudgetRange = (typeof budgetOptions)[number];
export type ProjectTimeline = (typeof timelineOptions)[number];
export type CompanySize = (typeof companySizeOptions)[number];
