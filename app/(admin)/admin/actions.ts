"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/admin/auth";
import {
  isProspectReady,
  manualOutreachPlan,
  stageProbability,
} from "@/lib/admin/crm";
import {
  addOpportunityNoteSchema,
  archiveOpportunitySchema,
  createOpportunitySchema,
  createTaskSchema,
  convertProjectLeadSchema,
  logMessageSchema,
  markMessageActionedSchema,
  moveOpportunitySchema,
  completeOutreachStepSchema,
  startOutreachSequenceSchema,
  updateDailyTargetsSchema,
  updateOpportunitySchema,
  updateProspectResearchSchema,
  updateResearchChecklistSchema,
  updateTaskStatusSchema,
} from "@/lib/admin/validation";
import { prisma } from "@/lib/prisma";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function safeReturnPath(formData: FormData, fallback: string) {
  const candidate = value(formData, "returnTo");
  return candidate.startsWith("/admin") && !candidate.startsWith("//")
    ? candidate
    : fallback;
}

function redirectWithError(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

function nextReference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `TRX-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function optionalDate(input: string | undefined) {
  if (!input) return undefined;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function createOpportunityAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:create");
  const returnTo = safeReturnPath(formData, "/admin/leads");
  const parsed = createOpportunitySchema.safeParse({
    companyName: value(formData, "companyName"),
    website: value(formData, "website"),
    industry: value(formData, "industry"),
    country: value(formData, "country"),
    estimatedCompanySize: value(formData, "estimatedCompanySize"),
    decisionMaker: value(formData, "decisionMaker"),
    decisionMakerTitle: value(formData, "decisionMakerTitle"),
    email: value(formData, "email"),
    phone: value(formData, "phone"),
    linkedInUrl: value(formData, "linkedInUrl"),
    instagramUrl: value(formData, "instagramUrl"),
    whatsapp: value(formData, "whatsapp"),
    otherContactMethod: value(formData, "otherContactMethod"),
    opportunityType: value(formData, "opportunityType"),
    identifiedProblem: value(formData, "identifiedProblem"),
    opportunity: value(formData, "opportunity"),
    estimatedProjectValue: value(formData, "estimatedProjectValue"),
    budget: value(formData, "budget"),
    timeline: value(formData, "timeline"),
    source: value(formData, "source"),
    reasonForContact: value(formData, "reasonForContact"),
    personalizationAngle: value(formData, "personalizationAngle"),
    currentWebsiteQuality: value(formData, "currentWebsiteQuality"),
    operationalMaturity: value(formData, "operationalMaturity"),
    observedProblems: value(formData, "observedProblems"),
    recentBusinessActivity: value(formData, "recentBusinessActivity"),
    researchNotes: value(formData, "researchNotes"),
    nextFollowUp: value(formData, "nextFollowUp"),
    financialCapacityScore: value(formData, "financialCapacityScore"),
    problemSeverityScore: value(formData, "problemSeverityScore"),
    strategicFitScore: value(formData, "strategicFitScore"),
    urgencyScore: value(formData, "urgencyScore"),
    decisionMakerAccessScore: value(formData, "decisionMakerAccessScore"),
  });

  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Review the prospect details.",
    );
  }

  const input = parsed.data;
  const opportunityId = await prisma.$transaction(async (transaction) => {
    const company = await transaction.adminCompany.upsert({
      where: { domain: input.domain },
      update: {
        name: input.companyName,
        website: input.website,
        industry: input.industry,
        country: input.country,
        estimatedSize: input.estimatedCompanySize,
        status: "ACTIVE",
      },
      create: {
        name: input.companyName,
        domain: input.domain,
        website: input.website,
        industry: input.industry,
        country: input.country,
        estimatedSize: input.estimatedCompanySize,
        status: "TARGET",
      },
    });
    const contact = await transaction.adminContact.upsert({
      where: {
        companyId_email: { companyId: company.id, email: input.email },
      },
      update: {
        name: input.decisionMaker,
        title: input.decisionMakerTitle,
        phone: input.phone,
        linkedInUrl: input.linkedInUrl,
        isDecisionMaker: true,
      },
      create: {
        companyId: company.id,
        name: input.decisionMaker,
        title: input.decisionMakerTitle,
        email: input.email,
        phone: input.phone,
        linkedInUrl: input.linkedInUrl,
        isDecisionMaker: true,
      },
    });
    const contactMethods = [
      { channel: "EMAIL" as const, value: input.email, label: "Work email", preferred: true },
      input.phone
        ? { channel: "PHONE" as const, value: input.phone, label: "Phone", preferred: false }
        : null,
      input.linkedInUrl
        ? { channel: "LINKEDIN" as const, value: input.linkedInUrl, label: "LinkedIn", preferred: false }
        : null,
      input.instagramUrl
        ? { channel: "INSTAGRAM" as const, value: input.instagramUrl, label: "Instagram", preferred: false }
        : null,
      input.whatsapp
        ? { channel: "WHATSAPP" as const, value: input.whatsapp, label: "WhatsApp", preferred: false }
        : null,
      input.otherContactMethod
        ? { channel: "OTHER" as const, value: input.otherContactMethod, label: "Other", preferred: false }
        : null,
    ].filter((method) => method !== null);
    await transaction.adminContactMethod.createMany({
      data: contactMethods.map((method) => ({ ...method, contactId: contact.id })),
      skipDuplicates: true,
    });
    const opportunity = await transaction.adminOpportunity.create({
      data: {
        reference: nextReference(),
        companyId: company.id,
        primaryContactId: contact.id,
        assignedOwnerId: session.id,
        direction: "OUTBOUND",
        stage: "RESEARCHING",
        type: input.opportunityType,
        title: `${input.companyName} — ${input.opportunityType.replaceAll("_", " ")}`,
        source: input.source,
        identifiedProblem: input.identifiedProblem,
        opportunity: input.opportunity,
        estimatedValue: input.estimatedProjectValue,
        budget: input.budget,
        timeline: input.timeline,
        probability: stageProbability.RESEARCHING,
        nextAction: input.reasonForContact,
        nextFollowUp: optionalDate(input.nextFollowUp),
        reasonForContact: input.reasonForContact,
        personalizationAngle: input.personalizationAngle,
        research: {
          create: {
            currentWebsiteQuality: input.currentWebsiteQuality,
            operationalMaturity: input.operationalMaturity,
            observedProblems: input.observedProblems,
            recentBusinessActivity: input.recentBusinessActivity,
            notes: input.researchNotes,
            financialCapacityScore: input.financialCapacityScore,
            problemSeverityScore: input.problemSeverityScore,
            strategicFitScore: input.strategicFitScore,
            urgencyScore: input.urgencyScore,
            decisionMakerAccessScore: input.decisionMakerAccessScore,
            totalScore: input.totalScore,
          },
        },
        activities: {
          create: {
            actorId: session.id,
            kind: "CREATED",
            summary: "Outbound opportunity created after account research.",
          },
        },
      },
    });

    if (opportunity.nextFollowUp) {
      await transaction.adminTask.create({
        data: {
          opportunityId: opportunity.id,
          companyId: company.id,
          contactId: contact.id,
          ownerId: session.id,
          type: "FOLLOW_UP",
          priority: input.totalScore >= 20 ? "HIGH" : "MEDIUM",
          title: `Review outreach for ${company.name}`,
          dueAt: opportunity.nextFollowUp,
          notes: input.reasonForContact,
        },
      });
    }

    await transaction.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: "CREATE",
        entityType: "AdminOpportunity",
        entityId: opportunity.id,
        summary: `${opportunity.reference} created.`,
        after: {
          companyId: company.id,
          stage: opportunity.stage,
          estimatedValue: String(opportunity.estimatedValue),
          score: input.totalScore,
        },
      },
    });

    return opportunity.id;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/pipeline");
  redirect(`/admin/leads/${opportunityId}?created=1`);
}

function projectTypeFromLead(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("website") || normalized.includes("digital")) return "WEBSITE_REDESIGN" as const;
  if (normalized.includes("portal")) return "CUSTOMER_PORTAL" as const;
  if (normalized.includes("automation")) return "AUTOMATION" as const;
  if (normalized.includes("business system")) return "BUSINESS_SYSTEM" as const;
  if (normalized.includes("software")) return "CUSTOM_SOFTWARE" as const;
  return "OTHER" as const;
}

function estimatedValueFromBudget(value: string) {
  if (value.includes("50,000+")) return 65000;
  if (value.includes("25,000")) return 37500;
  if (value.includes("10,000")) return 17500;
  if (value.startsWith("Under")) return 2500;
  if (value.includes("5,000")) return 7500;
  return 0;
}

function companyDomainFromLead(
  companyWebsite: string | null,
  companyName: string,
  leadId: string,
) {
  if (companyWebsite) {
    return new URL(companyWebsite).hostname.toLowerCase().replace(/^www\./, "");
  }

  const companySlug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${companySlug || "company"}-${leadId.slice(-8)}.no-website`;
}

