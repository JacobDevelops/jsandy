package validate

import (
	"context"
	"encoding/json"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"
)

var validateProcedureTool = mcp.NewTool("validate_procedure",
	mcp.WithDescription(
		"Check a @jsandy/rpc procedure definition for correctness. "+
			"Detects Zod v3 anti-patterns, incorrect builder chain order, "+
			"bad import paths, and missing patterns.",
	),
	mcp.WithString("code",
		mcp.Required(),
		mcp.Description("The procedure TypeScript code to validate"),
	),
)

func handleValidateProcedure(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	code, _ := req.GetArguments()["code"].(string)
	if code == "" {
		return mcp.NewToolResultError("'code' parameter is required"), nil
	}
	if len(code) > MaxCodeLength {
		return mcp.NewToolResultError("code exceeds maximum length of 50KB"), nil
	}

	var issues []Issue
	issues = append(issues, CheckZodV4Compliance(code)...)
	issues = append(issues, CheckProcedurePatterns(code)...)
	issues = append(issues, CheckImports(code)...)

	return formatIssues(issues)
}

func registerProcedureTools(s *mcpserver.MCPServer) {
	s.AddTool(validateProcedureTool, handleValidateProcedure)
}

func formatIssues(issues []Issue) (*mcp.CallToolResult, error) {
	if len(issues) == 0 {
		return mcp.NewToolResultText("No issues found. Code looks correct."), nil
	}

	data, err := json.MarshalIndent(issues, "", "  ")
	if err != nil {
		return mcp.NewToolResultError("failed to format issues"), nil
	}
	return mcp.NewToolResultText(string(data)), nil
}
