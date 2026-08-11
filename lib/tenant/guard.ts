import { getCurrentSession, type CurrentSession } from "@/lib/auth/session";

export type RoleKey =
  | "PLATFORM_OWNER"
  | "COMPANY_ADMIN"
  | "DISPATCHER"
  | "TECHNICIAN"
  | "SALES"
  | "ACCOUNTANT";

export type TenantContext = {
  session: CurrentSession;
  organizationId: string;
  organizationSlug: string;
  userId: string;
  roleKey: RoleKey;
};

export class TenantAccessError extends Error {
  constructor(message = "Tenant access denied.") {
    super(message);
    this.name = "TenantAccessError";
  }
}

export async function requireTenantContext(
  allowedRoles?: RoleKey[],
): Promise<TenantContext> {
  const session = await getCurrentSession();
  const organizationId = session.organization.id;
  const roleKey = session.roleKey;

  if (!organizationId) {
    throw new TenantAccessError("No organization is selected for this session.");
  }

  if (allowedRoles?.length && !allowedRoles.includes(roleKey)) {
    throw new TenantAccessError("This role cannot access the requested tenant resource.");
  }

  return {
    session,
    organizationId,
    organizationSlug: session.organization.slug,
    userId: session.user.id,
    roleKey,
  };
}

export function assertOrganizationBoundary(
  recordOrganizationId: string,
  context: Pick<TenantContext, "organizationId" | "roleKey">,
) {
  if (context.roleKey === "PLATFORM_OWNER") {
    return;
  }

  if (recordOrganizationId !== context.organizationId) {
    throw new TenantAccessError("Cross-organization access blocked.");
  }
}

export function tenantWhere<TWhere extends Record<string, unknown>>(
  context: Pick<TenantContext, "organizationId">,
  where?: TWhere,
) {
  return {
    ...where,
    organizationId: context.organizationId,
  };
}

export function tenantCreateData<TData extends Record<string, unknown>>(
  context: Pick<TenantContext, "organizationId">,
  data: TData,
) {
  return {
    ...data,
    organizationId: context.organizationId,
  };
}

export async function requireCompanyAdmin() {
  return requireTenantContext(["PLATFORM_OWNER", "COMPANY_ADMIN"]);
}
