package server

import (
	"net/http"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools"
)

const (
	ServerName    = "jsandy-mcp"
	ServerVersion = "1.0.0"
	RPCVersion    = "2.2.0" // tracked @jsandy/rpc version
)

// NewMCPServer creates a configured MCP server with tool capabilities.
func NewMCPServer() *mcpserver.MCPServer {
	return mcpserver.NewMCPServer(ServerName, ServerVersion,
		mcpserver.WithToolCapabilities(true),
		mcpserver.WithRecovery(),
		mcpserver.WithInstructions(serverInstructions()),
	)
}

// NewHandler creates an HTTP handler for the MCP server with all tools registered.
func NewHandler() http.Handler {
	s := NewMCPServer()

	// Register all tool categories (codegen, validate, lookup, analysis).
	tools.RegisterAll(s)

	// Keep spike hello tool for connectivity testing.
	registerSpikeTool(s)

	return mcpserver.NewStreamableHTTPServer(s,
		mcpserver.WithStateLess(true),
	)
}

func serverInstructions() string {
	return "You are connected to the JSandy MCP server. This server helps you " +
		"use @jsandy/rpc (v" + RPCVersion + ") correctly in Next.js projects. " +
		"Available tool categories: code generation, validation, API lookup, " +
		"and project analysis. All generated code uses Zod v4 (never v3). " +
		"Use lookup_api and search_docs to find API details before generating code."
}

func registerSpikeTool(s *mcpserver.MCPServer) {
	s.AddTool(
		mcp.NewTool("hello",
			mcp.WithDescription("Says hello. Use this to verify the MCP server is working."),
			mcp.WithString("name",
				mcp.Description("Name to greet"),
			),
		),
		handleHello,
	)
}
