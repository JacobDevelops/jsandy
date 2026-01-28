package kb

import (
	"strings"
	"sync"
)

// Entry represents a searchable knowledge base entry.
type Entry struct {
	Name     string   // e.g. "createClient", "Procedure.input"
	Kind     string   // "function", "class", "type", "method", "guide", "pattern"
	Source   string   // file name within embed.FS (without .md)
	Section  string   // "api", "guides", "patterns", "exports"
	Keywords []string // lowercase search terms
	Summary  string   // one-line description
}

// SearchResult represents a search hit.
type SearchResult struct {
	Name    string `json:"name"`
	Kind    string `json:"kind"`
	Summary string `json:"summary"`
	Score   int    `json:"score"`
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

// getContent retrieves the document content for an entry.
func getContent(e Entry) (string, bool) {
	switch e.Section {
	case "api":
		return GetAPIDoc(e.Source)
	case "guides":
		return GetGuide(e.Source)
	case "patterns":
		return GetPattern(e.Source)
	case "exports":
		return GetExports(e.Source)
	}
	return "", false
}

// buildIndex creates the search index from embedded documents.
func buildIndex() []Entry {
	var idx []Entry

	// API reference entries
	idx = append(idx,
		Entry{
			Name:     "jsandy.init",
			Kind:     "function",
			Source:   "jsandy-init",
			Section:  "api",
			Keywords: []string{"init", "initialize", "setup", "jsandy", "procedure", "router", "middleware"},
			Summary:  "Initialize @jsandy/rpc and get procedure, router, middleware, mergeRouters, defaults",
		},
		Entry{
			Name:     "procedure",
			Kind:     "function",
			Source:   "procedure",
			Section:  "api",
			Keywords: []string{"procedure", "query", "mutation", "input", "output", "handler", "endpoint", "api"},
			Summary:  "Build typed API endpoints with input/output validation and handlers",
		},
		Entry{
			Name:     "router",
			Kind:     "function",
			Source:   "router",
			Section:  "api",
			Keywords: []string{"router", "routes", "group", "procedures", "namespace"},
			Summary:  "Group procedures into a named, typed router",
		},
		Entry{
			Name:     "middleware",
			Kind:     "function",
			Source:   "middleware",
			Section:  "api",
			Keywords: []string{"middleware", "context", "next", "auth", "logging", "chain"},
			Summary:  "Create reusable middleware with context accumulation via next()",
		},
		Entry{
			Name:     "mergeRouters",
			Kind:     "function",
			Source:   "merge-routers",
			Section:  "api",
			Keywords: []string{"merge", "routers", "hono", "app", "combine", "defaults"},
			Summary:  "Combine multiple routers into a single Hono application",
		},
		Entry{
			Name:     "createClient",
			Kind:     "function",
			Source:   "create-client",
			Section:  "api",
			Keywords: []string{"client", "create", "fetch", "rpc", "call", "type-safe", "browser"},
			Summary:  "Create a type-safe client for calling @jsandy/rpc procedures",
		},
		Entry{
			Name:     "c.superjson",
			Kind:     "method",
			Source:   "superjson",
			Section:  "api",
			Keywords: []string{"superjson", "response", "json", "serialize", "date", "bigint"},
			Summary:  "Return typed, serialized responses with Date/Map/Set support",
		},
		Entry{
			Name:     "defaults",
			Kind:     "type",
			Source:   "defaults",
			Section:  "api",
			Keywords: []string{"defaults", "cors", "error", "handler", "middleware"},
			Summary:  "Pre-configured CORS and error handler from jsandy.init()",
		},
		Entry{
			Name:     "dynamic",
			Kind:     "function",
			Source:   "dynamic",
			Section:  "api",
			Keywords: []string{"dynamic", "lazy", "import", "code-splitting", "bundle"},
			Summary:  "Lazy-load routers for code splitting in large applications",
		},
		Entry{
			Name:     "PubSubAdapter",
			Kind:     "type",
			Source:   "pubsub-adapter",
			Section:  "api",
			Keywords: []string{"pubsub", "adapter", "publish", "subscribe", "upstash", "cloudflare", "queue"},
			Summary:  "Interface for connecting pub/sub backends to routers",
		},
	)

	// Guide entries
	idx = append(idx,
		Entry{
			Name:     "Getting Started",
			Kind:     "guide",
			Source:   "create-app",
			Section:  "guides",
			Keywords: []string{"start", "setup", "install", "create", "app", "project", "init"},
			Summary:  "Set up a new @jsandy/rpc project from scratch",
		},
		Entry{
			Name:     "Building Procedures",
			Kind:     "guide",
			Source:   "procedures",
			Section:  "guides",
			Keywords: []string{"procedure", "query", "mutation", "input", "output", "handler"},
			Summary:  "Create typed query and mutation procedures",
		},
		Entry{
			Name:     "Creating Routers",
			Kind:     "guide",
			Source:   "routers",
			Section:  "guides",
			Keywords: []string{"router", "routes", "group", "nest", "organize"},
			Summary:  "Organize procedures into routers and nested routers",
		},
		Entry{
			Name:     "Writing Middleware",
			Kind:     "guide",
			Source:   "middleware",
			Section:  "guides",
			Keywords: []string{"middleware", "context", "auth", "next", "chain", "accumulate"},
			Summary:  "Create middleware with context accumulation",
		},
		Entry{
			Name:     "Client Setup",
			Kind:     "guide",
			Source:   "client",
			Section:  "guides",
			Keywords: []string{"client", "setup", "browser", "fetch", "type-safe"},
			Summary:  "Set up a type-safe client to call your API",
		},
		Entry{
			Name:     "Next.js Integration",
			Kind:     "guide",
			Source:   "nextjs",
			Section:  "guides",
			Keywords: []string{"nextjs", "next", "app-router", "route-handler", "pages"},
			Summary:  "Integrate @jsandy/rpc with Next.js App Router",
		},
		Entry{
			Name:     "WebSocket Procedures",
			Kind:     "guide",
			Source:   "websocket",
			Section:  "guides",
			Keywords: []string{"websocket", "ws", "realtime", "incoming", "outgoing", "io"},
			Summary:  "Build real-time WebSocket procedures",
		},
		Entry{
			Name:     "PubSub Adapters",
			Kind:     "guide",
			Source:   "pubsub-adapter",
			Section:  "guides",
			Keywords: []string{"pubsub", "adapter", "upstash", "cloudflare", "queue", "redis"},
			Summary:  "Connect pub/sub backends like Upstash or Cloudflare Queues",
		},
		Entry{
			Name:     "Zod v4 Migration",
			Kind:     "guide",
			Source:   "zod-v4",
			Section:  "guides",
			Keywords: []string{"zod", "v4", "migration", "schema", "validation", "upgrade"},
			Summary:  "Migrate from Zod v3 to Zod v4 for @jsandy/rpc",
		},
	)

	// Pattern entries
	idx = append(idx,
		Entry{
			Name:     "Authentication Pattern",
			Kind:     "pattern",
			Source:   "auth",
			Section:  "patterns",
			Keywords: []string{"auth", "authentication", "jwt", "token", "login", "session"},
			Summary:  "Implement authentication with middleware and protected procedures",
		},
		Entry{
			Name:     "CRUD Pattern",
			Kind:     "pattern",
			Source:   "crud",
			Section:  "patterns",
			Keywords: []string{"crud", "create", "read", "update", "delete", "database"},
			Summary:  "Build CRUD operations with typed procedures",
		},
		Entry{
			Name:     "Error Handling Pattern",
			Kind:     "pattern",
			Source:   "error-handling",
			Section:  "patterns",
			Keywords: []string{"error", "handling", "catch", "throw", "status", "code"},
			Summary:  "Handle errors consistently across procedures",
		},
		Entry{
			Name:     "Pagination Pattern",
			Kind:     "pattern",
			Source:   "pagination",
			Section:  "patterns",
			Keywords: []string{"pagination", "cursor", "offset", "limit", "page"},
			Summary:  "Implement cursor-based and offset pagination",
		},
		Entry{
			Name:     "File Upload Pattern",
			Kind:     "pattern",
			Source:   "file-upload",
			Section:  "patterns",
			Keywords: []string{"file", "upload", "multipart", "form", "binary"},
			Summary:  "Handle file uploads with procedures",
		},
		Entry{
			Name:     "Real-time Chat Pattern",
			Kind:     "pattern",
			Source:   "realtime-chat",
			Section:  "patterns",
			Keywords: []string{"chat", "realtime", "websocket", "message", "room"},
			Summary:  "Build a real-time chat system with WebSocket procedures",
		},
		Entry{
			Name:     "Notifications Pattern",
			Kind:     "pattern",
			Source:   "notifications",
			Section:  "patterns",
			Keywords: []string{"notification", "push", "pubsub", "event", "broadcast"},
			Summary:  "Implement push notifications with pub/sub adapters",
		},
	)

	// Export entries
	idx = append(idx,
		Entry{
			Name:     "@jsandy/rpc exports",
			Kind:     "type",
			Source:   "main",
			Section:  "exports",
			Keywords: []string{"exports", "import", "jsandy", "rpc", "main", "entry"},
			Summary:  "Main entry point exports: jsandy, dynamic",
		},
		Entry{
			Name:     "@jsandy/rpc/client exports",
			Kind:     "type",
			Source:   "client",
			Section:  "exports",
			Keywords: []string{"exports", "import", "client", "createclient"},
			Summary:  "Client entry point exports: createClient",
		},
		Entry{
			Name:     "@jsandy/rpc/adapters exports",
			Kind:     "type",
			Source:   "adapters",
			Section:  "exports",
			Keywords: []string{"exports", "import", "adapters", "pubsub", "upstash", "cloudflare"},
			Summary:  "Adapters entry point exports: UpstashRestPubSub, CloudflareQueuePubSub",
		},
	)

	return idx
}
