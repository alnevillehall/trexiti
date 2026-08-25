import type {
  Currency,
  PolicyThresholds,
  PriorityView,
  SafeOperationInput,
} from "../domain";

export type MutationContext = {
  actorId: string | null;
  correlationId: string;
  idempotencyKey: string;
  evidence?: unknown;
};

export type CreateProjectInput = MutationContext & {
  companyId: string;
  opportunityId?: string | null;
  ownerId?: string | null;
  title: string;
  description?: string | null;
  status?: "PLANNED" | "ACTIVE" | "ON_HOLD";
  startAt?: Date | null;
  targetEndAt?: Date | null;
};

export type UpdateProjectInput = MutationContext & {
  projectId: string;
  expectedVersion: number;
  changes: Partial<{
    ownerId: string | null;
    title: string;
    description: string | null;
    status: "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
    healthOverride: "ON_TRACK" | "ATTENTION" | "AT_RISK" | null;
    healthOverrideReason: string | null;
    startAt: Date | null;
    targetEndAt: Date | null;
    completedAt: Date | null;
    lastProgressAt: Date | null;
    activeBlocker: string | null;
    progressPercent: number;
  }>;
};

export type CreateMilestoneInput = MutationContext & {
  projectId: string;
  dependencyMilestoneId?: string | null;
  title: string;
  description?: string | null;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED";
  dueAt?: Date | null;
  sortOrder?: number;
};

export type UpdateMilestoneInput = MutationContext & {
  milestoneId: string;
  expectedVersion: number;
  changes: Partial<{
    dependencyMilestoneId: string | null;
    title: string;
    description: string | null;
    status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
    dueAt: Date | null;
    completedAt: Date | null;
    blockedAt: Date | null;
    blocker: string | null;
    sortOrder: number;
  }>;
};

export type AddProjectUpdateInput = MutationContext & {
  projectId: string;
  summary: string;
  progressPercent?: number | null;
  activeBlocker?: string | null;
  blockers?: unknown;
  metadata?: unknown;
};

export type CreatePolicyVersionInput = MutationContext & {
  name: string;
  automationMode: "OFF" | "SHADOW" | "GUARDED";
  thresholds?: Partial<
    Omit<PolicyThresholds, "version" | "name" | "automationMode">
  >;
  rules?: unknown;
  activate?: boolean;
  approvedRequestId: string;
};

export type ApprovalAction =
  | "CREATE_INVOICE"
  | "UPDATE_INVOICE"
  | "RECORD_PAYMENT"
  | "REFUND_PAYMENT"
  | "UPDATE_PRICING"
  | "UPDATE_PROPOSAL"
  | "UPDATE_OPPORTUNITY"
  | "CLOSE_OPPORTUNITY"
  | "ARCHIVE_OPPORTUNITY"
  | "DELETE_RECORD"
  | "CHANGE_POLICY"
  | "EXTERNAL_COMMUNICATION"
  | "CONTRACT_ACTION";

export type OpportunityApprovalChanges = Partial<{
  stage:
    | "RESEARCHING"
    | "CONTACTED"
    | "REPLIED"
    | "QUALIFIED"
    | "DISCOVERY"
    | "PROPOSAL"
    | "NEGOTIATION"
    | "WON"
    | "LOST";
  probability: number;
  estimatedValue: number;
  currency: Currency;
  budget: string | null;
  timeline: string | null;
  outcomeReason: string | null;
  nextAction: string | null;
  nextFollowUp: Date | string | null;
  assignedOwnerId: string | null;
}>;

export type UpdateOpportunityPayload = {
  opportunityId: string;
  changes: OpportunityApprovalChanges;
};

export type ArchiveOpportunityPayload = {
  opportunityId: string;
};

export type DeleteRecordPayload = {
  recordType:
    | "MarketingWeeklyMetric"
    | "MarketingUtmPreset"
    | "MarketingContent"
    | "MarketingCampaign"
    | "MarketingAsset";
  recordId: string;
  operation: "delete" | "archive";
};

export type RequestApprovalInput = MutationContext & {
  action: ApprovalAction;
  risk: "SENSITIVE" | "DESTRUCTIVE";
  entityType: string;
  entityId: string;
  targetVersion?: number | null;
  targetSnapshot?: unknown;
  payload: Record<string, unknown>;
  safeBatchKey?: string | null;
  policyId?: string | null;
  automationRunId?: string | null;
  now?: Date;
};

export type DecideApprovalInput = {
  approvalId: string;
  expectedVersion: number;
  actorId: string;
  decision: "APPROVE" | "REJECT";
  reason: string;
  correlationId: string;
  idempotencyKey: string;
  now?: Date;
};

export type DecideApprovalBatchInput = {
  items: Array<{ approvalId: string; expectedVersion: number }>;
  actorId: string;
  decision: "APPROVE" | "REJECT";
  reason: string;
  correlationId: string;
  idempotencyKey: string;
  now?: Date;
};

export type ApprovalExecutionContext = {
  id: string;
  action: string;
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "EXPIRED"
    | "EXECUTING"
    | "EXECUTED"
    | "FAILED";
  expiresAt: Date;
  version: number;
};

export type FailApprovalExecutionInput = {
  approvalId: string;
  actorId: string;
  correlationId: string;
  error: string;
};

