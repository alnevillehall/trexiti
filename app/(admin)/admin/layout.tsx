import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trexiti Operations Centre",
  description: "Restricted founder command centre for Trexiti operations.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdminSession();

  return <AdminShell session={session}>{children}</AdminShell>;
}
