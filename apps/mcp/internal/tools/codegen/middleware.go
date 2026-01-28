package codegen

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/templates"
)

var createMiddlewareTool = mcp.NewTool("create_middleware",
	mcp.WithDescription(
		"Generate typed @jsandy/rpc middleware with context accumulation. "+
			"Produces TypeScript code that follows the middleware pattern with next() and context fields.",
	),
	mcp.WithString("name",
		mcp.Required(),
		mcp.Description("Middleware variable name in camelCase (e.g. 'auth', 'rateLimit', 'logging')"),
	),
	mcp.WithString("contextFields",
		mcp.Description(
			"Comma-separated 'field:type' pairs that this middleware adds to context. "+
				"Example: 'userId: string, role: string, permissions: array'",
		),
	),
	mcp.WithString("description",
		mcp.Description("Description of what this middleware does"),
	),
)

func handleCreateMiddleware(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	name, _ := args["name"].(string)
	if name == "" {
		return mcp.NewToolResultError("'name' parameter is required"), nil
	}

	contextFields, _ := args["contextFields"].(string)
	description, _ := args["description"].(string)

	code := templates.RenderMiddleware(templates.MiddlewareParams{
		Name:          name,
		ContextFields: contextFields,
		Description:   description,
	})

	return mcp.NewToolResultText(code), nil
}

func registerMiddlewareTools(s *mcpserver.MCPServer) {
	s.AddTool(createMiddlewareTool, handleCreateMiddleware)
}
