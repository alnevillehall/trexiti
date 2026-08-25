import { z } from "zod";

export const aiCitationSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1).max(240),
  observedAt: z.string().datetime(),
});

export const discoveredProspectSchema = z.object({
  companyName: z.string().min(2).max(200),
  domain: z.string().min(3).max(255),
  website: z.string().url(),
  industry: z.string().min(2).max(160),
  country: z.string().min(2).max(120),
  observedBusinessNeed: z.string().min(20).max(1_500),
  recentBusinessActivity: z.string().max(1_500).nullable(),
  contact: z
    .object({
      name: z.string().max(200).nullable(),
      title: z.string().max(200).nullable(),
      email: z.string().email().nullable(),
      phone: z.string().max(80).nullable(),
      linkedInUrl: z.string().url().nullable(),
    })
    .nullable(),
  reasonForContact: z.string().min(20).max(1_500),
  personalizationAngle: z.string().min(20).max(1_500),
  citations: z.array(aiCitationSchema).min(1).max(8),
});

export const prospectDiscoveryOutputSchema = z.object({
  summary: z.string().max(2_000),
  prospects: z.array(discoveredProspectSchema).max(75),
});

export const scoredProspectSchema = discoveredProspectSchema.extend({
  financialCapacityScore: z.number().int().min(1).max(5),
  problemSeverityScore: z.number().int().min(1).max(5),
  strategicFitScore: z.number().int().min(1).max(5),
  urgencyScore: z.number().int().min(1).max(5),
  decisionMakerAccessScore: z.number().int().min(1).max(5),
  scoreRationale: z.string().min(20).max(1_500),
});

export const prospectScoringOutputSchema = z.object({
  summary: z.string().max(2_000),
  prospects: z.array(scoredProspectSchema).max(75),
});

export const briefPrioritySchema = z.object({
  sourceId: z.string().min(1),
  kind: z.enum(["DECISION", "ACTION", "ALERT", "COMPLETED"]),
  severity: z.enum(["INFO", "ATTENTION", "HIGH", "CRITICAL"]),
  title: z.string().min(3).max(180),
  rationale: z.string().min(10).max(1_200),
  nextAction: z.string().max(600).nullable(),
});

export const dailyBriefOutputSchema = z.object({
  headline: z.string().min(3).max(180),
  summary: z.string().min(20).max(3_000),
  priorities: z.array(briefPrioritySchema).max(5),
});

export type AiCitation = z.infer<typeof aiCitationSchema>;
export type DiscoveredProspect = z.infer<typeof discoveredProspectSchema>;
export type ScoredProspect = z.infer<typeof scoredProspectSchema>;
export type DailyBriefOutput = z.infer<typeof dailyBriefOutputSchema>;

