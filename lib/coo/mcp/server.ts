import "server-only";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import {
  McpAuthenticationError,
} from "@/lib/coo/mcp/auth";
import {
  getOAuthSecuritySchemes,
} from "@/lib/coo/mcp/oauth";
import {
  createErrorEnvelope,
  type CooToolContext,
} from "@/lib/coo/tools/contracts";
import { getTrexitiMcpToolList } from "@/lib/coo/tools/definitions";
import {
  cooToolDefinitions,
  executeCooTool,
} from "@/lib/coo/tools/registry";

function toJsonText(value: unknown) {
  return JSON.stringify(
    value,
    (_key, item) => (typeof item === "bigint" ? item.toString() : item),
    2,
  );
}

function toJsonObject(value: unknown): Record<string, unknown> {
  return JSON.parse(toJsonText(value)) as Record<string, unknown>;
}

export function createTrexitiMcpServer(context: CooToolContext) {
  const server = new McpServer({
    name: "trexiti-coo",
    title: "Trexiti COO Operations Center",
    version: "1.0.0",
  });

  for (const definition of cooToolDefinitions) {
    const securitySchemes = getOAuthSecuritySchemes(definition.requiredScopes);
    server.registerTool(
      definition.name,
      {
        title: definition.title,
        description: definition.description,
        inputSchema: definition.inputSchema,
        outputSchema: definition.outputSchema,
        annotations: definition.annotations,
        _meta: {
          securitySchemes,
          "openai/securitySchemes": securitySchemes,
        },
      },
      async (input: unknown) => {
        try {
          const envelope = await executeCooTool(definition.name, input, context);
          const structuredContent = toJsonObject(envelope);
          return {
            content: [{ type: "text" as const, text: toJsonText(structuredContent) }],
            structuredContent,
            isError: !envelope.ok,
          };
        } catch (error) {
          const authError =
            error instanceof McpAuthenticationError
              ? error
              : new McpAuthenticationError("Tool authorization failed.", {
                  status: 403,
                  scopes: definition.requiredScopes,
                });
          const envelope = createErrorEnvelope(
            {
              code: authError.status === 401 ? "unauthorized" : "forbidden",
              message: authError.message,
            },
            context.correlationId,
          );
          const structuredContent = toJsonObject(envelope);
          return {
            content: [{ type: "text" as const, text: toJsonText(structuredContent) }],
            structuredContent,
            isError: true,
            _meta: {
              "mcp/www_authenticate": [authError.authenticateHeader],
            },
          };
        }
      },
    );
  }

  server.server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: getTrexitiMcpToolList(),
  }));

  return server;
}
