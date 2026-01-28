# JSandy MCP Server - Requirements Specification

> Generated via `/sc:brainstorm` requirements discovery session.
> Next steps: `/sc:design` for architecture, `/sc:workflow` for implementation planning.

---

## 1. Project Overview

### Goal
Build a remote MCP (Model Context Protocol) server that enables AI agents to correctly and effectively use `@jsandy/rpc` in Next.js projects. The server provides code generation, validation, API lookup, and project analysis capabilities -- all without requiring users to run anything locally.

### Key Facts

| Property | Value |
|----------|-------|
| **Location** | `./apps/mcp` |
| **Language** | Go (compiled to WASM) |
| **Deployment** | Cloudflare Workers via `syumai/workers` |
| **URL** | `https://mcp.jsandy.com` |
| **Transport** | Streamable HTTP (MCP spec 2025-03-26+) |
| **MCP Library** | `mark3labs/mcp-go` |
| **Auth** | Public (no authentication) |
| **Compiler** | Standard Go (measure binary size; TinyGo fallback if >10MB) |
| **Docs Strategy** | Hand-written documentation embedded at build time |

### Scope
- **In scope**: `@jsandy/rpc` (routers, procedures, middleware, clients, WebSockets, adapters) and `create-jsandy-app` (project setup guidance)
- **Out of scope**: `@jsandy/builder` internals, general TypeScript/Next.js help unrelated to jsandy

---

## 2. Functional Requirements

### 2.1 MCP Tools

The server exposes tools only (no resources or prompts). Four categories:

#### 2.1.1 Code Generation Tools

Tools that produce ready-to-use TypeScript code following jsandy/rpc patterns. All generated code MUST use **Zod v4 syntax** (never v3).

| Tool | Description | Input Parameters |
|------|-------------|------------------|
| `create_procedure` | Generate a typed procedure definition (query or mutation) | `name`, `type` (query\|mutation), `inputSchema?` (description of fields), `outputSchema?`, `middleware?` (list of middleware names), `description?` |
| `create_ws_procedure` | Generate a WebSocket procedure with incoming/outgoing schemas | `name`, `incomingEvents` (map of event names to field descriptions), `outgoingEvents`, `roomBased?` (boolean) |
| `create_router` | Generate a router definition with procedure registrations | `name`, `procedures` (list of procedure names/types), `nested?` (nested route structure), `useDynamic?` (code-split with dynamic imports) |
| `create_middleware` | Generate typed middleware with context accumulation | `name`, `contextFields` (fields added to ctx), `logic` (description of what it does) |
| `create_client` | Generate createClient setup and typed client usage | `routerType` (name of router type to reference), `baseUrl`, `includeWebSocket?` |
| `create_pubsub_adapter` | Generate a custom PubSubAdapter implementation | `name`, `backingService` (description of the pub/sub backend, e.g. "AWS SNS", "Kafka", "Ably"), `methods` (publish/subscribe behavior description) |
| `setup_nextjs_route` | Generate Next.js App Router route handler for jsandy/rpc | `routePath` (e.g. "api/rpc/[...route]"), `routerImport` (router module path), `middleware?` (CORS, error handler) |
| `merge_routers` | Generate mergeRouters configuration with multiple sub-routers | `apiName`, `routers` (map of path prefix to router import) |

**Codegen constraints**:
- All Zod schemas use `zod` v4 API (e.g. `z.object()`, no `z.nativeEnum()`, no `.strict()`, no `.passthrough()`, no `.merge()` on objects)
- All imports use `@jsandy/rpc` or `@jsandy/rpc/client` package paths
- Generated code uses named exports and ES modules
- TypeScript with strict mode patterns

#### 2.1.2 Validation Tools

Tools that analyze code snippets and report issues.

| Tool | Description | Input Parameters |
|------|-------------|------------------|
| `validate_procedure` | Check a procedure definition for correctness | `code` (string: the procedure code) |
| `validate_router` | Check a router definition for structural issues | `code` (string: the router code) |
| `validate_middleware` | Check middleware for correct patterns | `code` (string: the middleware code) |
| `validate_nextjs_integration` | Check Next.js route handler integration | `code` (string: the route handler code), `framework` ("app-router" \| "pages-router") |
| `check_zod_v4_compliance` | Flag any Zod v3 syntax in code | `code` (string: code containing Zod usage) |

