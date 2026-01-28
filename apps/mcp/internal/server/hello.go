package server

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
)

func handleHello(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	name, _ := req.GetArguments()["name"].(string)
	if name == "" {
		name = "World"
	}
	return mcp.NewToolResultText("Hello, " + name + "! from Go WASM MCP on Cloudflare Workers"), nil
}
