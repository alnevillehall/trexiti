import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";

import { seedMarketingOs } from "../lib/admin/marketing-seed";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the Marketing OS database test.");
  }
  const prisma = new PrismaClient();
  const rollback = Symbol("rollback-marketing-crud");

  try {
    const firstSeed = await seedMarketingOs(prisma);
    const before = await Promise.all([
      prisma.marketingCampaign.count({ where: { seedKey: { not: null } } }),
      prisma.marketingContent.count({ where: { seedKey: { not: null } } }),
      prisma.marketingAsset.count({ where: { seedKey: { not: null } } }),
      prisma.marketingChannelProfile.count(),
      prisma.marketingWeeklyMetric.count({ where: { seedKey: { not: null } } }),
      prisma.marketingUtmPreset.count({ where: { seedKey: { not: null } } }),
    ]);
    const secondSeed = await seedMarketingOs(prisma);
    const after = await Promise.all([
      prisma.marketingCampaign.count({ where: { seedKey: { not: null } } }),
      prisma.marketingContent.count({ where: { seedKey: { not: null } } }),
      prisma.marketingAsset.count({ where: { seedKey: { not: null } } }),
      prisma.marketingChannelProfile.count(),
      prisma.marketingWeeklyMetric.count({ where: { seedKey: { not: null } } }),
      prisma.marketingUtmPreset.count({ where: { seedKey: { not: null } } }),
    ]);
    assert.deepEqual(firstSeed, secondSeed);
    assert.deepEqual(before, after, "Running the approved seed twice must not duplicate records.");
    assert.deepEqual(after, [4, 17, 9, 7, 4, 4]);

    try {
      await prisma.$transaction(async (transaction) => {
        const suffix = randomUUID();
        const campaign = await transaction.marketingCampaign.create({
          data: {
            name: `CRUD campaign ${suffix}`,
            objective: "Verify campaign create and read behavior.",
            audience: "Database integration test operators.",
            message: "A structured campaign record remains editable.",
            offer: "A safe rollback-only test.",
            startAt: new Date("2026-09-01T12:00:00Z"),
            endAt: new Date("2026-09-07T12:00:00Z"),
            primaryCta: "Verify",
          },
        });
        const content = await transaction.marketingContent.create({
          data: {
            title: "CRUD content",
            coreIdea: "Verify normalized Marketing OS content persistence.",
            contentType: "TEXT_POST",
            pillar: "BUSINESS_SYSTEMS",
            status: "DRAFTING",
            primaryChannel: "LINKEDIN_FOUNDER",
            secondaryChannels: ["LINKEDIN_COMPANY"],
            publishAt: new Date("2026-09-02T12:30:00Z"),
            owner: "CRUD operator",
            body: "A rollback-only prepared post.",
            campaignId: campaign.id,
          },
        });
        const read = await transaction.marketingContent.findUniqueOrThrow({
          where: { id: content.id },
          include: { campaign: true },
        });
        assert.equal(read.campaign?.id, campaign.id);
        const updated = await transaction.marketingContent.update({
          where: { id: content.id },
          data: { status: "READY" },
        });
        assert.equal(updated.status, "READY");

        const asset = await transaction.marketingAsset.create({
          data: {
            name: "CRUD asset",
            kind: "Test graphic",
            brief: "Verify asset relations.",
            campaignId: campaign.id,
            contentId: content.id,
          },
        });
        const metric = await transaction.marketingWeeklyMetric.create({
          data: {
            weekStarting: new Date("2026-09-01T05:00:00Z"),
            campaignId: campaign.id,
            qualifiedConversations: 2,
            discoveryCalls: 1,
            notes: "A test result with a likely-cause note.",
          },
        });
        const outbound = await transaction.marketingOutboundActivity.create({
          data: {
            campaignId: campaign.id,
            occurredAt: new Date("2026-09-02T14:00:00Z"),
            channel: "EMAIL",
            activity: "Personalized test messages",
            quantity: 3,
          },
        });
        assert.equal(outbound.quantity, 3);
        const preset = await transaction.marketingUtmPreset.create({
          data: {
            name: `CRUD preset ${suffix}`,
            destination: "https://www.trexiti.com/systems-review",
            source: "linkedin",
            medium: "organic_social",
            campaign: `crud_${suffix}`,
          },
        });

        const profile = await transaction.marketingChannelProfile.findFirstOrThrow();
        await transaction.marketingChannelProfile.update({
          where: { id: profile.id },
          data: { status: "IN_PROGRESS", bioComplete: true },
        });

        await transaction.marketingUtmPreset.delete({ where: { id: preset.id } });
        await transaction.marketingAsset.delete({ where: { id: asset.id } });
        await transaction.marketingWeeklyMetric.delete({ where: { id: metric.id } });
        await transaction.marketingContent.delete({ where: { id: content.id } });
        await transaction.marketingCampaign.delete({ where: { id: campaign.id } });
        assert.equal(
          await transaction.marketingCampaign.findUnique({ where: { id: campaign.id } }),
          null,
        );
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("Marketing OS seed idempotency and PostgreSQL CRUD checks passed; test mutations rolled back.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
