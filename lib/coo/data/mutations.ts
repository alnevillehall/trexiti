import { Prisma, type CooPolicy } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  DEFAULT_POLICY,
  approvalExpiresAt,
  assessProspectAcceptance,
  calculateInvoiceBalance,
  validatePolicy,
  validateProspectScores,
  type PolicyThresholds,
  type SafeOperationResult,
} from "../domain";
import type {
  AddProjectUpdateInput,
  ArchiveOpportunityPayload,
  BeginAutomationRunInput,
  CreateInvoicePayload,
  CreateMilestoneInput,
  CreatePolicyVersionInput,
  CreateProjectInput,
  DeleteRecordPayload,
  DecideApprovalBatchInput,
  DecideApprovalInput,
  FailApprovalExecutionInput,
  FinalizeAutomationRunInput,
  PersistDailyBriefInput,
  PersistVerifiedProspectBatchInput,
  PersistVerifiedProspectBatchResult,
  RecordInteractionSummaryInput,
  RecordPaymentPayload,
  RequestApprovalInput,
  SafeOperationInput,
  UpdateInvoicePayload,
  UpdateMilestoneInput,
  UpdateOpportunityPayload,
  UpdateProjectInput,
  UpsertAutomationStepInput,
} from "./contracts";
import {
  getEffectiveAutomationMode,
  getRuntimeAutomationMode,
  type AutomationMode,
} from "./runtime";

