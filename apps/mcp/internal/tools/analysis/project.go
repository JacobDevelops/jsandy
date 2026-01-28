package analysis

import (
	"context"
	"fmt"
	"strings"

	"github.com/mark3labs/mcp-go/mcp"
	mcpserver "github.com/mark3labs/mcp-go/server"
)

var analyzeProjectTool = mcp.NewTool("analyze_project_structure",
	mcp.WithDescription(
		"Analyze a project structure for @jsandy/rpc integration. "+
			"Identifies framework type, suggests file locations for route handlers, "+
			"detects missing dependencies, and recommends project organization.",
	),
	mcp.WithString("structure",
		mcp.Required(),
		mcp.Description("Project file tree or structure description (e.g. list of file paths, package.json contents)"),
	),
	mcp.WithString("framework",
		mcp.Description("Framework being used"),
		mcp.Enum("nextjs-app", "nextjs-pages", "standalone"),
	),
)

func handleAnalyzeProject(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
	args := req.GetArguments()

	structure, _ := args["structure"].(string)
	if structure == "" {
		return mcp.NewToolResultError("'structure' parameter is required"), nil
	}
	if len(structure) > maxCodeLength {
		return mcp.NewToolResultError("structure exceeds maximum length"), nil
	}

	framework, _ := args["framework"].(string)

	var b strings.Builder
	b.WriteString("## Project Structure Analysis\n\n")

	// Detect framework if not specified
	if framework == "" {
		framework = detectFramework(structure)
		fmt.Fprintf(&b, "**Detected framework**: %s\n\n", framework)
	} else {
		fmt.Fprintf(&b, "**Framework**: %s\n\n", framework)
	}

	// Check for dependencies
	b.WriteString("### Dependencies Check\n\n")
	if !strings.Contains(structure, "@jsandy/rpc") {
		b.WriteString("- **Missing**: `@jsandy/rpc` — install with `bun add @jsandy/rpc`\n")
	} else {
		b.WriteString("- `@jsandy/rpc` found\n")
	}
	if !strings.Contains(structure, "\"zod\"") && !strings.Contains(structure, "'zod'") {
		b.WriteString("- **Missing**: `zod` (v4) — install with `bun add zod@4`\n")
	}
	if !strings.Contains(structure, "hono") {
		b.WriteString("- **Missing**: `hono` — install with `bun add hono`\n")
	}

	// Framework-specific recommendations
	b.WriteString("\n### Recommended Structure\n\n")
	switch framework {
	case "nextjs-app":
		b.WriteString("```\n")
		b.WriteString("src/\n")
		b.WriteString("├── app/\n")
		b.WriteString("│   └── api/\n")
		b.WriteString("│       └── [[...route]]/\n")
		b.WriteString("│           └── route.ts       ← catch-all route handler\n")
		b.WriteString("├── server/\n")
		b.WriteString("│   ├── router.ts              ← app router (mergeRouters)\n")
		b.WriteString("│   ├── middleware.ts           ← shared middleware\n")
		b.WriteString("│   └── routers/\n")
		b.WriteString("│       ├── users.ts            ← domain routers\n")
		b.WriteString("│       └── posts.ts\n")
		b.WriteString("└── lib/\n")
		b.WriteString("    └── client.ts               ← createClient setup\n")
		b.WriteString("```\n\n")

		if !strings.Contains(structure, "[[...route]]") && !strings.Contains(structure, "[...route]") {
			b.WriteString("- **Missing**: Catch-all route handler at `app/api/[[...route]]/route.ts`\n")
			b.WriteString("  - Create this with `create-jsandy-app` or manually\n")
		}

	case "nextjs-pages":
		b.WriteString("```\n")
		b.WriteString("src/\n")
		b.WriteString("├── pages/\n")
		b.WriteString("│   └── api/\n")
		b.WriteString("│       └── [...route].ts       ← catch-all API route\n")
		b.WriteString("├── server/\n")
		b.WriteString("│   ├── router.ts\n")
		b.WriteString("│   └── routers/\n")
		b.WriteString("└── lib/\n")
		b.WriteString("    └── client.ts\n")
		b.WriteString("```\n\n")

	default:
		b.WriteString("```\n")
		b.WriteString("src/\n")
		b.WriteString("├── index.ts                   ← entry point\n")
		b.WriteString("├── router.ts                  ← app router\n")
		b.WriteString("├── middleware.ts               ← shared middleware\n")
		b.WriteString("└── routers/\n")
		b.WriteString("    ├── users.ts\n")
		b.WriteString("    └── posts.ts\n")
		b.WriteString("```\n\n")
	}

	// Detect conflicting patterns
	b.WriteString("### Potential Conflicts\n\n")
	conflicts := false
	if strings.Contains(structure, "trpc") || strings.Contains(structure, "tRPC") {
		b.WriteString("- **tRPC detected**: @jsandy/rpc replaces tRPC. Remove tRPC dependencies and migrate procedures.\n")
		conflicts = true
	}
	if strings.Contains(structure, "next-connect") {
		b.WriteString("- **next-connect detected**: @jsandy/rpc uses Hono internally. Remove next-connect.\n")
		conflicts = true
	}
	if !conflicts {
		b.WriteString("No conflicting patterns detected.\n")
	}

	return mcp.NewToolResultText(b.String()), nil
}

func detectFramework(structure string) string {
	if strings.Contains(structure, "app/api") || strings.Contains(structure, "app/layout") {
		return "nextjs-app"
	}
	if strings.Contains(structure, "pages/api") {
		return "nextjs-pages"
	}
	if strings.Contains(structure, "next.config") {
		return "nextjs-app"
	}
	return "standalone"
}

func registerProjectTools(s *mcpserver.MCPServer) {
	s.AddTool(analyzeProjectTool, handleAnalyzeProject)
}
