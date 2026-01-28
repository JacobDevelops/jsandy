package codegen

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/templates"
)

var createClientTool = mcp.NewTool("create_client",
	mcp.WithDescription(
		"Generate a typed @jsandy/rpc client setup using createClient. "+
			"Produces TypeScript code that imports from @jsandy/rpc/client with full type inference.",
	),
	mcp.WithString("routerType",
		mcp.Required(),
		mcp.Description("Name of the router type to reference (e.g. 'AppRouter')"),
	),
	mcp.WithString("routerImportPath",
		mcp.Required(),
		mcp.Description("Import path for the router type (e.g. '../server/router', '@/server/router')"),
	),
	mcp.WithString("baseUrl",
		mcp.Required(),
		mcp.Description("API base URL (e.g. 'http://localhost:3000/api', '/api')"),
	),
)

func handleCreateClient(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	routerType, _ := args["routerType"].(string)
	routerImportPath, _ := args["routerImportPath"].(string)
	baseURL, _ := args["baseUrl"].(string)

	if routerType == "" {
		return mcp.NewToolResultError("'routerType' parameter is required"), nil
	}
	if routerImportPath == "" {
		return mcp.NewToolResultError("'routerImportPath' parameter is required"), nil
	}
	if baseURL == "" {
		return mcp.NewToolResultError("'baseUrl' parameter is required"), nil
	}

	code := templates.RenderClient(templates.ClientParams{
		RouterTypeName:   routerType,
		RouterImportPath: routerImportPath,
		BaseURL:          baseURL,
	})

	return mcp.NewToolResultText(code), nil
}

func registerClientTools(s *mcpserver.MCPServer) {
	s.AddTool(createClientTool, handleCreateClient)
}
