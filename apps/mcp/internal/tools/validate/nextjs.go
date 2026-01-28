package validate

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"
)

var validateNextJSTool = mcp.NewTool("validate_nextjs_integration",
	mcp.WithDescription(
		"Check a Next.js route handler for correct @jsandy/rpc integration. "+
			"Detects missing GET/POST exports, incorrect app.fetch usage, "+
			"Zod v3 patterns, and import issues.",
	),
	mcp.WithString("code",
		mcp.Required(),
		mcp.Description("The Next.js route handler TypeScript code to validate"),
	),
)

func handleValidateNextJS(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	code, _ := req.GetArguments()["code"].(string)
	if code == "" {
		return mcp.NewToolResultError("'code' parameter is required"), nil
	}
	if len(code) > MaxCodeLength {
		return mcp.NewToolResultError("code exceeds maximum length of 50KB"), nil
	}

	var issues []Issue
	issues = append(issues, CheckZodV4Compliance(code)...)
	issues = append(issues, CheckImports(code)...)
	issues = append(issues, CheckNextJSIntegration(code)...)

	return formatIssues(issues)
}

func registerNextJSTools(s *mcpserver.MCPServer) {
	s.AddTool(validateNextJSTool, handleValidateNextJS)
}
