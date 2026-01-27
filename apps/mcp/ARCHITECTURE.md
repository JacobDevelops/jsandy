# JSandy MCP Server - Architecture Design

> Designed from [REQUIREMENTS.md](./REQUIREMENTS.md).
> Next step: `/sc:workflow` for implementation plan, then `/sc:implement`.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers Edge                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   worker.mjs (entry)                      │  │
│  │                        ↓                                  │  │
│  │                   shim.mjs (bridge)                       │  │
│  │                        ↓                                  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              app.wasm (Go binary)                    │  │  │
│  │  │                                                     │  │  │
│  │  │  ┌──────────────┐     ┌──────────────────────────┐  │  │  │
│  │  │  │ syumai/      │     │    mcp-go                │  │  │  │
│  │  │  │ workers      │────▶│ StreamableHTTPServer     │  │  │  │
│  │  │  │ .Serve(h)    │     │   .ServeHTTP(w, r)      │  │  │  │
│  │  │  └──────────────┘     └───────────┬──────────────┘  │  │  │
│  │  │                                   │                 │  │  │
│  │  │                        ┌──────────▼───────────┐     │  │  │
│  │  │                        │     MCPServer        │     │  │  │
│  │  │                        │  ┌────────────────┐  │     │  │  │
│  │  │                        │  │ Tool Registry  │  │     │  │  │
│  │  │                        │  │  18 tools      │  │     │  │  │
│  │  │                        │  └───────┬────────┘  │     │  │  │
│  │  │                        └──────────┼───────────┘     │  │  │
│  │  │                                   │                 │  │  │
│  │  │              ┌────────────────────┼──────────────┐  │  │  │
│  │  │              ▼          ▼         ▼              ▼  │  │  │
│  │  │         ┌────────┐ ┌────────┐ ┌───────┐ ┌─────────┐│  │  │
│  │  │         │Codegen │ │Validate│ │Lookup │ │Analysis ││  │  │
│  │  │         │Handlers│ │Handlers│ │Handler│ │Handlers ││  │  │
│  │  │         └───┬────┘ └───┬────┘ └───┬───┘ └────┬────┘│  │  │
│  │  │             │          │          │           │     │  │  │
│  │  │             ▼          ▼          ▼           ▼     │  │  │
│  │  │         ┌──────────────────────────────────────────┐│  │  │
│  │  │         │          Knowledge Base                  ││  │  │
│  │  │         │  (embedded Go strings via go:embed)      ││  │  │
│  │  │         │  ┌──────┐ ┌────────┐ ┌─────────┐        ││  │  │
│  │  │         │  │ API  │ │ Guides │ │Templates│        ││  │  │
│  │  │         │  │ Ref  │ │        │ │         │        ││  │  │
│  │  │         │  └──────┘ └────────┘ └─────────┘        ││  │  │
│  │  │         └──────────────────────────────────────────┘│  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

MCP Clients (Claude Code, Cursor, etc.)
        │
        │  Streamable HTTP (JSON-RPC over POST/GET)
        │  https://mcp.jsandy.com/mcp
        │
        ▼
```

### Request Flow

1. MCP client sends JSON-RPC POST to `https://mcp.jsandy.com/mcp`
2. Cloudflare routes to `worker.mjs` → `shim.mjs` bridges to Go WASM
3. `syumai/workers` converts JS Request → Go `*http.Request`
4. `mcp-go` `StreamableHTTPServer.ServeHTTP()` handles MCP protocol
5. `MCPServer` dispatches to registered tool handler
6. Handler executes (string processing, template rendering, pattern matching)
7. Result flows back: Go response → JS Response → Cloudflare → client

---

## 2. Directory Structure

