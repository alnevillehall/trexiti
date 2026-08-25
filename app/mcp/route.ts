import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import {
  authenticateMcpRequest,
  createTrexitiMcpServer,
  McpAuthenticationError,
} from "@/lib/coo/mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID, X-Correlation-Id",
  "Access-Control-Expose-Headers": "MCP-Protocol-Version, MCP-Session-Id, WWW-Authenticate",
};

function withMcpHeaders(response: Response) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Content-Type-Options", "nosniff");
  for (const [name, value] of Object.entries(corsHeaders)) {
    response.headers.set(name, value);
  }
  return response;
}

async function handleMcpRequest(request: Request) {
  try {
    const context = await authenticateMcpRequest(request);
    const server = createTrexitiMcpServer(context);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    console.info("[coo:mcp] request handled", {
      method: request.method,
      correlationId: context.correlationId,
      actorId: context.actor.id,
      status: response.status,
    });
    return withMcpHeaders(response);
  } catch (error) {
    if (error instanceof McpAuthenticationError) {
      return withMcpHeaders(
        Response.json(
          {
            jsonrpc: "2.0",
            error: { code: -32001, message: error.message },
            id: null,
          },
          {
            status: error.status,
            headers: { "WWW-Authenticate": error.authenticateHeader },
          },
        ),
      );
    }

    console.error("[coo:mcp] unhandled request failure", error);
    return withMcpHeaders(
      Response.json(
        {
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal MCP server error" },
          id: null,
        },
        { status: 500 },
      ),
    );
  }
}

export function OPTIONS() {
  return withMcpHeaders(new Response(null, { status: 204 }));
}

export const GET = handleMcpRequest;
export const POST = handleMcpRequest;
export const DELETE = handleMcpRequest;

