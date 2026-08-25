"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireFounderSession } from "@/lib/admin/auth";
import { askTrexiti, planAndStartOperations } from "@/lib/coo/ai";
import {
  createMilestone,
  createProject,
  addProjectUpdate,
  updateMilestone,
  updateProject,
  decideApproval,
  decideApprovalBatch,
  ensureActivePolicy,
  getActivePolicy,
  getApprovalExecutionContext,
  listApprovalRequests,
  listFinanceOverview,
  requestApproval,
} from "@/lib/coo/data";
import type { Currency } from "@/lib/coo/domain/types";
import { CooRateLimitError } from "@/lib/coo/rate-limit";
import { createAdminCooToolContext, startApprovalExecutionWorkflow } from "@/lib/coo/tools";

export type OperationsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  links?: Array<{ href: string; label: string }>;
  nextIdempotencyKey?: string;
};

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function safeReturnPath(formData: FormData, fallback: string) {
  const candidate = formValue(formData, "returnTo");
  return candidate.startsWith("/admin") && !candidate.startsWith("//") ? candidate : fallback;
}

function requiredValue(formData: FormData, key: string) {
  const input = formValue(formData, key);
  if (!input) throw new Error(`${key} is required`);
  return input;
}

function optionalDate(input: string) {
  if (!input) return null;
  const zonedInput = /^\d{4}-\d{2}-\d{2}$/.test(input)
    ? `${input}T00:00:00-05:00`
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(input)
      ? `${input}-05:00`
      : input;
  const date = new Date(zonedInput);
  if (Number.isNaN(date.getTime())) throw new Error("Enter a valid date");
  return date;
}

function requiredDate(input: string, label: string) {
  const date = optionalDate(input);
  if (!date) throw new Error(`${label} is required`);
  return date;
}

function optionalInteger(input: string) {
  if (!input) return null;
  const number = Number(input);
  if (!Number.isInteger(number)) throw new Error("Enter a whole number");
  return number;
}

function requiredInteger(input: string, label: string) {
  const number = optionalInteger(input);
  if (number === null) throw new Error(`${label} is required`);
  return number;
}

