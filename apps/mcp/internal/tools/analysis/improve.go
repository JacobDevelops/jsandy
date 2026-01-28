package analysis

import (
	"context"
	"fmt"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/kb"
	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools/validate"
)

var suggestImprovementsTool = mcp.NewTool("suggest_improvements",
	mcp.WithDescription(
		"Given existing @jsandy/rpc code, suggest improvements for "+
			"correctness, performance, and best practices. "+
			"Combines validation checks with goal-oriented recommendations.",
	),
	mcp.WithString("code",
		mcp.Required(),
		mcp.Description("The current TypeScript code to improve"),
	),
	mcp.WithString("goal",
		mcp.Description("What the user wants to achieve (e.g. 'add authentication', 'improve error handling', 'add WebSocket support')"),
	),
)

func handleSuggestImprovements(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	code, _ := args["code"].(string)
	if code == "" {
		return mcp.NewToolResultError("'code' parameter is required"), nil
	}
	if len(code) > maxCodeLength {
		return mcp.NewToolResultError("code exceeds maximum length of 50KB"), nil
	}

	goal, _ := args["goal"].(string)

	// Run validation
	var issues []validate.Issue
	issues = append(issues, validate.CheckZodV4Compliance(code)...)
	issues = append(issues, validate.CheckProcedurePatterns(code)...)
	issues = append(issues, validate.CheckImports(code)...)
	issues = append(issues, validate.CheckRouterStructure(code)...)
	issues = append(issues, validate.CheckMiddlewarePattern(code)...)

	var b strings.Builder
	b.WriteString("## Improvement Suggestions\n\n")

	// Fix issues first
	if len(issues) > 0 {
		b.WriteString("### Issues to Fix\n\n")
		for _, issue := range issues {
			fmt.Fprintf(&b, "- **[%s]** %s", issue.Severity, issue.Message)
			if issue.Fix != "" {
				fmt.Fprintf(&b, " → %s", issue.Fix)
			}
			b.WriteString("\n")
		}
		b.WriteString("\n")
	}

	// Code quality improvements
	b.WriteString("### Best Practice Improvements\n\n")

	if !strings.Contains(code, "c.superjson(") && (strings.Contains(code, ".query(") || strings.Contains(code, ".mutation(")) {
		b.WriteString("- Use `c.superjson()` for responses instead of plain `c.json()` — enables Date/Map/Set serialization\n")
	}

	if !strings.Contains(code, ".describe(") && (strings.Contains(code, ".query(") || strings.Contains(code, ".mutation(")) {
		b.WriteString("- Add `.describe()` to procedures for automatic OpenAPI documentation\n")
	}

	if !strings.Contains(code, ".output(") && (strings.Contains(code, ".query(") || strings.Contains(code, ".mutation(")) {
		b.WriteString("- Add `.output()` schema for runtime output validation and type safety\n")
	}

	if strings.Contains(code, "router(") && !strings.Contains(code, "export type") {
		b.WriteString("- Export the router type (`export type AppRouter = typeof appRouter`) for client type inference\n")
	}

	if strings.Contains(code, ".ws(") && !strings.Contains(code, "PubSubAdapter") && !strings.Contains(code, "getPubSubAdapter") {
		b.WriteString("- Consider adding a PubSubAdapter for WebSocket scaling across multiple instances\n")
	}

	// Goal-oriented suggestions
	if goal != "" {
		results := kb.Search(goal, 5)
		if len(results) > 0 {
			b.WriteString("\n### Resources for Your Goal\n\n")
			fmt.Fprintf(&b, "Based on your goal (%q):\n\n", goal)
			for _, r := range results {
				fmt.Fprintf(&b, "- **%s** (%s): %s\n", r.Name, r.Kind, r.Summary)
			}
			b.WriteString("\nUse `lookup_api` or `get_examples` to view full documentation for any of these.\n")
		}
	}

	return mcp.NewToolResultText(b.String()), nil
}

func registerImproveTools(s *mcpserver.MCPServer) {
	s.AddTool(suggestImprovementsTool, handleSuggestImprovements)
}
