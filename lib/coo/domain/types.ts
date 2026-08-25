export const CURRENCIES = ["JMD", "USD"] as const;

export type Currency = (typeof CURRENCIES)[number];

export type CurrencyTotals = Record<Currency, number>;

export type CursorPage<T> = {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
};

export type FreshnessState = "FRESH" | "STALE" | "UNKNOWN";

export type RecordLink = {
  type: string;
  id: string;
  label: string;
  href: string;
};

export type Freshness = {
  state: FreshnessState;
  asOf: string | null;
  thresholdMinutes: number;
};

export type PolicyThresholds = {
  version: number;
  name: string;
  automationMode: "OFF" | "SHADOW" | "GUARDED";
  projectDeadlineHours: number;
  staleProgressDays: number;
  approvalExpiryHours: number;
  safeBatchLimit: number;
  prospectDailyMinimum: number;
  prospectDailyMaximum: number;
  maxFounderPriorities: number;
  freshnessMinutes: number;
};

export type PolicyView = PolicyThresholds & {
  id: string | null;
  active: boolean;
  activatedAt: string | null;
  configuredAutomationMode: PolicyThresholds["automationMode"];
  runtimeAutomationMode: PolicyThresholds["automationMode"];
  rules: unknown;
};

export const DEFAULT_POLICY: PolicyThresholds = {
  version: 1,
  name: "Trexiti COO default policy",
  automationMode: "SHADOW",
  projectDeadlineHours: 72,
  staleProgressDays: 7,
  approvalExpiryHours: 24,
  safeBatchLimit: 25,
  prospectDailyMinimum: 40,
  prospectDailyMaximum: 50,
  maxFounderPriorities: 5,
  freshnessMinutes: 90,
};

export type PriorityView = {
  id: string;
  rank: number;
  kind: "DECISION" | "ACTION" | "ALERT" | "COMPLETED";
  severity: "INFO" | "ATTENTION" | "HIGH" | "CRITICAL";
  title: string;
  rationale: string;
  nextAction: string | null;
  record: RecordLink | null;
  currency: Currency | null;
  amount: number | null;
};

export type BriefView = {
  id: string;
  businessDate: string;
  status: "READY" | "DEGRADED" | "FAILED";
  headline: string;
  summary: string;
  asOf: string;
  dataAsOf: string | null;
  degradedReason: string | null;
  model: string | null;
  policyVersion: number;
  priorities: PriorityView[];
};

export type QueueItemView = {
  id: string;
  title: string;
  detail: string | null;
  severity: "INFO" | "ATTENTION" | "HIGH" | "CRITICAL";
  dueAt: string | null;
  status: string;
  record: RecordLink;
};

export type ProjectRiskReason =
  | "OVERDUE_MILESTONE"
  | "ACTIVE_BLOCKER"
  | "OVERDUE_DEPENDENCY"
  | "DEADLINE_WITH_UNFINISHED_PREREQUISITE"
  | "STALE_PROGRESS"
  | "MANUAL_OVERRIDE";

export type ProjectRiskAssessment = {
  health: "ON_TRACK" | "ATTENTION" | "AT_RISK";
  reasons: ProjectRiskReason[];
};

export type ProjectRiskInput = {
  status: "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  healthOverride?: "ON_TRACK" | "ATTENTION" | "AT_RISK" | null;
  activeBlocker?: string | null;
  lastProgressAt?: Date | null;
  createdAt: Date;
  milestones: Array<{
    status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
    dueAt?: Date | null;
    blocker?: string | null;
    blockedAt?: Date | null;
    dependency?: {
      status: "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
      dueAt?: Date | null;
    } | null;
  }>;
};

export type ClientHealthInput = {
  projects: ProjectRiskAssessment[];
  hasOverdueInvoice: boolean;
  hasBlockedApprovalOrDependency: boolean;
  lastActiveDeliveryUpdateAt: Date | null;
};

export type ClientHealthAssessment = {
  health: "HEALTHY" | "ATTENTION";
  reasons: Array<
    | "AT_RISK_PROJECT"
    | "OVERDUE_INVOICE"
    | "BLOCKED_APPROVAL_OR_DEPENDENCY"
    | "STALE_ACTIVE_DELIVERY"
  >;
};

export type ClientView = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  country: string;
  health: ClientHealthAssessment["health"];
  healthReasons: ClientHealthAssessment["reasons"];
  activeProjects: number;
  outstanding: CurrencyTotals;
  lastUpdatedAt: string;
  record: RecordLink;
};

