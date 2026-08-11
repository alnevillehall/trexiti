import { PrismaClient } from "@prisma/client";

const externalAuthId = process.env.ADMIN_SEED_CLERK_USER_ID?.trim();
const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
const name = process.env.ADMIN_SEED_NAME?.trim() || "Trexiti Owner";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to provision an admin user.");
}

if (!externalAuthId || !email) {
  throw new Error(
    "ADMIN_SEED_CLERK_USER_ID and ADMIN_SEED_EMAIL are required to provision an admin user.",
  );
}

const prisma = new PrismaClient();

try {
  const existing = await prisma.adminUser.findFirst({
    where: { OR: [{ externalAuthId }, { email }] },
    select: { id: true },
  });

  const admin = existing
    ? await prisma.adminUser.update({
        where: { id: existing.id },
        data: { externalAuthId, email, name, role: "OWNER", active: true },
      })
    : await prisma.adminUser.create({
        data: { externalAuthId, email, name, role: "OWNER", active: true },
      });

  await prisma.adminDailyTargetConfig.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  console.log(`Provisioned active Trexiti admin: ${admin.email}`);
} finally {
  await prisma.$disconnect();
}
