import type { AdminRole } from "@prisma/client";

export type AdminPermission =
  | "admin:view"
  | "opportunity:create"
  | "opportunity:update"
  | "opportunity:archive"
  | "task:manage"
  | "company:manage"
  | "operations:view"
  | "operations:write"
  | "operations:approve"
  | "operations:policy"
  | "marketing:view"
  | "marketing:manage";

const rolePermissions: Record<AdminRole, readonly AdminPermission[]> = {
  OWNER: [
    "admin:view",
    "opportunity:create",
    "opportunity:update",
    "opportunity:archive",
    "task:manage",
    "company:manage",
    "operations:view",
    "operations:write",
    "operations:approve",
    "operations:policy",
    "marketing:view",
    "marketing:manage",
  ],
  ADMIN: [
    "admin:view",
    "opportunity:create",
    "opportunity:update",
    "opportunity:archive",
    "task:manage",
    "company:manage",
    "marketing:view",
    "marketing:manage",
  ],
  SALES: [
    "admin:view",
    "opportunity:create",
    "opportunity:update",
    "task:manage",
    "marketing:view",
  ],
};

export function hasAdminPermission(
  role: AdminRole,
  permission: AdminPermission,
) {
  return rolePermissions[role].includes(permission);
}

export function assertAdminPermission(
  role: AdminRole,
  permission: AdminPermission,
) {
  if (!hasAdminPermission(role, permission)) {
    throw new AdminAuthorizationError(permission);
  }
}

export class AdminAuthorizationError extends Error {
  constructor(permission: AdminPermission) {
    super(`Admin permission required: ${permission}`);
    this.name = "AdminAuthorizationError";
  }
}
