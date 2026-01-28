package codegen

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/templates"
)

var createPubSubAdapterTool = mcp.NewTool("create_pubsub_adapter",
	mcp.WithDescription(
		"Generate a PubSubAdapter implementation for @jsandy/rpc WebSocket scaling. "+
			"Supports built-in adapters (Upstash Redis, Cloudflare Queue) or custom implementations.",
	),
	mcp.WithString("name",
		mcp.Required(),
		mcp.Description("Adapter variable or class name (e.g. 'pubsub', 'redisPubSub')"),
	),
	mcp.WithString("platform",
		mcp.Description(
			"Target platform: 'upstash' (Upstash Redis), 'cloudflare-queue' (CF Queues), "+
				"or 'custom' (implement PubSubAdapter interface). Default: 'custom'.",
		),
		mcp.Enum("upstash", "cloudflare-queue", "custom"),
	),
	mcp.WithString("description",
		mcp.Description("Description of the adapter's purpose"),
	),
)

func handleCreatePubSubAdapter(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	name, _ := args["name"].(string)
	if name == "" {
		return mcp.NewToolResultError("'name' parameter is required"), nil
	}

	platform, _ := args["platform"].(string)
	if platform == "" {
		platform = "custom"
	}

	description, _ := args["description"].(string)

	code := templates.RenderPubSubAdapter(templates.AdapterParams{
		Name:        name,
		Platform:    platform,
		Description: description,
	})

	return mcp.NewToolResultText(code), nil
}

func registerAdapterTools(s *mcpserver.MCPServer) {
	s.AddTool(createPubSubAdapterTool, handleCreatePubSubAdapter)
}
