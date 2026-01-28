package codegen

import mcpserver "github.com/mark3labs/mcp-go/server"

// Register adds all code generation tools to the MCP server.
func Register(s *mcpserver.MCPServer) {
	registerProcedureTools(s) // create_procedure, create_ws_procedure
	registerRouterTools(s)    // create_router, merge_routers
	registerMiddlewareTools(s) // create_middleware
	registerClientTools(s)    // create_client
	registerAdapterTools(s)   // create_pubsub_adapter
}
