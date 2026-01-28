package validate

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"
)

var checkZodV4Tool = mcp.NewTool("check_zod_v4_compliance",
	mcp.WithDescription(
		"Flag any Zod v3 syntax in code. @jsandy/rpc requires Zod v4. "+
			"Detects deprecated methods like .nativeEnum(), .strict(), .passthrough(), "+
			".strip(), .deepPartial(), .merge(), z.promise(), .create(), z.ostring(), etc.",
	),
	mcp.WithString("code",
		mcp.Required(),
		mcp.Description("Code containing Zod usage to check for v3 anti-patterns"),
	),
)

func handleCheckZodV4(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	code, _ := req.GetArguments()["code"].(string)
	if code == "" {
		return mcp.NewToolResultError("'code' parameter is required"), nil
	}
	if len(code) > MaxCodeLength {
		return mcp.NewToolResultError("code exceeds maximum length of 50KB"), nil
	}

	issues := CheckZodV4Compliance(code)
	return formatIssues(issues)
}

func registerZodTools(s *mcpserver.MCPServer) {
	s.AddTool(checkZodV4Tool, handleCheckZodV4)
}
