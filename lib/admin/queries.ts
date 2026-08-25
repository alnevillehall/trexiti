import "server-only";

import type { AdminOpportunityStage, Prisma } from "@prisma/client";

import { requireAdminSession } from "@/lib/admin/auth";
import { opportunityStages } from "@/lib/admin/crm";
import { prisma } from "@/lib/prisma";
import type { z } from "zod";
import type { opportunityFiltersSchema } from "@/lib/admin/validation";

const activeOpportunityWhere: Prisma.AdminOpportunityWhereInput = {
  archivedAt: null,
};

export async function getAdminDashboard() {
  const { id: userId } = await requireAdminSession();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [
    stageGroups,
    opportunities,
    proposalsSent,
    unconvertedInboundLeads,
    dueTasks,
    todaysFollowUpCount,
    recentOpportunities,
    newTargetAccounts,
    hotOpportunities,
    repliesNeedingAction,
    upcomingMeetings,
    dailyTargetConfig,
    researchCompletedToday,
    outreachCompletedToday,
    followUpsCompletedToday,
  ] = await Promise.all([
    prisma.adminOpportunity.groupBy({
      by: ["stage", "currency"],
      where: activeOpportunityWhere,
      _count: { _all: true },
      _sum: { estimatedValue: true },
    }),
    prisma.adminOpportunity.findMany({
      where: activeOpportunityWhere,
      select: {
        stage: true,
        currency: true,
        estimatedValue: true,
        probability: true,
      },
    }),
    prisma.adminProposal.count({
      where: { status: "SENT" },
    }),
    prisma.projectLead.count({
      where: { opportunity: null, status: { not: "LOST" } },
    }),
    prisma.adminTask.findMany({
      where: {
        archivedAt: null,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { lte: todayEnd },
      },
      include: {
        opportunity: { select: { id: true, reference: true, title: true } },
        company: { select: { name: true } },
      },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
      take: 8,
    }),
    prisma.adminTask.count({
      where: {
        archivedAt: null,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.adminOpportunity.findMany({
      where: activeOpportunityWhere,
      include: {
        company: { select: { name: true } },
        assignedOwner: { select: { name: true } },
        research: { select: { totalScore: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.adminCompany.count({
      where: {
        archivedAt: null,
        status: "TARGET",
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.adminOpportunity.count({
      where: {
        archivedAt: null,
        stage: { notIn: ["WON", "LOST"] },
        research: { totalScore: { gte: 20 } },
      },
    }),
    prisma.adminMessage.findMany({
      where: { direction: "INBOUND", needsAction: true, actionedAt: null },
      include: {
        opportunity: {
          select: {
            id: true,
            reference: true,
            company: { select: { name: true } },
          },
        },
      },
      orderBy: { occurredAt: "asc" },
      take: 8,
    }),
    prisma.adminTask.count({
      where: {
        archivedAt: null,
        type: "MEETING",
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { gte: now },
      },
    }),
    prisma.adminDailyTargetConfig.findUnique({ where: { userId } }),
    prisma.adminActivity.count({
      where: {
        actorId: userId,
        occurredAt: { gte: todayStart, lte: todayEnd },
        kind: "RESEARCH_COMPLETED",
      },
    }),
    prisma.adminMessage.count({
      where: {
        direction: "OUTBOUND",
        recordedById: userId,
        occurredAt: { gte: todayStart, lte: todayEnd },
        sequenceStep: { is: { dayOffset: 0 } },
      },
    }),
    prisma.adminMessage.count({
      where: {
        direction: "OUTBOUND",
        recordedById: userId,
        occurredAt: { gte: todayStart, lte: todayEnd },
        sequenceStep: { is: { dayOffset: { gt: 0 } } },
      },
    }),
  ]);

  const countFor = (stage: AdminOpportunityStage) =>
    stageGroups
      .filter((group) => group.stage === stage)
      .reduce((total, group) => total + group._count._all, 0);
  const activePipeline = opportunities.filter(
    (item) => !["WON", "LOST"].includes(item.stage),
  );
  const decided = countFor("WON") + countFor("LOST");
  const totalPipelineValue = activePipeline.reduce(
    (totals, item) => ({
      ...totals,
      [item.currency]: totals[item.currency] + Number(item.estimatedValue),
    }),
    { JMD: 0, USD: 0 },
  );
  const expectedRevenue = activePipeline.reduce(
    (totals, item) => ({
      ...totals,
      [item.currency]:
        totals[item.currency] +
        Number(item.estimatedValue) * (item.probability / 100),
    }),
    { JMD: 0, USD: 0 },
  );
  const activePipelineCount = activePipeline.reduce(
    (counts, item) => ({
      ...counts,
      [item.currency]: counts[item.currency] + 1,
    }),
    { JMD: 0, USD: 0 },
  );

  return {
    metrics: {
      newLeads:
        unconvertedInboundLeads +
        countFor("RESEARCHING") +
        countFor("CONTACTED"),
      qualifiedLeads: countFor("QUALIFIED"),
      discoveryCalls: countFor("DISCOVERY"),
      proposalsSent,
      dealsWon: countFor("WON"),
      pipelineValue: totalPipelineValue,
      averageProjectValue: {
        JMD: activePipelineCount.JMD
          ? totalPipelineValue.JMD / activePipelineCount.JMD
          : 0,
        USD: activePipelineCount.USD
          ? totalPipelineValue.USD / activePipelineCount.USD
          : 0,
      },
      conversionRate: decided ? (countFor("WON") / decided) * 100 : 0,
      expectedRevenue,
    },
    stageGroups: opportunityStages.map((stage) => ({
      stage,
      count: countFor(stage),
      value: stageGroups
        .filter((group) => group.stage === stage)
        .reduce(
          (totals, group) => ({
            ...totals,
            [group.currency]: Number(group._sum.estimatedValue ?? 0),
          }),
          { JMD: 0, USD: 0 },
        ),
    })),
    dueTasks,
    recentOpportunities,
    todayStart,
    dailySales: {
      todaysFollowUps: todaysFollowUpCount,
      newTargetAccounts,
      hotOpportunities,
      repliesNeedingAction: repliesNeedingAction.length,
      upcomingMeetings,
      proposalsAwaitingDecision: proposalsSent,
      pipelineValue: totalPipelineValue,
    },
    repliesNeedingAction,
    dailyTarget: {
      researchTarget: dailyTargetConfig?.researchTarget ?? 10,
      personalizedOutreachTarget:
        dailyTargetConfig?.personalizedOutreachTarget ?? 20,
      followUpTarget: dailyTargetConfig?.followUpTarget ?? 10,
      researchCompleted: researchCompletedToday,
      personalizedOutreachCompleted: outreachCompletedToday,
      followUpsCompleted: followUpsCompletedToday,
    },
  };
}

export async function getAdminOpportunities(
  filters: z.infer<typeof opportunityFiltersSchema>,
  page = 1,
) {
  await requireAdminSession();
  const pageSize = 50;
  const safePage = Math.max(1, page);
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrow = new Date(todayEnd.getTime() + 1);
  const nextWeek = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);

  const where: Prisma.AdminOpportunityWhereInput = {
    archivedAt: null,
    ...(filters.stage ? { stage: filters.stage } : {}),
    ...(filters.industry
      ? { company: { industry: filters.industry } }
      : {}),
    ...(filters.country ? { company: { country: filters.country } } : {}),
    ...(filters.currency ? { currency: filters.currency } : {}),
    ...(filters.minValue
      ? { estimatedValue: { gte: filters.minValue } }
      : {}),
    ...(filters.minScore
      ? { research: { totalScore: { gte: filters.minScore } } }
      : {}),
    ...(filters.readiness === "ready"
      ? { research: { readyForOutreachAt: { not: null } } }
      : filters.readiness === "incomplete"
        ? {
            AND: [
              {
                OR: [
                  { research: null },
                  { research: { readyForOutreachAt: null } },
                ],
              },
            ],
          }
        : {}),
    ...(filters.q
      ? {
          OR: [
            { reference: { contains: filters.q, mode: "insensitive" } },
            { title: { contains: filters.q, mode: "insensitive" } },
            { company: { name: { contains: filters.q, mode: "insensitive" } } },
            {
              primaryContact: {
                name: { contains: filters.q, mode: "insensitive" },
              },
            },
          ],
        }
      : {}),
    ...(filters.followUp === "overdue"
      ? { nextFollowUp: { lt: now } }
      : filters.followUp === "today"
        ? { nextFollowUp: { gte: now, lte: todayEnd } }
        : filters.followUp === "upcoming"
          ? { nextFollowUp: { gte: tomorrow, lte: nextWeek } }
          : {}),
  };

  const [opportunities, total, industries, countries, owners] = await Promise.all([
    prisma.adminOpportunity.findMany({
      where,
      include: {
        company: true,
        primaryContact: true,
        assignedOwner: { select: { id: true, name: true } },
        research: true,
        _count: { select: { tasks: true, messages: true } },
      },
      orderBy: [{ nextFollowUp: "asc" }, { updatedAt: "desc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminOpportunity.count({ where }),
    prisma.adminCompany.findMany({
      where: { archivedAt: null },
      distinct: ["industry"],
      select: { industry: true },
      orderBy: { industry: "asc" },
    }),
    prisma.adminCompany.findMany({
      where: { archivedAt: null },
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
    prisma.adminUser.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    opportunities,
    total,
    page: safePage,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    industries: industries.map((item) => item.industry),
    countries: countries.map((item) => item.country),
    owners,
  };
}

export async function getAdminOpportunity(id: string) {
  await requireAdminSession();
  return prisma.adminOpportunity.findFirst({
    where: { id, archivedAt: null },
    include: {
      company: true,
      primaryContact: { include: { contactMethods: true } },
      assignedOwner: true,
      research: true,
      notes: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      activities: {
        include: { actor: { select: { name: true } } },
        orderBy: { occurredAt: "desc" },
        take: 50,
      },
      messages: {
        include: { recordedBy: { select: { name: true } } },
        orderBy: { occurredAt: "desc" },
      },
      proposals: { orderBy: { version: "desc" } },
      tasks: {
        where: { archivedAt: null },
        include: { owner: { select: { name: true } } },
        orderBy: { dueAt: "asc" },
      },
      projectLead: true,
      outreachSequence: {
        include: {
          steps: {
            include: { message: true },
            orderBy: { stepNumber: "asc" },
          },
        },
      },
    },
  });
}

export async function getAdminCompanies() {
  await requireAdminSession();
  return prisma.adminCompany.findMany({
    where: { archivedAt: null },
    include: {
      contacts: {
        where: { archivedAt: null },
        orderBy: [{ isDecisionMaker: "desc" }, { name: "asc" }],
      },
      opportunities: {
        where: { archivedAt: null },
        include: { research: { select: { totalScore: true } } },
        orderBy: { updatedAt: "desc" },
      },
      _count: { select: { contacts: true, opportunities: true, tasks: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function getAdminPipeline() {
  await requireAdminSession();
  const opportunities = await prisma.adminOpportunity.findMany({
    where: { archivedAt: null },
    include: {
      company: { select: { name: true, industry: true } },
      assignedOwner: { select: { name: true } },
      research: { select: { totalScore: true } },
    },
    orderBy: [{ estimatedValue: "desc" }, { updatedAt: "desc" }],
  });

  return opportunityStages.map((stage) => ({
    stage,
    opportunities: opportunities.filter((item) => item.stage === stage),
  }));
}

export async function getAdminTasks(page = 1) {
  await requireAdminSession();
  const pageSize = 50;
  const safePage = Math.max(1, page);
  const [tasks, total, opportunities, companies] = await Promise.all([
    prisma.adminTask.findMany({
      where: { archivedAt: null },
      include: {
        owner: { select: { name: true } },
        company: { select: { id: true, name: true } },
        opportunity: { select: { id: true, reference: true, title: true } },
      },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { priority: "desc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminTask.count({ where: { archivedAt: null } }),
    prisma.adminOpportunity.findMany({
      where: { archivedAt: null, stage: { notIn: ["WON", "LOST"] } },
      select: { id: true, reference: true, title: true, companyId: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.adminCompany.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    tasks,
    total,
    page: safePage,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    opportunities,
    companies,
  };
}

export async function getAdminOwners() {
  await requireAdminSession();
  return prisma.adminUser.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function getUnconvertedProjectLeads() {
  await requireAdminSession();
  return prisma.projectLead.findMany({
    where: { opportunity: null, status: { not: "LOST" } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getTargetAccounts(
  filters: z.infer<typeof opportunityFiltersSchema>,
  page: number,
) {
  await requireAdminSession();
  const pageSize = 50;
  const safePage = Math.max(1, page);
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrow = new Date(todayEnd.getTime() + 1);
  const nextWeek = new Date(todayEnd.getTime() + 7 * 24 * 60 * 60 * 1000);
  const where: Prisma.AdminOpportunityWhereInput = {
    archivedAt: null,
    direction: "OUTBOUND",
    ...(filters.stage ? { stage: filters.stage } : {}),
    ...(filters.industry ? { company: { industry: filters.industry } } : {}),
    ...(filters.country ? { company: { country: filters.country } } : {}),
    ...(filters.currency ? { currency: filters.currency } : {}),
    ...(filters.minValue ? { estimatedValue: { gte: filters.minValue } } : {}),
    ...(filters.minScore
      ? { research: { totalScore: { gte: filters.minScore } } }
      : {}),
    ...(filters.readiness === "ready"
      ? { research: { readyForOutreachAt: { not: null } } }
      : filters.readiness === "incomplete"
        ? {
            AND: [
              {
                OR: [
                  { research: null },
                  { research: { readyForOutreachAt: null } },
                ],
              },
            ],
          }
        : {}),
    ...(filters.q
      ? {
          OR: [
            { reference: { contains: filters.q, mode: "insensitive" } },
            { title: { contains: filters.q, mode: "insensitive" } },
            { company: { name: { contains: filters.q, mode: "insensitive" } } },
            { primaryContact: { name: { contains: filters.q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(filters.followUp === "overdue"
      ? { nextFollowUp: { lt: now } }
      : filters.followUp === "today"
        ? { nextFollowUp: { gte: now, lte: todayEnd } }
        : filters.followUp === "upcoming"
          ? { nextFollowUp: { gte: tomorrow, lte: nextWeek } }
          : {}),
  };

  const [accounts, total, industries, countries] = await Promise.all([
    prisma.adminOpportunity.findMany({
      where,
      include: {
        company: true,
        primaryContact: { include: { contactMethods: true } },
        assignedOwner: { select: { name: true } },
        research: true,
        outreachSequence: {
          include: {
            steps: {
              orderBy: { stepNumber: "asc" },
              select: { status: true, scheduledFor: true, stepNumber: true },
            },
          },
        },
      },
      orderBy: [{ research: { totalScore: "desc" } }, { updatedAt: "desc" }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminOpportunity.count({ where }),
    prisma.adminCompany.findMany({
      where: { archivedAt: null },
      distinct: ["industry"],
      select: { industry: true },
      orderBy: { industry: "asc" },
    }),
    prisma.adminCompany.findMany({
      where: { archivedAt: null },
      distinct: ["country"],
      select: { country: true },
      orderBy: { country: "asc" },
    }),
  ]);

  return {
    accounts,
    total,
    page: safePage,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    industries: industries.map((item) => item.industry),
    countries: countries.map((item) => item.country),
  };
}