```
apps/mcp/
├── main.go                     # Entry point: server init + tool registration
├── go.mod                      # Go module (github.com/jsandy/mcp)
├── go.sum
├── package.json                # Build scripts + wrangler dep
├── wrangler.toml               # Cloudflare Workers config
├── Makefile                    # Build helpers
├── build/                      # Generated build artifacts (gitignored)
│   ├── app.wasm
│   ├── worker.mjs
│   ├── shim.mjs
│   └── wasm_exec.js
│
├── internal/                   # Internal packages (not importable externally)
│   ├── server/
│   │   └── server.go           # MCP server factory + configuration
│   │
│   ├── tools/                  # Tool handler implementations
│   │   ├── registry.go         # Tool registration (registers all tools on MCPServer)
│   │   ├── codegen/            # Code generation tools
│   │   │   ├── procedure.go    # create_procedure, create_ws_procedure
│   │   │   ├── router.go       # create_router, merge_routers
│   │   │   ├── middleware.go   # create_middleware
│   │   │   ├── client.go       # create_client
│   │   │   ├── adapter.go      # create_pubsub_adapter
│   │   │   ├── nextjs.go       # setup_nextjs_route
│   │   │   └── codegen.go      # Shared codegen utilities (indent, format, etc.)
│   │   ├── validate/           # Validation tools
│   │   │   ├── procedure.go    # validate_procedure
│   │   │   ├── router.go       # validate_router
│   │   │   ├── middleware.go   # validate_middleware
│   │   │   ├── nextjs.go       # validate_nextjs_integration
│   │   │   ├── zod.go          # check_zod_v4_compliance
│   │   │   └── rules.go        # Shared validation rules and patterns
│   │   ├── lookup/             # Lookup tools
│   │   │   ├── api.go          # lookup_api
│   │   │   ├── search.go       # search_docs
│   │   │   ├── exports.go      # list_exports
│   │   │   └── examples.go     # get_examples
│   │   └── analysis/           # Analysis tools
│   │       ├── code.go         # analyze_code
│   │       ├── project.go      # analyze_project_structure
│   │       └── improve.go      # suggest_improvements
│   │
│   ├── kb/                     # Knowledge base (embedded documentation)
│   │   ├── kb.go               # go:embed directives + accessor functions
│   │   ├── index.go            # Search index built at init()
│   │   └── docs/               # Hand-written markdown documentation
│   │       ├── api/            # API reference docs
│   │       │   ├── jsandy.md           # jsandy.init() and defaults
│   │       │   ├── procedure.md        # Procedure builder API
│   │       │   ├── router.md           # Router API
│   │       │   ├── client.md           # createClient API
│   │       │   ├── middleware.md        # Middleware types and fromHono
│   │       │   ├── websocket.md        # ServerSocket, ClientSocket, IO
│   │       │   ├── adapters.md         # PubSubAdapter interface + impls
│   │       │   ├── schemas.md          # createSchema, createEnumSchema
│   │       │   ├── types.md            # Infer types, utility types
│   │       │   └── openapi.md          # OpenAPI generation
│   │       ├── guides/         # Usage guides
│   │       │   ├── procedures.md       # Building procedures guide
│   │       │   ├── routers.md          # Router patterns guide
│   │       │   ├── middleware.md       # Middleware guide
│   │       │   ├── client.md           # Client usage guide
│   │       │   ├── websocket.md        # WebSocket guide
│   │       │   ├── pubsub-adapter.md   # Custom adapter guide
│   │       │   ├── nextjs.md           # Next.js integration guide
│   │       │   ├── create-app.md       # create-jsandy-app guide
│   │       │   └── zod-v4.md           # Zod v4 constraints
│   │       ├── patterns/       # Common pattern examples
│   │       │   ├── auth.md             # Auth middleware pattern
│   │       │   ├── crud.md             # CRUD procedures pattern
│   │       │   ├── file-upload.md      # File upload pattern
│   │       │   ├── pagination.md       # Pagination pattern
│   │       │   ├── error-handling.md   # Error handling pattern
│   │       │   ├── realtime-chat.md    # Real-time chat pattern
│   │       │   └── notifications.md    # Notification system pattern
│   │       └── exports/        # Export listings
│   │           ├── main.md             # @jsandy/rpc exports
│   │           ├── client.md           # @jsandy/rpc/client exports
│   │           └── adapters.md         # @jsandy/rpc/adapters exports
│   │
│   └── templates/              # Code generation templates
│       ├── procedure.go        # Procedure template strings
│       ├── router.go           # Router template strings
│       ├── middleware.go       # Middleware template strings
│       ├── client.go           # Client template strings
│       ├── adapter.go          # PubSubAdapter template strings
│       └── nextjs.go           # Next.js route handler templates
│
└── internal_test/              # Tests (separate to avoid bloating WASM binary)
    ├── codegen_test.go
    ├── validate_test.go
    ├── lookup_test.go
    ├── analysis_test.go
    └── integration_test.go
```

---

## 3. Go Module Design

### Module Path

```
module github.com/nicholasgriffintn/jsandy/apps/mcp
```

> Uses the GitHub org path from the monorepo. Internal packages prevent external imports.

### Dependencies

```
require (
    github.com/mark3labs/mcp-go    v0.28.0   // MCP protocol (latest stable)
    github.com/syumai/workers      v0.31.0   // Cloudflare Workers bridge
)
```

**No other dependencies.** Minimizing deps is critical for WASM binary size. All template rendering, validation, and search use stdlib-only approaches:

- `strings`, `fmt`, `text/template` for codegen
- `strings.Contains`, `regexp` for validation pattern matching
- `encoding/json` for structured inputs (pulled in transitively by mcp-go anyway)

### Build Constraints

The main binary targets `GOOS=js GOARCH=wasm`. Tests run on native `GOOS`:

```go
// main.go
//go:build js && wasm

package main
```

Tests intentionally live outside the main package to avoid build tag issues:

```go
// internal_test/codegen_test.go (no build tag - runs natively)
package internal_test
```

---

## 4. Component Design

### 4.1 Entry Point (`main.go`)

```go
//go:build js && wasm

package main

import (
    "net/http"

    "github.com/nicholasgriffintn/jsandy/apps/mcp/internal/server"
    "github.com/syumai/workers"
)

func main() {
    handler := server.NewHandler()
    mux := http.NewServeMux()
    mux.Handle("/mcp", handler)
    mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte(`{"status":"ok"}`))
    })
    workers.Serve(mux)
}
```

Minimal entry point. All complexity lives in `internal/`.

### 4.2 Server Factory (`internal/server/server.go`)

Creates and configures the MCP server + Streamable HTTP handler.

```go
package server

import (
    "net/http"

    "github.com/mark3labs/mcp-go/mcp"
    mcpserver "github.com/mark3labs/mcp-go/server"

    "github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools"
)

const (
    ServerName    = "jsandy-mcp"
    ServerVersion = "1.0.0"
    RPCVersion    = "2.2.0"  // tracked @jsandy/rpc version
)

func NewHandler() http.Handler {
    s := mcpserver.NewMCPServer(ServerName, ServerVersion,
        mcpserver.WithToolCapabilities(true),
        mcpserver.WithRecovery(),
        mcpserver.WithInstructions(serverInstructions()),
    )

    // Register all 18 tools
    tools.RegisterAll(s)

    // Create Streamable HTTP transport (stateless for Workers)
    handler := mcpserver.NewStreamableHTTPServer(s,
        mcpserver.WithEndpointPath("/mcp"),
        mcpserver.WithStateLess(true),
    )

    return handler
}

func serverInstructions() string {
    return `You are connected to the JSandy MCP server. This server helps you ` +
        `use @jsandy/rpc (v` + RPCVersion + `) correctly in Next.js projects. ` +
        `Available tool categories: code generation, validation, API lookup, ` +
        `and project analysis. All generated code uses Zod v4 (never v3). ` +
        `Use lookup_api and search_docs to find API details before generating code.`
}
```

**Key decisions:**
- **Stateless mode** (`WithStateLess(true)`): No session state between requests. Each request is independent, which is required for Cloudflare Workers (no persistent memory).
- **Recovery** (`WithRecovery()`): Prevents panics from crashing the WASM runtime.
- **Instructions**: Brief server description given to the AI agent during initialization.