**Validation checks include**:
- Zod v3 anti-patterns (`.nativeEnum()`, `.strict()`, `.passthrough()`, `.strip()`, `.deepPartial()`, `.merge()`, `z.promise()`, `.create()` static methods, `z.ostring()`, etc.)
- Incorrect procedure builder chain (e.g. `.input()` after `.query()`)
- Missing required patterns (e.g. router without procedures, procedure without handler)
- Incorrect import paths
- Incorrect SuperJSON usage
- WebSocket procedure missing incoming/outgoing schemas
- Incorrect middleware context typing

#### 2.1.3 Lookup Tools

Tools for querying the jsandy/rpc API reference.

| Tool | Description | Input Parameters |
|------|-------------|------------------|
| `lookup_api` | Look up a specific API (function, class, type, method) | `name` (string: e.g. "createClient", "Procedure.input", "IO.to") |
| `search_docs` | Search documentation by topic or keyword | `query` (string: e.g. "websocket rooms", "error handling", "middleware context") |
| `list_exports` | List all exports from a specific entry point | `entryPoint` ("main" \| "client" \| "adapters") |
| `get_examples` | Get usage examples for a specific pattern | `pattern` (string: e.g. "auth middleware", "file upload procedure", "pub/sub with Upstash") |

#### 2.1.4 Project Analysis Tools

Tools that analyze user project code/structure and provide recommendations.

| Tool | Description | Input Parameters |
|------|-------------|------------------|
| `analyze_code` | Analyze a code snippet for jsandy/rpc best practices | `code` (string: the code to analyze), `context?` (string: description of what the code does) |
| `analyze_project_structure` | Analyze project structure for jsandy/rpc integration | `structure` (JSON: file tree, package.json contents, relevant route files), `framework` ("nextjs-app" \| "nextjs-pages" \| "standalone") |
| `suggest_improvements` | Given existing jsandy/rpc code, suggest improvements | `code` (string: current code), `goal?` (string: what the user wants to achieve) |

### 2.2 Embedded Documentation (Knowledge Base)

Hand-written documentation embedded at build time covering:

| Document | Contents |
|----------|----------|
| **API Reference** | All exports from `@jsandy/rpc`, `@jsandy/rpc/client`, `@jsandy/rpc/adapters` with signatures, parameters, return types, and brief descriptions |
| **Procedure Guide** | How to build procedures: queries, mutations, WebSocket handlers. Builder chain order. Input/output schemas. Middleware attachment. |
| **Router Guide** | Creating routers, nesting, merging, dynamic imports, error handlers, config |
| **Middleware Guide** | Writing middleware, context accumulation, fromHono adapter, built-in defaults (CORS, error handler) |
| **Client Guide** | createClient setup, typed usage, URL generation, WebSocket client ($ws), useWebSocket React hook |
| **WebSocket Guide** | ServerSocket, ClientSocket, IO broadcaster, rooms, pub/sub adapters, heartbeat config |
| **PubSubAdapter Guide** | PubSubAdapter interface, writing custom adapters, built-in adapters (Upstash, Cloudflare Queue, in-memory) |
| **Next.js Integration Guide** | App Router setup, route handlers, middleware, CORS, error handling, client-side usage |
| **create-jsandy-app Guide** | CLI usage, available templates, project structure after scaffolding |
| **Zod v4 Constraints** | Jsandy/rpc requires Zod v4. List of v3 patterns to avoid. Correct v4 equivalents. |
| **Common Patterns** | Auth middleware, file uploads, pagination, error responses, real-time chat, notifications |
| **Type Utilities** | InferRouterInputs, InferRouterOutputs, InferInput, InferOutput, Client<T>, ContextWithSuperJSON |

---

## 3. Non-Functional Requirements

### 3.1 Performance
- **Response time**: < 500ms for all tool calls (code generation, validation, lookup)
- **Cold start**: Acceptable within Cloudflare Workers WASM limits (typically 1-3s for Go WASM)
- **Binary size**: Must fit within Cloudflare Workers paid plan limit (10MB). Target < 8MB to leave headroom. If exceeded, fall back to TinyGo compiler.
- **CPU time**: Must stay within Workers CPU time limits per request (50ms on paid plan). Validation and codegen operations should be lightweight string processing.

### 3.2 Reliability
- **Availability**: Cloudflare Workers edge network (global, multi-region by default)
- **Stateless**: No server-side state between requests. Each tool call is independent.
- **Error handling**: Return proper MCP error responses (JSON-RPC error codes) for invalid inputs, unknown tools, and internal errors

