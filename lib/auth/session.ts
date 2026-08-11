import { demoSession } from "@/lib/service-os/demo-data";
import { notFound } from "next/navigation";

import { isWorkspaceDemoMode } from "@/lib/auth/config";

export type CurrentSession = typeof demoSession;

export async function getCurrentSession(): Promise<CurrentSession> {
  if (!isWorkspaceDemoMode()) {
    notFound();
  }

  return demoSession;
}

export function hasPermission(session: CurrentSession, permission: string) {
  return session.permissions.includes(permission);
}