### 4.3 Tool Registry (`internal/tools/registry.go`)

Central registration point. Each tool subpackage exports a `Register(s)` function.

```go
package tools

import (
    mcpserver "github.com/mark3labs/mcp-go/server"

    "github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools/analysis"
    "github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools/codegen"
    "github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools/lookup"
    "github.com/nicholasgriffintn/jsandy/apps/mcp/internal/tools/validate"
)

func RegisterAll(s *mcpserver.MCPServer) {
    codegen.Register(s)
    validate.Register(s)
    lookup.Register(s)
    analysis.Register(s)
}
```

### 4.4 Tool Handler Pattern

Every tool follows a consistent pattern:

```go
// internal/tools/codegen/procedure.go
package codegen

import (
    "context"
    "fmt"

    "github.com/mark3labs/mcp-go/mcp"
    mcpserver "github.com/mark3labs/mcp-go/server"

    "github.com/nicholasgriffintn/jsandy/apps/mcp/internal/templates"
)

// Tool definition
var createProcedureTool = mcp.NewTool("create_procedure",
    mcp.WithDescription(
        "Generate a typed @jsandy/rpc procedure definition (query or mutation). "+
            "Produces ready-to-use TypeScript code with Zod v4 schemas.",
    ),
    mcp.WithString("name",
        mcp.Required(),
        mcp.Description("Procedure name in camelCase (e.g. 'getUser', 'createPost')"),
    ),
    mcp.WithString("type",
        mcp.Required(),
        mcp.Description("Procedure type"),
        mcp.Enum("query", "mutation"),
    ),
    mcp.WithString("inputSchema",
        mcp.Description(
            "Description of input fields. Example: 'id: string (required), "+
                "includeProfile: boolean (optional)'",
        ),
    ),
    mcp.WithString("outputSchema",
        mcp.Description("Description of output fields"),
    ),
    mcp.WithString("middleware",
        mcp.Description(
            "Comma-separated middleware names to chain (e.g. 'auth, rateLimit')",
        ),
    ),
    mcp.WithString("description",
        mcp.Description("OpenAPI description for the procedure"),
    ),
)

// Handler
func handleCreateProcedure(
    ctx context.Context,
    req mcp.CallToolRequest,
) (*mcp.CallToolResult, error) {
    name, _ := req.RequireString("name")
    procType, _ := req.RequireString("type")

    args := req.GetArguments()
    inputSchema, _ := args["inputSchema"].(string)
    outputSchema, _ := args["outputSchema"].(string)
    middleware, _ := args["middleware"].(string)
    description, _ := args["description"].(string)

    code := templates.RenderProcedure(templates.ProcedureParams{
        Name:         name,
        Type:         procType,
        InputSchema:  inputSchema,
        OutputSchema: outputSchema,
        Middleware:    middleware,
        Description:  description,
    })

    return mcp.NewToolResultText(code), nil
}

// Registration (called from codegen.Register)
func registerProcedureTools(s *mcpserver.MCPServer) {
    s.AddTool(createProcedureTool, handleCreateProcedure)
    s.AddTool(createWSProcedureTool, handleCreateWSProcedure)
}
```

**Pattern rules:**
1. Tool definition at package level (zero allocation at registration)
2. Handler function with `(context.Context, mcp.CallToolRequest) → (*mcp.CallToolResult, error)` signature
3. Extract parameters via `RequireString` (required) or `GetArguments()` (optional)
4. Delegate to `templates` package for code generation or `kb` package for lookups
5. Return `mcp.NewToolResultText(content)` for success, `mcp.NewToolResultError(msg)` for errors

### 4.5 Template Engine (`internal/templates/`)

Uses Go's `text/template` for code generation. Templates are Go string constants (not embedded files) to keep the build simple and avoid `text/template` parse overhead on every request.

```go
// internal/templates/procedure.go
package templates

import (
    "fmt"
    "strings"
)

type ProcedureParams struct {
    Name         string
    Type         string   // "query" | "mutation"
    InputSchema  string   // human description → Zod fields
    OutputSchema string
    Middleware   string   // comma-separated names
    Description  string
}

func RenderProcedure(p ProcedureParams) string {
    var b strings.Builder

    // Imports
    b.WriteString("import { jsandy } from \"@jsandy/rpc\";\n")
    b.WriteString("import { z } from \"zod\";\n\n")

    // Init
    b.WriteString("const { procedure } = jsandy.init();\n\n")

    // Input schema (if provided)
    if p.InputSchema != "" {
        fmt.Fprintf(&b, "const %sInput = z.object({\n", p.Name)
        writeZodFields(&b, p.InputSchema)
        b.WriteString("});\n\n")
    }

    // Output schema (if provided)
    if p.OutputSchema != "" {
        fmt.Fprintf(&b, "const %sOutput = z.object({\n", p.Name)
        writeZodFields(&b, p.OutputSchema)
        b.WriteString("});\n\n")
    }

    // Procedure definition
    fmt.Fprintf(&b, "export const %s = procedure\n", p.Name)

    // Middleware chain
    if p.Middleware != "" {
        for _, mw := range strings.Split(p.Middleware, ",") {
            mw = strings.TrimSpace(mw)
            fmt.Fprintf(&b, "\t.use(%s)\n", mw)
        }
    }

    // Input/output
    if p.InputSchema != "" {
        fmt.Fprintf(&b, "\t.input(%sInput)\n", p.Name)
    }
    if p.OutputSchema != "" {
        fmt.Fprintf(&b, "\t.output(%sOutput)\n", p.Name)
    }

    // Description
    if p.Description != "" {
        fmt.Fprintf(&b, "\t.describe({ description: %q })\n", p.Description)
    }

    // Handler
    handlerMethod := "query"
    if p.Type == "mutation" {
        handlerMethod = "mutation"
    }

    fmt.Fprintf(&b, "\t.%s(async ({ c, ctx, input }) => {\n", handlerMethod)
    b.WriteString("\t\t// TODO: Implement handler logic\n")
    b.WriteString("\t\treturn c.superjson({\n")
    b.WriteString("\t\t\t// TODO: Return response data\n")
    b.WriteString("\t\t});\n")
    b.WriteString("\t});\n")

    return b.String()
}
```