export type ProjectView = {
  id: string;
  version: number;
  title: string;
  companyId: string;
  companyName: string;
  ownerName: string | null;
  status: "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  health: ProjectRiskAssessment["health"];
  riskReasons: ProjectRiskAssessment["reasons"];
  progressPercent: number;
  targetEndAt: string | null;
  lastProgressAt: string | null;
  activeBlocker: string | null;
  milestones: Array<{
    id: string;
    version: number;
    title: string;
    status: string;
    dueAt: string | null;
    blocker: string | null;
  }>;
  updates: Array<{
    id: string;
    summary: string;
    progressPercent: number | null;
    blockers: unknown;
    createdAt: string;
    authorName: string | null;
  }>;
  record: RecordLink;
};

export type InvoiceView = {
  id: string;
  invoiceNumber: string;
  companyId: string;
  companyName: string;
  projectId: string | null;
  status: string;
  currency: Currency;
  amount: number;
  paid: number;
  balance: number;
  dueAt: string | null;
  overdue: boolean;
  record: RecordLink;
};

export type FinanceOverview = {
  asOf: string;
  outstanding: CurrencyTotals;
  overdue: CurrencyTotals;
  expectedCash: CurrencyTotals;
  invoicedRevenue: CurrencyTotals;
  invoicedRevenuePeriod: {
    from: string;
    through: string;
    timezone: "America/Jamaica";
  };
  received: CurrencyTotals;
  receivedPeriod: { from: string; through: string; timezone: "America/Jamaica" };
  invoices: InvoiceView[];
};

export type ApprovalView = {
  id: string;
  version: number;
  action: string;
  entityType: string;
  entityId: string;
  risk: "SENSITIVE" | "DESTRUCTIVE";
  status: string;
  expiresAt: string;
  requestedAt: string;
  targetVersion: number | null;
  targetSnapshot: unknown;
  safeBatchKey: string | null;
  payload: unknown;
  record: RecordLink;
};

export type AutomationRunView = {
  id: string;
  type: string;
  status: string;
  mode: string;
  model: string | null;
  estimatedCostUsd: number | null;
  usage: unknown;
  input: unknown;
  outputSummary: unknown;
  correlationId: string;
  idempotencyKey: string;
  scheduledFor: string | null;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
  stepCounts: Record<string, number>;
  steps: Array<{
    id: string;
    key: string;
    label: string;
    status: string;
    attempt: number;
    startedAt: string | null;
    completedAt: string | null;
    error: string | null;
    idempotencyKey: string;
    input: unknown;
    output: unknown;
  }>;
  record: RecordLink;
};

export type OperationsDashboard = {
  asOf: string;
  policy: PolicyView;
  brief: BriefView | null;
  metrics: {
    activeClients: number;
    atRiskProjects: number;
    pendingApprovals: number;
    followUpsDue: number;
    pipeline: CurrencyTotals;
    weightedPipeline: CurrencyTotals;
    outstanding: CurrencyTotals;
    overdue: CurrencyTotals;
    expectedCash: CurrencyTotals;
    invoicedRevenue: CurrencyTotals;
    invoicedRevenuePeriod: FinanceOverview["invoicedRevenuePeriod"];
    received: CurrencyTotals;
    receivedPeriod: FinanceOverview["receivedPeriod"];
  };
  queues: {
    founderDecisions: QueueItemView[];
    aiCanExecute: QueueItemView[];
    completed: QueueItemView[];
  };
  projects: ProjectView[];
  clients: ClientView[];
  automationRuns: AutomationRunView[];
  freshness: Freshness;
};

export type ProspectAcceptanceInput = {
  sourceUrls: string[];
  sourceObservedAt: Date | null;
  hasReachableContactMethod: boolean;
  observedBusinessNeed: string | null;
  duplicateDomain: boolean;
  duplicateContact: boolean;
};

export type ProspectAcceptance = {
  accepted: boolean;
  reasons: Array<
    | "MISSING_CURRENT_PUBLIC_SOURCE"
    | "MISSING_CONTACT_METHOD"
    | "MISSING_OBSERVED_NEED"
    | "DUPLICATE_DOMAIN"
    | "DUPLICATE_CONTACT"
  >;
};

export type SafeOperationAction =
  | "CREATE_TASK"
  | "ADD_INTERNAL_NOTE"
  | "SET_FOLLOW_UP"
  | "CLASSIFY_PROSPECT"
  | "SET_INTERNAL_RISK_FLAG";

export type SafeOperationInput = {
  action: SafeOperationAction;
  actorId: string | null;
  idempotencyKey: string;
  correlationId: string;
  payload: Record<string, unknown>;
  automationRunId?: string | null;
};

export type SafeOperationResult = {
  status: "EXECUTED" | "SHADOWED" | "ALREADY_EXECUTED";
  action: SafeOperationAction;
  entityType: string;
  entityId: string | null;
  correlationId: string;
};