### 3.3 Maintainability
- **Documentation updates**: Redeploy when `@jsandy/rpc` package is updated. Embedded docs change → new binary → new deploy.
- **CI/CD**: Build and deploy pipeline via GitHub Actions or similar. Build Go WASM binary, deploy via Wrangler.
- **Testing**: Unit tests for each tool handler. Integration tests for MCP protocol compliance.

### 3.4 Compatibility
- **MCP spec version**: 2025-03-26+ (Streamable HTTP transport)
- **MCP clients**: Claude Desktop, Claude Code, Cursor, Windsurf, VS Code Copilot, and any spec-compliant client
- **Go version**: 1.24+ (required by `syumai/workers`)
- **jsandy/rpc version**: 2.x (current: 2.2.0)

### 3.5 Security
- **Public access**: No authentication required
- **Origin validation**: Validate `Origin` header per MCP spec to prevent DNS rebinding
- **No code execution**: The server generates and validates code as strings. It never executes user-provided code.
- **Input sanitization**: All tool inputs validated and bounded (max code length, max structure depth)
- **Rate limiting**: Consider Cloudflare's built-in rate limiting for abuse prevention

---

## 4. User Stories / Acceptance Criteria

### US-1: Agent generates a new procedure
**As** an AI agent helping a developer build a Next.js app with jsandy/rpc,
**I want** to call `create_procedure` to generate a typed query procedure,
**So that** I can provide the developer with correct, copy-pasteable code.

**Acceptance Criteria**:
- Generated code compiles with TypeScript strict mode
- Uses Zod v4 syntax for all schemas
- Imports from `@jsandy/rpc` (not internal paths)
- Includes proper handler signature with `c`, `ctx`, `input` parameters
- Uses `c.superjson()` for response serialization

### US-2: Agent validates existing code
**As** an AI agent reviewing a developer's jsandy/rpc code,
**I want** to call `validate_procedure` with a code snippet,
**So that** I can identify and report any issues or anti-patterns.

**Acceptance Criteria**:
- Detects Zod v3 patterns and suggests v4 replacements
- Detects incorrect procedure builder chain order
- Detects missing required elements (handler, input schema when referenced)
- Returns structured list of issues with severity (error, warning, info)
- Provides fix suggestions for each issue

### US-3: Agent looks up API details
**As** an AI agent that needs to know the exact signature of `createClient`,
**I want** to call `lookup_api` with the function name,
**So that** I get the accurate type signature, parameters, and usage examples.

**Acceptance Criteria**:
- Returns complete type signature
- Includes parameter descriptions
- Includes at least one usage example
- Returns "not found" with suggestions for misspelled/unknown names

### US-4: Agent creates a custom PubSub adapter
**As** an AI agent helping a developer integrate jsandy/rpc WebSockets with a custom backend,
**I want** to call `create_pubsub_adapter` describing the backing service,
**So that** I can generate a correct PubSubAdapter implementation.

**Acceptance Criteria**:
- Generated adapter implements the `PubSubAdapter` interface
- Includes `publish` and `subscribe` methods with correct signatures
- Uses `SubscribeOptions` (signal, onOpen, onError) correctly
- Includes TODO comments for service-specific implementation details
- Includes TypeScript types for the adapter

### US-5: Agent analyzes project integration
**As** an AI agent helping integrate jsandy/rpc into an existing Next.js project,
**I want** to call `analyze_project_structure` with the project's file tree and config,
**So that** I know where to add route handlers, how to structure routers, and what setup is missing.

**Acceptance Criteria**:
- Identifies Next.js version and router type (app vs pages)
- Suggests correct file locations for jsandy/rpc route handlers
- Identifies missing dependencies (@jsandy/rpc, zod@4)
- Recommends project organization (routers dir, shared middleware, client setup)
- Detects existing conflicting patterns (e.g. tRPC, other RPC libs)

### US-6: Agent sets up WebSocket with rooms
**As** an AI agent building a real-time feature,
**I want** to call `create_ws_procedure` with room-based events,
**So that** I generate correct WebSocket procedure code with pub/sub and room support.

**Acceptance Criteria**:
- Generated procedure uses `.ws()` handler
- Includes incoming and outgoing Zod v4 schemas for all events
- Uses `io.to(room).emit()` pattern for room broadcasting
- Includes ServerSocket setup with adapter configuration
- Includes client-side `$ws()` and `useWebSocket` usage example

