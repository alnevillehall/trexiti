import "server-only";

import type { AdminRole } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import {
  hasAdminPermission,
  type AdminPermission,
} from "@/lib/admin/permissions";
import { prisma } from "@/lib/prisma";

export type AdminSession = {
  id: string;
  externalAuthId: string;
  email: string;
  name: string;
  role: AdminRole;
};

export function isAdminAuthConfigured() {
  return Boolean(
    process.env.CLERK_SECRET_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
}

const getAuthorizedAdmin = cache(async (): Promise<AdminSession> => {
  if (!isAdminAuthConfigured()) {
    notFound();
  }

  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=${encodeURIComponent("/admin")}`);
  }

  const admin = await prisma.adminUser.findUnique({
    where: { externalAuthId: userId },
    select: {
      id: true,
      externalAuthId: true,
      email: true,
      name: true,
      role: true,
      active: true,
    },
  });

  if (!admin?.active) {
    notFound();
  }

  return {
    id: admin.id,
    externalAuthId: admin.externalAuthId,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
});

export async function requireAdminSession(
  permission: AdminPermission = "admin:view",
): Promise<AdminSession> {
  const admin = await getAuthorizedAdmin();

  if (!hasAdminPermission(admin.role, permission)) {
    notFound();
  }

  return admin;
}
