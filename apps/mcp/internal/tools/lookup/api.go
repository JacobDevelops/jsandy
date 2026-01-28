package lookup

import (
	"context"
	"fmt"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/kb"
)

var lookupAPITool = mcp.NewTool("lookup_api",
	mcp.WithDescription(
		"Look up a specific @jsandy/rpc API by name. Returns the full documentation "+
			"including type signature, parameters, and usage examples. "+
			"If not found, suggests similar entries.",
	),
	mcp.WithString("name",
		mcp.Required(),
		mcp.Description("API name to look up (e.g. 'createClient', 'procedure', 'router', 'middleware', 'mergeRouters', 'PubSubAdapter')"),
	),
)

func handleLookupAPI(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	name, _ := req.GetArguments()["name"].(string)
	if name == "" {
		return mcp.NewToolResultError("'name' parameter is required"), nil
	}
	if len(name) > maxQueryLength {
		return mcp.NewToolResultError("name exceeds maximum length"), nil
	}

	_, content, found := kb.Lookup(name)
	if found {
		return mcp.NewToolResultText(content), nil
	}

	// Not found — suggest similar entries
	results := kb.Search(name, 5)
	if len(results) == 0 {
		return mcp.NewToolResultText(fmt.Sprintf("No API entry found for %q. Try search_docs to find related topics.", name)), nil
	}

	var b strings.Builder
	fmt.Fprintf(&b, "No exact match for %q. Did you mean:\n\n", name)
	for _, r := range results {
		fmt.Fprintf(&b, "- **%s** (%s): %s\n", r.Name, r.Kind, r.Summary)
	}
	b.WriteString("\nUse lookup_api with one of these names, or search_docs for broader search.")
	return mcp.NewToolResultText(b.String()), nil
}

func registerAPITools(s *mcpserver.MCPServer) {
	s.AddTool(lookupAPITool, handleLookupAPI)
}
