package codegen

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/templates"
)

var createProcedureTool = mcp.NewTool("create_procedure",
	mcp.WithDescription(
		"Generate a typed @jsandy/rpc procedure definition (query or mutation). "+
			"Produces ready-to-use TypeScript code with Zod v4 schemas.",
	),
	mcp.WithString("name",
		mcp.Required(),
		mcp.Description("Procedure name in camelCase (e.g. 'getUser', 'createPost')"),
	),
	mcp.WithString("type",
		mcp.Required(),
		mcp.Description("Procedure type: 'query' or 'mutation'"),
		mcp.Enum("query", "mutation"),
	),
	mcp.WithString("inputSchema",
		mcp.Description(
			"Description of input fields. Example: 'id: string (required), includeProfile: boolean (optional)'",
		),
	),
	mcp.WithString("outputSchema",
		mcp.Description("Description of output fields. Example: 'user: object, token: string'"),
	),
	mcp.WithString("middleware",
		mcp.Description("Comma-separated middleware names to chain (e.g. 'auth, rateLimit')"),
	),
	mcp.WithString("description",
		mcp.Description("OpenAPI description for the procedure"),
	),
)

func handleCreateProcedure(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	name, _ := args["name"].(string)
	procType, _ := args["type"].(string)

	if name == "" {
		return mcp.NewToolResultError("'name' parameter is required"), nil
	}
	if procType == "" {
		return mcp.NewToolResultError("'type' parameter is required (must be 'query' or 'mutation')"), nil
	}

	inputSchema, _ := args["inputSchema"].(string)
	outputSchema, _ := args["outputSchema"].(string)
	middleware, _ := args["middleware"].(string)
	description, _ := args["description"].(string)

	code := templates.RenderProcedure(templates.ProcedureParams{
		Name:         name,
		Type:         procType,
		InputSchema:  inputSchema,
		OutputSchema: outputSchema,
		Middleware:    middleware,
		Description:  description,
	})

	return mcp.NewToolResultText(code), nil
}

var createWSProcedureTool = mcp.NewTool("create_ws_procedure",
	mcp.WithDescription(
		"Generate a typed @jsandy/rpc WebSocket procedure with incoming/outgoing event schemas. "+
			"Produces ready-to-use TypeScript code with Zod v4 schemas for real-time features.",
	),
	mcp.WithString("name",
		mcp.Required(),
		mcp.Description("Procedure name in camelCase (e.g. 'chat', 'liveUpdates')"),
	),
	mcp.WithString("incomingSchema",
		mcp.Description(
			"Description of incoming event fields. Example: 'message: string (required), roomId: string (required)'",
		),
	),
	mcp.WithString("outgoingSchema",
		mcp.Description(
			"Description of outgoing event fields. Example: 'message: string, sender: string, timestamp: number'",
		),
	),
	mcp.WithString("middleware",
		mcp.Description("Comma-separated middleware names to chain (e.g. 'auth')"),
	),
	mcp.WithString("description",
		mcp.Description("OpenAPI description for the WebSocket procedure"),
	),
)

func handleCreateWSProcedure(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	name, _ := args["name"].(string)
	if name == "" {
		return mcp.NewToolResultError("'name' parameter is required"), nil
	}

	incomingSchema, _ := args["incomingSchema"].(string)
	outgoingSchema, _ := args["outgoingSchema"].(string)
	middleware, _ := args["middleware"].(string)
	description, _ := args["description"].(string)

	code := templates.RenderWSProcedure(templates.WSProcedureParams{
		Name:           name,
		IncomingSchema: incomingSchema,
		OutgoingSchema: outgoingSchema,
		Middleware:     middleware,
		Description:    description,
	})

	return mcp.NewToolResultText(code), nil
}

func registerProcedureTools(s *mcpserver.MCPServer) {
	s.AddTool(createProcedureTool, handleCreateProcedure)
	s.AddTool(createWSProcedureTool, handleCreateWSProcedure)
}
