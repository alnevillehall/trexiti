import type { CooScope } from "@/lib/coo/tools/contracts";

export const COO_MCP_SCOPES = [
  "trexiti:read",
  "trexiti:write_internal",
  "trexiti:approve",
] as const satisfies readonly CooScope[];

export function getSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_TREXITI_SITE_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    "http://localhost:3000";
  const absolute = /^https?:\/\//i.test(configured)
    ? configured
    : `https://${configured}`;
  return absolute.replace(/\/$/, "");
}

export function getMcpResourceUrl() {
  const configured = process.env.COO_MCP_RESOURCE_URL?.trim();
  if (!configured) return `${getSiteUrl()}/mcp`;
  return /^https?:\/\//i.test(configured)
    ? configured.replace(/\/$/, "")
    : `https://${configured.replace(/\/$/, "")}`;
}

export function getProtectedResourceMetadataUrl() {
  return new URL(
    "/.well-known/oauth-protected-resource",
    getMcpResourceUrl(),
  ).toString();
}

export function getAuthorizationServer() {
  return (
    process.env.COO_MCP_AUTHORIZATION_SERVER?.trim() ||
    process.env.CLERK_ISSUER_URL?.trim() ||
    null
  );
}

export function getOAuthSecuritySchemes(scopes: readonly CooScope[]) {
  return [
    {
      type: "oauth2" as const,
      scopes: [...scopes],
    },
  ];
}

export function getWwwAuthenticateHeader(
  error?: "invalid_token" | "insufficient_scope",
  scope?: readonly CooScope[],
  errorDescription?: string,
) {
  const fields = [
    `resource_metadata="${getProtectedResourceMetadataUrl()}"`,
  ];

  if (error) {
    fields.push(`error="${error}"`);
    if (errorDescription) {
      const safeDescription = errorDescription
        .replace(/[\r\n]+/g, " ")
        .replaceAll("\\", "\\\\")
        .replaceAll('"', '\\"');
      fields.push(`error_description="${safeDescription}"`);
    }
  }

  if (scope?.length) {
    fields.push(`scope="${scope.join(" ")}"`);
  }

  return `Bearer ${fields.join(", ")}`;
}
