package validate

import mcpserver "github.com/mark3labs/mcp-go/server"

// Register adds all validation tools to the MCP server.
func Register(s *mcpserver.MCPServer) {
	registerProcedureTools(s)  // validate_procedure
	registerRouterTools(s)     // validate_router
	registerMiddlewareTools(s) // validate_middleware
	registerNextJSTools(s)     // validate_nextjs_integration
	registerZodTools(s)        // check_zod_v4_compliance
}
