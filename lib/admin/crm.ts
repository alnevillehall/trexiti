import type {
  AdminOpportunityStage,
  AdminOpportunityType,
  AdminTaskPriority,
  AdminTaskStatus,
  AdminTaskType,
} from "@prisma/client";

export const opportunityStages: readonly AdminOpportunityStage[] = [
  "RESEARCHING",
  "CONTACTED",
  "REPLIED",
  "QUALIFIED",
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export const opportunityStageLabels: Record<AdminOpportunityStage, string> = {
  RESEARCHING: "Researching",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  QUALIFIED: "Qualified",
  DISCOVERY: "Discovery",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export const opportunityTypes: readonly AdminOpportunityType[] = [
  "WEBSITE_REDESIGN",
  "PROPERTY_PLATFORM",
  "CUSTOMER_PORTAL",
  "BUSINESS_SYSTEM",
  "OPERATIONS_PLATFORM",
  "CRM",
  "AUTOMATION",
  "INTEGRATION",
  "CUSTOM_SOFTWARE",
  "OTHER",
];

export const opportunityTypeLabels: Record<AdminOpportunityType, string> = {
  WEBSITE_REDESIGN: "Website Redesign",
  PROPERTY_PLATFORM: "Property Platform",
  CUSTOMER_PORTAL: "Customer Portal",
  BUSINESS_SYSTEM: "Business System",
  OPERATIONS_PLATFORM: "Operations Platform",
  CRM: "CRM",
  AUTOMATION: "Automation",
  INTEGRATION: "Integration",
  CUSTOM_SOFTWARE: "Custom Software",
  OTHER: "Other",
};

export const taskTypes: readonly AdminTaskType[] = [
  "CALL",
  "EMAIL",
  "LINKEDIN",
  "RESEARCH",
  "PROPOSAL",
  "FOLLOW_UP",
  "MEETING",
];

export const taskTypeLabels: Record<AdminTaskType, string> = {
  CALL: "Call",
  EMAIL: "Email",
  LINKEDIN: "LinkedIn",
  RESEARCH: "Research",
  PROPOSAL: "Proposal",
  FOLLOW_UP: "Follow Up",
  MEETING: "Meeting",
};

export const taskPriorities: readonly AdminTaskPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export const taskPriorityLabels: Record<AdminTaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const taskStatusLabels: Record<AdminTaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const stageProbability: Record<AdminOpportunityStage, number> = {
  RESEARCHING: 5,
  CONTACTED: 10,
  REPLIED: 20,
  QUALIFIED: 35,
  DISCOVERY: 50,
  PROPOSAL: 65,
  NEGOTIATION: 80,
  WON: 100,
  LOST: 0,
};

export const manualOutreachPlan = [
  { stepNumber: 1, dayOffset: 0, label: "Initial personalized outreach" },
  { stepNumber: 2, dayOffset: 3, label: "Follow-up" },
  { stepNumber: 3, dayOffset: 7, label: "Value follow-up / insight" },
  { stepNumber: 4, dayOffset: 14, label: "Final follow-up" },
] as const;

export type ResearchChecklist = {
  websiteReviewed: boolean;
  mobileReviewed: boolean;
  businessModelUnderstood: boolean;
  decisionMakerIdentified: boolean;
  specificProblemIdentified: boolean;
  personalizationPrepared: boolean;
  contactMethodFound: boolean;
};

export function isProspectReady(checklist: ResearchChecklist) {
  return [
    checklist.websiteReviewed,
    checklist.mobileReviewed,
    checklist.businessModelUnderstood,
    checklist.decisionMakerIdentified,
    checklist.specificProblemIdentified,
    checklist.personalizationPrepared,
    checklist.contactMethodFound,
  ].every(Boolean);
}

export type OpportunityScoreInput = {
  financialCapacityScore: number;
  problemSeverityScore: number;
  strategicFitScore: number;
  urgencyScore: number;
  decisionMakerAccessScore: number;
};

export function calculateOpportunityScore(input: OpportunityScoreInput) {
  return (
    input.financialCapacityScore +
    input.problemSeverityScore +
    input.strategicFitScore +
    input.urgencyScore +
    input.decisionMakerAccessScore
  );
}

export function opportunityHeat(score: number) {
  if (score >= 20) return "HOT" as const;
  if (score >= 15) return "WARM" as const;
  return "LOW" as const;
}

export function opportunityHeatLabel(score: number) {
  const heat = opportunityHeat(score);
  return heat === "LOW" ? "LOW PRIORITY" : heat;
}

export function normalizeDomain(website: string) {
  const withProtocol = website.match(/^https?:\/\//i)
    ? website
    : `https://${website}`;
  const url = new URL(withProtocol);
  return url.hostname.toLowerCase().replace(/^www\./, "");
}

export function formatAdminCurrency(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatAdminDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatAdminDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
