package templates

import (
	"fmt"
	"strings"
)

// MiddlewareParams defines parameters for generating middleware.
type MiddlewareParams struct {
	Name          string // middleware variable name
	ContextFields string // comma-separated "field:type" pairs for context accumulation
	Description   string // description comment
}

// RenderMiddleware generates a @jsandy/rpc middleware with context accumulation.
func RenderMiddleware(p MiddlewareParams) string {
	var b strings.Builder

	// Imports
	b.WriteString("import { jsandy } from \"@jsandy/rpc\";\n\n")

	// Init
	b.WriteString("const { middleware } = jsandy.init();\n\n")

	// Description comment
	if p.Description != "" {
		fmt.Fprintf(&b, "/** %s */\n", p.Description)
	}

	// Middleware definition
	fmt.Fprintf(&b, "export const %s = middleware(async ({ c, ctx, next }) => {\n", p.Name)

	// Parse context fields and generate body
	if p.ContextFields != "" {
		fields := strings.Split(p.ContextFields, ",")
		for _, field := range fields {
			field = strings.TrimSpace(field)
			parts := strings.SplitN(field, ":", 2)
			if len(parts) == 2 {
				name := strings.TrimSpace(parts[0])
				typ := strings.TrimSpace(parts[1])
				fmt.Fprintf(&b, "\t// TODO: Compute %s (%s)\n", name, typ)
				fmt.Fprintf(&b, "\tconst %s = undefined; // replace with actual value\n\n", name)
			}
		}

		// Build next() call with context
		b.WriteString("\treturn next({\n")
		for _, field := range fields {
			field = strings.TrimSpace(field)
			parts := strings.SplitN(field, ":", 2)
			if len(parts) >= 1 {
				name := strings.TrimSpace(parts[0])
				fmt.Fprintf(&b, "\t\t%s,\n", name)
			}
		}
		b.WriteString("\t});\n")
	} else {
		b.WriteString("\t// TODO: Implement middleware logic\n\n")
		b.WriteString("\treturn next();\n")
	}

	b.WriteString("});\n")

	return b.String()
}
