package templates

import (
	"fmt"
	"strings"
)

// NextJSRouteParams defines parameters for generating a Next.js route handler.
type NextJSRouteParams struct {
	RouterImportPath     string // import path for the app router
	UseMiddleware        bool   // whether to use custom middleware
	MiddlewareImportPath string // import path for middleware (if UseMiddleware)
}

// RenderNextJSRoute generates a Next.js App Router route handler.
func RenderNextJSRoute(p NextJSRouteParams) string {
	var b strings.Builder

	// Imports
	b.WriteString("import { Hono } from \"hono\";\n")
	b.WriteString("import { jsandy } from \"@jsandy/rpc\";\n")
	fmt.Fprintf(&b, "import { appRouter } from \"%s\";\n", p.RouterImportPath)
	if p.UseMiddleware && p.MiddlewareImportPath != "" {
		fmt.Fprintf(&b, "import { authMiddleware } from \"%s\";\n", p.MiddlewareImportPath)
	}
	b.WriteString("\n")

	// Init
	b.WriteString("const { defaults } = jsandy.init();\n\n")

	// Hono app
	b.WriteString("const app = new Hono().basePath(\"/api\");\n\n")

	// CORS and error handling
	b.WriteString("app.use(defaults.cors);\n")
	b.WriteString("app.onError(defaults.errorHandler);\n\n")

	// Mount router
	b.WriteString("// Mount the router\n")
	b.WriteString("app.route(\"/\", appRouter);\n\n")

	// Exports
	b.WriteString("// Next.js App Router exports\n")
	b.WriteString("// Place this file at: app/api/[...path]/route.ts\n")
	b.WriteString("export const GET = app.fetch;\n")
	b.WriteString("export const POST = app.fetch;\n")
	b.WriteString("export const OPTIONS = app.fetch;\n")

	return b.String()
}
