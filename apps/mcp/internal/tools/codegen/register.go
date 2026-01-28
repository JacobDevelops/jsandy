package codegen

import mcpserver "github.com/mark3labs/mcp-go/server"

// Register adds all code generation tools to the MCP server.
// Tools: create_procedure, create_ws_procedure, create_router, create_merge_routers,
// create_middleware, create_client, create_nextjs_route, create_pubsub_adapter
func Register(s *mcpserver.MCPServer) {
	// Tool implementations will be added in Phase 3.
	_ = s
}
