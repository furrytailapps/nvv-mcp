import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Consolidated tools
import { listProtectedAreasTool, listProtectedAreasHandler } from './list-protected-areas';
import { getAreaDetailTool, getAreaDetailHandler } from './get-area-detail';
import { lookupTool, lookupHandler } from './lookup';
import { getAreasExtentTool, getAreasExtentHandler } from './get-areas-extent';

// Tool registry: consolidated from 10 tools to 4
const tools = [
  { definition: listProtectedAreasTool, handler: listProtectedAreasHandler },
  { definition: getAreaDetailTool, handler: getAreaDetailHandler },
  { definition: lookupTool, handler: lookupHandler },
  { definition: getAreasExtentTool, handler: getAreasExtentHandler },
];

/**
 * Register all NVV tools with the MCP server
 */
export function registerAllTools(server: McpServer): void {
  for (const { definition, handler } of tools) {
    server.tool(definition.name, definition.description, definition.inputSchema, handler);
  }
}
