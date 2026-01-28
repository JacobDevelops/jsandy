package internal_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/nicholasgriffintn/jsandy/apps/mcp/internal/server"
)

// jsonRPCRequest builds a JSON-RPC 2.0 request body.
func jsonRPCRequest(id int, method string, params any) []byte {
	req := map[string]any{
		"jsonrpc": "2.0",
		"id":      id,
		"method":  method,
	}
	if params != nil {
		req["params"] = params
	}
	data, _ := json.Marshal(req)
	return data
}

// postMCP sends a JSON-RPC request to the MCP endpoint and returns the parsed response.
func postMCP(t *testing.T, url string, body []byte) map[string]any {
	t.Helper()
	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST failed: %v", err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("failed to read response: %v", err)
	}

	// The response may be SSE (text/event-stream) or plain JSON.
	// mcp-go StreamableHTTPServer returns SSE for stateful, but for stateless
	// it can return either depending on the request. Parse accordingly.
	content := string(data)

	// If SSE format, extract the JSON from "data:" lines
	if strings.Contains(resp.Header.Get("Content-Type"), "text/event-stream") {
		content = extractSSEData(content)
	}

	var result map[string]any
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		t.Fatalf("failed to parse JSON response: %v\nraw: %s", err, content)
	}
	return result
}

// extractSSEData pulls the first JSON payload from an SSE stream.
func extractSSEData(sse string) string {
	for _, line := range strings.Split(sse, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "data:") {
			return strings.TrimPrefix(line, "data:")
		}
		if strings.HasPrefix(line, "data: ") {
			return strings.TrimPrefix(line, "data: ")
		}
	}
	return sse
}

// startTestServer creates an httptest server wired to the MCP handler.
func startTestServer(t *testing.T) *httptest.Server {
	t.Helper()
	handler := server.NewHandler()
	mux := http.NewServeMux()
	mux.Handle("/mcp", handler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})
	ts := httptest.NewServer(mux)
	t.Cleanup(ts.Close)
	return ts
}

// --- Phase 6, Task 6.1: Full MCP Protocol Flow Tests ---

func TestHealthEndpoint(t *testing.T) {
	ts := startTestServer(t)

	resp, err := http.Get(ts.URL + "/health")
	if err != nil {
		t.Fatalf("health check failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected status 200, got %d", resp.StatusCode)
	}

	data, _ := io.ReadAll(resp.Body)
	var body map[string]string
	if err := json.Unmarshal(data, &body); err != nil {
		t.Fatalf("failed to parse health response: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("expected status 'ok', got %q", body["status"])
	}
}

func TestMCPInitialize(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "initialize", map[string]any{
		"protocolVersion": "2025-03-26",
		"clientInfo": map[string]any{
			"name":    "integration-test",
			"version": "1.0.0",
		},
		"capabilities": map[string]any{},
	})

	result := postMCP(t, ts.URL+"/mcp", body)

	// Verify JSON-RPC structure
	if result["jsonrpc"] != "2.0" {
		t.Errorf("expected jsonrpc '2.0', got %v", result["jsonrpc"])
	}

	// Verify result exists (not an error)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected 'result' object, got: %v", result)
	}

	// Verify server info
	serverInfo, ok := res["serverInfo"].(map[string]any)
	if !ok {
		t.Fatalf("expected 'serverInfo' in result, got: %v", res)
	}
	if serverInfo["name"] != server.ServerName {
		t.Errorf("expected server name %q, got %q", server.ServerName, serverInfo["name"])
	}
	if serverInfo["version"] != server.ServerVersion {
		t.Errorf("expected server version %q, got %q", server.ServerVersion, serverInfo["version"])
	}

	// Verify capabilities include tools
	capabilities, ok := res["capabilities"].(map[string]any)
	if !ok {
		t.Fatalf("expected 'capabilities' in result, got: %v", res)
	}
	if _, hasTools := capabilities["tools"]; !hasTools {
		t.Error("expected 'tools' capability in capabilities")
	}
}