export type CreateInvoicePayload = {
  companyId: string;
  projectId?: string | null;
  invoiceNumber: string;
  currency: Currency;
  amount: number;
  issuedAt?: Date | null;
  dueAt?: Date | null;
  notes?: string | null;
  externalReference?: string | null;
};

export type UpdateInvoicePayload = {
  invoiceId: string;
  expectedVersion: number;
  changes: Partial<{
    projectId: string | null;
    invoiceNumber: string;
    status: "DRAFT" | "ISSUED" | "PARTIALLY_PAID" | "PAID" | "VOID";
    currency: Currency;
    amount: number;
    issuedAt: Date | null;
    dueAt: Date | null;
    notes: string | null;
    externalReference: string | null;
  }>;
};

export type RecordPaymentPayload = {
  companyId: string;
  currency: Currency;
  amount: number;
  status?: "PENDING" | "CLEARED";
  method: "CASH" | "BANK_TRANSFER" | "CARD" | "CHEQUE" | "MOBILE_MONEY" | "OTHER";
  paidAt: Date;
  reference?: string | null;
  notes?: string | null;
  allocations: Array<{ invoiceId: string; amount: number }>;
};

export type BeginAutomationRunInput = {
  type: "PROSPECTING" | "DAILY_BRIEF" | "RUN_OPERATIONS" | "APPROVAL_EXECUTION";
  mode: "OFF" | "SHADOW" | "GUARDED";
  correlationId: string;
  idempotencyKey: string;
  policyId?: string | null;
  requestedById?: string | null;
  scheduledFor?: Date | null;
  model?: string | null;
  input?: unknown;
};

export type UpsertAutomationStepInput = {
  runId: string;
  key: string;
  label: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "SKIPPED" | "FAILED";
  attempt?: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
  input?: unknown;
  output?: unknown;
  error?: string | null;
  idempotencyKey: string;
};

export type FinalizeAutomationRunInput = {
  runId: string;
  status: "SUCCEEDED" | "PARTIAL" | "FAILED" | "CANCELLED";
  outputSummary?: unknown;
  error?: string | null;
  usage?: unknown;
  estimatedCostUsd?: number | null;
  completedAt?: Date;
};

export type PersistDailyBriefInput = {
  businessDate: Date;
  status: "READY" | "DEGRADED" | "FAILED";
  headline: string;
  summary: string;
  asOf: Date;
  dataAsOf?: Date | null;
  degradedReason?: string | null;
  model?: string | null;
  policyId: string;
  automationRunId?: string | null;
  evidence?: unknown;
  priorities: Array<
    Pick<
      PriorityView,
      "rank" | "kind" | "severity" | "title" | "rationale" | "nextAction" | "currency" | "amount"
    > & {
      recordType?: string | null;
      recordId?: string | null;
      recordUrl?: string | null;
      evidence?: unknown;
    }
  >;
};

export type RecordInteractionSummaryInput = {
  channel: "ADMIN" | "MCP" | "WORKFLOW" | "CHAT";
  status: "SUCCEEDED" | "PARTIAL" | "FAILED";
  actorId?: string | null;
  automationRunId?: string | null;
  correlationId: string;
  model?: string | null;
  summary: string;
  conclusions?: unknown;
  citations?: unknown;
  toolCalls?: unknown;
  outcomes?: unknown;
};

export type VerifiedProspectCandidate = {
  candidateKey: string;
  ownerId?: string | null;
  company: {
    name: string;
    domain: string;
    website: string;
    industry: string;
    country: string;
    estimatedSize?: string | null;
    phone?: string | null;
  };
  contact: {
    name: string;
    title?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedInUrl?: string | null;
  };
  opportunity: {
    reference: string;
    type:
      | "WEBSITE_REDESIGN"
      | "PROPERTY_PLATFORM"
      | "CUSTOMER_PORTAL"
      | "BUSINESS_SYSTEM"
      | "OPERATIONS_PLATFORM"
      | "CRM"
      | "AUTOMATION"
      | "INTEGRATION"
      | "CUSTOM_SOFTWARE"
      | "OTHER";
    title: string;
    source: string;
    identifiedProblem: string;
    opportunity: string;
    estimatedValue?: number;
    currency?: Currency;
    probability?: number;
    nextFollowUp?: Date | null;
    reasonForContact?: string | null;
    personalizationAngle?: string | null;
  };
  research: {
    sourceUrls: string[];
    sourceObservedAt: Date;
    observedProblems: string;
    recentBusinessActivity?: string | null;
    notes?: string | null;
    financialCapacityScore: number;
    problemSeverityScore: number;
    strategicFitScore: number;
    urgencyScore: number;
    decisionMakerAccessScore: number;
  };
  followUpTask?: {
    title: string;
    dueAt: Date;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    notes?: string | null;
  };
};

export type PersistVerifiedProspectBatchInput = {
  automationRunId: string;
  correlationId: string;
  candidates: VerifiedProspectCandidate[];
};

export type PersistVerifiedProspectBatchResult = {
  accepted: number;
  rejected: Array<{ candidateKey: string; reasons: string[] }>;
  opportunityIds: string[];
  taskIds: string[];
};

export type { SafeOperationInput };