function positiveMoney(input: string, label: string) {
  if (!/^\d{1,16}(?:\.\d{1,2})?$/.test(input)) {
    throw new Error(`${label} must be a positive amount with no more than two decimal places`);
  }
  const number = Number(input);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} must be greater than zero`);
  return number;
}

function currencyValue(formData: FormData, key: string): Currency {
  const input = formValue(formData, key);
  if (input !== "JMD" && input !== "USD") {
    throw new Error("Currency must be JMD or USD");
  }
  return input;
}

function paymentMethod(formData: FormData) {
  const input = formValue(formData, "method");
  const methods = ["CASH", "BANK_TRANSFER", "CARD", "CHEQUE", "MOBILE_MONEY", "OTHER"] as const;
  return methods.find((method) => method === input) ?? "OTHER";
}

function appendParam(path: string, key: string, value: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function redirectToError(path: string, message: string): never {
  redirect(appendParam(path, "error", message));
}

function redirectWithFlag(path: string, flag: string): never {
  redirect(appendParam(path, flag, "1"));
}

function actionError(error: unknown) {
  if (!(error instanceof Error)) return "The operation could not be completed.";
  if (error instanceof CooRateLimitError) {
    return error.message.replace(/^RATE_LIMITED:\s*/, "");
  }
  const known: Record<string, string> = {
    STALE_TARGET: "The target changed while you were reviewing it. Refresh and try again.",
    STALE_APPROVAL: "This approval was updated elsewhere. Refresh before deciding.",
    APPROVAL_EXPIRED: "This approval expired and cannot be executed.",
    APPROVAL_NOT_PENDING: "This approval is no longer pending.",
    SAFE_BATCH_LIMIT: "This batch exceeds the active policy limit.",
    MIXED_SAFE_BATCH: "Only identical low-consequence actions can share a batch.",
    UNSAFE_BATCH: "Destructive actions must be reviewed individually.",
    AUTOMATION_NOT_GUARDED: "Execution is held until Trexiti is in guarded automation mode.",
    APPROVAL_EXECUTION_IN_PROGRESS: "This approved action is already executing.",
  };
  return known[error.message] ?? error.message;
}

function revalidateOperationsPaths() {
  for (const path of ["/admin", "/admin/clients", "/admin/projects", "/admin/finance", "/admin/approvals", "/admin/automations", "/admin/operations-policy"]) {
    revalidatePath(path);
  }
}

export async function createAdminProjectAction(formData: FormData) {
  const session = await requireFounderSession("operations:write");
  const returnTo = safeReturnPath(formData, "/admin/projects");
  const status = formValue(formData, "status");
  try {
    await createProject({
      actorId: session.id,
      correlationId: randomUUID(),
      idempotencyKey: formValue(formData, "idempotencyKey") || randomUUID(),
      evidence: { source: "admin-project-form" },
      companyId: requiredValue(formData, "companyId"),
      opportunityId: formValue(formData, "opportunityId") || null,
      ownerId: session.id,
      title: requiredValue(formData, "title"),
      description: formValue(formData, "description") || null,
      status: status === "ACTIVE" || status === "ON_HOLD" ? status : "PLANNED",
      startAt: optionalDate(formValue(formData, "startAt")),
      targetEndAt: optionalDate(formValue(formData, "targetEndAt")),
    });
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidateOperationsPaths();
  redirectWithFlag(returnTo, "projectCreated");
}

export async function createAdminMilestoneAction(formData: FormData) {
  const session = await requireFounderSession("operations:write");
  const returnTo = safeReturnPath(formData, "/admin/projects");
  const status = formValue(formData, "status");
  try {
    await createMilestone({
      actorId: session.id,
      correlationId: randomUUID(),
      idempotencyKey: formValue(formData, "idempotencyKey") || randomUUID(),
      evidence: { source: "admin-milestone-form" },
      projectId: requiredValue(formData, "projectId"),
      dependencyMilestoneId: formValue(formData, "dependencyMilestoneId") || null,
      title: requiredValue(formData, "title"),
      description: formValue(formData, "description") || null,
      status: status === "IN_PROGRESS" || status === "BLOCKED" ? status : "NOT_STARTED",
      dueAt: optionalDate(formValue(formData, "dueAt")),
      sortOrder: optionalInteger(formValue(formData, "sortOrder")) ?? 0,
    });
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidateOperationsPaths();
  redirectWithFlag(returnTo, "milestoneCreated");
}

export async function addAdminProjectUpdateAction(formData: FormData) {
  const session = await requireFounderSession("operations:write");
  const projectId = requiredValue(formData, "projectId");
  const returnTo = safeReturnPath(formData, `/admin/projects/${projectId}`);
  try {
    const activeBlocker = formValue(formData, "activeBlocker") || null;
    await addProjectUpdate({
      actorId: session.id,
      correlationId: randomUUID(),
      idempotencyKey: formValue(formData, "idempotencyKey") || randomUUID(),
      evidence: { source: "admin-project-update-form" },
      projectId,
      summary: requiredValue(formData, "summary"),
      progressPercent: optionalInteger(formValue(formData, "progressPercent")),
      activeBlocker,
      blockers: activeBlocker ? { active: activeBlocker } : null,
    });
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidateOperationsPaths();
  redirectWithFlag(returnTo, "updateAdded");
}

export async function updateAdminProjectStatusAction(formData: FormData) {
  const session = await requireFounderSession("operations:write");
  const returnTo = safeReturnPath(formData, "/admin/projects");
  try {
    const projectId = requiredValue(formData, "projectId");
    const status = requiredValue(formData, "status");
    if (!new Set(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).has(status)) {
      throw new Error("Choose a valid project status");
    }
    await updateProject({
      actorId: session.id,
      correlationId: randomUUID(),
      idempotencyKey: formValue(formData, "idempotencyKey") || randomUUID(),
      evidence: { source: "admin-project-status-form" },
      projectId,
      expectedVersion: requiredInteger(formValue(formData, "expectedVersion"), "Project version"),
      changes: {
        status: status as "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED",
        targetEndAt: optionalDate(formValue(formData, "targetEndAt")),
        completedAt: status === "COMPLETED" ? new Date() : null,
        ...(status === "COMPLETED" ? { progressPercent: 100 } : {}),
      },
    });
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidateOperationsPaths();
  redirectWithFlag(returnTo, "projectUpdated");
}

export async function updateAdminMilestoneAction(formData: FormData) {
  const session = await requireFounderSession("operations:write");
  const returnTo = safeReturnPath(formData, "/admin/projects");
  try {
    const milestoneId = requiredValue(formData, "milestoneId");
    const status = requiredValue(formData, "status");
    if (!new Set(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"]).has(status)) {
      throw new Error("Choose a valid milestone status");
    }
    const blocker = formValue(formData, "blocker") || null;
    if (status === "BLOCKED" && !blocker) {
      throw new Error("Describe the blocker before marking this milestone blocked");
    }
    await updateMilestone({
      actorId: session.id,
      correlationId: randomUUID(),
      idempotencyKey: formValue(formData, "idempotencyKey") || randomUUID(),
      evidence: { source: "admin-milestone-status-form" },
      milestoneId,
      expectedVersion: requiredInteger(formValue(formData, "expectedVersion"), "Milestone version"),
      changes: {
        status: status as "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED",
        dueAt: optionalDate(formValue(formData, "dueAt")),
        blocker: status === "BLOCKED" ? blocker : null,
        blockedAt: status === "BLOCKED" ? new Date() : null,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidateOperationsPaths();
  redirectWithFlag(returnTo, "milestoneUpdated");
}

export async function createAdminInvoiceAction(formData: FormData) {
  const session = await requireFounderSession("operations:write");
  const returnTo = safeReturnPath(formData, "/admin/finance");
  const companyId = requiredValue(formData, "companyId");
  const currency = currencyValue(formData, "currency");
  try {
    await requestApproval({
      actorId: session.id,
      correlationId: randomUUID(),
      idempotencyKey: formValue(formData, "idempotencyKey") || randomUUID(),
      evidence: { source: "admin-invoice-form" },
      action: "CREATE_INVOICE",
      risk: "SENSITIVE",
      entityType: "AdminCompany",
      entityId: companyId,
      payload: {
        companyId,
        projectId: formValue(formData, "projectId") || null,
        invoiceNumber: requiredValue(formData, "invoiceNumber"),
        currency,
        amount: positiveMoney(formValue(formData, "amount"), "Amount"),
        issuedAt: optionalDate(formValue(formData, "issuedAt")),
        dueAt: optionalDate(formValue(formData, "dueAt")),
        notes: formValue(formData, "notes") || null,
        externalReference: formValue(formData, "externalReference") || null,
      },
    });
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidatePath("/admin/approvals");
  redirectWithFlag(returnTo, "approvalRequested");
}

export async function recordAdminPaymentAction(formData: FormData) {
  const session = await requireFounderSession("operations:write");
  const returnTo = safeReturnPath(formData, "/admin/finance");
  try {
    const invoiceId = requiredValue(formData, "invoiceId");
    const finance = await listFinanceOverview();
    const invoice = finance.invoices.find((item) => item.id === invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    const amount = positiveMoney(formValue(formData, "amount"), "Amount");
    if (amount > invoice.balance) throw new Error("Payment allocation exceeds the invoice balance");
    const method = paymentMethod(formData);
    const status = formValue(formData, "status");
    if (status !== "PENDING" && status !== "CLEARED") {
      throw new Error("Payment status must be pending or cleared");
    }
    await requestApproval({
      actorId: session.id,
      correlationId: randomUUID(),
      idempotencyKey: formValue(formData, "idempotencyKey") || randomUUID(),
      evidence: { source: "admin-payment-form", invoiceId: invoice.id },
      action: "RECORD_PAYMENT",
      risk: "SENSITIVE",
      entityType: "AdminInvoice",
      entityId: invoice.id,
      payload: {
        companyId: invoice.companyId,
        currency: invoice.currency,
        amount,
        status,
        method,
        paidAt: requiredDate(formValue(formData, "paidAt"), "Paid at"),
        reference: formValue(formData, "reference") || null,
        notes: formValue(formData, "notes") || null,
        allocations: [{ invoiceId: invoice.id, amount }],
      },
    });
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidatePath("/admin/approvals");
  redirectWithFlag(returnTo, "approvalRequested");
}

export async function decideApprovalRequestAction(formData: FormData) {
  const session = await requireFounderSession("operations:approve");
  const returnTo = safeReturnPath(formData, "/admin/approvals");
  const decision = formValue(formData, "decision") === "REJECT" ? "REJECT" : "APPROVE";
  try {
    const approvalId = requiredValue(formData, "approvalId");
    const expectedVersion = requiredInteger(formValue(formData, "expectedVersion"), "Approval version");
    const approval = await decideApproval({
      approvalId,
      expectedVersion,
      actorId: session.id,
      decision,
      reason: formValue(formData, "reason") || `${decision === "APPROVE" ? "Approved" : "Rejected"} by founder from the operations centre.`,
      correlationId: randomUUID(),
      idempotencyKey: `approval-decision:${approvalId}:${expectedVersion}:${decision}`,
    });
    if (decision === "APPROVE" && approval.status === "APPROVED") {
      await startApprovalExecutionWorkflow({
        approvalId: approval.id,
        actorId: session.id,
        idempotencyKey: `approval-execution:${approval.id}:${approval.version}`,
      });
    }
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidateOperationsPaths();
  redirectWithFlag(returnTo, "decided");
}

export async function executeApprovedRequestAction(formData: FormData) {
  const session = await requireFounderSession("operations:approve");
  const returnTo = safeReturnPath(formData, "/admin/approvals");
  try {
    const approvalId = requiredValue(formData, "approvalId");
    const approval = await getApprovalExecutionContext(approvalId);
    if (!approval) throw new Error("Approval request not found");
    if (approval.status === "EXPIRED") throw new Error("APPROVAL_EXPIRED");
    if (approval.status !== "APPROVED") {
      throw new Error("Only an approved, unexpired request can be executed");
    }
    await startApprovalExecutionWorkflow({
      approvalId,
      actorId: session.id,
      idempotencyKey: `approval-execution:${approvalId}:${approval.version}:${formValue(formData, "idempotencyKey") || randomUUID()}`,
    });
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidateOperationsPaths();
  redirectWithFlag(returnTo, "executionQueued");
}

export async function decideApprovalBatchAction(formData: FormData) {
  const session = await requireFounderSession("operations:approve");
  const returnTo = safeReturnPath(formData, "/admin/approvals");
  const decision = formValue(formData, "decision") === "REJECT" ? "REJECT" : "APPROVE";
  try {
    const batchKey = requiredValue(formData, "safeBatchKey");
    const [requests, policy] = await Promise.all([
      listApprovalRequests({ status: "PENDING", take: 100 }),
      getActivePolicy(),
    ]);
    const batch = requests.filter((request) => request.safeBatchKey === batchKey);
    if (!batch.length) throw new Error("This approval batch is no longer pending");
    if (batch.length > policy.safeBatchLimit) throw new Error("SAFE_BATCH_LIMIT");
    const first = batch[0];
    if (!first || first.risk === "DESTRUCTIVE") throw new Error("UNSAFE_BATCH");
    if (batch.some((request) => request.action !== first.action || request.risk !== first.risk)) {
      throw new Error("MIXED_SAFE_BATCH");
    }
    const reason = formValue(formData, "reason") || `${decision === "APPROVE" ? "Approved" : "Rejected"} safe batch ${batchKey} from the operations centre.`;
    const batchVersionKey = batch.map((request) => `${request.id}:${request.version}`).join("|");
    const approvals = await decideApprovalBatch({
      items: batch.map((request) => ({ approvalId: request.id, expectedVersion: request.version })),
      actorId: session.id,
      decision,
      reason,
      correlationId: randomUUID(),
      idempotencyKey: `approval-batch:${batchKey}:${decision}:${batchVersionKey}`,
    });
    if (decision === "APPROVE") {
      await Promise.all(approvals.map((approval) => startApprovalExecutionWorkflow({
        approvalId: approval.id,
        actorId: session.id,
        idempotencyKey: `approval-execution:${approval.id}:${approval.version}`,
      })));
    }
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidateOperationsPaths();
  redirectWithFlag(returnTo, "decided");
}

export async function saveOperationsPolicyAction(formData: FormData) {
  const session = await requireFounderSession("operations:policy");
  const returnTo = safeReturnPath(formData, "/admin/operations-policy");
  try {
    const policy = await getActivePolicy();
    const ensuredPolicy = policy.id ? null : await ensureActivePolicy({ createdById: session.id });
    const activePolicyId = policy.id ?? ensuredPolicy?.id;
    const activePolicyVersion = policy.id ? policy.version : ensuredPolicy?.version;
    if (!activePolicyId || !activePolicyVersion) throw new Error("Active policy is unavailable");
    const automationMode = formValue(formData, "automationMode");
    await requestApproval({
      actorId: session.id,
      correlationId: randomUUID(),
      idempotencyKey: formValue(formData, "idempotencyKey") || randomUUID(),
      evidence: { source: "admin-operations-policy-form" },
      action: "CHANGE_POLICY",
      risk: "SENSITIVE",
      entityType: "CooPolicy",
      entityId: activePolicyId,
      targetVersion: activePolicyVersion,
      payload: {
        name: requiredValue(formData, "name"),
        automationMode: automationMode === "OFF" || automationMode === "GUARDED" ? automationMode : "SHADOW",
        thresholds: {
          projectDeadlineHours: requiredInteger(formValue(formData, "projectDeadlineHours"), "Deadline horizon"),
          staleProgressDays: requiredInteger(formValue(formData, "staleProgressDays"), "Stale progress"),
          approvalExpiryHours: requiredInteger(formValue(formData, "approvalExpiryHours"), "Approval expiry"),
          safeBatchLimit: requiredInteger(formValue(formData, "safeBatchLimit"), "Safe batch limit"),
          prospectDailyMinimum: requiredInteger(formValue(formData, "prospectDailyMinimum"), "Prospect minimum"),
          prospectDailyMaximum: requiredInteger(formValue(formData, "prospectDailyMaximum"), "Prospect maximum"),
          maxFounderPriorities: requiredInteger(formValue(formData, "maxFounderPriorities"), "Founder priorities"),
          freshnessMinutes: requiredInteger(formValue(formData, "freshnessMinutes"), "Freshness"),
        },
      },
    });
  } catch (error) {
    redirectToError(returnTo, actionError(error));
  }
  revalidatePath("/admin/approvals");
  redirectWithFlag(returnTo, "approvalRequested");
}

export async function runSafeOperationsAction(
  _previousState: OperationsActionState,
  formData: FormData,
): Promise<OperationsActionState> {
  const session = await requireFounderSession("operations:write");
  const instruction = formValue(formData, "instruction");
  if (instruction.length < 8) {
    return { status: "error", message: "Describe the internal work Trexiti should perform.", nextIdempotencyKey: `admin:run-operations:${randomUUID()}` };
  }

  try {
    const idempotencyKey = formValue(formData, "idempotencyKey") || `admin:run-operations:${randomUUID()}`;
    const context = createAdminCooToolContext(session, { correlationId: randomUUID(), origin: "admin" });
    const result = await planAndStartOperations({
      instruction,
      context,
      idempotencyKey,
    });
    revalidatePath("/admin/automations");
    const cautions = [...result.plan.blockedSensitiveActions, ...result.plan.unsupportedActions];
    return {
      status: "success",
      message: result.launch
        ? `${result.plan.rationale} Queued ${result.plan.operations.length} safe ${result.plan.operations.length === 1 ? "action" : "actions"} in durable run ${result.launch.runId}.${cautions.length ? ` Not launched: ${cautions.join("; ")}` : ""}`
        : `${result.plan.rationale} No operation was launched.${cautions.length ? ` ${cautions.join("; ")}` : ""}`,
      links: result.launch ? [{ href: "/admin/automations", label: "Track automation" }] : [{ href: "/admin/approvals", label: "Review approvals" }],
      nextIdempotencyKey: `admin:run-operations:${randomUUID()}`,
    };
  } catch (error) {
    return { status: "error", message: actionError(error), nextIdempotencyKey: `admin:run-operations:${randomUUID()}` };
  }
}

export async function askTrexitiAction(
  _previousState: OperationsActionState,
  formData: FormData,
): Promise<OperationsActionState> {
  const session = await requireFounderSession("operations:view");
  const question = formValue(formData, "question");
  if (question.length < 4) {
    return { status: "error", message: "Ask a specific operational question." };
  }

  try {
    const context = createAdminCooToolContext(session, { correlationId: randomUUID(), origin: "admin" });
    const result = await askTrexiti({ question, context });
    return {
      status: "success",
      message: `${result.answer}${result.dataLimitations.length ? `\n\nData limitations: ${result.dataLimitations.join("; ")}` : ""}\n\nAs of ${result.asOf}.`,
      links: result.links.map((link) => ({ href: link.href, label: link.label })),
    };
  } catch (error) {
    return { status: "error", message: actionError(error) };
  }
}