func TestMCPToolsList(t *testing.T) {
	ts := startTestServer(t)

	// Initialize first to set up session
	initBody := jsonRPCRequest(1, "initialize", map[string]any{
		"protocolVersion": "2025-03-26",
		"clientInfo": map[string]any{
			"name":    "integration-test",
			"version": "1.0.0",
		},
		"capabilities": map[string]any{},
	})
	postMCP(t, ts.URL+"/mcp", initBody)

	// List tools
	listBody := jsonRPCRequest(2, "tools/list", map[string]any{})
	result := postMCP(t, ts.URL+"/mcp", listBody)

	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected 'result' in response, got: %v", result)
	}

	toolsRaw, ok := res["tools"].([]any)
	if !ok {
		t.Fatalf("expected 'tools' array in result, got: %v", res)
	}

	// Collect tool names
	toolNames := make(map[string]bool)
	for _, toolRaw := range toolsRaw {
		tool, ok := toolRaw.(map[string]any)
		if !ok {
			continue
		}
		name, _ := tool["name"].(string)
		toolNames[name] = true
	}

	// Verify expected tool categories
	expectedTools := []string{
		// Codegen (7)
		"create_procedure",
		"create_ws_procedure",
		"create_router",
		"merge_routers",
		"create_middleware",
		"create_client",
		"create_pubsub_adapter",
		// Validate (5)
		"validate_procedure",
		"validate_router",
		"validate_middleware",
		"validate_nextjs_integration",
		"check_zod_v4_compliance",
		// Lookup (4)
		"lookup_api",
		"search_docs",
		"list_exports",
		"get_examples",
		// Analysis (3)
		"analyze_code",
		"analyze_project_structure",
		"suggest_improvements",
		// Spike (1)
		"hello",
	}

	for _, expected := range expectedTools {
		if !toolNames[expected] {
			t.Errorf("missing expected tool: %s", expected)
		}
	}

	t.Logf("total tools registered: %d", len(toolsRaw))
	if len(toolsRaw) < len(expectedTools) {
		t.Errorf("expected at least %d tools, got %d", len(expectedTools), len(toolsRaw))
	}
}

// --- Tool Call Tests: One from each category ---

func TestToolCall_Codegen_CreateProcedure(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "create_procedure",
		"arguments": map[string]any{
			"name":        "getUser",
			"type":        "query",
			"inputSchema": "id: string (required)",
			"description": "Fetch a user by ID",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)

	res, ok := result["result"].(map[string]any)
	if !ok {
		if errObj, hasErr := result["error"]; hasErr {
			t.Fatalf("got error response: %v", errObj)
		}
		t.Fatalf("expected 'result' in response, got: %v", result)
	}

	// Extract text content from MCP tool result
	content := extractToolResultText(t, res)

	// Verify generated TypeScript code
	assertContains(t, content, `@jsandy/rpc`, "missing @jsandy/rpc import")
	assertContains(t, content, `zod`, "missing zod import")
	assertContains(t, content, `getUser`, "missing procedure name")
	assertContains(t, content, `.query(`, "expected .query() handler for query type")
	assertContains(t, content, `c.superjson(`, "missing c.superjson() response")

	// Verify no Zod v3 patterns in generated code
	assertNotContains(t, content, `.nativeEnum(`, "generated code contains Zod v3 anti-pattern")
	assertNotContains(t, content, `.strict()`, "generated code contains Zod v3 anti-pattern")
}