export async function convertProjectLeadAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:create");
  const parsed = convertProjectLeadSchema.safeParse({
    projectLeadId: value(formData, "projectLeadId"),
  });
  if (!parsed.success) redirectWithError("/admin/leads", "Invalid inbound lead.");

  const lead = await prisma.projectLead.findFirst({
    where: { id: parsed.data.projectLeadId, opportunity: null },
  });
  if (!lead) redirectWithError("/admin/leads", "Inbound lead is already converted or unavailable.");

  const domain = companyDomainFromLead(
    lead.companyWebsite,
    lead.companyName,
    lead.id,
  );
  const attributedSource = [
    lead.lastTouchSource ?? lead.utmSource ?? lead.source,
    lead.lastTouchMedium ?? lead.utmMedium,
    lead.lastTouchCampaign ?? lead.utmCampaign,
  ]
    .filter(Boolean)
    .join(" / ");
  const opportunityId = await prisma.$transaction(async (transaction) => {
    const company = await transaction.adminCompany.upsert({
      where: { domain },
      update: {
        name: lead.companyName,
        website: lead.companyWebsite,
        industry: lead.industry,
        country: lead.location,
        estimatedSize: lead.teamSize ?? lead.companySize,
        status: "ACTIVE",
      },
      create: {
        name: lead.companyName,
        domain,
        website: lead.companyWebsite,
        industry: lead.industry,
        country: lead.location,
        estimatedSize: lead.teamSize ?? lead.companySize,
        status: "ACTIVE",
      },
    });
    const contact = await transaction.adminContact.upsert({
      where: { companyId_email: { companyId: company.id, email: lead.email } },
      update: { name: lead.name, title: lead.role, phone: lead.phone, isDecisionMaker: true },
      create: {
        companyId: company.id,
        name: lead.name,
        title: lead.role,
        email: lead.email,
        phone: lead.phone,
        isDecisionMaker: true,
      },
    });
    const opportunity = await transaction.adminOpportunity.create({
      data: {
        reference: nextReference(),
        companyId: company.id,
        primaryContactId: contact.id,
        projectLeadId: lead.id,
        assignedOwnerId: session.id,
        direction: "INBOUND",
        stage: "QUALIFIED",
        type: projectTypeFromLead(lead.projectType),
        title: `${lead.companyName} — ${lead.projectType}`,
        source: attributedSource || lead.source,
        identifiedProblem: lead.friction ?? lead.challenge,
        opportunity:
          lead.qualificationSummary ?? lead.objectives.join("; "),
        estimatedValue: estimatedValueFromBudget(lead.budgetRange),
        budget:
          lead.investmentNotes ??
          lead.investmentContext ??
          lead.budgetRange,
        timeline: lead.timeline,
        probability: stageProbability.QUALIFIED,
        nextAction:
          lead.nextAction ??
          "Review the submitted business context and prepare discovery questions.",
        activities: {
          create: {
            actorId: session.id,
            kind: "CREATED",
            summary: "Inbound project qualification converted to an opportunity.",
          },
        },
      },
    });
    await transaction.projectLead.update({
      where: { id: lead.id },
      data: { status: "REVIEWING" },
    });
    await transaction.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: "CREATE",
        entityType: "AdminOpportunity",
        entityId: opportunity.id,
        summary: `${opportunity.reference} created from inbound ProjectLead.`,
        metadata: { projectLeadId: lead.id },
      },
    });
    return opportunity.id;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${opportunityId}?created=1`);
}

export async function updateOpportunityAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:update");
  const returnTo = safeReturnPath(formData, "/admin/leads");
  const parsed = updateOpportunitySchema.safeParse({
    opportunityId: value(formData, "opportunityId"),
    stage: value(formData, "stage"),
    probability: value(formData, "probability"),
    estimatedProjectValue: value(formData, "estimatedProjectValue"),
    budget: value(formData, "budget"),
    timeline: value(formData, "timeline"),
    outcomeReason: value(formData, "outcomeReason"),
    nextAction: value(formData, "nextAction"),
    nextFollowUp: value(formData, "nextFollowUp"),
    assignedOwnerId: value(formData, "assignedOwnerId"),
  });

  if (!parsed.success) {
    redirectWithError(returnTo, parsed.error.issues[0]?.message ?? "Invalid update.");
  }

  const existing = await prisma.adminOpportunity.findFirst({
    where: { id: parsed.data.opportunityId, archivedAt: null },
    select: {
      stage: true,
      probability: true,
      estimatedValue: true,
      outcomeReason: true,
    },
  });

  if (!existing) redirectWithError("/admin/leads", "Opportunity not found.");

  await prisma.$transaction(async (transaction) => {
    const updated = await transaction.adminOpportunity.update({
      where: { id: parsed.data.opportunityId },
      data: {
        stage: parsed.data.stage,
        probability: parsed.data.probability,
        estimatedValue: parsed.data.estimatedProjectValue,
        budget: parsed.data.budget ?? null,
        timeline: parsed.data.timeline ?? null,
        outcomeReason: parsed.data.outcomeReason ?? null,
        nextAction: parsed.data.nextAction ?? null,
        nextFollowUp: optionalDate(parsed.data.nextFollowUp) ?? null,
        assignedOwnerId: parsed.data.assignedOwnerId ?? null,
      },
    });
    await transaction.adminActivity.create({
      data: {
        opportunityId: updated.id,
        actorId: session.id,
        kind: existing.stage === updated.stage ? "UPDATED" : "STAGE_CHANGED",
        summary:
          existing.stage === updated.stage
            ? "Commercial details updated."
            : `Stage moved from ${existing.stage} to ${updated.stage}.`,
      },
    });
    await transaction.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: "UPDATE",
        entityType: "AdminOpportunity",
        entityId: updated.id,
        summary: `${updated.reference} updated.`,
        before: {
          stage: existing.stage,
          probability: existing.probability,
          estimatedValue: String(existing.estimatedValue),
          outcomeReason: existing.outcomeReason,
        },
        after: {
          stage: updated.stage,
          probability: updated.probability,
          estimatedValue: String(updated.estimatedValue),
          outcomeReason: updated.outcomeReason,
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${parsed.data.opportunityId}`);
  revalidatePath("/admin/pipeline");
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}saved=1`);
}

export async function moveOpportunityAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:update");
  const returnTo = safeReturnPath(formData, "/admin/pipeline");
  const parsed = moveOpportunitySchema.safeParse({
    opportunityId: value(formData, "opportunityId"),
    stage: value(formData, "stage"),
  });

  if (!parsed.success) redirectWithError(returnTo, "Invalid pipeline update.");

  const existing = await prisma.adminOpportunity.findFirst({
    where: { id: parsed.data.opportunityId, archivedAt: null },
    select: { stage: true },
  });
  if (!existing) redirectWithError(returnTo, "Opportunity not found.");

  await prisma.$transaction([
    prisma.adminOpportunity.update({
      where: { id: parsed.data.opportunityId },
      data: {
        stage: parsed.data.stage,
        probability: stageProbability[parsed.data.stage],
      },
    }),
    prisma.adminActivity.create({
      data: {
        opportunityId: parsed.data.opportunityId,
        actorId: session.id,
        kind: "STAGE_CHANGED",
        summary: `Stage moved from ${existing.stage} to ${parsed.data.stage}.`,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: "UPDATE",
        entityType: "AdminOpportunity",
        entityId: parsed.data.opportunityId,
        summary: `Pipeline stage changed to ${parsed.data.stage}.`,
        before: { stage: existing.stage },
        after: { stage: parsed.data.stage },
      },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/pipeline");
  redirect(returnTo);
}

export async function archiveOpportunityAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:archive");
  const parsed = archiveOpportunitySchema.safeParse({
    opportunityId: value(formData, "opportunityId"),
  });
  if (!parsed.success) redirectWithError("/admin/leads", "Invalid archive request.");

  await prisma.$transaction(async (transaction) => {
    const opportunity = await transaction.adminOpportunity.update({
      where: { id: parsed.data.opportunityId },
      data: { archivedAt: new Date() },
    });
    await transaction.adminActivity.create({
      data: {
        opportunityId: opportunity.id,
        actorId: session.id,
        kind: "ARCHIVED",
        summary: "Opportunity archived.",
      },
    });
    await transaction.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: "ARCHIVE",
        entityType: "AdminOpportunity",
        entityId: opportunity.id,
        summary: `${opportunity.reference} archived.`,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/pipeline");
  redirect("/admin/leads?archived=1");
}

export async function createTaskAction(formData: FormData) {
  const session = await requireAdminSession("task:manage");
  const returnTo = safeReturnPath(formData, "/admin/tasks");
  const parsed = createTaskSchema.safeParse({
    opportunityId: value(formData, "opportunityId"),
    companyId: value(formData, "companyId"),
    type: value(formData, "type"),
    priority: value(formData, "priority"),
    title: value(formData, "title"),
    dueAt: value(formData, "dueAt"),
    notes: value(formData, "notes"),
  });
  if (!parsed.success) {
    redirectWithError(returnTo, parsed.error.issues[0]?.message ?? "Invalid task.");
  }

  const dueAt = optionalDate(parsed.data.dueAt);
  if (!dueAt) redirectWithError(returnTo, "Enter a valid due date.");

  const opportunity = parsed.data.opportunityId
    ? await prisma.adminOpportunity.findFirst({
        where: { id: parsed.data.opportunityId, archivedAt: null },
        select: { companyId: true },
      })
    : null;
  if (parsed.data.opportunityId && !opportunity) {
    redirectWithError(returnTo, "Select an active opportunity.");
  }
  const companyId = parsed.data.companyId || opportunity?.companyId;
  if (!companyId) redirectWithError(returnTo, "Select a company or opportunity.");

  const company = await prisma.adminCompany.findFirst({
    where: { id: companyId, archivedAt: null },
    select: { id: true },
  });
  if (!company) redirectWithError(returnTo, "Select an active company.");

  await prisma.$transaction(async (transaction) => {
    const created = await transaction.adminTask.create({
      data: {
        opportunityId: parsed.data.opportunityId,
        companyId,
        ownerId: session.id,
        type: parsed.data.type,
        priority: parsed.data.priority,
        title: parsed.data.title,
        dueAt,
        notes: parsed.data.notes,
      },
    });

    if (parsed.data.opportunityId) {
      await transaction.adminActivity.create({
        data: {
          opportunityId: parsed.data.opportunityId,
          actorId: session.id,
          kind: "TASK_CREATED",
          summary: `Task created: ${created.title}`,
        },
      });
    }

    await transaction.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: "CREATE",
        entityType: "AdminTask",
        entityId: created.id,
        summary: `Task created: ${created.title}`,
        after: {
          status: created.status,
          type: created.type,
          priority: created.priority,
          opportunityId: created.opportunityId,
          companyId: created.companyId,
        },
      },
    });

    return created;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tasks");
  if (parsed.data.opportunityId) {
    revalidatePath(`/admin/leads/${parsed.data.opportunityId}`);
  }
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}taskCreated=1`);
}

