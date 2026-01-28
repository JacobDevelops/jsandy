package analysis

import mcpserver "github.com/mark3labs/mcp-go/server"

// Register adds all code analysis tools to the MCP server.
// Tools: analyze_structure, suggest_improvements
func Register(s *mcpserver.MCPServer) {
	// Tool implementations will be added in Phase 3.
	_ = s
}
