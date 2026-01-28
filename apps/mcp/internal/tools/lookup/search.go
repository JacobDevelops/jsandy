package lookup

import (
	"context"
	"encoding/json"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/kb"
)

var searchDocsTool = mcp.NewTool("search_docs",
	mcp.WithDescription(
		"Search @jsandy/rpc documentation by topic or keyword. "+
			"Returns ranked results from API reference, guides, patterns, and export listings.",
	),
	mcp.WithString("query",
		mcp.Required(),
		mcp.Description("Search query (e.g. 'websocket rooms', 'error handling', 'middleware context')"),
	),
)

func handleSearchDocs(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	query, _ := req.GetArguments()["query"].(string)
	if query == "" {
		return mcp.NewToolResultError("'query' parameter is required"), nil
	}
	if len(query) > maxQueryLength {
		return mcp.NewToolResultError("query exceeds maximum length"), nil
	}

	results := kb.Search(query, 10)
	if len(results) == 0 {
		return mcp.NewToolResultText("No results found. Try different keywords or use lookup_api with a specific API name."), nil
	}

	data, err := json.MarshalIndent(results, "", "  ")
	if err != nil {
		return mcp.NewToolResultError("failed to format results"), nil
	}
	return mcp.NewToolResultText(string(data)), nil
}

func registerSearchTools(s *mcpserver.MCPServer) {
	s.AddTool(searchDocsTool, handleSearchDocs)
}