**Why `strings.Builder` instead of `text/template`:**
- `text/template` adds ~800KB to WASM binary (via `reflect` dependency)
- String builders are faster for structured code generation
- Templates are predictable enough that `fmt.Fprintf` + `strings.Builder` is sufficient
- Avoids runtime template parsing overhead (important for 50ms CPU budget)

### 4.6 Knowledge Base (`internal/kb/`)

Embedded markdown docs with a lightweight search index.

```go
// internal/kb/kb.go
package kb

import "embed"

//go:embed docs/api/*.md
var apiDocs embed.FS

//go:embed docs/guides/*.md
var guideDocs embed.FS

//go:embed docs/patterns/*.md
var patternDocs embed.FS

//go:embed docs/exports/*.md
var exportDocs embed.FS

// GetAPIDoc returns the content of an API reference document.
func GetAPIDoc(name string) (string, bool) {
    data, err := apiDocs.ReadFile("docs/api/" + name + ".md")
    if err != nil {
        return "", false
    }
    return string(data), true
}

// GetGuide returns the content of a guide document.
func GetGuide(name string) (string, bool) {
    data, err := guideDocs.ReadFile("docs/guides/" + name + ".md")
    if err != nil {
        return "", false
    }
    return string(data), true
}

// GetPattern returns the content of a pattern document.
func GetPattern(name string) (string, bool) {
    data, err := patternDocs.ReadFile("docs/patterns/" + name + ".md")
    if err != nil {
        return "", false
    }
    return string(data), true
}

// GetExports returns the content of an exports listing.
func GetExports(entryPoint string) (string, bool) {
    data, err := exportDocs.ReadFile("docs/exports/" + entryPoint + ".md")
    if err != nil {
        return "", false
    }
    return string(data), true
}
```

```go
// internal/kb/index.go
package kb

import (
    "strings"
    "sync"
)

// Entry represents a searchable knowledge base entry.
type Entry struct {
    Name     string   // e.g. "createClient", "Procedure.input"
    Kind     string   // "function", "class", "type", "method", "guide", "pattern"
    Source   string   // file path within embed.FS
    Section  string   // "api", "guides", "patterns", "exports"
    Keywords []string // lowercase search terms
    Summary  string   // one-line description
}

var (
    entries []Entry
    once    sync.Once
)

// initIndex builds the search index on first access.
// This runs once per WASM instance lifetime (survives across requests
// within the same Worker invocation).
func initIndex() {
    once.Do(func() {
        entries = buildIndex()
    })
}

// Lookup finds an exact API entry by name (case-insensitive).
func Lookup(name string) (*Entry, string, bool) {
    initIndex()
    lower := strings.ToLower(name)
    for _, e := range entries {
        if strings.ToLower(e.Name) == lower {
            content, ok := getContent(e)
            return &e, content, ok
        }
    }
    return nil, "", false
}

// Search finds entries matching a keyword query.
// Returns up to maxResults entries sorted by relevance.
func Search(query string, maxResults int) []SearchResult {
    initIndex()
    terms := strings.Fields(strings.ToLower(query))

    type scored struct {
        entry Entry
        score int
    }

    var results []scored
    for _, e := range entries {
        score := 0
        for _, term := range terms {
            for _, kw := range e.Keywords {
                if strings.Contains(kw, term) {
                    score++
                }
            }
            if strings.Contains(strings.ToLower(e.Name), term) {
                score += 3 // boost name matches
            }
            if strings.Contains(strings.ToLower(e.Summary), term) {
                score += 2 // boost summary matches
            }
        }
        if score > 0 {
            results = append(results, scored{entry: e, score: score})
        }
    }

    // Sort by score descending (simple insertion sort - small N)
    for i := 1; i < len(results); i++ {
        for j := i; j > 0 && results[j].score > results[j-1].score; j-- {
            results[j], results[j-1] = results[j-1], results[j]
        }
    }

    if len(results) > maxResults {
        results = results[:maxResults]
    }

    out := make([]SearchResult, len(results))
    for i, r := range results {
        out[i] = SearchResult{
            Name:    r.entry.Name,
            Kind:    r.entry.Kind,
            Summary: r.entry.Summary,
            Score:   r.score,
        }
    }
    return out
}

// SearchResult represents a search hit.
type SearchResult struct {
    Name    string
    Kind    string
    Summary string
    Score   int
}
```

**Search design rationale:**
- **No external search library** (keeps binary small)
- **Keyword-based scoring** with boost for name/summary matches
- **`sync.Once` initialization**: Index builds once per WASM instance. Worker instances may be reused across requests, so this amortizes startup cost.
- **Linear scan**: With ~100 entries, linear scan is faster than building a trie/index structure. Well within CPU budget.

### 4.7 Validation Engine (`internal/tools/validate/rules.go`)

Pattern-based validation using string matching and regex. No AST parsing (too expensive for WASM CPU limits).

