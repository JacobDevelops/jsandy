package codegen

import (
	"context"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/templates"
)

var createRouterTool = mcp.NewTool("create_router",
	mcp.WithDescription(
		"Generate a @jsandy/rpc router definition that groups procedures together. "+
			"Produces TypeScript code with correct router() call and type export.",
	),
	mcp.WithString("name",
		mcp.Required(),
		mcp.Description("Router variable name in camelCase (e.g. 'userRouter', 'postRouter')"),
	),
	mcp.WithString("procedures",
		mcp.Required(),
		mcp.Description("Comma-separated procedure names to include (e.g. 'getUser, createUser, deleteUser')"),
	),
)

func handleCreateRouter(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	name, _ := args["name"].(string)
	proceduresStr, _ := args["procedures"].(string)

	if name == "" {
		return mcp.NewToolResultError("'name' parameter is required"), nil
	}
	if proceduresStr == "" {
		return mcp.NewToolResultError("'procedures' parameter is required"), nil
	}

	procedures := splitAndTrim(proceduresStr)

	code := templates.RenderRouter(templates.RouterParams{
		Name:       name,
		Procedures: procedures,
	})

	return mcp.NewToolResultText(code), nil
}

var mergeRoutersTool = mcp.NewTool("merge_routers",
	mcp.WithDescription(
		"Generate a mergeRouters configuration that combines multiple sub-routers into a single Hono app. "+
			"Produces TypeScript code with Hono setup, CORS, error handling, and router mounting.",
	),
	mcp.WithString("name",
		mcp.Required(),
		mcp.Description("App variable name (e.g. 'app')"),
	),
	mcp.WithString("routers",
		mcp.Required(),
		mcp.Description(
			"Comma-separated 'routerName=importPath' pairs. "+
				"Example: 'users=./routers/users, posts=./routers/posts'",
		),
	),
	mcp.WithBoolean("useDynamic",
		mcp.Description("Use dynamic() for lazy-loading routers (code-splitting). Default: false."),
	),
)

func handleMergeRouters(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	name, _ := args["name"].(string)
	routersStr, _ := args["routers"].(string)

	if name == "" {
		return mcp.NewToolResultError("'name' parameter is required"), nil
	}
	if routersStr == "" {
		return mcp.NewToolResultError("'routers' parameter is required"), nil
	}

	useDynamic, _ := args["useDynamic"].(bool)

	routers := parseKeyValuePairs(routersStr)

	code := templates.RenderMergeRouters(templates.MergeRouterParams{
		Name:       name,
		Routers:    routers,
		UseDynamic: useDynamic,
	})

	return mcp.NewToolResultText(code), nil
}

func registerRouterTools(s *mcpserver.MCPServer) {
	s.AddTool(createRouterTool, handleCreateRouter)
	s.AddTool(mergeRoutersTool, handleMergeRouters)
}

// splitAndTrim splits a comma-separated string and trims whitespace from each element.
func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}

// parseKeyValuePairs parses "key=value, key2=value2" into a map.
func parseKeyValuePairs(s string) map[string]string {
	result := make(map[string]string)
	pairs := strings.Split(s, ",")
	for _, pair := range pairs {
		pair = strings.TrimSpace(pair)
		if pair == "" {
			continue
		}
		kv := strings.SplitN(pair, "=", 2)
		if len(kv) == 2 {
			result[strings.TrimSpace(kv[0])] = strings.TrimSpace(kv[1])
		}
	}
	return result
}
