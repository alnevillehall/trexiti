import { PrismaClient } from "@prisma/client";

import { seedMarketingOs } from "../lib/admin/marketing-seed";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the Marketing OS.");
  }

  const prisma = new PrismaClient();
  try {
    const result = await seedMarketingOs(prisma);
    console.log(
      `Marketing OS seed complete: ${result.campaigns} campaigns, ${result.content} content records, ${result.assets} assets, ${result.channels} channels, ${result.metrics} metric baselines, ${result.presets} UTM presets, ${result.launchChecklist} launch checklist items and ${result.launchSources} verified source files.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