function json(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function requiredString(
  payload: Record<string, unknown>,
  key: string,
): string {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return value.trim();
}

function optionalString(
  payload: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const value = payload[key];
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${key} must be a string`);
  return value.trim();
}

function requiredDate(payload: Record<string, unknown>, key: string): Date {
  const raw = payload[key];
  const value = raw instanceof Date ? raw : new Date(String(raw ?? ""));
  if (Number.isNaN(value.getTime())) throw new Error(`${key} must be a valid date`);
  return value;
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  input: {
    actorId: string | null;
    correlationId: string;
    idempotencyKey: string;
    action: "CREATE" | "UPDATE" | "ARCHIVE" | "RESTORE";
    entityType: string;
    entityId: string;
    summary: string;
    before?: unknown;
    after?: unknown;
    evidence?: unknown;
    metadata?: Record<string, unknown>;
  },
) {
  return tx.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      before: json(input.before),
      after: json(input.after),
      metadata: json({
        correlationId: input.correlationId,
        evidence: input.evidence ?? null,
        ...(input.metadata ?? {}),
      }),
    },
  });
}

export async function ensureActivePolicy(input: {
  createdById?: string | null;
} = {}): Promise<CooPolicy> {
  const existing = await prisma.cooPolicy.findFirst({
    where: { active: true },
    orderBy: { version: "desc" },
  });
  if (existing) return existing;

  try {
    return await prisma.$transaction(async (tx) => {
      const active = await tx.cooPolicy.findFirst({
        where: { active: true },
        orderBy: { version: "desc" },
      });
      if (active) return active;
      const latest = await tx.cooPolicy.findFirst({
        orderBy: { version: "desc" },
        select: { version: true },
      });
      return tx.cooPolicy.create({
        data: {
          version: (latest?.version ?? 0) + 1,
          active: true,
          activatedAt: new Date(),
          name: DEFAULT_POLICY.name,
          automationMode: getRuntimeAutomationMode(),
          projectDeadlineHours: DEFAULT_POLICY.projectDeadlineHours,
          staleProgressDays: DEFAULT_POLICY.staleProgressDays,
          approvalExpiryHours: DEFAULT_POLICY.approvalExpiryHours,
          safeBatchLimit: DEFAULT_POLICY.safeBatchLimit,
          prospectDailyMinimum: DEFAULT_POLICY.prospectDailyMinimum,
          prospectDailyMaximum: DEFAULT_POLICY.prospectDailyMaximum,
          maxFounderPriorities: DEFAULT_POLICY.maxFounderPriorities,
          freshnessMinutes: DEFAULT_POLICY.freshnessMinutes,
          createdById: input.createdById ?? null,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await prisma.cooPolicy.findFirst({
        where: { active: true },
        orderBy: { version: "desc" },
      });
      if (winner) return winner;
    }
    throw error;
  }
}

export async function createProject(input: CreateProjectInput) {
  const canonicalPayload = {
    companyId: input.companyId,
    opportunityId: input.opportunityId ?? null,
    ownerId: input.ownerId ?? null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status ?? "PLANNED",
    startAt: input.startAt ?? null,
    targetEndAt: input.targetEndAt ?? null,
  };
  const existing = await prisma.adminProject.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    const audit = await prisma.adminAuditLog.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    assertMutationReplay(audit, input.actorId, "CREATE_PROJECT", canonicalPayload);
    return existing;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const project = await tx.adminProject.create({
        data: {
          ...canonicalPayload,
          lastProgressAt: canonicalPayload.status === "ACTIVE" ? new Date() : null,
          idempotencyKey: input.idempotencyKey,
        },
      });
      await writeAudit(tx, {
        ...input,
        action: "CREATE",
        entityType: "AdminProject",
        entityId: project.id,
        summary: `Created project ${project.title}`,
        after: project,
        metadata: mutationReplayMetadata("CREATE_PROJECT", canonicalPayload),
      });
      return project;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const [winner, audit] = await Promise.all([
        prisma.adminProject.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        }),
        prisma.adminAuditLog.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        }),
      ]);
      if (winner) {
        assertMutationReplay(audit, input.actorId, "CREATE_PROJECT", canonicalPayload);
        return winner;
      }
    }
    throw error;
  }
}

export async function updateProject(input: UpdateProjectInput) {
  const canonicalPayload = {
    projectId: input.projectId,
    expectedVersion: input.expectedVersion,
    changes: input.changes,
  };
  const priorAudit = await prisma.adminAuditLog.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (priorAudit) {
    assertMutationReplay(
      priorAudit,
      input.actorId,
      "UPDATE_PROJECT",
      canonicalPayload,
    );
    return prisma.adminProject.findUniqueOrThrow({ where: { id: input.projectId } });
  }
  if (
    input.changes.progressPercent !== undefined &&
    (input.changes.progressPercent < 0 || input.changes.progressPercent > 100)
  ) {
    throw new Error("progressPercent must be between 0 and 100");
  }

  try {
    return await prisma.$transaction(async (tx) => {
    const before = await tx.adminProject.findUniqueOrThrow({
      where: { id: input.projectId },
    });
    const changed = await tx.adminProject.updateMany({
      where: { id: input.projectId, version: input.expectedVersion },
      data: { ...input.changes, version: { increment: 1 } },
    });
    if (changed.count !== 1) throw new Error("STALE_TARGET");
    const after = await tx.adminProject.findUniqueOrThrow({
      where: { id: input.projectId },
    });
    await writeAudit(tx, {
      ...input,
      action: "UPDATE",
      entityType: "AdminProject",
      entityId: after.id,
      summary: `Updated project ${after.title}`,
      before,
      after,
      metadata: mutationReplayMetadata("UPDATE_PROJECT", canonicalPayload),
    });
    return after;
    });
  } catch (error) {
    const audit = await prisma.adminAuditLog.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (audit) {
      assertMutationReplay(audit, input.actorId, "UPDATE_PROJECT", canonicalPayload);
      return prisma.adminProject.findUniqueOrThrow({ where: { id: input.projectId } });
    }
    throw error;
  }
}

export async function createMilestone(input: CreateMilestoneInput) {
  const canonicalPayload = {
    projectId: input.projectId,
    dependencyMilestoneId: input.dependencyMilestoneId ?? null,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: input.status ?? "NOT_STARTED",
    dueAt: input.dueAt ?? null,
    sortOrder: input.sortOrder ?? 0,
  };
  const existing = await prisma.adminMilestone.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    const audit = await prisma.adminAuditLog.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    assertMutationReplay(audit, input.actorId, "CREATE_MILESTONE", canonicalPayload);
    return existing;
  }
  try {
    return await prisma.$transaction(async (tx) => {
    if (input.dependencyMilestoneId) {
      const dependency = await tx.adminMilestone.findUniqueOrThrow({
        where: { id: input.dependencyMilestoneId },
      });
      if (dependency.projectId !== input.projectId) {
        throw new Error("Milestone dependency must belong to the same project");
      }
    }
    const milestone = await tx.adminMilestone.create({
      data: {
        ...canonicalPayload,
        idempotencyKey: input.idempotencyKey,
      },
    });
    await writeAudit(tx, {
      ...input,
      action: "CREATE",
      entityType: "AdminMilestone",
      entityId: milestone.id,
      summary: `Created milestone ${milestone.title}`,
      after: milestone,
      metadata: mutationReplayMetadata("CREATE_MILESTONE", canonicalPayload),
    });
    return milestone;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const [winner, audit] = await Promise.all([
        prisma.adminMilestone.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        }),
        prisma.adminAuditLog.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        }),
      ]);
      if (winner) {
        assertMutationReplay(
          audit,
          input.actorId,
          "CREATE_MILESTONE",
          canonicalPayload,
        );
        return winner;
      }
    }
    throw error;
  }
}

export async function updateMilestone(input: UpdateMilestoneInput) {
  const canonicalPayload = {
    milestoneId: input.milestoneId,
    expectedVersion: input.expectedVersion,
    changes: input.changes,
  };
  const priorAudit = await prisma.adminAuditLog.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (priorAudit) {
    assertMutationReplay(
      priorAudit,
      input.actorId,
      "UPDATE_MILESTONE",
      canonicalPayload,
    );
    return prisma.adminMilestone.findUniqueOrThrow({
      where: { id: input.milestoneId },
    });
  }
  try {
    return await prisma.$transaction(async (tx) => {
    const before = await tx.adminMilestone.findUniqueOrThrow({
      where: { id: input.milestoneId },
    });
    if (input.changes.dependencyMilestoneId) {
      if (input.changes.dependencyMilestoneId === input.milestoneId) {
        throw new Error("A milestone cannot depend on itself");
      }
      const dependency = await tx.adminMilestone.findUniqueOrThrow({
        where: { id: input.changes.dependencyMilestoneId },
      });
      if (dependency.projectId !== before.projectId) {
        throw new Error("Milestone dependency must belong to the same project");
      }
    }
    const changed = await tx.adminMilestone.updateMany({
      where: { id: input.milestoneId, version: input.expectedVersion },
      data: { ...input.changes, version: { increment: 1 } },
    });
    if (changed.count !== 1) throw new Error("STALE_TARGET");
    const after = await tx.adminMilestone.findUniqueOrThrow({
      where: { id: input.milestoneId },
    });
    await writeAudit(tx, {
      ...input,
      action: "UPDATE",
      entityType: "AdminMilestone",
      entityId: after.id,
      summary: `Updated milestone ${after.title}`,
      before,
      after,
      metadata: mutationReplayMetadata("UPDATE_MILESTONE", canonicalPayload),
    });
    return after;
    });
  } catch (error) {
    const audit = await prisma.adminAuditLog.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (audit) {
      assertMutationReplay(
        audit,
        input.actorId,
        "UPDATE_MILESTONE",
        canonicalPayload,
      );
      return prisma.adminMilestone.findUniqueOrThrow({
        where: { id: input.milestoneId },
      });
    }
    throw error;
  }
}

export async function addProjectUpdate(input: AddProjectUpdateInput) {
  const canonicalPayload = {
    projectId: input.projectId,
    summary: input.summary.trim(),
    progressPercent: input.progressPercent ?? null,
    activeBlocker: input.activeBlocker?.trim() || null,
    blockers: input.blockers ?? null,
    metadata: input.metadata ?? null,
  };
  const existing = await prisma.adminProjectUpdate.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    const audit = await prisma.adminAuditLog.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    assertMutationReplay(audit, input.actorId, "ADD_PROJECT_UPDATE", canonicalPayload);
    return existing;
  }
  if (
    input.progressPercent != null &&
    (input.progressPercent < 0 || input.progressPercent > 100)
  ) {
    throw new Error("progressPercent must be between 0 and 100");
  }
  try {
    return await prisma.$transaction(async (tx) => {
    const before = await tx.adminProject.findUniqueOrThrow({
      where: { id: input.projectId },
    });
    const update = await tx.adminProjectUpdate.create({
      data: {
        projectId: input.projectId,
        authorId: input.actorId,
        summary: canonicalPayload.summary,
        progressPercent: canonicalPayload.progressPercent,
        blockers: json(canonicalPayload.blockers),
        metadata: json(canonicalPayload.metadata),
        idempotencyKey: input.idempotencyKey,
      },
    });
    const after = await tx.adminProject.update({
      where: { id: input.projectId },
      data: {
        lastProgressAt: new Date(),
        ...(input.progressPercent == null
          ? {}
          : { progressPercent: input.progressPercent }),
        activeBlocker: canonicalPayload.activeBlocker,
        version: { increment: 1 },
      },
    });
    await writeAudit(tx, {
      ...input,
      action: "UPDATE",
      entityType: "AdminProject",
      entityId: input.projectId,
      summary: `Added a progress update to ${after.title}`,
      before,
      after: { project: after, update },
      metadata: mutationReplayMetadata("ADD_PROJECT_UPDATE", canonicalPayload),
    });
    return update;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const [winner, audit] = await Promise.all([
        prisma.adminProjectUpdate.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        }),
        prisma.adminAuditLog.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        }),
      ]);
      if (winner) {
        assertMutationReplay(
          audit,
          input.actorId,
          "ADD_PROJECT_UPDATE",
          canonicalPayload,
        );
        return winner;
      }
    }
    throw error;
  }
}

async function readTargetSnapshot(
  tx: Prisma.TransactionClient,
  entityType: string,
  entityId: string,
): Promise<Record<string, unknown> | null> {
  switch (entityType) {
    case "AdminProject": {
      const value = await tx.adminProject.findUnique({ where: { id: entityId } });
      return value
        ? { id: value.id, version: value.version, updatedAt: value.updatedAt }
        : null;
    }
    case "AdminMilestone": {
      const value = await tx.adminMilestone.findUnique({ where: { id: entityId } });
      return value
        ? { id: value.id, version: value.version, updatedAt: value.updatedAt }
        : null;
    }
    case "AdminInvoice": {
      const value = await tx.adminInvoice.findUnique({ where: { id: entityId } });
      return value
        ? { id: value.id, version: value.version, updatedAt: value.updatedAt }
        : null;
    }
    case "AdminPayment": {
      const value = await tx.adminPayment.findUnique({ where: { id: entityId } });
      return value
        ? { id: value.id, version: value.version, updatedAt: value.updatedAt }
        : null;
    }
    case "CooPolicy": {
      const value = await tx.cooPolicy.findUnique({ where: { id: entityId } });
      return value
        ? { id: value.id, version: value.version, updatedAt: value.updatedAt }
        : null;
    }
    case "AdminOpportunity": {
      const value = await tx.adminOpportunity.findUnique({ where: { id: entityId } });
      return value
        ? {
            id: value.id,
            updatedAt: value.updatedAt,
            stage: value.stage,
            estimatedValue: value.estimatedValue.toString(),
            currency: value.currency,
            probability: value.probability,
            archivedAt: value.archivedAt,
          }
        : null;
    }
    case "AdminProposal": {
      const value = await tx.adminProposal.findUnique({ where: { id: entityId } });
      return value
        ? {
            id: value.id,
            updatedAt: value.updatedAt,
            version: value.version,
            amount: value.amount.toString(),
            currency: value.currency,
            status: value.status,
          }
        : null;
    }
    case "AdminCompany": {
      const value = await tx.adminCompany.findUnique({ where: { id: entityId } });
      return value ? { id: value.id, updatedAt: value.updatedAt } : null;
    }
    case "MarketingWeeklyMetric": {
      const value = await tx.marketingWeeklyMetric.findUnique({
        where: { id: entityId },
      });
      return value ? { id: value.id, updatedAt: value.updatedAt } : null;
    }
    case "MarketingUtmPreset": {
      const value = await tx.marketingUtmPreset.findUnique({
        where: { id: entityId },
      });
      return value ? { id: value.id, updatedAt: value.updatedAt } : null;
    }
    case "MarketingContent": {
      const value = await tx.marketingContent.findUnique({ where: { id: entityId } });
      return value
        ? { id: value.id, updatedAt: value.updatedAt, status: value.status }
        : null;
    }
    case "MarketingCampaign": {
      const value = await tx.marketingCampaign.findUnique({ where: { id: entityId } });
      return value
        ? { id: value.id, updatedAt: value.updatedAt, status: value.status }
        : null;
    }
    case "MarketingAsset": {
      const value = await tx.marketingAsset.findUnique({ where: { id: entityId } });
      return value
        ? { id: value.id, updatedAt: value.updatedAt, status: value.status }
        : null;
    }
    default:
      return null;
  }
}

async function lockApprovalTarget(
  tx: Prisma.TransactionClient,
  entityType: string,
  entityId: string,
) {
  switch (entityType) {
    case "AdminProject":
      await tx.$queryRaw`SELECT "id" FROM "AdminProject" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "AdminMilestone":
      await tx.$queryRaw`SELECT "id" FROM "AdminMilestone" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "AdminInvoice":
      await tx.$queryRaw`SELECT "id" FROM "AdminInvoice" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "AdminPayment":
      await tx.$queryRaw`SELECT "id" FROM "AdminPayment" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "CooPolicy":
      await tx.$queryRaw`SELECT "id" FROM "CooPolicy" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "AdminOpportunity":
      await tx.$queryRaw`SELECT "id" FROM "AdminOpportunity" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "AdminProposal":
      await tx.$queryRaw`SELECT "id" FROM "AdminProposal" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "AdminCompany":
      await tx.$queryRaw`SELECT "id" FROM "AdminCompany" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "MarketingWeeklyMetric":
      await tx.$queryRaw`SELECT "id" FROM "MarketingWeeklyMetric" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "MarketingUtmPreset":
      await tx.$queryRaw`SELECT "id" FROM "MarketingUtmPreset" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "MarketingContent":
      await tx.$queryRaw`SELECT "id" FROM "MarketingContent" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "MarketingCampaign":
      await tx.$queryRaw`SELECT "id" FROM "MarketingCampaign" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    case "MarketingAsset":
      await tx.$queryRaw`SELECT "id" FROM "MarketingAsset" WHERE "id" = ${entityId} FOR UPDATE`;
      return;
    default:
      return;
  }
}

async function retrySerializableApprovalExecution<T>(
  operation: () => Promise<T>,
): Promise<T> {
  const maximumAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const retryable = isSerializableConflict(error);
      if (!retryable || attempt === maximumAttempts) throw error;
    }
  }

  throw lastError;
}

function isSerializableConflict(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2034") return true;
  if (error.code !== "P2010") return false;

  const metadata = error.meta as
    | { code?: unknown; message?: unknown }
    | undefined;
  const databaseMessage =
    typeof metadata?.message === "string" ? metadata.message : "";
  return (
    metadata?.code === "40001" ||
    /could not serialize access|serialization failure/i.test(databaseMessage) ||
    /could not serialize access|serialization failure/i.test(error.message)
  );
}

export async function requestApproval(input: RequestApprovalInput) {
  const existing = await prisma.cooApprovalRequest.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    assertApprovalReplay(existing, input);
    return existing;
  }
  const now = input.now ?? new Date();
  const policy = input.policyId
    ? await prisma.cooPolicy.findUniqueOrThrow({ where: { id: input.policyId } })
    : await ensureActivePolicy({ createdById: input.actorId });

  try {
    return await prisma.$transaction(async (tx) => {
    if (input.safeBatchKey) {
      const batch = await tx.cooApprovalRequest.findMany({
        where: { safeBatchKey: input.safeBatchKey, status: "PENDING" },
        select: { action: true, risk: true },
      });
      if (batch.length >= policy.safeBatchLimit) throw new Error("SAFE_BATCH_LIMIT");
      if (
        batch.some(
          (item) => item.action !== input.action || item.risk !== input.risk,
        )
      ) {
        throw new Error("MIXED_SAFE_BATCH");
      }
      if (input.risk === "DESTRUCTIVE") throw new Error("UNSAFE_BATCH");
    }

    const targetSnapshot =
      input.targetSnapshot ??
      (await readTargetSnapshot(tx, input.entityType, input.entityId));
    const snapshotVersion =
      targetSnapshot !== null && typeof targetSnapshot === "object"
        ? (targetSnapshot as Record<string, unknown>).version
        : undefined;
    if (
      input.targetVersion != null &&
      snapshotVersion !== undefined &&
      snapshotVersion !== input.targetVersion
    ) {
      throw new Error("STALE_TARGET");
    }
    const approval = await tx.cooApprovalRequest.create({
      data: {
        expiresAt: approvalExpiresAt(now, policy),
        risk: input.risk,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        targetVersion: input.targetVersion ?? null,
        targetSnapshot: json(targetSnapshot),
        payload: json(input.payload)!,
        evidence: json(input.evidence),
        requestedById: input.actorId,
        safeBatchKey: input.safeBatchKey ?? null,
        idempotencyKey: input.idempotencyKey,
        correlationId: input.correlationId,
        policyId: policy.id,
        automationRunId: input.automationRunId ?? null,
      },
    });
    await writeAudit(tx, {
      ...input,
      idempotencyKey: `${input.idempotencyKey}:audit`,
      action: "CREATE",
      entityType: "CooApprovalRequest",
      entityId: approval.id,
      summary: `Requested approval for ${input.action}`,
      after: approval,
    });
      return approval;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winner = await prisma.cooApprovalRequest.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (winner) {
        assertApprovalReplay(winner, input);
        return winner;
      }
    }
    throw error;
  }
}

function assertApprovalReplay(
  existing: {
    action: string;
    risk: string;
    entityType: string;
    entityId: string;
    targetVersion: number | null;
    targetSnapshot: Prisma.JsonValue | null;
    payload: Prisma.JsonValue;
    evidence: Prisma.JsonValue | null;
    requestedById: string | null;
    safeBatchKey: string | null;
    policyId: string | null;
    automationRunId: string | null;
  },
  input: RequestApprovalInput,
) {
  const matches =
    existing.action === input.action &&
    existing.risk === input.risk &&
    existing.entityType === input.entityType &&
    existing.entityId === input.entityId &&
    (input.targetVersion === undefined ||
      existing.targetVersion === input.targetVersion) &&
    (input.targetSnapshot === undefined ||
      stableJson(existing.targetSnapshot) === stableJson(input.targetSnapshot)) &&
    existing.requestedById === input.actorId &&
    existing.safeBatchKey === (input.safeBatchKey ?? null) &&
    existing.automationRunId === (input.automationRunId ?? null) &&
    (!input.policyId || existing.policyId === input.policyId) &&
    stableJson(existing.payload) === stableJson(input.payload) &&
    stableJson(existing.evidence) === stableJson(input.evidence ?? null);
  if (!matches) throw new Error("IDEMPOTENCY_CONFLICT");
}

function canonicalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Prisma.Decimal) return value.toString();
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function mutationReplayMetadata(operation: string, payload: unknown) {
  return { mutationOperation: operation, mutationPayload: payload };
}

function assertMutationReplay(
  audit: {
    actorId: string | null;
    metadata: Prisma.JsonValue | null;
  } | null,
  actorId: string | null,
  operation: string,
  payload: unknown,
) {
  const metadata =
    audit?.metadata &&
    typeof audit.metadata === "object" &&
    !Array.isArray(audit.metadata)
      ? (audit.metadata as Record<string, unknown>)
      : null;
  if (
    !audit ||
    audit.actorId !== actorId ||
    metadata?.mutationOperation !== operation ||
    stableJson(metadata.mutationPayload) !== stableJson(payload)
  ) {
    throw new Error("IDEMPOTENCY_CONFLICT");
  }
}

export async function decideApproval(input: DecideApprovalInput) {
  const now = input.now ?? new Date();
  const auditKey = `approval-decision:${input.idempotencyKey}`;
  const priorAudit = await prisma.adminAuditLog.findUnique({
    where: { idempotencyKey: auditKey },
  });
  if (priorAudit) {
    const metadata = priorAudit.metadata as {
      approvalId?: string;
      decision?: string;
    } | null;
    if (
      metadata?.approvalId !== input.approvalId ||
      metadata?.decision !== input.decision
    ) {
      throw new Error("IDEMPOTENCY_CONFLICT");
    }
    return prisma.cooApprovalRequest.findUniqueOrThrow({
      where: { id: input.approvalId },
    });
  }

  try {
    return await prisma.$transaction(async (tx) => {
    const before = await tx.cooApprovalRequest.findUniqueOrThrow({
      where: { id: input.approvalId },
    });
    if (before.status !== "PENDING") throw new Error("APPROVAL_NOT_PENDING");
    if (before.expiresAt <= now) {
      const expired = await tx.cooApprovalRequest.update({
        where: { id: before.id },
        data: { status: "EXPIRED", version: { increment: 1 } },
      });
      await writeAudit(tx, {
        actorId: input.actorId,
        correlationId: input.correlationId,
        idempotencyKey: auditKey,
        action: "UPDATE",
        entityType: "CooApprovalRequest",
        entityId: before.id,
        summary: `Expired approval for ${before.action}`,
        before,
        after: expired,
        metadata: {
          approvalId: before.id,
          decision: input.decision,
          outcome: "EXPIRED",
        },
      });
      return expired;
    }

    const currentSnapshot = await readTargetSnapshot(
      tx,
      before.entityType,
      before.entityId,
    );
    if (
      before.targetSnapshot &&
      stableJson(before.targetSnapshot) !== stableJson(currentSnapshot)
    ) {
      throw new Error("STALE_TARGET");
    }

    const changed = await tx.cooApprovalRequest.updateMany({
      where: {
        id: before.id,
        status: "PENDING",
        version: input.expectedVersion,
      },
      data: {
        status: input.decision === "APPROVE" ? "APPROVED" : "REJECTED",
        decidedById: input.actorId,
        decidedAt: now,
        decisionReason: input.reason.trim(),
        version: { increment: 1 },
      },
    });
    if (changed.count !== 1) throw new Error("STALE_APPROVAL");
    const after = await tx.cooApprovalRequest.findUniqueOrThrow({
      where: { id: before.id },
    });
    await writeAudit(tx, {
      actorId: input.actorId,
      correlationId: input.correlationId,
      idempotencyKey: auditKey,
      action: "UPDATE",
      entityType: "CooApprovalRequest",
      entityId: before.id,
      summary: `${input.decision === "APPROVE" ? "Approved" : "Rejected"} ${before.action}`,
      before,
      after,
      evidence: { reason: input.reason },
      metadata: { approvalId: before.id, decision: input.decision },
    });
    return after;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const winnerAudit = await prisma.adminAuditLog.findUnique({
        where: { idempotencyKey: auditKey },
      });
      const metadata = winnerAudit?.metadata as {
        approvalId?: string;
        decision?: string;
      } | null;
      if (
        metadata?.approvalId === input.approvalId &&
        metadata?.decision === input.decision
      ) {
        return prisma.cooApprovalRequest.findUniqueOrThrow({
          where: { id: input.approvalId },
        });
      }
      throw new Error("IDEMPOTENCY_CONFLICT");
    }
    throw error;
  }
}

export async function decideApprovalBatch(input: DecideApprovalBatchInput) {
  const ids = input.items.map((item) => item.approvalId);
  if (ids.length === 0 || ids.length > DEFAULT_POLICY.safeBatchLimit) {
    throw new Error("SAFE_BATCH_LIMIT");
  }
  if (new Set(ids).size !== ids.length) throw new Error("DUPLICATE_BATCH_ITEM");
  const batchAuditKey = `approval-batch:${input.idempotencyKey}`;
  const priorAudit = await prisma.adminAuditLog.findUnique({
    where: { idempotencyKey: batchAuditKey },
  });
  if (priorAudit) {
    const metadata = priorAudit.metadata as {
      approvalIds?: string[];
      decision?: string;
    } | null;
    if (
      stableJson(metadata?.approvalIds) !== stableJson(ids) ||
      metadata?.decision !== input.decision
    ) {
      throw new Error("IDEMPOTENCY_CONFLICT");
    }
    return prisma.cooApprovalRequest.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "asc" },
    });
  }

  const now = input.now ?? new Date();
  return prisma.$transaction(
    async (tx) => {
      const approvals = await tx.cooApprovalRequest.findMany({
        where: { id: { in: ids } },
        orderBy: { createdAt: "asc" },
      });
      if (approvals.length !== ids.length) throw new Error("APPROVAL_NOT_FOUND");
      const expectedVersions = new Map(
        input.items.map((item) => [item.approvalId, item.expectedVersion]),
      );
      if (approvals.some((approval) => approval.status !== "PENDING")) {
        throw new Error("APPROVAL_NOT_PENDING");
      }
      if (approvals.some((approval) => approval.expiresAt <= now)) {
        throw new Error("APPROVAL_EXPIRED");
      }
      if (approvals.some((approval) => approval.risk === "DESTRUCTIVE")) {
        throw new Error("UNSAFE_BATCH");
      }
      const actions = new Set(approvals.map((approval) => approval.action));
      const batchKeys = new Set(
        approvals.map((approval) => approval.safeBatchKey).filter(Boolean),
      );
      if (
        actions.size !== 1 ||
        batchKeys.size !== 1 ||
        approvals.some((approval) => !approval.safeBatchKey)
      ) {
        throw new Error("MIXED_SAFE_BATCH");
      }

      for (const approval of approvals) {
        const currentSnapshot = await readTargetSnapshot(
          tx,
          approval.entityType,
          approval.entityId,
        );
        if (
          approval.targetSnapshot &&
          stableJson(approval.targetSnapshot) !== stableJson(currentSnapshot)
        ) {
          throw new Error("STALE_TARGET");
        }
        const expectedVersion = expectedVersions.get(approval.id);
        if (expectedVersion !== approval.version) throw new Error("STALE_APPROVAL");
      }

      const updated = [];
      for (const approval of approvals) {
        const after = await tx.cooApprovalRequest.update({
          where: { id: approval.id },
          data: {
            status: input.decision === "APPROVE" ? "APPROVED" : "REJECTED",
            decidedById: input.actorId,
            decidedAt: now,
            decisionReason: input.reason.trim(),
            version: { increment: 1 },
          },
        });
        await writeAudit(tx, {
          actorId: input.actorId,
          correlationId: input.correlationId,
          idempotencyKey: `${batchAuditKey}:${approval.id}`,
          action: "UPDATE",
          entityType: "CooApprovalRequest",
          entityId: approval.id,
          summary: `${input.decision === "APPROVE" ? "Approved" : "Rejected"} ${approval.action} in safe batch`,
          before: approval,
          after,
          evidence: { reason: input.reason },
          metadata: {
            approvalId: approval.id,
            decision: input.decision,
            batchIdempotencyKey: input.idempotencyKey,
          },
        });
        updated.push(after);
      }
      await writeAudit(tx, {
        actorId: input.actorId,
        correlationId: input.correlationId,
        idempotencyKey: batchAuditKey,
        action: "UPDATE",
        entityType: "CooApprovalBatch",
        entityId: input.idempotencyKey,
        summary: `${input.decision === "APPROVE" ? "Approved" : "Rejected"} ${updated.length} homogeneous approval requests atomically`,
        before: approvals,
        after: updated,
        evidence: { reason: input.reason },
        metadata: { approvalIds: ids, decision: input.decision },
      });
      return updated;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

function assertPositiveAmount(value: number, field = "amount") {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a positive amount`);
  }
}