export async function updateTaskStatusAction(formData: FormData) {
  const session = await requireAdminSession("task:manage");
  const returnTo = safeReturnPath(formData, "/admin/tasks");
  const parsed = updateTaskStatusSchema.safeParse({
    taskId: value(formData, "taskId"),
    status: value(formData, "status"),
  });
  if (!parsed.success) redirectWithError(returnTo, "Invalid task status.");

  const existing = await prisma.adminTask.findFirst({
    where: { id: parsed.data.taskId, archivedAt: null },
    select: { id: true, status: true },
  });
  if (!existing) redirectWithError(returnTo, "Task not found.");

  const task = await prisma.adminTask.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status,
      completedAt: parsed.data.status === "DONE" ? new Date() : null,
    },
  });

  if (task.opportunityId) {
    await prisma.adminActivity.create({
      data: {
        opportunityId: task.opportunityId,
        actorId: session.id,
        kind: "UPDATED",
        summary: `Task “${task.title}” marked ${parsed.data.status.toLowerCase()}.`,
      },
    });
  }

  await prisma.adminAuditLog.create({
    data: {
      actorId: session.id,
      action: "UPDATE",
      entityType: "AdminTask",
      entityId: task.id,
      summary: `Task status changed from ${existing.status} to ${task.status}.`,
      before: { status: existing.status },
      after: { status: task.status },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/tasks");
  if (task.opportunityId) {
    revalidatePath(`/admin/leads/${task.opportunityId}`);
  }
  redirect(returnTo);
}

export async function updateResearchChecklistAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:update");
  const returnTo = safeReturnPath(formData, "/admin/leads");
  const parsed = updateResearchChecklistSchema.safeParse({
    opportunityId: value(formData, "opportunityId"),
    websiteReviewed: formData.get("websiteReviewed") === "on",
    mobileReviewed: formData.get("mobileReviewed") === "on",
    businessModelUnderstood: formData.get("businessModelUnderstood") === "on",
    decisionMakerIdentified: formData.get("decisionMakerIdentified") === "on",
    specificProblemIdentified: formData.get("specificProblemIdentified") === "on",
    personalizationPrepared: formData.get("personalizationPrepared") === "on",
    contactMethodFound: formData.get("contactMethodFound") === "on",
  });
  if (!parsed.success) redirectWithError(returnTo, "Invalid research checklist.");

  const checklist = parsed.data;
  const ready = isProspectReady(checklist);
  const opportunity = await prisma.adminOpportunity.findFirst({
    where: { id: checklist.opportunityId, archivedAt: null },
    select: {
      research: { select: { id: true, readyForOutreachAt: true } },
      activities: {
        where: { kind: "RESEARCH_COMPLETED" },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!opportunity) redirectWithError(returnTo, "Opportunity not found.");

  const existing = opportunity.research;
  const becameReady = ready && !existing?.readyForOutreachAt;
  const firstCompletion = becameReady && opportunity.activities.length === 0;
  const { opportunityId, ...researchValues } = checklist;

  await prisma.$transaction(async (transaction) => {
    const research = await transaction.adminProspectResearch.upsert({
      where: { opportunityId },
      update: {
        ...researchValues,
        readyForOutreachAt: ready
          ? existing?.readyForOutreachAt ?? new Date()
          : null,
      },
      create: {
        opportunityId,
        ...researchValues,
        readyForOutreachAt: ready ? new Date() : null,
      },
    });
    await transaction.adminActivity.create({
      data: {
        opportunityId,
        actorId: session.id,
        kind: firstCompletion ? "RESEARCH_COMPLETED" : "UPDATED",
        summary: becameReady
          ? "Research checklist completed; account is ready for outreach."
          : ready
            ? "Completed research checklist reviewed."
            : "Research checklist updated; outreach remains locked.",
      },
    });
    await transaction.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: existing ? "UPDATE" : "CREATE",
        entityType: "AdminProspectResearch",
        entityId: research.id,
        summary: becameReady
          ? "Prospect marked ready for manual outreach."
          : "Prospect research checklist updated.",
        before: { readyForOutreach: Boolean(existing?.readyForOutreachAt) },
        after: { readyForOutreach: ready },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/accounts");
  revalidatePath(`/admin/leads/${opportunityId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}researchSaved=1`);
}

export async function updateProspectResearchAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:update");
  const returnTo = safeReturnPath(formData, "/admin/leads");
  const parsed = updateProspectResearchSchema.safeParse({
    opportunityId: value(formData, "opportunityId"),
    currentWebsiteQuality: value(formData, "currentWebsiteQuality"),
    operationalMaturity: value(formData, "operationalMaturity"),
    observedProblems: value(formData, "observedProblems"),
    recentBusinessActivity: value(formData, "recentBusinessActivity"),
    personalizationAngle: value(formData, "personalizationAngle"),
    researchNotes: value(formData, "researchNotes"),
    financialCapacityScore: value(formData, "financialCapacityScore"),
    problemSeverityScore: value(formData, "problemSeverityScore"),
    strategicFitScore: value(formData, "strategicFitScore"),
    urgencyScore: value(formData, "urgencyScore"),
    decisionMakerAccessScore: value(formData, "decisionMakerAccessScore"),
  });
  if (!parsed.success) {
    redirectWithError(
      returnTo,
      parsed.error.issues[0]?.message ?? "Review the research profile.",
    );
  }

  const existing = await prisma.adminOpportunity.findFirst({
    where: { id: parsed.data.opportunityId, archivedAt: null },
    select: {
      personalizationAngle: true,
      research: {
        select: {
          id: true,
          financialCapacityScore: true,
          problemSeverityScore: true,
          strategicFitScore: true,
          urgencyScore: true,
          decisionMakerAccessScore: true,
          totalScore: true,
        },
      },
    },
  });
  if (!existing) redirectWithError(returnTo, "Opportunity not found.");

  const input = parsed.data;
  await prisma.$transaction(async (transaction) => {
    await transaction.adminOpportunity.update({
      where: { id: input.opportunityId },
      data: { personalizationAngle: input.personalizationAngle },
    });
    const research = await transaction.adminProspectResearch.upsert({
      where: { opportunityId: input.opportunityId },
      update: {
        currentWebsiteQuality: input.currentWebsiteQuality,
        operationalMaturity: input.operationalMaturity,
        observedProblems: input.observedProblems,
        recentBusinessActivity: input.recentBusinessActivity,
        notes: input.researchNotes,
        financialCapacityScore: input.financialCapacityScore,
        problemSeverityScore: input.problemSeverityScore,
        strategicFitScore: input.strategicFitScore,
        urgencyScore: input.urgencyScore,
        decisionMakerAccessScore: input.decisionMakerAccessScore,
        totalScore: input.totalScore,
      },
      create: {
        opportunityId: input.opportunityId,
        currentWebsiteQuality: input.currentWebsiteQuality,
        operationalMaturity: input.operationalMaturity,
        observedProblems: input.observedProblems,
        recentBusinessActivity: input.recentBusinessActivity,
        notes: input.researchNotes,
        financialCapacityScore: input.financialCapacityScore,
        problemSeverityScore: input.problemSeverityScore,
        strategicFitScore: input.strategicFitScore,
        urgencyScore: input.urgencyScore,
        decisionMakerAccessScore: input.decisionMakerAccessScore,
        totalScore: input.totalScore,
      },
    });
    await transaction.adminActivity.create({
      data: {
        opportunityId: input.opportunityId,
        actorId: session.id,
        kind: "UPDATED",
        summary: "Prospect research and quality score updated.",
      },
    });
    await transaction.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: existing.research ? "UPDATE" : "CREATE",
        entityType: "AdminProspectResearch",
        entityId: research.id,
        summary: `Prospect score updated to ${input.totalScore}/25.`,
        before: existing.research
          ? {
              totalScore: existing.research.totalScore,
              personalizationAngle: existing.personalizationAngle,
            }
          : undefined,
        after: {
          financialCapacityScore: input.financialCapacityScore,
          problemSeverityScore: input.problemSeverityScore,
          strategicFitScore: input.strategicFitScore,
          urgencyScore: input.urgencyScore,
          decisionMakerAccessScore: input.decisionMakerAccessScore,
          totalScore: input.totalScore,
          personalizationAngle: input.personalizationAngle,
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/accounts");
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${input.opportunityId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}researchProfileSaved=1`);
}

export async function startOutreachSequenceAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:update");
  const returnTo = safeReturnPath(formData, "/admin/leads");
  const parsed = startOutreachSequenceSchema.safeParse({
    opportunityId: value(formData, "opportunityId"),
    startDate: value(formData, "startDate"),
  });
  if (!parsed.success) redirectWithError(returnTo, "Choose a valid sequence start date.");

  const startDate = optionalDate(parsed.data.startDate);
  if (!startDate) redirectWithError(returnTo, "Choose a valid sequence start date.");

  const opportunity = await prisma.adminOpportunity.findFirst({
    where: { id: parsed.data.opportunityId, archivedAt: null },
    include: { research: true, outreachSequence: { select: { id: true } } },
  });
  if (!opportunity) redirectWithError(returnTo, "Opportunity not found.");
  if (opportunity.outreachSequence) redirectWithError(returnTo, "A manual outreach sequence already exists.");

  const research = opportunity.research;
  const ready = Boolean(
    research?.readyForOutreachAt && research && isProspectReady(research),
  );
  if (!ready) {
    redirectWithError(
      returnTo,
      "Complete every research requirement before starting outreach.",
    );
  }

  await prisma.$transaction(async (transaction) => {
    const sequence = await transaction.adminOutreachSequence.create({
      data: { opportunityId: opportunity.id, startedAt: startDate },
    });
    await transaction.adminOutreachStep.createMany({
      data: manualOutreachPlan.map((step) => ({
        sequenceId: sequence.id,
        stepNumber: step.stepNumber,
        dayOffset: step.dayOffset,
        label: step.label,
        scheduledFor: new Date(
          startDate.getTime() + step.dayOffset * 24 * 60 * 60 * 1000,
        ),
        status: step.stepNumber === 1 ? "READY" : "PENDING",
      })),
    });
    await transaction.adminActivity.create({
      data: {
        opportunityId: opportunity.id,
        actorId: session.id,
        kind: "UPDATED",
        summary: "Manual four-step outreach sequence prepared.",
      },
    });
    await transaction.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: "CREATE",
        entityType: "AdminOutreachSequence",
        entityId: sequence.id,
        summary: "Manual four-step outreach sequence prepared.",
        after: {
          opportunityId: opportunity.id,
          startedAt: startDate.toISOString(),
          steps: manualOutreachPlan.length,
          automaticSending: false,
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/accounts");
  revalidatePath(`/admin/leads/${opportunity.id}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}sequenceStarted=1`);
}

export async function completeOutreachStepAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:update");
  const returnTo = safeReturnPath(formData, "/admin/leads");
  const parsed = completeOutreachStepSchema.safeParse({
    stepId: value(formData, "stepId"),
    channel: value(formData, "channel"),
    message: value(formData, "message"),
    response: value(formData, "response"),
    nextAction: value(formData, "nextAction"),
  });
  if (!parsed.success) redirectWithError(returnTo, parsed.error.issues[0]?.message ?? "Review the outreach record.");

  const step = await prisma.adminOutreachStep.findUnique({
    where: { id: parsed.data.stepId },
    include: { sequence: true, message: { select: { id: true } } },
  });
  if (!step || step.message || step.status === "COMPLETED") {
    redirectWithError(returnTo, "This outreach step is already complete or unavailable.");
  }
  const earlierIncomplete = await prisma.adminOutreachStep.count({
    where: {
      sequenceId: step.sequenceId,
      stepNumber: { lt: step.stepNumber },
      status: { notIn: ["COMPLETED", "SKIPPED"] },
    },
  });
  if (earlierIncomplete) {
    redirectWithError(returnTo, "Complete the earlier outreach step first.");
  }
  if (step.scheduledFor > new Date()) {
    redirectWithError(returnTo, "This follow-up is not due yet.");
  }

  await prisma.$transaction(async (transaction) => {
    const completedAt = new Date();
    await transaction.adminMessage.create({
      data: {
        opportunityId: step.sequence.opportunityId,
        recordedById: session.id,
        sequenceStepId: step.id,
        channel: parsed.data.channel,
        direction: "OUTBOUND",
        body: parsed.data.message,
        response: parsed.data.response,
        nextAction: parsed.data.nextAction,
        occurredAt: completedAt,
      },
    });
    await transaction.adminOutreachStep.update({
      where: { id: step.id },
      data: {
        status: "COMPLETED",
        completedAt,
        channel: parsed.data.channel,
      },
    });
    const nextStep = await transaction.adminOutreachStep.findFirst({
      where: {
        sequenceId: step.sequenceId,
        stepNumber: { gt: step.stepNumber },
      },
      orderBy: { stepNumber: "asc" },
    });
    if (nextStep) {
      await transaction.adminOutreachStep.update({
        where: { id: nextStep.id },
        data: {
          status: nextStep.scheduledFor <= completedAt ? "READY" : "PENDING",
        },
      });
    } else {
      await transaction.adminOutreachSequence.update({
        where: { id: step.sequenceId },
        data: { completedAt },
      });
    }
    await transaction.adminActivity.create({
      data: {
        opportunityId: step.sequence.opportunityId,
        actorId: session.id,
        kind: "OUTREACH_STEP_COMPLETED",
        summary: `Manual sequence step ${step.stepNumber} completed via ${parsed.data.channel.toLowerCase()}.`,
      },
    });
    await transaction.adminAuditLog.create({
      data: {
        actorId: session.id,
        action: "UPDATE",
        entityType: "AdminOutreachStep",
        entityId: step.id,
        summary: `Manual outreach step ${step.stepNumber} recorded.`,
        before: { status: step.status },
        after: {
          status: "COMPLETED",
          channel: parsed.data.channel,
          completedAt: completedAt.toISOString(),
        },
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/accounts");
  revalidatePath(`/admin/leads/${step.sequence.opportunityId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}sequenceStepSaved=1`);
}

export async function updateDailyTargetsAction(formData: FormData) {
  const session = await requireAdminSession("admin:view");
  const parsed = updateDailyTargetsSchema.safeParse({
    researchTarget: value(formData, "researchTarget"),
    personalizedOutreachTarget: value(formData, "personalizedOutreachTarget"),
    followUpTarget: value(formData, "followUpTarget"),
  });
  if (!parsed.success) redirectWithError("/admin", "Daily targets must be between 1 and 100.");

  await prisma.adminDailyTargetConfig.upsert({
    where: { userId: session.id },
    update: parsed.data,
    create: { userId: session.id, ...parsed.data },
  });
  revalidatePath("/admin");
  redirect("/admin?targetsSaved=1");
}

export async function markMessageActionedAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:update");
  const returnTo = safeReturnPath(formData, "/admin");
  const parsed = markMessageActionedSchema.safeParse({
    messageId: value(formData, "messageId"),
  });
  if (!parsed.success) redirectWithError(returnTo, "Invalid message record.");

  const message = await prisma.adminMessage.update({
    where: { id: parsed.data.messageId },
    data: { needsAction: false, actionedAt: new Date() },
  });
  await prisma.adminActivity.create({
    data: {
      opportunityId: message.opportunityId,
      actorId: session.id,
      kind: "REPLY_ACTIONED",
      summary: "Inbound reply marked actioned.",
    },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${message.opportunityId}`);
  redirect(returnTo);
}

export async function addOpportunityNoteAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:update");
  const returnTo = safeReturnPath(formData, "/admin/leads");
  const parsed = addOpportunityNoteSchema.safeParse({
    opportunityId: value(formData, "opportunityId"),
    body: value(formData, "body"),
  });
  if (!parsed.success) redirectWithError(returnTo, "Write a note before saving.");

  await prisma.$transaction([
    prisma.adminOpportunityNote.create({
      data: {
        opportunityId: parsed.data.opportunityId,
        authorId: session.id,
        body: parsed.data.body,
      },
    }),
    prisma.adminActivity.create({
      data: {
        opportunityId: parsed.data.opportunityId,
        actorId: session.id,
        kind: "NOTE_ADDED",
        summary: "Internal note added.",
      },
    }),
  ]);

  revalidatePath(`/admin/leads/${parsed.data.opportunityId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}noteAdded=1`);
}

export async function logMessageAction(formData: FormData) {
  const session = await requireAdminSession("opportunity:update");
  const returnTo = safeReturnPath(formData, "/admin/leads");
  const parsed = logMessageSchema.safeParse({
    opportunityId: value(formData, "opportunityId"),
    channel: value(formData, "channel"),
    direction: value(formData, "direction"),
    subject: value(formData, "subject"),
    body: value(formData, "body"),
    response: value(formData, "response"),
    nextAction: value(formData, "nextAction"),
    needsAction: formData.get("needsAction") === "on",
  });
  if (!parsed.success) redirectWithError(returnTo, "Review the message log.");

  await prisma.$transaction([
    prisma.adminMessage.create({
      data: {
        opportunityId: parsed.data.opportunityId,
        recordedById: session.id,
        channel: parsed.data.channel,
        direction: parsed.data.direction,
        subject: parsed.data.subject,
        body: parsed.data.body,
        response: parsed.data.response,
        nextAction: parsed.data.nextAction,
        needsAction: parsed.data.needsAction,
      },
    }),
    prisma.adminActivity.create({
      data: {
        opportunityId: parsed.data.opportunityId,
        actorId: session.id,
        kind: "MESSAGE_LOGGED",
        summary: `${parsed.data.direction.toLowerCase()} ${parsed.data.channel.toLowerCase()} activity logged.`,
      },
    }),
  ]);

  revalidatePath(`/admin/leads/${parsed.data.opportunityId}`);
  redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}messageAdded=1`);
}