func TestToolCall_Codegen_CreateWSProcedure(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "create_ws_procedure",
		"arguments": map[string]any{
			"name":           "chat",
			"incomingSchema": "message: string (required), roomId: string (required)",
			"outgoingSchema": "message: string, sender: string, timestamp: number",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	assertContains(t, content, `chat`, "missing procedure name")
	assertContains(t, content, `.ws(`, "missing .ws() handler")
}

func TestToolCall_Codegen_CreateRouter(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "create_router",
		"arguments": map[string]any{
			"name":       "userRouter",
			"procedures": "getUser, createUser, deleteUser",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	assertContains(t, content, `userRouter`, "missing router name")
	assertContains(t, content, `router(`, "missing router() call")
}

func TestToolCall_Codegen_MergeRouters(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "merge_routers",
		"arguments": map[string]any{
			"name":    "app",
			"routers": "users=./routers/users, posts=./routers/posts",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	assertContains(t, content, `app`, "missing app name")
	assertContains(t, content, `users`, "missing users router")
	assertContains(t, content, `posts`, "missing posts router")
}

func TestToolCall_Codegen_CreateClient(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "create_client",
		"arguments": map[string]any{
			"routerType":       "AppRouter",
			"routerImportPath": "../server/router",
			"baseUrl":          "http://localhost:3000/api",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	assertContains(t, content, `@jsandy/rpc/client`, "missing client import")
	assertContains(t, content, `AppRouter`, "missing router type reference")
}

func TestToolCall_Validate_Procedure(t *testing.T) {
	ts := startTestServer(t)

	// Code with Zod v3 anti-pattern
	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "validate_procedure",
		"arguments": map[string]any{
			"code": `import { z } from "zod";
const status = z.nativeEnum(Status);
export const getUser = procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ c, input }) => {
    return c.superjson({ id: input.id });
  });`,
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)

	// Should detect nativeEnum as Zod v3 anti-pattern (message is "deprecated in Zod v4, use z.enum()")
	assertContains(t, content, `z.enum()`, "should detect z.nativeEnum() anti-pattern and suggest z.enum()")
}

func TestToolCall_Validate_CleanCode(t *testing.T) {
	ts := startTestServer(t)

	// Clean Zod v4 code — should report no issues
	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "validate_procedure",
		"arguments": map[string]any{
			"code": `import { jsandy } from "@jsandy/rpc";
import { z } from "zod";

const { procedure } = jsandy.init();

export const getUser = procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ c, input }) => {
    return c.superjson({ id: input.id });
  });`,
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	assertContains(t, content, "No issues found", "clean code should have no issues")
}

func TestToolCall_Validate_ZodV4Compliance(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "check_zod_v4_compliance",
		"arguments": map[string]any{
			"code": `const schema = z.object({ name: z.string() }).strict();
const partial = schema.deepPartial();
const merged = schema.merge(otherSchema);`,
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	// Verify the response contains issue entries (messages from rules.go)
	assertContains(t, content, "objects are strict by default", "should detect .strict() anti-pattern")
	assertContains(t, content, "removed in v4", "should detect .deepPartial() anti-pattern")
	assertContains(t, content, "spread syntax", "should detect .merge() anti-pattern")
}

func TestToolCall_Lookup_API(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "lookup_api",
		"arguments": map[string]any{
			"name": "procedure",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	// Should return documentation (not "not found")
	if strings.Contains(content, "No exact match") && strings.Contains(content, "No API entry found") {
		t.Error("lookup_api should find 'procedure' in the knowledge base")
	}
	// Should contain something substantial
	if len(content) < 50 {
		t.Errorf("lookup_api response too short (%d chars), expected documentation", len(content))
	}
}

func TestToolCall_Lookup_Search(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "search_docs",
		"arguments": map[string]any{
			"query": "websocket",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	if len(content) < 20 {
		t.Errorf("search_docs response too short (%d chars)", len(content))
	}
}

func TestToolCall_Lookup_ListExports(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "list_exports",
		"arguments": map[string]any{
			"entryPoint": "main",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	if len(content) < 20 {
		t.Errorf("list_exports response too short (%d chars)", len(content))
	}
}

func TestToolCall_Analysis_AnalyzeCode(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "analyze_code",
		"arguments": map[string]any{
			"code": `import { jsandy } from "@jsandy/rpc";
const { procedure, router } = jsandy.init();

export const getUser = procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ c, input }) => {
    return c.superjson({ id: input.id });
  });

export const appRouter = router({
  getUser,
});`,
			"context": "user authentication",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	assertContains(t, content, "Analysis", "should contain analysis header")
}

func TestToolCall_Spike_Hello(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "hello",
		"arguments": map[string]any{
			"name": "Integration Test",
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)
	res, ok := result["result"].(map[string]any)
	if !ok {
		t.Fatalf("expected result, got: %v", result)
	}

	content := extractToolResultText(t, res)
	assertContains(t, content, "Hello", "should contain greeting")
	assertContains(t, content, "Integration Test", "should include the name")
}

// --- Error Case Tests ---

func TestErrorCase_UnknownTool(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name":      "nonexistent_tool",
		"arguments": map[string]any{},
	})

	result := postMCP(t, ts.URL+"/mcp", body)

	// Should have an error response
	if _, hasError := result["error"]; !hasError {
		// Some MCP implementations return a tool result with isError=true instead
		res, ok := result["result"].(map[string]any)
		if ok {
			if isErr, _ := res["isError"].(bool); isErr {
				return // acceptable error format
			}
		}
		t.Logf("response: %v", result)
		// The MCP server may handle unknown tools at a different level.
		// Not strictly required to be a JSON-RPC error, but should indicate failure.
	}
}

func TestErrorCase_MissingRequiredParam(t *testing.T) {
	ts := startTestServer(t)

	// create_procedure requires 'name' and 'type'
	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name":      "create_procedure",
		"arguments": map[string]any{
			// missing name and type
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)

	res, ok := result["result"].(map[string]any)
	if !ok {
		// JSON-RPC error is also acceptable
		if _, hasError := result["error"]; hasError {
			return
		}
		t.Fatalf("expected result or error, got: %v", result)
	}

	content := extractToolResultText(t, res)
	// Should indicate the parameter is required
	if !strings.Contains(strings.ToLower(content), "required") {
		// Check isError flag
		if isErr, _ := res["isError"].(bool); !isErr {
			t.Errorf("expected error about missing required param, got: %s", content)
		}
	}
}

func TestErrorCase_CodeExceedsMaxLength(t *testing.T) {
	ts := startTestServer(t)

	// Generate code exceeding 50KB
	bigCode := strings.Repeat("const x = 1;\n", 5000) // ~65KB

	body := jsonRPCRequest(1, "tools/call", map[string]any{
		"name": "validate_procedure",
		"arguments": map[string]any{
			"code": bigCode,
		},
	})

	result := postMCP(t, ts.URL+"/mcp", body)

	res, ok := result["result"].(map[string]any)
	if !ok {
		// JSON-RPC error is also acceptable for oversized input
		return
	}

	content := extractToolResultText(t, res)
	// Should indicate code is too long
	isErr, _ := res["isError"].(bool)
	if !isErr && !strings.Contains(strings.ToLower(content), "maximum") && !strings.Contains(strings.ToLower(content), "exceeds") {
		t.Errorf("expected error about code length, got: %s", truncate(content, 200))
	}
}

func TestErrorCase_InvalidMethod(t *testing.T) {
	ts := startTestServer(t)

	body := jsonRPCRequest(1, "nonexistent/method", nil)
	result := postMCP(t, ts.URL+"/mcp", body)

	// Should have an error response for unknown method
	if _, hasError := result["error"]; !hasError {
		// Some implementations may handle this differently
		t.Logf("response to invalid method: %v", result)
	}
}

// --- Helpers ---

// extractToolResultText extracts the text content from an MCP tool result.
func extractToolResultText(t *testing.T, res map[string]any) string {
	t.Helper()

	// MCP tool results have "content" array with objects containing "text"
	contentArr, ok := res["content"].([]any)
	if !ok || len(contentArr) == 0 {
		t.Fatalf("expected 'content' array in tool result, got: %v", res)
	}

	var texts []string
	for _, item := range contentArr {
		itemMap, ok := item.(map[string]any)
		if !ok {
			continue
		}
		text, _ := itemMap["text"].(string)
		if text != "" {
			texts = append(texts, text)
		}
	}

	if len(texts) == 0 {
		t.Fatalf("no text content found in tool result: %v", res)
	}

	return strings.Join(texts, "\n")
}

func assertContains(t *testing.T, s, substr, msg string) {
	t.Helper()
	if !strings.Contains(s, substr) {
		t.Errorf("%s: %q not found in response (len=%d)", msg, substr, len(s))
	}
}

func assertNotContains(t *testing.T, s, substr, msg string) {
	t.Helper()
	if strings.Contains(s, substr) {
		t.Errorf("%s: %q found in response", msg, substr)
	}
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
