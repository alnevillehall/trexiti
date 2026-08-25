import {
  COO_MCP_SCOPES,
  getAuthorizationServer,
  getMcpResourceUrl,
} from "@/lib/coo/mcp/oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authorizationServer = getAuthorizationServer();

  if (!authorizationServer) {
    console.error("[coo:mcp] COO_MCP_AUTHORIZATION_SERVER is not configured");
    return Response.json(
      { error: "oauth_not_configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      resource: getMcpResourceUrl(),
      resource_name: "Trexiti COO Operations Center",
      authorization_servers: [authorizationServer],
      scopes_supported: COO_MCP_SCOPES,
      bearer_methods_supported: ["header"],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
        "Content-Type": "application/json",
      },
    },
  );
}
