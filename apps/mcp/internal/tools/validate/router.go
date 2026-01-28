package validate

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"
)

var validateRouterTool = mcp.NewTool("validate_router",
	mcp.WithDescription(
		"Check a @jsandy/rpc router definition for structural issues. "+
			"Detects empty routers, procedures without router wrappers, "+
			"Zod v3 usage, and import path issues.",
	),
	mcp.WithString("code",
		mcp.Required(),
		mcp.Description("The router TypeScript code to validate"),
	),
)

func handleValidateRouter(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
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
	issues = append(issues, CheckRouterStructure(code)...)

	return formatIssues(issues)
}

func registerRouterTools(s *mcpserver.MCPServer) {
	s.AddTool(validateRouterTool, handleValidateRouter)
}