async function createInvoiceFromApproval(
  tx: Prisma.TransactionClient,
  approval: {
    id: string;
    idempotencyKey: string;
    entityType: string;
    entityId: string;
    payload: Prisma.JsonValue;
  },
) {
  const payload = approval.payload as unknown as CreateInvoicePayload;
  if (
    approval.entityType !== "AdminCompany" ||
    approval.entityId !== payload.companyId
  ) {
    throw new Error("APPROVED_TARGET_MISMATCH");
  }
  assertPositiveAmount(payload.amount);
  if (payload.projectId) {
    const project = await tx.adminProject.findUniqueOrThrow({
      where: { id: payload.projectId },
      select: { companyId: true },
    });
    if (project.companyId !== payload.companyId) {
      throw new Error("Invoice project and company must match");
    }
  }
  return tx.adminInvoice.create({
    data: {
      companyId: payload.companyId,
      projectId: payload.projectId ?? null,
      invoiceNumber: payload.invoiceNumber.trim(),
      status: payload.issuedAt ? "ISSUED" : "DRAFT",
      currency: payload.currency,
      amount: payload.amount,
      issuedAt: payload.issuedAt ? new Date(payload.issuedAt) : null,
      dueAt: payload.dueAt ? new Date(payload.dueAt) : null,
      notes: payload.notes?.trim() || null,
      externalReference: payload.externalReference?.trim() || null,
      idempotencyKey: `${approval.idempotencyKey}:invoice`,
    },
  });
}

