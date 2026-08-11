import { z } from "zod";

import {
  companyStageOptions,
  engagementShapeOptions,
  existingSystemOptions,
  investmentContextOptions,
  preferredContactMethodOptions,
  projectObjectiveOptions,
  projectTypeOptions,
  timelineOptions,
} from "@/lib/content/project-qualification";

const requiredText = (label: string, maximum: number) =>
  z
    .string()
    .trim()
    .min(2, `${label} is required.`)
    .max(maximum, `${label} is too long.`);

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum, "This value is too long.");

const optionalIsoTimestamp = z
  .string()
  .trim()
  .max(40, "This timestamp is too long.")
  .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
    message: "This attribution timestamp is invalid.",
  });

const optionalWebsite = z
  .string()
  .trim()
  .max(240, "Website is too long.")
  .refine(
    (value) => {
      if (!value) return true;
      try {
        return /^https?:$/.test(new URL(value).protocol);
      } catch {
        return false;
      }
    },
    { message: "Enter a complete website address, including https://" },
  );

export const projectLeadSubmissionSchema = z
  .object({
    formToken: z.string().min(40).max(500),
    companyFax: z.string().max(200).default(""),
    projectType: z.enum(projectTypeOptions, {
      error: "Choose what should be improved, replaced, or built.",
    }),
    objectives: z
      .array(z.enum(projectObjectiveOptions))
      .min(1, "Choose at least one objective.")
      .max(projectObjectiveOptions.length),
    otherObjective: optionalText(240).default(""),
    companyName: requiredText("Company name", 160),
    companyWebsite: optionalWebsite.default(""),
    industry: requiredText("Industry", 120),
    companyStage: z.enum(companyStageOptions, {
      error: "Choose the company stage.",
    }),
    teamSize: optionalText(80).default(""),
    location: requiredText("Primary location", 160),
    customerServiceArea: requiredText("Customer service area", 240),
    currentState: z
      .string()
      .trim()
      .min(40, "Please share a little more about how this works today.")
      .max(5000, "Current state must be 5,000 characters or fewer."),
    friction: z
      .string()
      .trim()
      .min(40, "Please share a little more about where the friction appears.")
      .max(5000, "Friction must be 5,000 characters or fewer."),
    existingSystems: z
      .array(z.enum(existingSystemOptions))
      .min(1, "Choose at least one current system.")
      .max(existingSystemOptions.length),
    otherSystem: optionalText(240).default(""),
    importantTools: optionalText(1000).default(""),
    engagementShape: z.enum(engagementShapeOptions, {
      error: "Choose the closest engagement boundary.",
    }),
    investmentContext: z.enum(investmentContextOptions, {
      error: "Choose the closest investment context.",
    }),
    investmentNotes: optionalText(240).default(""),
    timeline: z.enum(timelineOptions, {
      error: "Choose a timing option.",
    }),
    name: requiredText("Name", 120),
    email: z
      .string()
      .trim()
      .email("Enter a valid work email address.")
      .max(254, "Email is too long."),
    phone: optionalText(40).default(""),
    role: requiredText("Role", 120),
    preferredContactMethod: z.enum(preferredContactMethodOptions, {
      error: "Choose a preferred contact method.",
    }),
    consent: z.boolean().refine(Boolean, {
      message: "Consent is required before submitting.",
    }),
    firstTouchSource: optionalText(120).default(""),
    firstTouchMedium: optionalText(120).default(""),
    firstTouchCampaign: optionalText(160).default(""),
    firstTouchContent: optionalText(160).default(""),
    firstTouchTerm: optionalText(160).default(""),
    firstTouchAt: optionalIsoTimestamp.default(""),
    lastTouchSource: optionalText(120).default(""),
    lastTouchMedium: optionalText(120).default(""),
    lastTouchCampaign: optionalText(160).default(""),
    lastTouchContent: optionalText(160).default(""),
    lastTouchTerm: optionalText(160).default(""),
    lastTouchAt: optionalIsoTimestamp.default(""),
    landingPage: optionalText(500).default(""),
    referrer: optionalText(500).default(""),
    isReturning: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.objectives.includes("Other") && !value.otherObjective) {
      context.addIssue({
        code: "custom",
        path: ["otherObjective"],
        message: "Tell us what else you want to improve.",
      });
    }

    if (value.existingSystems.includes("Other") && !value.otherSystem) {
      context.addIssue({
        code: "custom",
        path: ["otherSystem"],
        message: "Tell us which other system is in use.",
      });
    }
  });

export type ProjectLeadSubmission = z.infer<
  typeof projectLeadSubmissionSchema
>;

export const systemsReviewSubmissionSchema = z.object({
  formToken: z.string().min(40).max(500),
  companyFax: z.string().max(200).default(""),
  companyName: requiredText("Company name", 160),
  name: requiredText("Name", 120),
  email: z
    .string()
    .trim()
    .email("Enter a valid work email address.")
    .max(254, "Email is too long."),
  role: requiredText("Role", 120),
  companyWebsite: optionalWebsite.default(""),
  workflowProblem: z
    .string()
    .trim()
    .min(20, "Describe the workflow or problem in a little more detail.")
    .max(5000, "Workflow or problem must be 5,000 characters or fewer."),
  currentTools: z
    .string()
    .trim()
    .min(2, "List the current tools, even if the answer is not sure.")
    .max(1500, "Current tools must be 1,500 characters or fewer."),
  desiredOutcome: z
    .string()
    .trim()
    .min(10, "Describe the outcome the business needs.")
    .max(3000, "Desired outcome must be 3,000 characters or fewer."),
  companyStage: z.enum(companyStageOptions, {
    error: "Choose the company stage.",
  }),
  preferredContactMethod: z.enum(preferredContactMethodOptions, {
    error: "Choose a preferred contact method.",
  }),
  consent: z.boolean().refine(Boolean, {
    message: "Consent is required before submitting.",
  }),
  firstTouchSource: optionalText(120).default(""),
  firstTouchMedium: optionalText(120).default(""),
  firstTouchCampaign: optionalText(160).default(""),
  firstTouchContent: optionalText(160).default(""),
  firstTouchTerm: optionalText(160).default(""),
  firstTouchAt: optionalIsoTimestamp.default(""),
  lastTouchSource: optionalText(120).default(""),
  lastTouchMedium: optionalText(120).default(""),
  lastTouchCampaign: optionalText(160).default(""),
  lastTouchContent: optionalText(160).default(""),
  lastTouchTerm: optionalText(160).default(""),
  lastTouchAt: optionalIsoTimestamp.default(""),
  landingPage: optionalText(500).default(""),
  referrer: optionalText(500).default(""),
  isReturning: z.boolean().default(false),
});

export type SystemsReviewSubmission = z.infer<
  typeof systemsReviewSubmissionSchema
>;
