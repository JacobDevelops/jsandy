package lookup

import mcpserver "github.com/mark3labs/mcp-go/server"

// Register adds all knowledge base lookup tools to the MCP server.
func Register(s *mcpserver.MCPServer) {
	registerAPITools(s)      // lookup_api
	registerSearchTools(s)   // search_docs
	registerExportsTools(s)  // list_exports
	registerExamplesTools(s) // get_examples
}
