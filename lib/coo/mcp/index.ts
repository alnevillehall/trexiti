export {
  authenticateMcpRequest,
  assertToolScopes,
  McpAuthenticationError,
} from "@/lib/coo/mcp/auth";
export {
  COO_MCP_SCOPES,
  getAuthorizationServer,
  getMcpResourceUrl,
  getProtectedResourceMetadataUrl,
  getWwwAuthenticateHeader,
} from "@/lib/coo/mcp/oauth";
export { createTrexitiMcpServer } from "@/lib/coo/mcp/server";