async function updateInvoiceFromApproval(
  tx: Prisma.TransactionClient,
  approval: { entityType: string; entityId: string; payload: Prisma.JsonValue },
) {
  const payload = approval.payload as unknown as UpdateInvoicePayload;
  if (
    approval.entityType !== "AdminInvoice" ||
    approval.entityId !== payload.invoiceId
  ) {
    throw new Error("APPROVED_TARGET_MISMATCH");
  }
  if (payload.changes.amount !== undefined) assertPositiveAmount(payload.changes.amount);
  const before = await tx.adminInvoice.findUniqueOrThrow({
    where: { id: payload.invoiceId },
    include: { allocations: { include: { payment: true } } },
  });
  if (
    payload.changes.currency &&
    payload.changes.currency !== before.currency &&
    before.allocations.length > 0
  ) {
    throw new Error("Cannot change invoice currency after payments are allocated");
  }
  if (payload.changes.projectId) {
    const project = await tx.adminProject.findUniqueOrThrow({
      where: { id: payload.changes.projectId },
      select: { companyId: true },
    });
    if (project.companyId !== before.companyId) {
      throw new Error("Invoice project and company must match");
    }
  }
  if (payload.changes.amount !== undefined) {
    const cleared = before.allocations.reduce(
      (total, allocation) =>
        allocation.payment.status === "CLEARED"
          ? total + Number(allocation.amount)
          : total,
      0,
    );
    if (payload.changes.amount + 0.001 < cleared) {
      throw new Error("Invoice amount cannot be less than cleared allocations");
    }
  }
  const result = await tx.adminInvoice.updateMany({
    where: { id: payload.invoiceId, version: payload.expectedVersion },
    data: { ...payload.changes, version: { increment: 1 } },
  });
  if (result.count !== 1) throw new Error("STALE_TARGET");
  return tx.adminInvoice.findUniqueOrThrow({ where: { id: payload.invoiceId } });
}

async function recordPaymentFromApproval(
  tx: Prisma.TransactionClient,
  approval: {
    idempotencyKey: string;
    entityType: string;
    entityId: string;
    payload: Prisma.JsonValue;
  },
) {
  const payload = approval.payload as unknown as RecordPaymentPayload;
  const targetsCompany =
    approval.entityType === "AdminCompany" &&
    approval.entityId === payload.companyId;
  const targetsSingleInvoice =
    approval.entityType === "AdminInvoice" &&
    payload.allocations.length === 1 &&
    payload.allocations[0]?.invoiceId === approval.entityId;
  if (!targetsCompany && !targetsSingleInvoice) {
    throw new Error("APPROVED_TARGET_MISMATCH");
  }
  assertPositiveAmount(payload.amount);
  if (payload.allocations.length === 0) {
    throw new Error("At least one payment allocation is required");
  }
  const allocationTotal = payload.allocations.reduce((sum, allocation) => {
    assertPositiveAmount(allocation.amount, "allocation amount");
    return sum + allocation.amount;
  }, 0);
  if (allocationTotal > payload.amount + 0.001) {
    throw new Error("Payment allocations cannot exceed the payment amount");
  }

  const invoiceIds = payload.allocations.map((allocation) => allocation.invoiceId);
  if (new Set(invoiceIds).size !== invoiceIds.length) {
    throw new Error("A payment can allocate to each invoice only once");
  }
  await tx.$queryRaw(
    Prisma.sql`SELECT "id" FROM "AdminInvoice" WHERE "id" IN (${Prisma.join(
      invoiceIds,
    )}) ORDER BY "id" FOR UPDATE`,
  );
  const invoices = await tx.adminInvoice.findMany({
    where: { id: { in: invoiceIds }, archivedAt: null },
    include: { allocations: { include: { payment: true } } },
  });
  if (invoices.length !== invoiceIds.length) throw new Error("Invoice not found");

  for (const allocation of payload.allocations) {
    const invoice = invoices.find((item) => item.id === allocation.invoiceId)!;
    if (invoice.companyId !== payload.companyId) {
      throw new Error("Payment and invoice company must match");
    }
    if (invoice.currency !== payload.currency) {
      throw new Error("Payment and invoice currency must match");
    }
    if (invoice.status === "VOID") throw new Error("Cannot allocate to a void invoice");
    const currentBalance = calculateInvoiceBalance({
      currency: invoice.currency,
      amount: Number(invoice.amount),
      dueAt: invoice.dueAt,
      status: invoice.status,
      payments: invoice.allocations.map((current) => ({
        currency: current.currency,
        amount: Number(current.amount),
        status: current.payment.status,
      })),
    });
    if (allocation.amount > currentBalance + 0.001) {
      throw new Error(`Allocation exceeds invoice ${invoice.invoiceNumber} balance`);
    }
  }

  const payment = await tx.adminPayment.create({
    data: {
      companyId: payload.companyId,
      currency: payload.currency,
      amount: payload.amount,
      status: payload.status ?? "CLEARED",
      method: payload.method,
      paidAt: new Date(payload.paidAt),
      reference: payload.reference?.trim() || null,
      notes: payload.notes?.trim() || null,
      idempotencyKey: `${approval.idempotencyKey}:payment`,
    },
  });
  await tx.adminPaymentAllocation.createMany({
    data: payload.allocations.map((allocation, index) => ({
      paymentId: payment.id,
      invoiceId: allocation.invoiceId,
      currency: payload.currency,
      amount: allocation.amount,
      idempotencyKey: `${approval.idempotencyKey}:allocation:${index}`,
    })),
  });

  if ((payload.status ?? "CLEARED") === "CLEARED") {
    for (const allocation of payload.allocations) {
      const invoice = invoices.find((item) => item.id === allocation.invoiceId)!;
      const previousBalance = calculateInvoiceBalance({
        currency: invoice.currency,
        amount: Number(invoice.amount),
        dueAt: invoice.dueAt,
        status: invoice.status,
        payments: invoice.allocations.map((current) => ({
          currency: current.currency,
          amount: Number(current.amount),
          status: current.payment.status,
        })),
      });
      const remaining = Math.max(0, previousBalance - allocation.amount);
      await tx.adminInvoice.update({
        where: { id: invoice.id },
        data: {
          status: remaining <= 0.001 ? "PAID" : "PARTIALLY_PAID",
          version: { increment: 1 },
        },
      });
    }
  }

  return tx.adminPayment.findUniqueOrThrow({
    where: { id: payment.id },
    include: { allocations: true },
  });
}

const OPPORTUNITY_CHANGE_FIELDS = new Set([
  "stage",
  "probability",
  "estimatedValue",
  "currency",
  "budget",
  "timeline",
  "outcomeReason",
  "nextAction",
  "nextFollowUp",
  "assignedOwnerId",
]);
const OPPORTUNITY_STAGES = new Set([
  "RESEARCHING",
  "CONTACTED",
  "REPLIED",
  "QUALIFIED",
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
]);

