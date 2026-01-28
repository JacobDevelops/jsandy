package validate

import mcpserver "github.com/mark3labs/mcp-go/server"

// Register adds all validation tools to the MCP server.
// Tools: validate_code, check_zod_v4
func Register(s *mcpserver.MCPServer) {
	// Tool implementations will be added in Phase 3.
	_ = s
}
