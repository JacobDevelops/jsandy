package templates

import (
	"strings"
	"testing"
)

func TestRenderProcedure_Query(t *testing.T) {
	code := RenderProcedure(ProcedureParams{
		Name:        "getUser",
		Type:        "query",
		InputSchema: "id: string (required)",
	})

	assertContains(t, code, `from "@jsandy/rpc"`, "missing @jsandy/rpc import")
	assertContains(t, code, `from "zod"`, "missing zod import")
	assertContains(t, code, ".query(", "expected .query() handler")
	assertNotContains(t, code, ".mutation(", "should not contain .mutation()")
	assertContains(t, code, "c.superjson(", "missing c.superjson() response")
	assertContains(t, code, "export const getUser", "missing named export")
	assertContains(t, code, "getUserInput", "missing input schema variable")
	assertContains(t, code, "z.string()", "missing z.string() for id field")
}

func TestRenderProcedure_Mutation(t *testing.T) {
	code := RenderProcedure(ProcedureParams{
		Name:        "createPost",
		Type:        "mutation",
		InputSchema: "title: string (required), body: string (required)",
	})

	assertContains(t, code, ".mutation(", "expected .mutation() handler")
	assertNotContains(t, code, ".query(", "should not contain .query()")
	assertContains(t, code, "export const createPost", "missing named export")
}

func TestRenderProcedure_WithMiddleware(t *testing.T) {
	code := RenderProcedure(ProcedureParams{
		Name:       "deleteUser",
		Type:       "mutation",
		Middleware: "auth, rateLimit",
	})

	assertContains(t, code, ".use(auth)", "missing auth middleware")
	assertContains(t, code, ".use(rateLimit)", "missing rateLimit middleware")
}

func TestRenderProcedure_WithDescription(t *testing.T) {
	code := RenderProcedure(ProcedureParams{
		Name:        "getUser",
		Type:        "query",
		Description: "Fetch a user by ID",
	})

	assertContains(t, code, ".describe(", "missing .describe() call")
	assertContains(t, code, "Fetch a user by ID", "missing description text")
}

func TestRenderProcedure_WithOutputSchema(t *testing.T) {
	code := RenderProcedure(ProcedureParams{
		Name:         "getUser",
		Type:         "query",
		InputSchema:  "id: string (required)",
		OutputSchema: "name: string, email: string",
	})

	assertContains(t, code, "getUserInput", "missing input schema")
	assertContains(t, code, "getUserOutput", "missing output schema")
	assertContains(t, code, ".input(getUserInput)", "missing .input() reference")
	assertContains(t, code, ".output(getUserOutput)", "missing .output() reference")
}

func TestRenderProcedure_NoInput(t *testing.T) {
	code := RenderProcedure(ProcedureParams{
		Name: "listUsers",
		Type: "query",
	})

	assertNotContains(t, code, "listUsersInput", "should not have input schema when not provided")
	assertNotContains(t, code, ".input(", "should not have .input() when no input schema")
}

func TestRenderWSProcedure(t *testing.T) {
	code := RenderWSProcedure(WSProcedureParams{
		Name:           "chat",
		IncomingSchema: "message: string (required), roomId: string (required)",
		OutgoingSchema: "message: string, sender: string, timestamp: number",
	})

	assertContains(t, code, `from "@jsandy/rpc"`, "missing import")
	assertContains(t, code, "chatIncoming", "missing incoming schema")
	assertContains(t, code, "chatOutgoing", "missing outgoing schema")
	assertContains(t, code, ".ws(", "missing .ws() handler")
	assertContains(t, code, "onMessage", "missing onMessage handler")
	assertContains(t, code, "onOpen", "missing onOpen handler")
	assertContains(t, code, "onClose", "missing onClose handler")
	assertContains(t, code, "export const chat", "missing named export")
}

func TestRenderWSProcedure_WithMiddleware(t *testing.T) {
	code := RenderWSProcedure(WSProcedureParams{
		Name:       "liveUpdates",
		Middleware: "auth",
	})

	assertContains(t, code, ".use(auth)", "missing middleware")
	assertContains(t, code, ".ws(", "missing .ws() handler")
}

func TestRenderRouter(t *testing.T) {
	code := RenderRouter(RouterParams{
		Name:       "userRouter",
		Procedures: []string{"getUser", "createUser", "deleteUser"},
	})

	assertContains(t, code, `from "@jsandy/rpc"`, "missing import")
	assertContains(t, code, "router({", "missing router() call")
	assertContains(t, code, "getUser,", "missing getUser procedure")
	assertContains(t, code, "createUser,", "missing createUser procedure")
	assertContains(t, code, "deleteUser,", "missing deleteUser procedure")
	assertContains(t, code, "export const userRouter", "missing named export")
	assertContains(t, code, "export type", "missing type export")
}

func TestRenderMergeRouters(t *testing.T) {
	code := RenderMergeRouters(MergeRouterParams{
		Name: "app",
		Routers: map[string]string{
			"users": "./routers/users",
			"posts": "./routers/posts",
		},
	})

	assertContains(t, code, `from "hono"`, "missing hono import")
	assertContains(t, code, `from "@jsandy/rpc"`, "missing jsandy import")
	assertContains(t, code, "mergeRouters(", "missing mergeRouters call")
	assertContains(t, code, "defaults.cors", "missing CORS default")
	assertContains(t, code, "defaults.errorHandler", "missing error handler default")
	assertContains(t, code, "export type AppRouter", "missing type export")
}

