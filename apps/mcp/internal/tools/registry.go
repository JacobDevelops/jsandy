package tools

import (
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools/analysis"
	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools/codegen"
	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools/lookup"
	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools/validate"
)

// RegisterAll registers all MCP tools on the given server.
func RegisterAll(s *mcpserver.MCPServer) {
	codegen.Register(s)
	validate.Register(s)
	lookup.Register(s)
	analysis.Register(s)
}
