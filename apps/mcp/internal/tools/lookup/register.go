package lookup

import mcpserver "github.com/mark3labs/mcp-go/server"

// Register adds all knowledge base lookup tools to the MCP server.
// Tools: lookup_api, search_docs, list_exports
func Register(s *mcpserver.MCPServer) {
	// Tool implementations will be added in Phase 3.
	_ = s
}
