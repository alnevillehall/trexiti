import { z } from "zod";

import {
  budgetOptions,
  companySizeOptions,
  existingSystemOptions,
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

export const projectLeadSubmissionSchema = z
  .object({
    formToken: z.string().min(40).max(500),
    companyFax: z.string().max(200).default(""),
    projectType: z.enum(projectTypeOptions, {
      error: "Choose what you are looking to build.",
    }),
    objectives: z
      .array(z.enum(projectObjectiveOptions))
      .min(1, "Choose at least one objective.")
      .max(projectObjectiveOptions.length),
    otherObjective: optionalText(240).default(""),
    companyName: requiredText("Company name", 160),
    companyWebsite: z
      .string()
      .trim()
      .max(240, "Website is too long.")
      .url("Enter a complete website address, including https://")
      .refine((value) => /^https?:\/\//i.test(value), {
        message: "Website must begin with http:// or https://",
      }),
    industry: requiredText("Industry", 120),
    companySize: z.enum(companySizeOptions, {
      error: "Choose a company size.",
    }),
    location: requiredText("Primary location", 160),
    challenge: z
      .string()
      .trim()
      .min(40, "Please share a little more about the challenge.")
      .max(5000, "Challenge must be 5,000 characters or fewer."),
    existingSystems: z
      .array(z.enum(existingSystemOptions))
      .min(1, "Choose at least one existing system.")
      .max(existingSystemOptions.length),
    otherSystem: optionalText(240).default(""),
    budgetRange: z.enum(budgetOptions, {
      error: "Choose an investment range.",
    }),
    timeline: z.enum(timelineOptions, {
      error: "Choose a timeline.",
    }),
    name: requiredText("Name", 120),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .max(254, "Email is too long."),
    phone: optionalText(40).default(""),
    role: requiredText("Role", 120),
    consent: z.boolean().refine(Boolean, {
      message: "Consent is required before submitting.",
    }),
    utmSource: optionalText(120).default(""),
    utmMedium: optionalText(120).default(""),
    utmCampaign: optionalText(160).default(""),
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