function nullablePayloadText(value: unknown, field: string): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${field} must be text or null`);
  return value.trim() || null;
}

async function updateOpportunityFromApproval(
  tx: Prisma.TransactionClient,
  approval: {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    payload: Prisma.JsonValue;
  },
  actorId: string,
) {
  const payload = approval.payload as unknown as UpdateOpportunityPayload;
  if (
    approval.entityType !== "AdminOpportunity" ||
    approval.entityId !== payload.opportunityId
  ) {
    throw new Error("APPROVED_TARGET_MISMATCH");
  }
  if (
    !payload.changes ||
    typeof payload.changes !== "object" ||
    Array.isArray(payload.changes)
  ) {
    throw new Error("INVALID_OPPORTUNITY_CHANGES");
  }
  const changeKeys = Object.keys(payload.changes);
  if (
    changeKeys.length === 0 ||
    changeKeys.some((field) => !OPPORTUNITY_CHANGE_FIELDS.has(field))
  ) {
    throw new Error("INVALID_OPPORTUNITY_CHANGES");
  }

  const changes = payload.changes;
  if (changes.stage !== undefined && !OPPORTUNITY_STAGES.has(changes.stage)) {
    throw new Error("INVALID_OPPORTUNITY_STAGE");
  }
  const closesOpportunity = changes.stage === "WON" || changes.stage === "LOST";
  if (approval.action === "CLOSE_OPPORTUNITY") {
    if (!closesOpportunity || !nullablePayloadText(changes.outcomeReason, "outcomeReason")) {
      throw new Error("CLOSE_REASON_REQUIRED");
    }
  } else if (approval.action !== "UPDATE_OPPORTUNITY" || closesOpportunity) {
    throw new Error("APPROVED_ACTION_MISMATCH");
  }
  if (
    changes.probability !== undefined &&
    (!Number.isInteger(changes.probability) ||
      changes.probability < 0 ||
      changes.probability > 100)
  ) {
    throw new Error("INVALID_OPPORTUNITY_PROBABILITY");
  }
  if (
    changes.estimatedValue !== undefined &&
    (!Number.isFinite(changes.estimatedValue) || changes.estimatedValue < 0)
  ) {
    throw new Error("INVALID_OPPORTUNITY_VALUE");
  }
  if (
    changes.currency !== undefined &&
    changes.currency !== "JMD" &&
    changes.currency !== "USD"
  ) {
    throw new Error("INVALID_CURRENCY");
  }

  const before = await tx.adminOpportunity.findFirstOrThrow({
    where: { id: payload.opportunityId, archivedAt: null },
  });
  const data: Prisma.AdminOpportunityUncheckedUpdateInput = {};
  if (changes.stage !== undefined) data.stage = changes.stage;
  if (changes.probability !== undefined) data.probability = changes.probability;
  if (changes.estimatedValue !== undefined) data.estimatedValue = changes.estimatedValue;
  if (changes.currency !== undefined) data.currency = changes.currency;
  if (changes.budget !== undefined) {
    data.budget = nullablePayloadText(changes.budget, "budget");
  }
  if (changes.timeline !== undefined) {
    data.timeline = nullablePayloadText(changes.timeline, "timeline");
  }
  if (changes.outcomeReason !== undefined) {
    data.outcomeReason = nullablePayloadText(changes.outcomeReason, "outcomeReason");
  }
  if (changes.nextAction !== undefined) {
    data.nextAction = nullablePayloadText(changes.nextAction, "nextAction");
  }
  if (changes.nextFollowUp !== undefined) {
    if (changes.nextFollowUp === null || changes.nextFollowUp === "") {
      data.nextFollowUp = null;
    } else {
      const nextFollowUp = new Date(changes.nextFollowUp);
      if (Number.isNaN(nextFollowUp.getTime())) {
        throw new Error("INVALID_NEXT_FOLLOW_UP");
      }
      data.nextFollowUp = nextFollowUp;
    }
  }
  if (changes.assignedOwnerId !== undefined) {
    if (
      changes.assignedOwnerId !== null &&
      typeof changes.assignedOwnerId !== "string"
    ) {
      throw new Error("INVALID_ASSIGNED_OWNER");
    }
    data.assignedOwnerId = changes.assignedOwnerId || null;
  }

  const updated = await tx.adminOpportunity.update({
    where: { id: before.id },
    data,
  });
  await tx.adminActivity.create({
    data: {
      opportunityId: updated.id,
      actorId,
      kind: before.stage === updated.stage ? "UPDATED" : "STAGE_CHANGED",
      summary:
        before.stage === updated.stage
          ? "Commercial details updated through founder approval."
          : `Stage moved from ${before.stage} to ${updated.stage} through founder approval.`,
      metadata: { approvalId: approval.id, action: approval.action },
    },
  });
  return updated;
}

async function archiveOpportunityFromApproval(
  tx: Prisma.TransactionClient,
  approval: {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    payload: Prisma.JsonValue;
  },
  actorId: string,
) {
  const payload = approval.payload as unknown as ArchiveOpportunityPayload;
  if (
    approval.action !== "ARCHIVE_OPPORTUNITY" ||
    approval.entityType !== "AdminOpportunity" ||
    approval.entityId !== payload.opportunityId ||
    Object.keys(payload).some((field) => field !== "opportunityId")
  ) {
    throw new Error("APPROVED_TARGET_MISMATCH");
  }
  const updated = await tx.adminOpportunity.update({
    where: { id: payload.opportunityId, archivedAt: null },
    data: { archivedAt: new Date() },
  });
  await tx.adminActivity.create({
    data: {
      opportunityId: updated.id,
      actorId,
      kind: "ARCHIVED",
      summary: "Opportunity archived through founder approval.",
      metadata: { approvalId: approval.id, action: approval.action },
    },
  });
  return updated;
}

async function deleteMarketingRecordFromApproval(
  tx: Prisma.TransactionClient,
  approval: {
    action: string;
    entityType: string;
    entityId: string;
    payload: Prisma.JsonValue;
  },
) {
  const payload = approval.payload as unknown as DeleteRecordPayload;
  if (
    approval.action !== "DELETE_RECORD" ||
    approval.entityType !== payload.recordType ||
    approval.entityId !== payload.recordId ||
    Object.keys(payload).some(
      (field) => !new Set(["recordType", "recordId", "operation"]).has(field),
    )
  ) {
    throw new Error("APPROVED_TARGET_MISMATCH");
  }

  if (payload.recordType === "MarketingWeeklyMetric") {
    if (payload.operation !== "delete") throw new Error("INVALID_DELETE_OPERATION");
    const record = await tx.marketingWeeklyMetric.delete({
      where: { id: payload.recordId },
    });
    return { operation: payload.operation, record };
  }
  if (payload.recordType === "MarketingUtmPreset") {
    if (payload.operation !== "delete") throw new Error("INVALID_DELETE_OPERATION");
    const record = await tx.marketingUtmPreset.delete({
      where: { id: payload.recordId },
    });
    return { operation: payload.operation, record };
  }
  if (payload.operation !== "archive") throw new Error("INVALID_DELETE_OPERATION");
  if (payload.recordType === "MarketingContent") {
    const record = await tx.marketingContent.update({
      where: { id: payload.recordId },
      data: { status: "ARCHIVED" },
    });
    return { operation: payload.operation, record };
  }
  if (payload.recordType === "MarketingCampaign") {
    const record = await tx.marketingCampaign.update({
      where: { id: payload.recordId },
      data: { status: "ARCHIVED" },
    });
    return { operation: payload.operation, record };
  }
  if (payload.recordType === "MarketingAsset") {
    const record = await tx.marketingAsset.update({
      where: { id: payload.recordId },
      data: { status: "ARCHIVED" },
    });
    return { operation: payload.operation, record };
  }
  throw new Error("UNSUPPORTED_DELETE_RECORD");
}

async function createPolicyFromApproval(
  tx: Prisma.TransactionClient,
  approval: {
    entityType: string;
    payload: Prisma.JsonValue;
    requestedById: string | null;
  },
) {
  if (approval.entityType !== "CooPolicy") {
    throw new Error("APPROVED_TARGET_MISMATCH");
  }
  const payload = approval.payload as unknown as {
    name: string;
    automationMode: "OFF" | "SHADOW" | "GUARDED";
    thresholds?: Partial<
      Omit<PolicyThresholds, "version" | "name" | "automationMode">
    >;
    rules?: unknown;
  };
  const current = await tx.cooPolicy.findFirst({
    orderBy: { version: "desc" },
  });
  const candidate: PolicyThresholds = {
    ...DEFAULT_POLICY,
    ...(payload.thresholds ?? {}),
    version: (current?.version ?? 0) + 1,
    name: payload.name,
    automationMode: payload.automationMode,
  };
  const errors = validatePolicy(candidate);
  if (errors.length > 0) throw new Error(errors.join("; "));
  await tx.cooPolicy.updateMany({
    where: { active: true },
    data: { active: false },
  });
  return tx.cooPolicy.create({
    data: {
      createdById: approval.requestedById,
      version: candidate.version,
      name: candidate.name,
      active: true,
      activatedAt: new Date(),
      automationMode: candidate.automationMode,
      projectDeadlineHours: candidate.projectDeadlineHours,
      staleProgressDays: candidate.staleProgressDays,
      approvalExpiryHours: candidate.approvalExpiryHours,
      safeBatchLimit: candidate.safeBatchLimit,
      prospectDailyMinimum: candidate.prospectDailyMinimum,
      prospectDailyMaximum: candidate.prospectDailyMaximum,
      maxFounderPriorities: candidate.maxFounderPriorities,
      freshnessMinutes: candidate.freshnessMinutes,
      rules: json(payload.rules),
    },
  });
}

export async function executeApprovedAction(input: {
  approvalId: string;
  actorId: string;
  correlationId: string;
}) {
  const outcome = await retrySerializableApprovalExecution(() =>
    prisma.$transaction(async (tx) => {
    const initial = await tx.cooApprovalRequest.findUniqueOrThrow({
      where: { id: input.approvalId },
      include: { policy: { select: { automationMode: true } } },
    });
    if (initial.status === "EXECUTED") {
      return { kind: "executed" as const, approval: initial };
    }
    if (initial.status !== "APPROVED") throw new Error("APPROVAL_REQUIRED");
    const executionNow = new Date();
    if (initial.expiresAt <= executionNow) {
      const expiredResult = await tx.cooApprovalRequest.updateMany({
        where: {
          id: initial.id,
          status: "APPROVED",
          version: initial.version,
        },
        data: { status: "EXPIRED", version: { increment: 1 } },
      });
      if (expiredResult.count !== 1) throw new Error("STALE_APPROVAL");
      const expired = await tx.cooApprovalRequest.findUniqueOrThrow({
        where: { id: initial.id },
      });
      await writeAudit(tx, {
        actorId: input.actorId,
        correlationId: input.correlationId,
        idempotencyKey: `${initial.idempotencyKey}:expiration:audit`,
        action: "UPDATE",
        entityType: "CooApprovalRequest",
        entityId: initial.id,
        summary: `Expired approval for ${initial.action} before execution`,
        before: initial,
        after: expired,
        evidence: initial.evidence,
        metadata: { approvalId: initial.id },
      });
      return { kind: "expired" as const, approval: expired };
    }

    const claim = await tx.cooApprovalRequest.updateMany({
      where: {
        id: initial.id,
        status: "APPROVED",
        version: initial.version,
      },
      data: { status: "EXECUTING", version: { increment: 1 } },
    });
    if (claim.count !== 1) {
      const winner = await tx.cooApprovalRequest.findUniqueOrThrow({
        where: { id: initial.id },
      });
      if (winner.status === "EXECUTED") {
        return { kind: "executed" as const, approval: winner };
      }
      if (winner.status === "EXECUTING") {
        throw new Error("APPROVAL_EXECUTION_IN_PROGRESS");
      }
      throw new Error("STALE_APPROVAL");
    }
    const approval = await tx.cooApprovalRequest.findUniqueOrThrow({
      where: { id: initial.id },
      include: { policy: { select: { automationMode: true } } },
    });
    if (
      approval.action !== "CHANGE_POLICY" &&
      getEffectiveAutomationMode(approval.policy?.automationMode ?? "SHADOW") !==
        "GUARDED"
    ) {
      throw new Error("AUTOMATION_NOT_GUARDED");
    }

    await lockApprovalTarget(tx, approval.entityType, approval.entityId);
    const before = await readTargetSnapshot(
      tx,
      approval.entityType,
      approval.entityId,
    );
    if (
      approval.targetSnapshot &&
      stableJson(approval.targetSnapshot) !== stableJson(before)
    ) {
      throw new Error("STALE_TARGET");
    }
    let result: unknown;
    if (approval.action === "CREATE_INVOICE") {
      result = await createInvoiceFromApproval(tx, approval);
    } else if (approval.action === "UPDATE_INVOICE") {
      result = await updateInvoiceFromApproval(tx, approval);
    } else if (approval.action === "RECORD_PAYMENT") {
      result = await recordPaymentFromApproval(tx, approval);
    } else if (
      approval.action === "UPDATE_OPPORTUNITY" ||
      approval.action === "CLOSE_OPPORTUNITY"
    ) {
      result = await updateOpportunityFromApproval(tx, approval, input.actorId);
    } else if (approval.action === "ARCHIVE_OPPORTUNITY") {
      result = await archiveOpportunityFromApproval(tx, approval, input.actorId);
    } else if (approval.action === "DELETE_RECORD") {
      result = await deleteMarketingRecordFromApproval(tx, approval);
    } else if (approval.action === "CHANGE_POLICY") {
      result = await createPolicyFromApproval(tx, approval);
    } else {
      throw new Error("UNSUPPORTED_ACTION");
    }

    const executionUpdate = await tx.cooApprovalRequest.updateMany({
      where: {
        id: approval.id,
        status: "EXECUTING",
        version: approval.version,
      },
      data: {
        status: "EXECUTED",
        executedAt: executionNow,
        executionResult: json(result),
        executionError: null,
        version: { increment: 1 },
      },
    });
    if (executionUpdate.count !== 1) throw new Error("STALE_APPROVAL");
    const executed = await tx.cooApprovalRequest.findUniqueOrThrow({
      where: { id: approval.id },
    });
    await writeAudit(tx, {
      actorId: input.actorId,
      correlationId: input.correlationId,
      idempotencyKey: `${approval.idempotencyKey}:execution:audit`,
      action:
        approval.action === "ARCHIVE_OPPORTUNITY" ||
        approval.action === "DELETE_RECORD"
          ? "ARCHIVE"
          : "UPDATE",
      entityType: approval.entityType,
      entityId: approval.entityId,
      summary: `Executed approved action ${approval.action}`,
      before,
      after: result,
      evidence: approval.evidence,
      metadata: { approvalId: approval.id },
    });
      return { kind: "executed" as const, approval: executed };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }),
  );
  if (outcome.kind === "expired") throw new Error("APPROVAL_EXPIRED");
  return outcome.approval;
}

export async function failApprovalExecution(input: FailApprovalExecutionInput) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.cooApprovalRequest.findUniqueOrThrow({
      where: { id: input.approvalId },
    });
    if (
      before.status === "FAILED" ||
      before.status === "EXECUTED" ||
      before.status === "REJECTED" ||
      before.status === "EXPIRED"
    ) {
      return before;
    }
    if (before.status !== "APPROVED" && before.status !== "EXECUTING") {
      throw new Error("APPROVAL_NOT_EXECUTABLE");
    }

    const failed = await tx.cooApprovalRequest.update({
      where: { id: before.id },
      data: {
        status: "FAILED",
        executionError: input.error.trim() || "Approval execution failed",
        version: { increment: 1 },
      },
    });
    await writeAudit(tx, {
      actorId: input.actorId,
      correlationId: input.correlationId,
      idempotencyKey: `approval:${before.id}:execution-failed`,
      action: "UPDATE",
      entityType: "CooApprovalRequest",
      entityId: before.id,
      summary: `Approval execution failed for ${before.action}`,
      before,
      after: failed,
      evidence: { error: failed.executionError },
      metadata: { approvalId: before.id, action: before.action },
    });
    return failed;
  });
}

export async function createPolicyVersion(input: CreatePolicyVersionInput) {
  const existingAudit = await prisma.adminAuditLog.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existingAudit) {
    return prisma.cooPolicy.findUniqueOrThrow({
      where: { id: existingAudit.entityId },
    });
  }
  const approval = await prisma.cooApprovalRequest.findUniqueOrThrow({
    where: { id: input.approvedRequestId },
  });
  const proposedPayload = {
    name: input.name,
    automationMode: input.automationMode,
    thresholds: input.thresholds ?? {},
    ...(input.rules === undefined ? {} : { rules: input.rules }),
  };
  if (stableJson(approval.payload) !== stableJson(proposedPayload)) {
    throw new Error("APPROVED_PAYLOAD_MISMATCH");
  }
  const executed = await executeApprovedAction({
    approvalId: approval.id,
    actorId: input.actorId ?? "",
    correlationId: input.correlationId,
  });
  const executionResult = executed.executionResult as {
    id?: string;
  } | null;
  if (!executionResult?.id) throw new Error("POLICY_EXECUTION_FAILED");
  return prisma.cooPolicy.findUniqueOrThrow({
    where: { id: executionResult.id },
  });
}

export async function beginAutomationRun(input: BeginAutomationRunInput) {
  const existing = await prisma.cooAutomationRun.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (existing) {
    assertAutomationRunReplay(existing, input);
    return { ...existing, alreadyExisted: true };
  }
  const policy = input.policyId
    ? await prisma.cooPolicy.findUniqueOrThrow({ where: { id: input.policyId } })
    : await ensureActivePolicy({ createdById: input.requestedById });
  const effectiveMode = getEffectiveAutomationMode(policy.automationMode);
  const allowsPolicyRecovery =
    effectiveMode === "OFF" && (await isApprovedPolicyRecoveryRun(input));
  const status =
    effectiveMode === "OFF" && !allowsPolicyRecovery ? "CANCELLED" : "RUNNING";
  try {
    const run = await prisma.cooAutomationRun.create({
      data: {
        type: input.type,
        mode: effectiveMode,
        policyId: policy.id,
        requestedById: input.requestedById ?? null,
        correlationId: input.correlationId,
        idempotencyKey: input.idempotencyKey,
        scheduledFor: input.scheduledFor ?? null,
        startedAt: new Date(),
        status,
        model: input.model ?? null,
        input: json(input.input),
        ...(status === "CANCELLED"
          ? { completedAt: new Date(), error: "Automation is disabled by policy" }
          : {}),
      },
    });
    return { ...run, alreadyExisted: false };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const winner = await prisma.cooAutomationRun.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (winner) {
        assertAutomationRunReplay(winner, input);
        return { ...winner, alreadyExisted: true };
      }
    }
    throw error;
  }
}

async function isApprovedPolicyRecoveryRun(
  input: BeginAutomationRunInput,
): Promise<boolean> {
  if (
    input.type !== "APPROVAL_EXECUTION" ||
    !input.input ||
    typeof input.input !== "object" ||
    Array.isArray(input.input)
  ) {
    return false;
  }
  const canonicalInput = input.input as Record<string, unknown>;
  if (
    canonicalInput.action !== "CHANGE_POLICY" ||
    typeof canonicalInput.approvalId !== "string"
  ) {
    return false;
  }
  const approval = await prisma.cooApprovalRequest.findUnique({
    where: { id: canonicalInput.approvalId },
    select: { action: true, status: true, expiresAt: true },
  });
  return (
    approval?.action === "CHANGE_POLICY" &&
    approval.status === "APPROVED" &&
    approval.expiresAt > new Date()
  );
}

function assertAutomationRunReplay(
  existing: {
    type: string;
    policyId: string | null;
    requestedById: string | null;
    model: string | null;
    input: Prisma.JsonValue | null;
  },
  input: BeginAutomationRunInput,
) {
  const scheduledRun =
    existing.type === "PROSPECTING" || existing.type === "DAILY_BRIEF";
  const matches =
    existing.type === input.type &&
    (scheduledRun || !input.policyId || existing.policyId === input.policyId) &&
    existing.requestedById === (input.requestedById ?? null) &&
    (scheduledRun || existing.model === (input.model ?? null)) &&
    stableJson(existing.input) === stableJson(input.input ?? null);
  if (!matches) throw new Error("IDEMPOTENCY_CONFLICT");
}

export async function upsertAutomationStep(input: UpsertAutomationStepInput) {
  const attempt = input.attempt ?? 1;
  return prisma.cooAutomationStep.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    create: {
      runId: input.runId,
      key: input.key,
      label: input.label,
      status: input.status,
      attempt,
      startedAt: input.startedAt ?? null,
      completedAt: input.completedAt ?? null,
      input: json(input.input),
      output: json(input.output),
      error: input.error ?? null,
      idempotencyKey: input.idempotencyKey,
    },
    update: {
      label: input.label,
      status: input.status,
      startedAt: input.startedAt ?? undefined,
      completedAt: input.completedAt ?? undefined,
      input: json(input.input),
      output: json(input.output),
      error: input.error ?? null,
    },
  });
}

export async function finalizeAutomationRun(input: FinalizeAutomationRunInput) {
  return prisma.cooAutomationRun.update({
    where: { id: input.runId },
    data: {
      status: input.status,
      completedAt: input.completedAt ?? new Date(),
      outputSummary: json(input.outputSummary),
      error: input.error ?? null,
      usage: json(input.usage),
      estimatedCostUsd: input.estimatedCostUsd ?? null,
    },
  });
}

export async function persistDailyBrief(input: PersistDailyBriefInput) {
  const policy = await prisma.cooPolicy.findUniqueOrThrow({
    where: { id: input.policyId },
  });
  const priorities = [...input.priorities]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, policy.maxFounderPriorities)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  const businessDate = new Date(
    Date.UTC(
      input.businessDate.getUTCFullYear(),
      input.businessDate.getUTCMonth(),
      input.businessDate.getUTCDate(),
    ),
  );
  return prisma.$transaction(async (tx) => {
    const existing = await tx.cooBrief.findUnique({ where: { businessDate } });
    if (existing) {
      await tx.cooBriefItem.deleteMany({ where: { briefId: existing.id } });
    }
    return tx.cooBrief.upsert({
      where: { businessDate },
      create: {
        businessDate,
        status: input.status,
        headline: input.headline,
        summary: input.summary,
        asOf: input.asOf,
        dataAsOf: input.dataAsOf ?? null,
        degradedReason: input.degradedReason ?? null,
        model: input.model ?? null,
        policyId: input.policyId,
        automationRunId: input.automationRunId ?? null,
        evidence: json(input.evidence),
        items: {
          create: priorities.map((item) => ({
            rank: item.rank,
            kind: item.kind,
            severity: item.severity,
            title: item.title,
            rationale: item.rationale,
            nextAction: item.nextAction,
            recordType: item.recordType ?? null,
            recordId: item.recordId ?? null,
            recordUrl: item.recordUrl ?? null,
            evidence: json(item.evidence),
            currency: item.currency,
            amount: item.amount,
          })),
        },
      },
      update: {
        status: input.status,
        headline: input.headline,
        summary: input.summary,
        asOf: input.asOf,
        dataAsOf: input.dataAsOf ?? null,
        degradedReason: input.degradedReason ?? null,
        model: input.model ?? null,
        policyId: input.policyId,
        automationRunId: input.automationRunId ?? null,
        evidence: json(input.evidence),
        items: {
          create: priorities.map((item) => ({
            rank: item.rank,
            kind: item.kind,
            severity: item.severity,
            title: item.title,
            rationale: item.rationale,
            nextAction: item.nextAction,
            recordType: item.recordType ?? null,
            recordId: item.recordId ?? null,
            recordUrl: item.recordUrl ?? null,
            evidence: json(item.evidence),
            currency: item.currency,
            amount: item.amount,
          })),
        },
      },
      include: { items: { orderBy: { rank: "asc" } } },
    });
  });
}

export async function recordInteractionSummary(
  input: RecordInteractionSummaryInput,
) {
  return prisma.cooInteractionSummary.upsert({
    where: { correlationId: input.correlationId },
    create: {
      channel: input.channel,
      status: input.status,
      actorId: input.actorId ?? null,
      automationRunId: input.automationRunId ?? null,
      correlationId: input.correlationId,
      model: input.model ?? null,
      summary: input.summary,
      conclusions: json(input.conclusions),
      citations: json(input.citations),
      toolCalls: json(input.toolCalls),
      outcomes: json(input.outcomes),
    },
    update: {
      status: input.status,
      model: input.model ?? null,
      summary: input.summary,
      conclusions: json(input.conclusions),
      citations: json(input.citations),
      toolCalls: json(input.toolCalls),
      outcomes: json(input.outcomes),
    },
  });
}

export async function getDefaultAutomationOwner(): Promise<{ id: string } | null> {
  return prisma.adminUser.findFirst({
    where: { active: true, role: { in: ["OWNER", "ADMIN"] } },
    orderBy: { role: "asc" },
    select: { id: true },
  });
}

function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/\D/g, "");
  return normalized || null;
}

function normalizeLinkedIn(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = url.pathname.replace(/\/+$/, "").toLowerCase();
    return `${hostname}${pathname}`;
  } catch {
    return value.trim().toLowerCase().replace(/\/+$/, "");
  }
}

function contactSignals(contact: {
  email: string | null;
  phone: string | null;
  linkedInUrl: string | null;
  contactMethods?: Array<{ channel: string; value: string }>;
}) {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const linkedIn = new Set<string>();
  const email = normalizeEmail(contact.email);
  const phone = normalizePhone(contact.phone);
  const linkedInUrl = normalizeLinkedIn(contact.linkedInUrl);
  if (email) emails.add(email);
  if (phone) phones.add(phone);
  if (linkedInUrl) linkedIn.add(linkedInUrl);
  for (const method of contact.contactMethods ?? []) {
    if (method.channel === "EMAIL") {
      const value = normalizeEmail(method.value);
      if (value) emails.add(value);
    } else if (method.channel === "PHONE") {
      const value = normalizePhone(method.value);
      if (value) phones.add(value);
    } else if (method.channel === "LINKEDIN") {
      const value = normalizeLinkedIn(method.value);
      if (value) linkedIn.add(value);
    }
  }
  return { emails, phones, linkedIn };
}

function hasDuplicateContact(
  candidate: { email?: string | null; phone?: string | null; linkedInUrl?: string | null },
  existingContacts: Array<{
    email: string | null;
    phone: string | null;
    linkedInUrl: string | null;
    contactMethods?: Array<{ channel: string; value: string }>;
  }>,
): boolean {
  const candidateSignals = contactSignals({
    email: candidate.email ?? null,
    phone: candidate.phone ?? null,
    linkedInUrl: candidate.linkedInUrl ?? null,
  });
  return existingContacts.some((contact) => {
    const existing = contactSignals(contact);
    return (
      [...candidateSignals.emails].some((value) => existing.emails.has(value)) ||
      [...candidateSignals.phones].some((value) => existing.phones.has(value)) ||
      [...candidateSignals.linkedIn].some((value) => existing.linkedIn.has(value))
    );
  });
}

export async function persistVerifiedProspectBatch(
  input: PersistVerifiedProspectBatchInput,
): Promise<PersistVerifiedProspectBatchResult> {
  const run = await prisma.cooAutomationRun.findUniqueOrThrow({
    where: { id: input.automationRunId },
    include: { policy: { select: { version: true } } },
  });
  const [defaultOwner, knownContacts, companies, opportunities] = await Promise.all([
    getDefaultAutomationOwner(),
    prisma.adminContact.findMany({
      where: { archivedAt: null },
      select: {
        email: true,
        phone: true,
        linkedInUrl: true,
        contactMethods: { select: { channel: true, value: true } },
      },
    }),
    prisma.adminCompany.findMany({ select: { domain: true } }),
    prisma.adminOpportunity.findMany({ select: { reference: true } }),
  ]);
  const knownDomains = new Set(
    companies.map((company) => company.domain.trim().toLowerCase()),
  );
  const knownReferences = new Set(
    opportunities.map((opportunity) => opportunity.reference),
  );
  const result: PersistVerifiedProspectBatchResult = {
    accepted: 0,
    rejected: [],
    opportunityIds: [],
    taskIds: [],
  };

  if (run.status !== "RUNNING") {
    throw new Error("AUTOMATION_RUN_NOT_ACTIVE");
  }
  if (run.mode === "OFF") {
    result.rejected = input.candidates.map((candidate) => ({
      candidateKey: candidate.candidateKey,
      reasons: ["AUTOMATION_DISABLED"],
    }));
    return result;
  }

  for (const candidate of input.candidates) {
    const ownerId = candidate.ownerId ?? defaultOwner?.id;
    if (!ownerId) {
      result.rejected.push({
        candidateKey: candidate.candidateKey,
        reasons: ["NO_ACTIVE_AUTOMATION_OWNER"],
      });
      continue;
    }
    const normalizedDomain = candidate.company.domain.trim().toLowerCase();
    const domainMatch = knownDomains.has(normalizedDomain);
    const referenceMatch = knownReferences.has(candidate.opportunity.reference);
    const contactMatch = hasDuplicateContact(candidate.contact, knownContacts);
    if (referenceMatch) {
      result.rejected.push({
        candidateKey: candidate.candidateKey,
        reasons: ["DUPLICATE_REFERENCE"],
      });
      continue;
    }
    const acceptance = assessProspectAcceptance(
      {
        sourceUrls: candidate.research.sourceUrls,
        sourceObservedAt: candidate.research.sourceObservedAt,
        hasReachableContactMethod: Boolean(
          candidate.contact.email ||
            candidate.contact.phone ||
            candidate.contact.linkedInUrl,
        ),
        observedBusinessNeed: candidate.research.observedProblems,
        duplicateDomain: domainMatch,
        duplicateContact: contactMatch,
      },
      new Date(),
    );
    const scores = validateProspectScores({
      financialCapacityScore: candidate.research.financialCapacityScore,
      problemSeverityScore: candidate.research.problemSeverityScore,
      strategicFitScore: candidate.research.strategicFitScore,
      urgencyScore: candidate.research.urgencyScore,
      decisionMakerAccessScore: candidate.research.decisionMakerAccessScore,
    });
    const reasons: string[] = [...acceptance.reasons];
    if (!scores.valid) reasons.push("INVALID_SCORES");
    if (reasons.length > 0) {
      result.rejected.push({ candidateKey: candidate.candidateKey, reasons });
      continue;
    }

    if (run.mode === "SHADOW") {
      result.accepted += 1;
      knownDomains.add(normalizedDomain);
      knownReferences.add(candidate.opportunity.reference);
      knownContacts.push({
        email: normalizeEmail(candidate.contact.email),
        phone: candidate.contact.phone ?? null,
        linkedInUrl: candidate.contact.linkedInUrl ?? null,
        contactMethods: [],
      });
      continue;
    }

    const persisted = await prisma.$transaction(async (tx) => {
      const company = await tx.adminCompany.create({
        data: {
          name: candidate.company.name,
          domain: candidate.company.domain.trim().toLowerCase(),
          website: candidate.company.website,
          industry: candidate.company.industry,
          country: candidate.company.country,
          estimatedSize: candidate.company.estimatedSize ?? null,
          phone: candidate.company.phone ?? null,
          status: "TARGET",
        },
      });
      const contact = await tx.adminContact.create({
        data: {
          companyId: company.id,
          name: candidate.contact.name,
          title: candidate.contact.title ?? null,
          email: normalizeEmail(candidate.contact.email),
          phone: candidate.contact.phone ?? null,
          linkedInUrl: candidate.contact.linkedInUrl ?? null,
          isDecisionMaker: true,
        },
      });
      const opportunity = await tx.adminOpportunity.create({
        data: {
          reference: candidate.opportunity.reference,
          companyId: company.id,
          primaryContactId: contact.id,
          assignedOwnerId: ownerId,
          direction: "OUTBOUND",
          type: candidate.opportunity.type,
          title: candidate.opportunity.title,
          source: candidate.opportunity.source,
          identifiedProblem: candidate.opportunity.identifiedProblem,
          opportunity: candidate.opportunity.opportunity,
          estimatedValue: candidate.opportunity.estimatedValue ?? 0,
          currency: candidate.opportunity.currency ?? "USD",
          probability: candidate.opportunity.probability ?? 10,
          nextFollowUp: candidate.opportunity.nextFollowUp ?? null,
          reasonForContact: candidate.opportunity.reasonForContact ?? null,
          personalizationAngle:
            candidate.opportunity.personalizationAngle ?? null,
        },
      });
      await tx.adminProspectResearch.create({
        data: {
          opportunityId: opportunity.id,
          automationRunId: run.id,
          classification: "QUALIFIED",
          observedProblems: candidate.research.observedProblems,
          recentBusinessActivity:
            candidate.research.recentBusinessActivity ?? null,
          notes: candidate.research.notes ?? null,
          financialCapacityScore: candidate.research.financialCapacityScore,
          problemSeverityScore: candidate.research.problemSeverityScore,
          strategicFitScore: candidate.research.strategicFitScore,
          urgencyScore: candidate.research.urgencyScore,
          decisionMakerAccessScore:
            candidate.research.decisionMakerAccessScore,
          totalScore: scores.totalScore,
          websiteReviewed: true,
          businessModelUnderstood: true,
          decisionMakerIdentified: true,
          specificProblemIdentified: true,
          personalizationPrepared: Boolean(
            candidate.opportunity.personalizationAngle,
          ),
          contactMethodFound: true,
          sourceUrls: candidate.research.sourceUrls,
          verifiedAt: candidate.research.sourceObservedAt,
          readyForOutreachAt: candidate.opportunity.personalizationAngle
            ? new Date()
            : null,
        },
      });
      let taskId: string | null = null;
      if (candidate.followUpTask) {
        const task = await tx.adminTask.create({
          data: {
            opportunityId: opportunity.id,
            companyId: company.id,
            contactId: contact.id,
            ownerId,
            automationRunId: run.id,
            type: "FOLLOW_UP",
            priority: candidate.followUpTask.priority ?? "HIGH",
            title: candidate.followUpTask.title,
            dueAt: candidate.followUpTask.dueAt,
            notes: candidate.followUpTask.notes ?? null,
            source: "AUTOMATION",
            idempotencyKey: `${run.id}:prospect:${candidate.candidateKey}:follow-up`,
          },
        });
        taskId = task.id;
      }
      await writeAudit(tx, {
        actorId: null,
        correlationId: input.correlationId,
        idempotencyKey: `${run.id}:prospect:${candidate.candidateKey}:audit`,
        action: "CREATE",
        entityType: "AdminOpportunity",
        entityId: opportunity.id,
        summary: `Persisted verified prospect ${candidate.company.name}`,
        after: { company, contact, opportunity, taskId },
        evidence: { sourceUrls: candidate.research.sourceUrls },
        metadata: {
          automationRunId: run.id,
          policyId: run.policyId,
          policyVersion: run.policy?.version ?? null,
        },
      });
      return { opportunityId: opportunity.id, taskId };
    });
    result.accepted += 1;
    result.opportunityIds.push(persisted.opportunityId);
    if (persisted.taskId) result.taskIds.push(persisted.taskId);
    knownDomains.add(normalizedDomain);
    knownReferences.add(candidate.opportunity.reference);
    knownContacts.push({
      email: normalizeEmail(candidate.contact.email),
      phone: candidate.contact.phone ?? null,
      linkedInUrl: candidate.contact.linkedInUrl ?? null,
      contactMethods: [],
    });
  }

  if (run.mode === "SHADOW") {
    await recordInteractionSummary({
      channel: "WORKFLOW",
      status: "PARTIAL",
      automationRunId: run.id,
      correlationId: `${input.correlationId}:prospect-shadow`,
      summary: `${result.accepted} prospect candidates passed full validation in shadow mode; no CRM records were written.`,
      conclusions: input.candidates.map((candidate) => ({
        candidateKey: candidate.candidateKey,
        company: candidate.company.name,
        sourceUrls: candidate.research.sourceUrls,
      })),
      outcomes: {
        wouldAccept: result.accepted,
        rejected: result.rejected,
        persisted: 0,
        mode: run.mode,
      },
    });
  }

  return result;
}

export async function executeSafeOperation(
  input: SafeOperationInput,
): Promise<SafeOperationResult> {
  const priorAudit = await prisma.adminAuditLog.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
  });
  if (priorAudit) {
    assertSafeOperationReplay(priorAudit, input);
    return {
      status: "ALREADY_EXECUTED",
      action: input.action,
      entityType: priorAudit.entityType,
      entityId: priorAudit.entityId,
      correlationId: input.correlationId,
    };
  }
  let effectiveMode: AutomationMode;
  let policyId: string | null;
  let policyVersion: number | null;
  if (input.automationRunId) {
    const run = await prisma.cooAutomationRun.findUniqueOrThrow({
      where: { id: input.automationRunId },
      select: {
        mode: true,
        status: true,
        policyId: true,
        policy: { select: { version: true } },
      },
    });
    if (run.status !== "RUNNING") throw new Error("AUTOMATION_RUN_NOT_RUNNING");
    effectiveMode = getEffectiveAutomationMode(run.mode);
    policyId = run.policyId;
    policyVersion = run.policy?.version ?? null;
  } else {
    const policy = await ensureActivePolicy({ createdById: input.actorId });
    effectiveMode = getEffectiveAutomationMode(policy.automationMode);
    policyId = policy.id;
    policyVersion = policy.version;
  }
  if (effectiveMode === "OFF") throw new Error("AUTOMATION_DISABLED");

  if (effectiveMode === "SHADOW") {
    try {
      await prisma.$transaction((tx) =>
        writeAudit(tx, {
          actorId: input.actorId,
          correlationId: input.correlationId,
          idempotencyKey: input.idempotencyKey,
          action: "CREATE",
          entityType: "CooShadowOperation",
          entityId: input.idempotencyKey,
          summary: `Shadowed safe operation ${input.action}`,
          before: null,
          after: { action: input.action, payload: input.payload },
          evidence: input.payload.evidence,
          metadata: {
            automationRunId: input.automationRunId ?? null,
            effectiveMode,
            policyId,
            policyVersion,
            safeOperationAction: input.action,
            safeOperationPayload: input.payload,
          },
        }),
      );
    } catch (error) {
      return recoverSafeOperationCollision(error, input);
    }
    return {
      status: "SHADOWED",
      action: input.action,
      entityType: "CooShadowOperation",
      entityId: null,
      correlationId: input.correlationId,
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
    let entityType: string;
    let entityId: string;
    let before: unknown = null;
    let after: unknown;

    if (input.action === "CREATE_TASK") {
      const type = optionalString(input.payload, "type") ?? "FOLLOW_UP";
      const priority = optionalString(input.payload, "priority") ?? "MEDIUM";
      const allowedTypes = new Set([
        "CALL",
        "EMAIL",
        "LINKEDIN",
        "RESEARCH",
        "PROPOSAL",
        "FOLLOW_UP",
        "MEETING",
      ]);
      const allowedPriorities = new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]);
      if (!allowedTypes.has(type)) throw new Error("INVALID_TASK_TYPE");
      if (!allowedPriorities.has(priority)) throw new Error("INVALID_TASK_PRIORITY");
      const task = await tx.adminTask.create({
        data: {
          opportunityId: optionalString(input.payload, "opportunityId"),
          companyId: optionalString(input.payload, "companyId"),
          contactId: optionalString(input.payload, "contactId"),
          projectId: optionalString(input.payload, "projectId"),
          milestoneId: optionalString(input.payload, "milestoneId"),
          automationRunId: input.automationRunId ?? null,
          ownerId: requiredString(input.payload, "ownerId"),
          type: type as
            | "CALL"
            | "EMAIL"
            | "LINKEDIN"
            | "RESEARCH"
            | "PROPOSAL"
            | "FOLLOW_UP"
            | "MEETING",
          priority: priority as
            | "LOW"
            | "MEDIUM"
            | "HIGH"
            | "URGENT",
          title: requiredString(input.payload, "title"),
          dueAt: requiredDate(input.payload, "dueAt"),
          notes: optionalString(input.payload, "notes"),
          source: input.automationRunId ? "AUTOMATION" : "AI",
          idempotencyKey: input.idempotencyKey,
        },
      });
      entityType = "AdminTask";
      entityId = task.id;
      after = task;
    } else if (input.action === "ADD_INTERNAL_NOTE") {
      if (!input.actorId) throw new Error("ACTOR_REQUIRED");
      const note = await tx.adminOpportunityNote.create({
        data: {
          opportunityId: requiredString(input.payload, "opportunityId"),
          authorId: input.actorId,
          body: requiredString(input.payload, "body"),
        },
      });
      entityType = "AdminOpportunityNote";
      entityId = note.id;
      after = note;
    } else if (input.action === "SET_FOLLOW_UP") {
      const opportunityId = requiredString(input.payload, "opportunityId");
      before = await tx.adminOpportunity.findUniqueOrThrow({
        where: { id: opportunityId },
      });
      const opportunity = await tx.adminOpportunity.update({
        where: { id: opportunityId },
        data: {
          nextFollowUp: requiredDate(input.payload, "nextFollowUp"),
          nextAction: optionalString(input.payload, "nextAction"),
        },
      });
      entityType = "AdminOpportunity";
      entityId = opportunity.id;
      after = opportunity;
    } else if (input.action === "CLASSIFY_PROSPECT") {
      const opportunityId = requiredString(input.payload, "opportunityId");
      const classification = requiredString(input.payload, "classification");
      if (
        !new Set(["QUALIFIED", "NURTURE", "NOT_A_FIT"]).has(classification)
      ) {
        throw new Error("INVALID_PROSPECT_CLASSIFICATION");
      }
      if (
        "readyForOutreach" in input.payload ||
        "personalizationPrepared" in input.payload
      ) {
        throw new Error("UNSUPPORTED_PROSPECT_CLASSIFICATION_FIELD");
      }
      before = await tx.adminProspectResearch.findUniqueOrThrow({
        where: { opportunityId },
      });
      const research = await tx.adminProspectResearch.update({
        where: { opportunityId },
        data: {
          classification: classification as
            | "QUALIFIED"
            | "NURTURE"
            | "NOT_A_FIT",
          notes: optionalString(input.payload, "notes"),
        },
      });
      entityType = "AdminProspectResearch";
      entityId = research.id;
      after = research;
    } else if (input.action === "SET_INTERNAL_RISK_FLAG") {
      const projectId = requiredString(input.payload, "projectId");
      before = await tx.adminProject.findUniqueOrThrow({
        where: { id: projectId },
      });
      const health = requiredString(input.payload, "health");
      if (!new Set(["ATTENTION", "AT_RISK"]).has(health)) {
        throw new Error("health must be ATTENTION or AT_RISK");
      }
      const project = await tx.adminProject.update({
        where: { id: projectId },
        data: {
          healthOverride: health as "ATTENTION" | "AT_RISK",
          healthOverrideReason: requiredString(input.payload, "reason"),
          version: { increment: 1 },
        },
      });
      entityType = "AdminProject";
      entityId = project.id;
      after = project;
    } else {
      throw new Error("UNSUPPORTED_ACTION");
    }

    await writeAudit(tx, {
      actorId: input.actorId,
      correlationId: input.correlationId,
      idempotencyKey: input.idempotencyKey,
      action: before ? "UPDATE" : "CREATE",
      entityType,
      entityId,
      summary: `Executed safe operation ${input.action}`,
      before,
      after,
      evidence: input.payload.evidence,
      metadata: {
        automationRunId: input.automationRunId ?? null,
        effectiveMode,
        policyId,
        policyVersion,
        safeOperationAction: input.action,
        safeOperationPayload: input.payload,
      },
    });
    return {
      status: "EXECUTED",
      action: input.action,
      entityType,
      entityId,
      correlationId: input.correlationId,
    };
    });
  } catch (error) {
    return recoverSafeOperationCollision(error, input);
  }
}

async function recoverSafeOperationCollision(
  error: unknown,
  input: SafeOperationInput,
): Promise<SafeOperationResult> {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const winner = await prisma.adminAuditLog.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (winner) {
      assertSafeOperationReplay(winner, input);
      return {
        status: "ALREADY_EXECUTED",
        action: input.action,
        entityType: winner.entityType,
        entityId: winner.entityId,
        correlationId: winner.correlationId ?? input.correlationId,
      };
    }
  }
  throw error;
}

function assertSafeOperationReplay(
  audit: {
    actorId: string | null;
    metadata: Prisma.JsonValue | null;
  },
  input: SafeOperationInput,
) {
  const metadata =
    audit.metadata &&
    typeof audit.metadata === "object" &&
    !Array.isArray(audit.metadata)
      ? (audit.metadata as Record<string, unknown>)
      : null;
  if (
    audit.actorId !== input.actorId ||
    metadata?.safeOperationAction !== input.action ||
    stableJson(metadata.safeOperationPayload) !== stableJson(input.payload)
  ) {
    throw new Error("IDEMPOTENCY_CONFLICT");
  }
}
