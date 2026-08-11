import { z } from "zod";

import {
  calculateOpportunityScore,
  normalizeDomain,
  opportunityStages,
  opportunityTypes,
  taskPriorities,
  taskTypes,
} from "@/lib/admin/crm";

const cleanText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || undefined)
    .optional();

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .transform((value) => {
    if (!value) return undefined;
    return value.match(/^https?:\/\//i) ? value : `https://${value}`;
  })
  .refine(
    (value) => !value || z.string().url().safeParse(value).success,
    "Enter a valid website URL.",
  );

const score = z.coerce.number().int().min(1).max(5);
const optionalRating = z
  .string()
  .trim()
  .transform((value) => (value ? Number(value) : undefined))
  .refine(
    (value) =>
      value === undefined ||
      (Number.isInteger(value) && value >= 1 && value <= 5),
    { message: "Ratings must be between 1 and 5." },
  );

const optionalId = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .refine((value) => !value || z.string().cuid().safeParse(value).success, {
    message: "Invalid record reference.",
  });

const optionalDateTime = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: "Enter a valid date and time.",
  });

export const createOpportunitySchema = z
  .object({
    companyName: cleanText(2, 160),
    website: optionalUrl,
    industry: cleanText(2, 100),
    country: cleanText(2, 100),
    estimatedCompanySize: optionalText(80),
    decisionMaker: cleanText(2, 120),
    decisionMakerTitle: optionalText(120),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    phone: optionalText(40),
    linkedInUrl: optionalUrl,
    instagramUrl: optionalUrl,
    whatsapp: optionalText(80),
    otherContactMethod: optionalText(200),
    opportunityType: z.enum(opportunityTypes),
    identifiedProblem: cleanText(10, 5000),
    opportunity: cleanText(10, 5000),
    estimatedProjectValue: z.coerce.number().min(0).max(100000000),
    budget: optionalText(120),
    timeline: optionalText(120),
    source: cleanText(2, 120),
    reasonForContact: cleanText(10, 3000),
    personalizationAngle: cleanText(10, 3000),
    currentWebsiteQuality: optionalRating,
    operationalMaturity: optionalRating,
    observedProblems: cleanText(10, 5000),
    recentBusinessActivity: optionalText(5000),
    researchNotes: optionalText(5000),
    nextFollowUp: optionalDateTime,
    financialCapacityScore: score,
    problemSeverityScore: score,
    strategicFitScore: score,
    urgencyScore: score,
    decisionMakerAccessScore: score,
  })
  .transform((value) => ({
    ...value,
    domain: value.website
      ? normalizeDomain(value.website)
      : `${value.companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}.unverified`,
    totalScore: calculateOpportunityScore(value),
  }));

export const updateOpportunitySchema = z
  .object({
    opportunityId: z.string().cuid(),
    stage: z.enum(opportunityStages),
    probability: z.coerce.number().int().min(0).max(100),
    estimatedProjectValue: z.coerce.number().min(0).max(100000000),
    budget: optionalText(120),
    timeline: optionalText(120),
    outcomeReason: optionalText(3000),
    nextAction: optionalText(2000),
    nextFollowUp: optionalDateTime,
    assignedOwnerId: optionalId,
  })
  .superRefine((value, context) => {
    if (["WON", "LOST"].includes(value.stage) && !value.outcomeReason) {
      context.addIssue({
        code: "custom",
        message: "Record a reason before closing an opportunity as won or lost.",
        path: ["outcomeReason"],
      });
    }
  });

export const moveOpportunitySchema = z
  .object({
    opportunityId: z.string().cuid(),
    stage: z.enum(opportunityStages),
  })
  .refine((value) => !["WON", "LOST"].includes(value.stage), {
    message: "Close won or lost opportunities from their detail page so the outcome reason is recorded.",
    path: ["stage"],
  });

export const archiveOpportunitySchema = z.object({
  opportunityId: z.string().cuid(),
});

export const convertProjectLeadSchema = z.object({
  projectLeadId: z.string().cuid(),
});

export const createTaskSchema = z.object({
  opportunityId: optionalId,
  companyId: optionalId,
  type: z.enum(taskTypes),
  priority: z.enum(taskPriorities),
  title: cleanText(3, 180),
  dueAt: z.string().trim().min(1),
  notes: optionalText(3000),
});

export const updateTaskStatusSchema = z.object({
  taskId: z.string().cuid(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]),
});

export const addOpportunityNoteSchema = z.object({
  opportunityId: z.string().cuid(),
  body: cleanText(2, 5000),
});

export const logMessageSchema = z.object({
  opportunityId: z.string().cuid(),
  channel: z.enum([
    "EMAIL",
    "LINKEDIN",
    "INSTAGRAM",
    "PHONE",
    "WHATSAPP",
    "REFERRAL",
    "OTHER",
  ]),
  direction: z.enum(["INBOUND", "OUTBOUND", "INTERNAL"]),
  subject: optionalText(200),
  body: cleanText(2, 10000),
  response: optionalText(10000),
  nextAction: optionalText(2000),
  needsAction: z.boolean().default(false),
});

export const updateResearchChecklistSchema = z.object({
  opportunityId: z.string().cuid(),
  websiteReviewed: z.boolean(),
  mobileReviewed: z.boolean(),
  businessModelUnderstood: z.boolean(),
  decisionMakerIdentified: z.boolean(),
  specificProblemIdentified: z.boolean(),
  personalizationPrepared: z.boolean(),
  contactMethodFound: z.boolean(),
});

export const updateProspectResearchSchema = z
  .object({
    opportunityId: z.string().cuid(),
    currentWebsiteQuality: optionalRating,
    operationalMaturity: optionalRating,
    observedProblems: cleanText(10, 5000),
    recentBusinessActivity: optionalText(5000),
    personalizationAngle: cleanText(10, 3000),
    researchNotes: optionalText(5000),
    financialCapacityScore: score,
    problemSeverityScore: score,
    strategicFitScore: score,
    urgencyScore: score,
    decisionMakerAccessScore: score,
  })
  .transform((value) => ({
    ...value,
    totalScore: calculateOpportunityScore(value),
  }));

export const startOutreachSequenceSchema = z.object({
  opportunityId: z.string().cuid(),
  startDate: z.string().trim().min(1),
});

export const completeOutreachStepSchema = z.object({
  stepId: z.string().cuid(),
  channel: z.enum([
    "EMAIL",
    "LINKEDIN",
    "INSTAGRAM",
    "PHONE",
    "WHATSAPP",
    "REFERRAL",
    "OTHER",
  ]),
  message: cleanText(2, 10000),
  response: optionalText(10000),
  nextAction: optionalText(2000),
});

export const updateDailyTargetsSchema = z.object({
  researchTarget: z.coerce.number().int().min(1).max(100),
  personalizedOutreachTarget: z.coerce.number().int().min(1).max(100),
  followUpTarget: z.coerce.number().int().min(1).max(100),
});

export const markMessageActionedSchema = z.object({
  messageId: z.string().cuid(),
});

export const opportunityFiltersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  stage: z.enum(opportunityStages).optional(),
  industry: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  minScore: z.coerce.number().int().min(5).max(25).optional(),
  minValue: z.coerce.number().min(0).optional(),
  followUp: z.enum(["overdue", "today", "upcoming"]).optional(),
  readiness: z.enum(["ready", "incomplete"]).optional(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
