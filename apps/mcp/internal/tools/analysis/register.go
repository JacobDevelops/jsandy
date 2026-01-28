package analysis

import mcpserver "github.com/mark3labs/mcp-go/server"

// Register adds all code analysis tools to the MCP server.
func Register(s *mcpserver.MCPServer) {
	registerCodeTools(s)    // analyze_code
	registerProjectTools(s) // analyze_project_structure
	registerImproveTools(s) // suggest_improvements
}
