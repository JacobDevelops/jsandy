package lookup

import (
	"context"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/kb"
)

var listExportsTool = mcp.NewTool("list_exports",
	mcp.WithDescription(
		"List all exports from a specific @jsandy/rpc entry point. "+
			"Shows every exported function, type, and constant.",
	),
	mcp.WithString("entryPoint",
		mcp.Required(),
		mcp.Description("Entry point to list exports for"),
		mcp.Enum("main", "client", "adapters"),
	),
)

func handleListExports(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	entryPoint, _ := req.GetArguments()["entryPoint"].(string)
	if entryPoint == "" {
		return mcp.NewToolResultError("'entryPoint' parameter is required (must be 'main', 'client', or 'adapters')"), nil
	}

	content, found := kb.GetExports(entryPoint)
	if !found {
		return mcp.NewToolResultText(fmt.Sprintf("No export listing found for entry point %q. Valid options: main, client, adapters.", entryPoint)), nil
	}

	return mcp.NewToolResultText(content), nil
}

func registerExportsTools(s *mcpserver.MCPServer) {
	s.AddTool(listExportsTool, handleListExports)
}