func TestRenderMergeRouters_Dynamic(t *testing.T) {
	code := RenderMergeRouters(MergeRouterParams{
		Name: "app",
		Routers: map[string]string{
			"users": "./routers/users",
		},
		UseDynamic: true,
	})

	assertContains(t, code, "dynamic(", "missing dynamic() call")
	assertContains(t, code, "import(", "missing dynamic import")
}

func TestRenderMiddleware(t *testing.T) {
	code := RenderMiddleware(MiddlewareParams{
		Name:          "auth",
		ContextFields: "userId: string, role: string",
		Description:   "Authentication middleware",
	})

	assertContains(t, code, `from "@jsandy/rpc"`, "missing import")
	assertContains(t, code, "export const auth", "missing named export")
	assertContains(t, code, "middleware(", "missing middleware() call")
	assertContains(t, code, "next({", "missing next() with context")
	assertContains(t, code, "userId,", "missing userId in context")
	assertContains(t, code, "role,", "missing role in context")
	assertContains(t, code, "Authentication middleware", "missing description")
}

func TestRenderMiddleware_NoContext(t *testing.T) {
	code := RenderMiddleware(MiddlewareParams{
		Name: "logging",
	})

	assertContains(t, code, "return next()", "should call next() without context fields")
}

func TestRenderClient(t *testing.T) {
	code := RenderClient(ClientParams{
		RouterTypeName:   "AppRouter",
		RouterImportPath: "@/server/router",
		BaseURL:          "http://localhost:3000/api",
	})

	assertContains(t, code, `from "@jsandy/rpc/client"`, "missing client import")
	assertContains(t, code, "createClient<AppRouter>", "missing typed createClient")
	assertContains(t, code, `"@/server/router"`, "missing router import path")
	assertContains(t, code, "http://localhost:3000/api", "missing base URL")
	assertContains(t, code, "export const client", "missing named export")
}

func TestRenderPubSubAdapter_Custom(t *testing.T) {
	code := RenderPubSubAdapter(AdapterParams{
		Name:        "kafkaAdapter",
		Platform:    "custom",
		Description: "Kafka pub/sub adapter",
	})

	assertContains(t, code, "PubSubAdapter", "missing PubSubAdapter import")
	assertContains(t, code, "SubscribeOptions", "missing SubscribeOptions import")
	assertContains(t, code, "publish(", "missing publish method")
	assertContains(t, code, "subscribe(", "missing subscribe method")
	assertContains(t, code, "Kafka pub/sub adapter", "missing description")
}

func TestRenderPubSubAdapter_Upstash(t *testing.T) {
	code := RenderPubSubAdapter(AdapterParams{
		Name:     "pubsub",
		Platform: "upstash",
	})

	assertContains(t, code, "UpstashRestPubSub", "missing UpstashRestPubSub import")
	assertContains(t, code, `from "@jsandy/rpc/adapters"`, "missing adapters import")
	assertContains(t, code, "UPSTASH_REDIS_REST_URL", "missing env var reference")
}

func TestRenderPubSubAdapter_CloudflareQueue(t *testing.T) {
	code := RenderPubSubAdapter(AdapterParams{
		Name:     "queuePubSub",
		Platform: "cloudflare-queue",
	})

	assertContains(t, code, "CloudflareQueuePubSub", "missing CloudflareQueuePubSub")
	assertContains(t, code, `from "@jsandy/rpc/adapters"`, "missing adapters import")
}

// --- Zod v4 compliance checks across all templates ---

func TestAllTemplates_NoZodV3Patterns(t *testing.T) {
	v3Patterns := []string{".nativeEnum(", ".strict()", ".passthrough()", ".strip()", ".deepPartial()", ".merge(", "z.promise(", "z.ostring(", "z.onumber(", "z.oboolean("}

	codes := []string{
		RenderProcedure(ProcedureParams{Name: "test", Type: "query", InputSchema: "id: string"}),
		RenderWSProcedure(WSProcedureParams{Name: "test", IncomingSchema: "msg: string"}),
		RenderRouter(RouterParams{Name: "r", Procedures: []string{"p"}}),
		RenderMiddleware(MiddlewareParams{Name: "m", ContextFields: "userId: string"}),
		RenderClient(ClientParams{RouterTypeName: "T", RouterImportPath: "./r", BaseURL: "/api"}),
		RenderPubSubAdapter(AdapterParams{Name: "a", Platform: "custom"}),
	}

	for i, code := range codes {
		for _, pattern := range v3Patterns {
			if strings.Contains(code, pattern) {
				t.Errorf("template %d contains Zod v3 pattern %q", i, pattern)
			}
		}
	}
}

// --- Helpers ---

func assertContains(t *testing.T, s, substr, msg string) {
	t.Helper()
	if !strings.Contains(s, substr) {
		t.Errorf("%s: expected %q in output", msg, substr)
	}
}

func assertNotContains(t *testing.T, s, substr, msg string) {
	t.Helper()
	if strings.Contains(s, substr) {
		t.Errorf("%s: unexpected %q in output", msg, substr)
	}
}