```go
// internal/tools/validate/rules.go
package validate

import "regexp"

// Issue represents a validation finding.
type Issue struct {
    Severity string `json:"severity"` // "error", "warning", "info"
    Message  string `json:"message"`
    Line     int    `json:"line,omitempty"`     // approximate line number
    Fix      string `json:"fix,omitempty"`      // suggested fix
}

// --- Zod v3 anti-patterns ---

var zodV3Patterns = []struct {
    Pattern *regexp.Regexp
    Message string
    Fix     string
}{
    {
        regexp.MustCompile(`\.nativeEnum\s*\(`),
        "z.nativeEnum() is deprecated in Zod v4. Use z.enum() instead.",
        "Replace z.nativeEnum(MyEnum) with z.enum(['value1', 'value2'])",
    },
    {
        regexp.MustCompile(`\.strict\s*\(\s*\)`),
        ".strict() is deprecated in Zod v4. Objects are strict by default.",
        "Remove .strict() call - Zod v4 objects reject unknown keys by default.",
    },
    {
        regexp.MustCompile(`\.passthrough\s*\(\s*\)`),
        ".passthrough() is deprecated in Zod v4.",
        "Use z.looseObject() or z.object().extend() patterns instead.",
    },
    {
        regexp.MustCompile(`\.strip\s*\(\s*\)`),
        ".strip() is deprecated in Zod v4.",
        "Remove .strip() - Zod v4 strips unknown keys by default.",
    },
    {
        regexp.MustCompile(`\.deepPartial\s*\(\s*\)`),
        ".deepPartial() is removed in Zod v4.",
        "Use recursive z.partial() or manual partial types.",
    },
    {
        regexp.MustCompile(`\.merge\s*\(`),
        ".merge() on objects is deprecated in Zod v4.",
        "Use z.object({...obj1.shape, ...obj2.shape}) or spread syntax.",
    },
    {
        regexp.MustCompile(`z\.promise\s*\(`),
        "z.promise() is deprecated in Zod v4.",
        "Remove z.promise() wrapper - validate the resolved value instead.",
    },
    {
        regexp.MustCompile(`z\.\w+\.create\s*\(`),
        "Static .create() factory methods are removed in Zod v4.",
        "Use z.string(), z.number(), etc. directly without .create().",
    },
    {
        regexp.MustCompile(`z\.ostring\s*\(`),
        "z.ostring() is removed in Zod v4.",
        "Use z.string().optional() instead.",
    },
    {
        regexp.MustCompile(`z\.onumber\s*\(`),
        "z.onumber() is removed in Zod v4.",
        "Use z.number().optional() instead.",
    },
    {
        regexp.MustCompile(`z\.oboolean\s*\(`),
        "z.oboolean() is removed in Zod v4.",
        "Use z.boolean().optional() instead.",
    },
}

// --- jsandy/rpc patterns ---

var procedurePatterns = []struct {
    Pattern *regexp.Regexp
    Message string
    Fix     string
}{
    {
        // .input() after .query() or .mutation()
        regexp.MustCompile(`\.(query|mutation|get|post)\s*\([^)]*\)\s*\.\s*input\s*\(`),
        "Incorrect builder chain: .input() must come before .query()/.mutation().",
        "Move .input() before the handler method in the procedure chain.",
    },
    {
        // .output() after .query() or .mutation()
        regexp.MustCompile(`\.(query|mutation|get|post)\s*\([^)]*\)\s*\.\s*output\s*\(`),
        "Incorrect builder chain: .output() must come before .query()/.mutation().",
        "Move .output() before the handler method in the procedure chain.",
    },
    {
        // .use() after .query() or .mutation()
        regexp.MustCompile(`\.(query|mutation|get|post)\s*\([^)]*\)\s*\.\s*use\s*\(`),
        "Incorrect builder chain: .use() must come before .query()/.mutation().",
        "Move .use() before the handler method in the procedure chain.",
    },
}

var importPatterns = []struct {
    Pattern *regexp.Regexp
    Message string
    Fix     string
}{
    {
        regexp.MustCompile(`from\s+["']@jsandy/rpc/src/`),
        "Importing from internal source paths is not allowed.",
        "Import from '@jsandy/rpc', '@jsandy/rpc/client', or '@jsandy/rpc/adapters'.",
    },
    {
        regexp.MustCompile(`from\s+["']@jsandy/rpc/dist/`),
        "Importing from dist paths is not allowed.",
        "Import from '@jsandy/rpc', '@jsandy/rpc/client', or '@jsandy/rpc/adapters'.",
    },
    {
        regexp.MustCompile(`from\s+["']zod/v3`),
        "Importing from zod/v3 is not supported. @jsandy/rpc requires Zod v4.",
        "Import from 'zod' (which should be zod@4 in your package.json).",
    },
}

// CheckZodV4Compliance runs all Zod v3 anti-pattern checks.
func CheckZodV4Compliance(code string) []Issue {
    var issues []Issue
    for _, p := range zodV3Patterns {
        if p.Pattern.MatchString(code) {
            issues = append(issues, Issue{
                Severity: "error",
                Message:  p.Message,
                Fix:      p.Fix,
            })
        }
    }
    return issues
}

// CheckProcedurePatterns validates procedure builder chain ordering.
func CheckProcedurePatterns(code string) []Issue {
    var issues []Issue
    for _, p := range procedurePatterns {
        if p.Pattern.MatchString(code) {
            issues = append(issues, Issue{
                Severity: "error",
                Message:  p.Message,
                Fix:      p.Fix,
            })
        }
    }
    return issues
}

// CheckImports validates import statements.
func CheckImports(code string) []Issue {
    var issues []Issue
    for _, p := range importPatterns {
        if p.Pattern.MatchString(code) {
            issues = append(issues, Issue{
                Severity: "error",
                Message:  p.Message,
                Fix:      p.Fix,
            })
        }
    }
    return issues
}
```

**Validation approach:**
- **Regex-based**: Fast, predictable CPU cost, no dependency overhead
- **Pre-compiled patterns**: `regexp.MustCompile` at package init, reused across requests
- **Structured output**: Issues returned as typed structs, serialized to JSON for the MCP response
- **Composable**: Each validator function checks one category, combined per tool handler

---

## 5. Data Flow Diagrams

### 5.1 Code Generation Flow

```
Agent calls create_procedure
        │
        ▼
┌─────────────────────┐
│  mcp-go dispatches  │
│  to handler func    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Extract params:    │
│  name, type, input, │
│  output, middleware  │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  templates.Render   │
│  Procedure(params)  │
│                     │
│  Builds TS code via │
│  strings.Builder    │
│  with Zod v4 syntax │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Return             │
│  ToolResultText(    │
│    generated code   │
│  )                  │
└─────────────────────┘
```

### 5.2 Validation Flow

```
Agent calls validate_procedure(code)
        │
        ▼
┌───────────────────────┐
│  Extract code param   │
│  (bounded: max 50KB)  │
└────────┬──────────────┘
         │
         ▼
┌───────────────────────────────────────┐
│  Run validation checks in parallel:   │
│                                       │
│  ┌────────────────────────────┐       │
│  │ CheckZodV4Compliance(code) │       │
│  └────────────┬───────────────┘       │
│               │                       │
│  ┌────────────▼───────────────┐       │
│  │ CheckProcedurePatterns(code)│      │
│  └────────────┬───────────────┘       │
│               │                       │
│  ┌────────────▼───────────────┐       │
│  │ CheckImports(code)         │       │
│  └────────────┬───────────────┘       │
│               │                       │
│  ┌────────────▼───────────────┐       │
│  │ CheckMissingPatterns(code) │       │
│  └────────────────────────────┘       │
└────────────────┬──────────────────────┘
                 │
                 ▼
┌───────────────────────────────────┐
│  Aggregate issues                 │
│  Sort by severity (error first)   │
│  Format as JSON array             │
└────────────────┬──────────────────┘
                 │
                 ▼
┌───────────────────────┐
│  Return ToolResultText │
│  (JSON issues array)  │
└───────────────────────┘
```

### 5.3 Lookup Flow

```
Agent calls lookup_api("createClient")
        │
        ▼
┌─────────────────────────┐
│  kb.Lookup("createClient")
│                         │
│  Search index by exact  │
│  name (case-insensitive)│
└────────┬────────────────┘
         │
    ┌────┴────┐
    │  Found? │
    └────┬────┘
     yes │         no
    ┌────▼───┐  ┌──────────────┐
    │ Load   │  │ kb.Search(   │
    │ embed  │  │  name, 5)    │
    │ doc    │  │ Return       │
    │ section│  │ "Not found.  │
    └────┬───┘  │ Did you mean:│
         │      │  ..."        │
         ▼      └──────────────┘
┌───────────────────┐
│ Return doc section │
│ with signature,   │
│ params, examples  │
└───────────────────┘
```

---

## 6. Build Pipeline

### 6.1 Build Steps

```
1. workers-assets-gen       Generate JS bridge files (worker.mjs, shim.mjs, wasm_exec.js)
                            → outputs to ./build/

2. go build (WASM)          Compile Go to WebAssembly
                            GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ./build/app.wasm .
                            → outputs ./build/app.wasm

3. wrangler deploy          Upload build/ directory to Cloudflare Workers
                            → deployed to mcp.jsandy.com
```

### 6.2 `package.json`

```json
{
    "name": "@jsandy/mcp",
    "version": "1.0.0",
    "private": true,
    "scripts": {
        "build": "go run github.com/syumai/workers/cmd/workers-assets-gen@v0.31.0 -mode=go && GOOS=js GOARCH=wasm go build -ldflags=\"-s -w\" -o ./build/app.wasm .",
        "build:check-size": "ls -lh ./build/app.wasm",
        "dev": "wrangler dev",
        "deploy": "npm run build && wrangler deploy",
        "test": "go test ./..."
    },
    "devDependencies": {
        "wrangler": "^4"
    }
}
```

### 6.3 `wrangler.toml`

```toml
name = "jsandy-mcp"
main = "./build/worker.mjs"
compatibility_date = "2025-06-01"

[build]
command = "npm run build"

[observability]
enabled = true

[placement]
mode = "smart"

[routes]
pattern = "mcp.jsandy.com/*"
custom_domain = true
```

### 6.4 `Makefile`

```makefile
.PHONY: build dev deploy test clean check-size

# Build WASM binary
build:
	go run github.com/syumai/workers/cmd/workers-assets-gen@v0.31.0 -mode=go
	GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ./build/app.wasm .

# Check binary size (target: < 8MB, hard limit: 10MB)
check-size: build
	@size=$$(stat -f%z ./build/app.wasm 2>/dev/null || stat -c%s ./build/app.wasm); \
	mb=$$(echo "scale=2; $$size / 1048576" | bc); \
	echo "Binary size: $${mb}MB"; \
	if [ $$size -gt 10485760 ]; then echo "ERROR: Exceeds 10MB limit!"; exit 1; fi; \
	if [ $$size -gt 8388608 ]; then echo "WARNING: Exceeds 8MB target"; fi

# Run tests (native, not WASM)
test:
	go test ./internal/...

# Local development
dev: build
	npx wrangler dev

# Deploy to Cloudflare
deploy: check-size
	npx wrangler deploy

# Clean build artifacts
clean:
	rm -rf ./build
```

### 6.5 `go.mod`

```
module github.com/nicholasgriffintn/jsandy/apps/mcp

go 1.24

require (
    github.com/mark3labs/mcp-go v0.28.0
    github.com/syumai/workers v0.31.0
)
```

### 6.6 Binary Size Strategy

Estimated breakdown:

| Component | Size (approx) |
|-----------|---------------|
| Go WASM runtime | ~1.3 MB |
| `net/http` (from mcp-go) | ~5.9 MB |
| `encoding/json` (from mcp-go) | ~0.9 MB |
| `regexp` (validation) | ~0.4 MB |
| Embedded docs (~30 markdown files) | ~0.1 MB |
| Application code | ~0.1 MB |
| **Total estimate** | **~8.7 MB** |

After `-ldflags="-s -w"` (strips debug info): **~7-8 MB**

This is within the 10MB limit but tight. Mitigation plan:

1. **Measure immediately** after initial build (spike task)
2. If > 10MB: Try `-ldflags="-s -w" -trimpath`
3. If still > 10MB: Evaluate TinyGo (but note: TinyGo's `net/http` support is limited)
4. If TinyGo fails: Consider building a minimal HTTP adapter that doesn't use `net/http` (mcp-go may need patching)

---

## 7. Testing Strategy

### 7.1 Unit Tests (Native Go)

Tests run with `go test` using native GOOS/GOARCH (not WASM). The internal packages have no WASM-specific code.

```
internal_test/
├── codegen_test.go       # Test each code generation template
├── validate_test.go      # Test validation rules against known-good/bad code
├── lookup_test.go        # Test knowledge base lookup and search
├── analysis_test.go      # Test analysis recommendations
└── integration_test.go   # Test MCP server tool registration + dispatch
```

**Testing pattern:**

```go
// internal_test/codegen_test.go
package internal_test

import (
    "strings"
    "testing"

    "github.com/nicholasgriffintn/jsandy/apps/mcp/internal/templates"
)

func TestRenderProcedure_Query(t *testing.T) {
    code := templates.RenderProcedure(templates.ProcedureParams{
        Name:        "getUser",
        Type:        "query",
        InputSchema: "id: string (required)",
    })

    // Must contain correct imports
    if !strings.Contains(code, `from "@jsandy/rpc"`) {
        t.Error("missing @jsandy/rpc import")
    }

    // Must use .query() not .mutation()
    if !strings.Contains(code, ".query(") {
        t.Error("expected .query() handler")
    }
    if strings.Contains(code, ".mutation(") {
        t.Error("should not contain .mutation()")
    }

    // Must use Zod v4 syntax
    if strings.Contains(code, ".nativeEnum(") {
        t.Error("contains Zod v3 anti-pattern: nativeEnum")
    }

    // Must use c.superjson()
    if !strings.Contains(code, "c.superjson(") {
        t.Error("missing c.superjson() response")
    }
}
```

### 7.2 Integration Tests

Test the full MCP protocol flow using mcp-go's test utilities:

```go
func TestMCPServerInitialize(t *testing.T) {
    s := server.NewHandler() // returns the configured MCPServer

    // Send initialize request
    // Verify capabilities include tools
    // Verify tool count is 18
    // Verify server name and version
}

func TestToolCallCreateProcedure(t *testing.T) {
    // Create MCP server
    // Send tools/call with create_procedure params
    // Verify response is valid TypeScript
    // Verify no Zod v3 patterns in output
}
```

### 7.3 WASM Build Test

A CI-only test that builds the WASM binary and checks size:

```yaml
# .github/workflows/mcp.yml
- name: Build WASM
  run: cd apps/mcp && make check-size
```

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                GitHub Repository                 │
│                                                  │
│  push to main ──┐                               │
│                 │                                │
│                 ▼                                │
│  ┌──────────────────────────────────────┐       │
│  │        GitHub Actions CI             │       │
│  │                                      │       │
│  │  1. go test ./internal/...           │       │
│  │  2. GOOS=js GOARCH=wasm go build     │       │
│  │  3. Check binary size < 10MB         │       │
│  │  4. wrangler deploy                  │       │
│  └──────────────────────────────────────┘       │
│                 │                                │
│                 ▼                                │
│  ┌──────────────────────────────────────┐       │
│  │      Cloudflare Workers              │       │
│  │                                      │       │
│  │  mcp.jsandy.com/mcp                  │       │
│  │  ├── POST (MCP requests)             │       │
│  │  ├── GET  (SSE stream)               │       │
│  │  └── DELETE (session terminate)       │       │
│  │                                      │       │
│  │  mcp.jsandy.com/health               │       │
│  │  └── GET (health check)              │       │
│  └──────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

### DNS Configuration

```
mcp.jsandy.com  →  CNAME  →  jsandy-mcp.<account>.workers.dev
```

Or if using Cloudflare as the domain registrar, configure via Workers Custom Domains in `wrangler.toml`.

---

## 9. Security Design

### 9.1 Input Boundaries

```go
const (
    MaxCodeLength       = 50 * 1024  // 50KB max code input
    MaxStructureDepth   = 10         // max JSON nesting for project structure
    MaxQueryLength      = 500        // max search query length
    MaxFieldDescription = 2000       // max field description length
)

// validateInput enforces input boundaries.
func validateInput(code string) error {
    if len(code) > MaxCodeLength {
        return fmt.Errorf("code exceeds maximum length of %d bytes", MaxCodeLength)
    }
    return nil
}
```

### 9.2 Origin Validation

Per MCP spec, validate `Origin` header to prevent DNS rebinding:

```go
// Applied via mcp-go WithHTTPContextFunc or custom middleware
func validateOrigin(r *http.Request) bool {
    origin := r.Header.Get("Origin")
    if origin == "" {
        return true // no origin = not a browser request
    }
    // Allow known MCP clients
    // Block unknown browser origins
    return true // permissive for public server
}
```

For a public server with no auth, Origin validation is less critical but still recommended per spec.

### 9.3 No Code Execution

The server never evaluates, compiles, or executes user-provided code. All operations are string-in → string-out:
- **Codegen**: Params → template rendering → TypeScript string
- **Validation**: Code string → regex matching → issue list
- **Lookup**: Name string → index lookup → doc string
- **Analysis**: Code/structure string → pattern matching → recommendations

---

## 10. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Template engine** | `strings.Builder` + `fmt.Fprintf` | Avoids `text/template` binary bloat (~800KB). Predictable code patterns don't need template flexibility. |
| **Search engine** | Linear scan with keyword scoring | ~100 entries total. Linear scan is faster than building an index structure for this scale. No external deps. |
| **Validation approach** | Regex pattern matching | Fast, predictable CPU cost, no AST parsing overhead. Sufficient for detecting common anti-patterns. |
| **Stateless mode** | `WithStateLess(true)` | Required for Cloudflare Workers. No persistent memory between requests. |
| **Test location** | `internal_test/` (separate dir) | Avoids including test code in WASM binary. Tests run natively. |
| **Go module path** | `github.com/nicholasgriffintn/jsandy/apps/mcp` | Follows monorepo structure. Internal packages prevent external imports. |
| **No `text/template`** | Direct string building | Saves ~800KB binary size. Templates are structured enough for `Fprintf`. |
| **`embed.FS` for docs** | `go:embed` directives | Zero-cost embedding at compile time. No runtime file I/O needed. |
| **`sync.Once` for index** | Lazy initialization | Index builds once per Worker instance. Amortizes cost across requests within same invocation. |
| **`-ldflags="-s -w"`** | Strip debug symbols | Saves 10-20% binary size. Debug info not useful in production WASM. |

---

## 11. Interface Definitions

### 11.1 Tool Input/Output Contracts

All tools accept JSON parameters via MCP's `CallToolRequest` and return `CallToolResult` with text content.

**Code generation tools** return TypeScript code as plain text:

```
Input:  { name: "getUser", type: "query", inputSchema: "id: string" }
Output: "import { jsandy } from \"@jsandy/rpc\";\n..."
```

**Validation tools** return JSON-formatted issue arrays:

```
Input:  { code: "const x = procedure.query(...).input(z.string())" }
Output: [{ "severity": "error", "message": "...", "fix": "..." }]
```

**Lookup tools** return markdown-formatted documentation:

```
Input:  { name: "createClient" }
Output: "## createClient\n\n```typescript\nfunction createClient<T>(...)\n```\n..."
```

**Analysis tools** return structured markdown recommendations:

```
Input:  { code: "...", context: "user authentication" }
Output: "## Analysis\n\n### Issues Found\n- ...\n\n### Recommendations\n- ..."
```

### 11.2 Internal Package Interfaces

```go
// templates package
type ProcedureParams struct { ... }
type RouterParams struct { ... }
type MiddlewareParams struct { ... }
type ClientParams struct { ... }
type AdapterParams struct { ... }
type NextJSRouteParams struct { ... }

func RenderProcedure(p ProcedureParams) string
func RenderWSProcedure(p WSProcedureParams) string
func RenderRouter(p RouterParams) string
func RenderMiddleware(p MiddlewareParams) string
func RenderClient(p ClientParams) string
func RenderPubSubAdapter(p AdapterParams) string
func RenderNextJSRoute(p NextJSRouteParams) string
func RenderMergeRouters(p MergeRoutersParams) string
```

```go
// kb package
func Lookup(name string) (*Entry, string, bool)
func Search(query string, maxResults int) []SearchResult
func GetAPIDoc(name string) (string, bool)
func GetGuide(name string) (string, bool)
func GetPattern(name string) (string, bool)
func GetExports(entryPoint string) (string, bool)
```

```go
// validate package
type Issue struct {
    Severity string
    Message  string
    Line     int
    Fix      string
}

func CheckZodV4Compliance(code string) []Issue
func CheckProcedurePatterns(code string) []Issue
func CheckImports(code string) []Issue
func CheckRouterStructure(code string) []Issue
func CheckMiddlewarePattern(code string) []Issue
func CheckNextJSIntegration(code string, framework string) []Issue
```

---

## 12. Risk Mitigations (Resolved from Requirements)

### Binary Size (Highest Risk)

**Mitigation chain:**
1. Use `-ldflags="-s -w"` (strips ~1-2MB)
2. Avoid `text/template` (saves ~800KB)
3. Avoid `regexp/syntax` heavy usage (pre-compile all patterns)
4. Keep embedded docs in plain markdown (no JSON overhead)
5. If still > 10MB: Try `-trimpath` flag
6. If still > 10MB: Evaluate minimal `net/http`-free approach
7. If all else fails: TinyGo with custom `net/http` shim

**Measurement point:** First task in implementation is building a skeleton with mcp-go + syumai/workers to measure baseline WASM binary size.

### mcp-go WASM Compatibility

**Mitigation:**
- Only use `StreamableHTTPServer.ServeHTTP()` as an `http.Handler` (never call `.Start()`)
- Avoid any mcp-go features that use `net.Listen`, `os.Signal`, or filesystem
- If specific mcp-go internals fail in WASM: fork and patch the specific file
- The `server` package of mcp-go primarily uses `encoding/json`, `sync`, `context`, `net/http` types (all WASM-compatible)

### syumai/workers + mcp-go Integration

**Mitigation:**
- `syumai/workers.Serve(handler)` accepts `http.Handler`
- `mcp-go.StreamableHTTPServer` implements `http.Handler`
- The bridge: `JS Request → Go *http.Request → ServeHTTP() → Go response → JS Response`
- SSE streaming within POST responses: Needs testing. The syumai/workers bridge streams via `io.Pipe`, which should support chunked responses.
- **Fallback**: If streaming doesn't work through the bridge, configure mcp-go to disable streaming (`WithDisableStreaming(true)`) and use plain JSON responses only.

---

## 13. Spike: Pre-Implementation Validation

Before full implementation, build a minimal spike to validate:

```go
// spike/main.go - Minimal MCP server on Cloudflare Workers
package main

import (
    "net/http"

    "github.com/mark3labs/mcp-go/mcp"
    mcpserver "github.com/mark3labs/mcp-go/server"
    "github.com/syumai/workers"
)

func main() {
    s := mcpserver.NewMCPServer("spike", "0.1.0",
        mcpserver.WithToolCapabilities(true),
    )

    s.AddTool(
        mcp.NewTool("hello", mcp.WithDescription("Says hello")),
        func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
            return mcp.NewToolResultText("Hello from Go WASM MCP!"), nil
        },
    )

    handler := mcpserver.NewStreamableHTTPServer(s,
        mcpserver.WithEndpointPath("/mcp"),
        mcpserver.WithStateLess(true),
    )

    mux := http.NewServeMux()
    mux.Handle("/mcp", handler)
    workers.Serve(mux)
}
```

**Spike validates:**
1. Binary compiles to WASM (`GOOS=js GOARCH=wasm`)
2. Binary size is within limits
3. mcp-go runs correctly in WASM
4. MCP handshake works through syumai/workers bridge
5. Tool calls succeed end-to-end
6. Deploys to Cloudflare Workers

**Spike should be the first implementation task.**
