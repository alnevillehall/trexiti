export type FrictionScore = 0 | 1 | 2;

export type FrictionAnswerMap = Record<string, FrictionScore>;

export const frictionScoreOptions = [
  { value: 0 as const, label: "Rarely or never" },
  { value: 1 as const, label: "Sometimes" },
  { value: 2 as const, label: "Frequently" },
] as const;

export const frictionChecklistSections = [
  {
    id: "customer-sales",
    title: "Customer and sales",
    questions: [
      "Customer enquiries arrive through several channels without one shared record.",
      "Follow-up depends on a person remembering or checking old messages.",
      "Customers repeat information they have already supplied.",
      "Management cannot easily see which enquiries became sales.",
    ],
    nextActions: [
      "Choose one enquiry path and define the record created when it begins.",
      "Assign a clear owner and response rule for every qualified enquiry.",
      "Connect source, status and commercial outcome in one visible flow.",
    ],
  },
  {
    id: "work-operations",
    title: "Work and operations",
    questions: [
      "Staff repeatedly enter the same information into different tools.",
      "Ownership of the next action is sometimes unclear.",
      "Job, project or request status is difficult to confirm quickly.",
      "Work slows down significantly when one key employee is absent.",
      "Exceptions are handled through private messages rather than a visible workflow.",
    ],
    nextActions: [
      "Map one workflow from trigger to completed outcome.",
      "Name the owner, required information and visible status at every handoff.",
      "Document the common exceptions instead of designing only the ideal path.",
    ],
  },
  {
    id: "information-tools",
    title: "Information and tools",
    questions: [
      "Important information lives across spreadsheets, WhatsApp, email, paper or notes.",
      "Different teams maintain different versions of the same record.",
      "The business has software that is underused because it does not fit the workflow.",
      "Reports require manual reconciliation between systems.",
      "It is unclear which system should be the source of truth.",
    ],
    nextActions: [
      "List the tools involved and the role each one should continue to play.",
      "Define the authoritative source for customer, work and financial information.",
      "Evaluate what should be kept, connected, replaced or deliberately built.",
    ],
  },
  {
    id: "finance-management",
    title: "Finance and management",
    questions: [
      "Completed work does not always lead to an invoice promptly.",
      "Outstanding balances are difficult to see in one place.",
      "Management reporting takes too long to assemble.",
      "Decisions are delayed because reliable information is unavailable.",
    ],
    nextActions: [
      "Connect completion, invoicing and payment as explicit operating events.",
      "Define the small set of measures management needs to trust regularly.",
      "Build reporting from governed workflow data rather than manual summaries.",
    ],
  },
  {
    id: "experience-growth",
    title: "Customer experience and growth",
    questions: [
      "The website is disconnected from the sales or operating process behind it.",
      "Current systems would struggle if customer or work volume doubled.",
    ],
    nextActions: [
      "Trace what happens immediately after a visitor, buyer or customer acts.",
      "Carry submitted context into the sales or operating record instead of asking twice.",
      "Identify the first capacity limit that growth would expose.",
    ],
  },
] as const;

export type FrictionSectionId =
  (typeof frictionChecklistSections)[number]["id"];

export const frictionResultTiers = [
  {
    minimum: 0,
    maximum: 8,
    label: "Contained friction",
    explanation:
      "The operating model is generally stable. Focus on one or two recurring problems before adding new technology.",
  },
  {
    minimum: 9,
    maximum: 18,
    label: "Growing coordination cost",
    explanation:
      "Manual handoffs and fragmented context are creating avoidable work. A focused workflow review or integration may create meaningful leverage.",
  },
  {
    minimum: 19,
    maximum: 30,
    label: "System fragmentation",
    explanation:
      "Several areas depend on people carrying information between tools. Map one end-to-end workflow and define the source of truth before buying more software.",
  },
  {
    minimum: 31,
    maximum: 40,
    label: "Operating model at risk",
    explanation:
      "Fragmentation is likely affecting customer experience, visibility, speed and financial control. A structured Systems Review should become a near-term priority.",
  },
] as const;

export const frictionQuestionCount = frictionChecklistSections.reduce(
  (total, section) => total + section.questions.length,
  0,
);

export function frictionQuestionId(sectionId: string, index: number) {
  return `${sectionId}-${index + 1}`;
}

export function scoreFrictionChecklist(answers: FrictionAnswerMap) {
  return Object.values(answers).reduce<number>((total, score) => total + score, 0);
}

export function getFrictionResultTier(score: number) {
  const boundedScore = Math.min(40, Math.max(0, score));
  return frictionResultTiers.find(
    (tier) => boundedScore >= tier.minimum && boundedScore <= tier.maximum,
  )!;
}

export function getHighestFrictionSection(answers: FrictionAnswerMap) {
  return frictionChecklistSections
    .map((section) => ({
      id: section.id,
      title: section.title,
      score: section.questions.reduce(
        (total, _, index) =>
          total + (answers[frictionQuestionId(section.id, index)] ?? 0),
        0,
      ),
      maximum: section.questions.length * 2,
      nextActions: section.nextActions,
    }))
    .sort(
      (left, right) =>
        right.score / right.maximum - left.score / left.maximum ||
        right.score - left.score,
    )[0]!;
}

export function getChecklistResult(answers: FrictionAnswerMap) {
  const score = scoreFrictionChecklist(answers);
  return {
    score,
    tier: getFrictionResultTier(score),
    highestSection: getHighestFrictionSection(answers),
  };
}
