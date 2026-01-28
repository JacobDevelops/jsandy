package validate

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"
)

var validateMiddlewareTool = mcp.NewTool("validate_middleware",
	mcp.WithDescription(
		"Check @jsandy/rpc middleware for correct patterns. "+
			"Detects missing next() calls, unreturned next() results, "+
			"Zod v3 usage, and import issues.",
	),
	mcp.WithString("code",
		mcp.Required(),
		mcp.Description("The middleware TypeScript code to validate"),
	),
)

func handleValidateMiddleware(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
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
	issues = append(issues, CheckMiddlewarePattern(code)...)

	return formatIssues(issues)
}

func registerMiddlewareTools(s *mcpserver.MCPServer) {
	s.AddTool(validateMiddlewareTool, handleValidateMiddleware)
}
