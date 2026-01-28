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

var analyzeCodeTool = mcp.NewTool("analyze_code",
	mcp.WithDescription(
		"Analyze a code snippet for @jsandy/rpc best practices. "+
			"Runs all validation checks and provides recommendations "+
			"based on the knowledge base.",
	),
	mcp.WithString("code",
		mcp.Required(),
		mcp.Description("The TypeScript code to analyze"),
	),
	mcp.WithString("context",
		mcp.Description("Description of what the code does (helps target recommendations)"),
	),
)

func handleAnalyzeCode(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	code, _ := args["code"].(string)
	if code == "" {
		return mcp.NewToolResultError("'code' parameter is required"), nil
	}
	if len(code) > maxCodeLength {
		return mcp.NewToolResultError("code exceeds maximum length of 50KB"), nil
	}

	codeContext, _ := args["context"].(string)

	// Run all validation checks
	var issues []validate.Issue
	issues = append(issues, validate.CheckZodV4Compliance(code)...)
	issues = append(issues, validate.CheckProcedurePatterns(code)...)
	issues = append(issues, validate.CheckImports(code)...)
	issues = append(issues, validate.CheckRouterStructure(code)...)
	issues = append(issues, validate.CheckMiddlewarePattern(code)...)

	var b strings.Builder
	b.WriteString("## Code Analysis\n\n")

	// Issues section
	if len(issues) > 0 {
		b.WriteString("### Issues Found\n\n")
		for _, issue := range issues {
			fmt.Fprintf(&b, "- **[%s]** %s", issue.Severity, issue.Message)
			if issue.Line > 0 {
				fmt.Fprintf(&b, " (line %d)", issue.Line)
			}
			if issue.Fix != "" {
				fmt.Fprintf(&b, "\n  - Fix: %s", issue.Fix)
			}
			b.WriteString("\n")
		}
		b.WriteString("\n")
	} else {
		b.WriteString("### No issues found\n\nCode passes all validation checks.\n\n")
	}

	// Recommendations based on context
	b.WriteString("### Recommendations\n\n")

	if strings.Contains(code, ".query(") || strings.Contains(code, ".mutation(") {
		b.WriteString("- Ensure handler uses `c.superjson()` for responses\n")
		b.WriteString("- Add `.describe()` for OpenAPI documentation\n")
	}
	if strings.Contains(code, "router(") {
		b.WriteString("- Export the router type for client type inference\n")
	}
	if strings.Contains(code, ".ws(") {
		b.WriteString("- Define both incoming and outgoing schemas\n")
		b.WriteString("- Consider using a PubSubAdapter for multi-instance scaling\n")
	}
	if strings.Contains(code, "middleware(") || strings.Contains(code, ".use(") {
		b.WriteString("- Return `next()` with accumulated context fields\n")
	}

	// Suggest relevant docs
	if codeContext != "" {
		results := kb.Search(codeContext, 3)
		if len(results) > 0 {
			b.WriteString("\n### Related Documentation\n\n")
			for _, r := range results {
				fmt.Fprintf(&b, "- **%s** (%s): %s\n", r.Name, r.Kind, r.Summary)
			}
		}
	}

	return mcp.NewToolResultText(b.String()), nil
}

func registerCodeTools(s *mcpserver.MCPServer) {
	s.AddTool(analyzeCodeTool, handleAnalyzeCode)
}
