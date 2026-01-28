package lookup

import (
	"context"
	"fmt"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/kb"
)

var getExamplesTool = mcp.NewTool("get_examples",
	mcp.WithDescription(
		"Get usage examples for a specific @jsandy/rpc pattern. "+
			"Returns code examples from the patterns library (auth, CRUD, file upload, pagination, etc.).",
	),
	mcp.WithString("pattern",
		mcp.Required(),
		mcp.Description("Pattern name or topic (e.g. 'auth', 'crud', 'file-upload', 'pagination', 'error-handling', 'realtime-chat', 'notifications')"),
	),
)

func handleGetExamples(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	pattern, _ := req.GetArguments()["pattern"].(string)
	if pattern == "" {
		return mcp.NewToolResultError("'pattern' parameter is required"), nil
	}
	if len(pattern) > maxQueryLength {
		return mcp.NewToolResultError("pattern exceeds maximum length"), nil
	}

	// Try exact pattern match first
	content, found := kb.GetPattern(pattern)
	if found {
		return mcp.NewToolResultText(content), nil
	}

	// Try as a guide
	content, found = kb.GetGuide(pattern)
	if found {
		return mcp.NewToolResultText(content), nil
	}

	// Fall back to search
	results := kb.Search(pattern, 3)
	if len(results) == 0 {
		available := kb.ListPatterns()
		return mcp.NewToolResultText(fmt.Sprintf(
			"No examples found for %q. Available patterns: %s",
			pattern, strings.Join(available, ", "),
		)), nil
	}

	// Return the top result's content
	entry, topContent, ok := kb.Lookup(results[0].Name)
	if ok && entry != nil {
		return mcp.NewToolResultText(topContent), nil
	}

	// Format search results as fallback
	var b strings.Builder
	fmt.Fprintf(&b, "No exact match for %q. Related topics:\n\n", pattern)
	for _, r := range results {
		fmt.Fprintf(&b, "- **%s** (%s): %s\n", r.Name, r.Kind, r.Summary)
	}
	return mcp.NewToolResultText(b.String()), nil
}

func registerExamplesTools(s *mcpserver.MCPServer) {
	s.AddTool(getExamplesTool, handleGetExamples)
}
