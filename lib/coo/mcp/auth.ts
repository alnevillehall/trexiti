import "server-only";

import { verifyToken } from "@clerk/nextjs/server";

import { hasAdminPermission, type AdminPermission } from "@/lib/admin/permissions";
import { prisma } from "@/lib/prisma";
import {
  cooScopeSchema,
  type CooScope,
  type CooToolActor,
  type CooToolContext,
} from "@/lib/coo/tools/contracts";
import {
  getAuthorizationServer,
  getMcpResourceUrl,
  getWwwAuthenticateHeader,
} from "@/lib/coo/mcp/oauth";

const permissionByScope: Record<CooScope, AdminPermission> = {
  "trexiti:read": "operations:view",
  "trexiti:write_internal": "operations:write",
  "trexiti:approve": "operations:approve",
};

export class McpAuthenticationError extends Error {
  readonly status: 401 | 403;
  readonly authenticateHeader: string;

  constructor(
    message: string,
    options?: { status?: 401 | 403; scopes?: readonly CooScope[] },
  ) {
    super(message);
    this.name = "McpAuthenticationError";
    this.status = options?.status ?? 401;
    this.authenticateHeader = getWwwAuthenticateHeader(
      this.status === 401 ? "invalid_token" : "insufficient_scope",
      options?.scopes,
      this.message,
    );
  }
}

function parseScopes(payload: Record<string, unknown>) {
  const raw = payload.scp ?? payload.scope ?? payload.scopes;
  const candidates = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw.split(/\s+/)
      : [];

  const scopes = new Set<CooScope>();
  for (const candidate of candidates) {
    const parsed = cooScopeSchema.safeParse(candidate);
    if (parsed.success) {
      scopes.add(parsed.data);
    }
  }

  return scopes;
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function assertToolScopes(
  context: CooToolContext,
  requiredScopes: readonly CooScope[],
) {
  for (const scope of requiredScopes) {
    if (
      !context.scopes.has(scope) ||
      !hasAdminPermission(context.actor.role, permissionByScope[scope])
    ) {
      throw new McpAuthenticationError(`Required scope is missing: ${scope}`, {
        status: 403,
        scopes: requiredScopes,
      });
    }
  }
}

async function findActiveAdmin(externalAuthId: string): Promise<CooToolActor> {
  const admin = await prisma.adminUser.findUnique({
    where: { externalAuthId },
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
    throw new McpAuthenticationError("The Trexiti admin account is not active.", {
      status: 403,
      scopes: ["trexiti:read"],
    });
  }

  if (admin.role !== "OWNER") {
    throw new McpAuthenticationError(
      "The Trexiti COO connection is restricted to the founder account.",
      {
        status: 403,
        scopes: ["trexiti:read"],
      },
    );
  }

  return {
    id: admin.id,
    externalAuthId: admin.externalAuthId,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

export async function authenticateMcpRequest(
  request: Request,
): Promise<CooToolContext> {
  const token = getBearerToken(request);
  if (!token) {
    throw new McpAuthenticationError("A Clerk OAuth bearer token is required.");
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  const jwtKey = process.env.CLERK_JWT_KEY;
  if (!secretKey && !jwtKey) {
    console.error("[coo:mcp] Clerk token verification is not configured");
    throw new McpAuthenticationError("Token verification is unavailable.");
  }

  const expectedIssuer = getAuthorizationServer();
  if (!expectedIssuer) {
    console.error("[coo:mcp] Clerk OAuth issuer is not configured");
    throw new McpAuthenticationError("Token issuer verification is unavailable.");
  }

  const audience = process.env.COO_MCP_AUDIENCE?.trim() || getMcpResourceUrl();
  const authorizedParties = process.env.COO_MCP_AUTHORIZED_PARTIES?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV === "production" && !authorizedParties?.length) {
    console.error("[coo:mcp] OAuth authorized-party allow-list is not configured");
    throw new McpAuthenticationError(
      "The production OAuth client allow-list is not configured.",
    );
  }

  let verified: Awaited<ReturnType<typeof verifyToken>>;
  try {
    verified = await verifyToken(token, {
      secretKey,
      jwtKey,
      audience,
      authorizedParties: authorizedParties?.length ? authorizedParties : undefined,
    });
  } catch (error) {
    console.warn("[coo:mcp] bearer token verification failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    throw new McpAuthenticationError("The bearer token is invalid or expired.");
  }

  const payload = verified as Record<string, unknown>;
  if (payload.iss !== expectedIssuer) {
    throw new McpAuthenticationError("The bearer token issuer is not trusted.");
  }

  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new McpAuthenticationError("The bearer token has no user subject.");
  }

  const scopes = parseScopes(payload);
  if (scopes.size === 0) {
    throw new McpAuthenticationError("The bearer token grants no Trexiti scopes.", {
      status: 403,
      scopes: ["trexiti:read"],
    });
  }

  return {
    actor: await findActiveAdmin(payload.sub),
    scopes,
    correlationId: request.headers.get("x-correlation-id") ?? crypto.randomUUID(),
    origin: "mcp",
  };
}
