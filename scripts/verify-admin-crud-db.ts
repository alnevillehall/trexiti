import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for the PostgreSQL CRUD integration test.",
    );
  }

  const prisma = new PrismaClient();
  const rollback = Symbol("rollback-admin-crud-test");
  const suffix = randomUUID();

  try {
    await prisma.$transaction(async (transaction) => {
    const actor = await transaction.adminUser.create({
      data: {
        externalAuthId: `crud-test-${suffix}`,
        email: `crud-${suffix}@trexiti.test`,
        name: "CRUD Test Actor",
        role: "OWNER",
      },
    });
    const company = await transaction.adminCompany.create({
      data: {
        name: "CRUD Test Company",
        domain: `crud-${suffix}.test`,
        industry: "Testing",
        country: "Jamaica",
      },
    });
    const contact = await transaction.adminContact.create({
      data: {
        companyId: company.id,
        name: "CRUD Test Contact",
        email: `contact-${suffix}@trexiti.test`,
        isDecisionMaker: true,
      },
    });
    await transaction.adminContactMethod.createMany({
      data: [
        {
          contactId: contact.id,
          channel: "EMAIL",
          value: contact.email!,
          preferred: true,
        },
        {
          contactId: contact.id,
          channel: "LINKEDIN",
          value: `https://linkedin.com/in/crud-${suffix}`,
        },
      ],
    });
    const created = await transaction.adminOpportunity.create({
      data: {
        reference: `CRUD-${suffix}`,
        companyId: company.id,
        primaryContactId: contact.id,
        assignedOwnerId: actor.id,
        direction: "OUTBOUND",
        type: "BUSINESS_SYSTEM",
        title: "CRUD integration test",
        source: "Automated test",
        identifiedProblem: "Verify normalized persistence.",
        opportunity: "Verify create, read, update, task, and archive behavior.",
        estimatedValue: 10000,
      },
    });

    const read = await transaction.adminOpportunity.findUniqueOrThrow({
      where: { id: created.id },
      include: { company: true, primaryContact: true },
    });
    assert.equal(read.company.name, "CRUD Test Company");
    assert.equal(read.primaryContact?.isDecisionMaker, true);

    const research = await transaction.adminProspectResearch.create({
      data: {
        opportunityId: created.id,
        currentWebsiteQuality: 2,
        operationalMaturity: 3,
        observedProblems: "Fragmented sales and operating workflows.",
        recentBusinessActivity: "A new operating location was announced.",
        financialCapacityScore: 5,
        problemSeverityScore: 4,
        urgencyScore: 4,
        strategicFitScore: 5,
        decisionMakerAccessScore: 4,
        totalScore: 22,
        websiteReviewed: true,
        mobileReviewed: true,
        businessModelUnderstood: true,
        decisionMakerIdentified: true,
        specificProblemIdentified: true,
        personalizationPrepared: true,
        contactMethodFound: true,
        readyForOutreachAt: new Date(),
      },
    });
    assert.equal(research.totalScore, 22);
    assert.ok(research.readyForOutreachAt);

    const sequence = await transaction.adminOutreachSequence.create({
      data: { opportunityId: created.id, startedAt: new Date() },
    });
    await transaction.adminOutreachStep.createMany({
      data: [
        { sequenceId: sequence.id, stepNumber: 1, dayOffset: 0, label: "Initial personalized outreach", scheduledFor: new Date(), status: "READY" },
        { sequenceId: sequence.id, stepNumber: 2, dayOffset: 3, label: "Follow-up", scheduledFor: new Date(Date.now() + 3 * 86_400_000) },
        { sequenceId: sequence.id, stepNumber: 3, dayOffset: 7, label: "Value follow-up / insight", scheduledFor: new Date(Date.now() + 7 * 86_400_000) },
        { sequenceId: sequence.id, stepNumber: 4, dayOffset: 14, label: "Final follow-up", scheduledFor: new Date(Date.now() + 14 * 86_400_000) },
      ],
    });
    const initialStep = await transaction.adminOutreachStep.findUniqueOrThrow({
      where: {
        sequenceId_stepNumber: { sequenceId: sequence.id, stepNumber: 1 },
      },
    });
    await transaction.adminMessage.create({
      data: {
        opportunityId: created.id,
        recordedById: actor.id,
        sequenceStepId: initialStep.id,
        channel: "EMAIL",
        direction: "OUTBOUND",
        body: "A deliberately personalized test message.",
        nextAction: "Review for a response before the next manual step.",
      },
    });
    const outboundRecord = await transaction.adminOpportunity.findUniqueOrThrow({
      where: { id: created.id },
      include: {
        primaryContact: { include: { contactMethods: true } },
        research: true,
        outreachSequence: { include: { steps: { include: { message: true } } } },
      },
    });
    assert.equal(outboundRecord.primaryContact?.contactMethods.length, 2);
    assert.equal(outboundRecord.research?.totalScore, 22);
    assert.equal(outboundRecord.outreachSequence?.steps.length, 4);
    assert.equal(
      outboundRecord.outreachSequence?.steps.find(
        (step) => step.stepNumber === 1,
      )?.message?.direction,
      "OUTBOUND",
    );

    const updated = await transaction.adminOpportunity.update({
      where: { id: created.id },
      data: { stage: "QUALIFIED", probability: 35, estimatedValue: 15000 },
    });
    assert.equal(updated.stage, "QUALIFIED");
    assert.equal(Number(updated.estimatedValue), 15000);

    const task = await transaction.adminTask.create({
      data: {
        opportunityId: created.id,
        companyId: company.id,
        ownerId: actor.id,
        type: "FOLLOW_UP",
        priority: "HIGH",
        title: "CRUD follow-up",
        dueAt: new Date(Date.now() + 86_400_000),
      },
    });
    const completed = await transaction.adminTask.update({
      where: { id: task.id },
      data: { status: "DONE", completedAt: new Date() },
    });
    assert.equal(completed.status, "DONE");

    const archived = await transaction.adminOpportunity.update({
      where: { id: created.id },
      data: { archivedAt: new Date() },
    });
    assert.ok(archived.archivedAt);

      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  } finally {
    await prisma.$disconnect();
  }

  console.log("PostgreSQL admin CRUD integration test passed and rolled back.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
