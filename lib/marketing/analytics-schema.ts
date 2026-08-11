import type { AttributionState } from "@/lib/marketing/attribution";

export type MarketingEventProperty = string | number | boolean;

export type MarketingEventMap = {
  page_view: Record<string, never>;
  primary_cta_clicked: { cta_id: string; destination: string; placement: string };
  start_project_clicked: { destination: string; placement: string };
  project_form_view: Record<string, never>;
  project_form_started: { step: number };
  project_form_step_completed: { step: number; step_name: string };
  project_form_submitted: {
    engagement_shape: string;
    investment_context: string;
    project_type: string;
    timeline: string;
  };
  project_form_error: { error_type: string; error_count?: number; step?: number };
  engagement_shape_selected: { engagement_shape: string };
  systems_review_view: Record<string, never>;
  systems_review_form_started: Record<string, never>;
  systems_review_submitted: { company_stage: string };
  friction_checklist_started: Record<string, never>;
  friction_checklist_completed: { score_tier: string };
  friction_checklist_tier: { tier: string };
  friction_checklist_email_requested: { tier: string };
  insight_view: { slug: string };
  insight_cta_clicked: { destination: string; placement: string; slug: string };
  capability_statement_view: Record<string, never>;
  capability_statement_print: Record<string, never>;
  capability_statement_download: { format: string; method: string };
  media_kit_view: Record<string, never>;
  asset_download: { asset: string };
  email_link_clicked: { placement: string };
  whatsapp_link_clicked: { placement: string };
  social_link_clicked: { placement: string; platform: string };
  case_study_view: { slug: string };
  outbound_audit_link_viewed: { campaign: string };
};

export type MarketingEventName = keyof MarketingEventMap;
export type MarketingEventProperties<EventName extends MarketingEventName> =
  MarketingEventMap[EventName];

export type MarketingEventDetail<EventName extends MarketingEventName = MarketingEventName> = {
  event: EventName;
  route: string;
  properties: MarketingEventProperties<EventName>;
};

export type MarketingEventEnvelope = MarketingEventDetail & {
  attribution: AttributionState;
  occurredAt: string;
  sessionId: string;
};

export const marketingEventPropertyAllowList = {
  page_view: [],
  primary_cta_clicked: ["cta_id", "destination", "placement"],
  start_project_clicked: ["destination", "placement"],
  project_form_view: [],
  project_form_started: ["step"],
  project_form_step_completed: ["step", "step_name"],
  project_form_submitted: ["engagement_shape", "investment_context", "project_type", "timeline"],
  project_form_error: ["error_type", "error_count", "step"],
  engagement_shape_selected: ["engagement_shape"],
  systems_review_view: [],
  systems_review_form_started: [],
  systems_review_submitted: ["company_stage"],
  friction_checklist_started: [],
  friction_checklist_completed: ["score_tier"],
  friction_checklist_tier: ["tier"],
  friction_checklist_email_requested: ["tier"],
  insight_view: ["slug"],
  insight_cta_clicked: ["destination", "placement", "slug"],
  capability_statement_view: [],
  capability_statement_print: [],
  capability_statement_download: ["format", "method"],
  media_kit_view: [],
  asset_download: ["asset"],
  email_link_clicked: ["placement"],
  whatsapp_link_clicked: ["placement"],
  social_link_clicked: ["placement", "platform"],
  case_study_view: ["slug"],
  outbound_audit_link_viewed: ["campaign"],
} as const satisfies Record<MarketingEventName, readonly string[]>;

export const marketingEventNames = Object.freeze(
  Object.keys(marketingEventPropertyAllowList) as MarketingEventName[],
);

export function isMarketingEventName(value: unknown): value is MarketingEventName {
  return typeof value === "string" && value in marketingEventPropertyAllowList;
}