### US-7: Agent connects MCP server from Claude Code
**As** a developer using Claude Code,
**I want** to connect to `https://mcp.jsandy.com` as a remote MCP server,
**So that** Claude has jsandy/rpc expertise when helping me build my Next.js app.

**Acceptance Criteria**:
- MCP server responds to `initialize` handshake correctly
- Server advertises all tools in `tools/list` response
- Streamable HTTP transport works with Claude Code's MCP client
- Server endpoint is reachable at `https://mcp.jsandy.com/mcp`
- No authentication required to connect

---

## 5. Technical Constraints & Risks

### Constraints
1. **Go WASM binary size** (10MB limit): The combined size of Go runtime + `mark3labs/mcp-go` + embedded docs must stay under 10MB. If exceeded, options are: (a) switch to TinyGo, (b) reduce embedded docs, (c) switch to Cloudflare Containers.
2. **CPU time per request** (50ms paid plan): All tool handlers must complete within CPU time limits. String-based codegen and validation should be well within limits, but complex parsing could be problematic.
3. **No file system access**: WASM Workers cannot read the local file system. All analysis tools receive code/structure as string input parameters.
4. **Stateless**: No persistent state between requests. Each tool call is independent.
5. **Zod v4 only**: All generated code must use Zod v4 syntax. The knowledge base must include Zod v3→v4 migration awareness.

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Binary exceeds 10MB | Cannot deploy to Workers | Medium | Measure early. TinyGo fallback. Minimize dependencies. |
| CPU time exceeded | Requests fail/timeout | Low | Keep handlers simple (string templates, not AST parsing) |
| `mcp-go` doesn't work in WASM | Cannot use the library | Medium | Test early. May need to fork/patch or use a minimal custom impl. |
| `syumai/workers` incompatible with `mcp-go` HTTP handler | Cannot serve MCP protocol | Medium | Test early. May need adapter layer between Workers HTTP and mcp-go. |
| Streamable HTTP not supported by all MCP clients | Some clients can't connect | Low | Also support legacy SSE if `mcp-go` supports it (it does) |
| Docs become stale after rpc updates | Agents give wrong advice | Medium | Include version check in tool responses. CI pipeline to rebuild on release. |

---

## 6. Open Questions

1. **Binary size measurement**: Need a prototype build to determine if standard Go + `mcp-go` + embedded docs fits within 10MB WASM limit. This is the highest-risk technical question.

2. **`mcp-go` WASM compatibility**: Has `mcp-go` been tested in a WASM environment? It may use syscalls or features not available in `GOOS=js GOARCH=wasm`. Needs early validation.

3. **Streamable HTTP via syumai/workers**: The `syumai/workers` package bridges `http.Handler` to Workers. Need to verify that `mcp-go`'s Streamable HTTP handler works correctly through this bridge (especially SSE streaming within POST responses).

4. **Documentation versioning**: When `@jsandy/rpc` releases a new version, what's the update process? Manual doc update + redeploy? Or automated pipeline that regenerates docs from source?

5. **Rate limiting**: For a public server, should we implement rate limiting beyond Cloudflare's built-in protections? What limits are reasonable?

6. **Monitoring**: What observability should the MCP server have? Request logging, error tracking, usage analytics?

7. **Custom domain**: DNS configuration for `mcp.jsandy.com` → Cloudflare Workers. Is the domain already managed by Cloudflare?

---

## 7. Handoff Summary

### What to build
A Go MCP server compiled to WASM, deployed on Cloudflare Workers, exposing ~18 tools across 4 categories (codegen, validation, lookup, analysis) for helping AI agents use `@jsandy/rpc` in Next.js projects.

### Key technology decisions
- **Go + WASM** on Cloudflare Workers via `syumai/workers`
- **`mark3labs/mcp-go`** for MCP protocol implementation
- **Streamable HTTP** transport (with SSE fallback)
- **Hand-written embedded docs** updated at build time
- **Public access**, no auth
- **Tools only** (no MCP resources or prompts)
- **Zod v4 codegen** exclusively

### Recommended next steps
1. `/sc:design` - Design the system architecture (Go module structure, handler patterns, doc embedding, build pipeline)
2. `/sc:workflow` - Generate implementation workflow from this requirements spec
3. **Spike**: Build a minimal Go WASM Worker with `mcp-go` to validate binary size and WASM compatibility before full implementation
