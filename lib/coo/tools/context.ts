import { hasAdminPermission } from "@/lib/admin/permissions";
import {
  type CooScope,
  type CooToolActor,
  type CooToolContext,
  type CooToolOrigin,
} from "@/lib/coo/tools/contracts";

export function createAdminCooToolContext(
  actor: CooToolActor,
  options?: { correlationId?: string; origin?: CooToolOrigin },
): CooToolContext {
  const scopes = new Set<CooScope>();
  if (hasAdminPermission(actor.role, "operations:view")) {
    scopes.add("trexiti:read");
  }
  if (hasAdminPermission(actor.role, "operations:write")) {
    scopes.add("trexiti:write_internal");
  }
  if (hasAdminPermission(actor.role, "operations:approve")) {
    scopes.add("trexiti:approve");
  }
  return {
    actor,
    scopes,
    correlationId: options?.correlationId ?? crypto.randomUUID(),
    origin: options?.origin ?? "admin",
  };
}

