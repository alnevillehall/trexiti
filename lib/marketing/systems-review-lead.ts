import type { SystemsReviewSubmission } from "@/lib/validation/project-lead";

function plainText(value: string) {
  return value.replace(/\u0000/g, "").replace(/\r\n?/g, "\n").trim();
}

export function buildSystemsReviewLeadData(
  value: SystemsReviewSubmission,
  fingerprint: string,
  consentedAt = new Date(),
) {
  const workflowProblem = plainText(value.workflowProblem);
  const currentTools = plainText(value.currentTools);
  const desiredOutcome = plainText(value.desiredOutcome);
  const qualificationSummary = [
    "Change: Systems Review",
    `Company stage: ${value.companyStage}`,
    `Workflow or problem: ${workflowProblem}`,
    `Current tools: ${currentTools}`,
    `Desired outcome: ${desiredOutcome}`,
  ].join("\n");

  return {
    name: plainText(value.name),
    email: value.email.toLowerCase(),
    phone: null,
    role: plainText(value.role),
    companyName: plainText(value.companyName),
    companyWebsite: value.companyWebsite || null,
    industry: "Not provided in Systems Review enquiry",
    companySize: null,
    companyStage: value.companyStage,
    teamSize: null,
    location: "Not provided in Systems Review enquiry",
    customerServiceArea: "Not provided in Systems Review enquiry",
    projectType: "SYSTEMS_REVIEW",
    objectives: ["Make the operating model visible", desiredOutcome],
    challenge: workflowProblem,
    currentState: workflowProblem,
    friction: workflowProblem,
    existingSystems: [currentTools],
    importantTools: currentTools,
    engagementShape: "Systems Review",
    budgetRange: "Not discussed in Systems Review enquiry",
    investmentContext: "Not discussed in Systems Review enquiry",
    investmentNotes: null,
    timeline: "To be discussed",
    preferredContactMethod: value.preferredContactMethod,
    consentedAt,
    source: "systems_review_page",
    utmSource: value.lastTouchSource || null,
    utmMedium: value.lastTouchMedium || null,
    utmCampaign: value.lastTouchCampaign || null,
    firstTouchSource: value.firstTouchSource || null,
    firstTouchMedium: value.firstTouchMedium || null,
    firstTouchCampaign: value.firstTouchCampaign || null,
    firstTouchContent: value.firstTouchContent || null,
    firstTouchTerm: value.firstTouchTerm || null,
    firstTouchAt: value.firstTouchAt ? new Date(value.firstTouchAt) : null,
    lastTouchSource: value.lastTouchSource || null,
    lastTouchMedium: value.lastTouchMedium || null,
    lastTouchCampaign: value.lastTouchCampaign || null,
    lastTouchContent: value.lastTouchContent || null,
    lastTouchTerm: value.lastTouchTerm || null,
    lastTouchAt: value.lastTouchAt ? new Date(value.lastTouchAt) : null,
    landingPage: value.landingPage || "/systems-review",
    referrer: value.referrer || null,
    isReturning: value.isReturning,
    qualificationSummary,
    nextAction:
      "Review the Systems Review enquiry and confirm a suitable review boundary.",
    requestFingerprint: fingerprint,
  };
}
