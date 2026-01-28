package templates

import (
	"fmt"
	"strings"
)

// RouterParams defines parameters for generating a router.
type RouterParams struct {
	Name       string   // router variable name
	Procedures []string // procedure names to include
}

// RenderRouter generates a @jsandy/rpc router definition.
func RenderRouter(p RouterParams) string {
	var b strings.Builder

	// Imports
	b.WriteString("import { jsandy } from \"@jsandy/rpc\";\n")
	b.WriteString("// Import your procedures:\n")
	for _, proc := range p.Procedures {
		fmt.Fprintf(&b, "// import { %s } from \"./%s\";\n", proc, proc)
	}
	b.WriteString("\n")

	// Init
	b.WriteString("const { router } = jsandy.init();\n\n")

	// Router definition
	fmt.Fprintf(&b, "export const %s = router({\n", p.Name)
	for _, proc := range p.Procedures {
		fmt.Fprintf(&b, "\t%s,\n", proc)
	}
	b.WriteString("});\n\n")

	// Type export
	fmt.Fprintf(&b, "export type %sType = typeof %s;\n", strings.Title(p.Name), p.Name)

	return b.String()
}

// MergeRouterParams defines parameters for generating a mergeRouters call.
type MergeRouterParams struct {
	Name       string            // app variable name
	Routers    map[string]string // router name -> import path
	UseDynamic bool              // use dynamic() for lazy loading
}

// RenderMergeRouters generates a mergeRouters configuration.
func RenderMergeRouters(p MergeRouterParams) string {
	var b strings.Builder

	// Imports
	b.WriteString("import { Hono } from \"hono\";\n")
	b.WriteString("import { jsandy } from \"@jsandy/rpc\";\n")
	if p.UseDynamic {
		b.WriteString("import { dynamic } from \"@jsandy/rpc\";\n")
	}
	b.WriteString("\n")

	// Static router imports
	if !p.UseDynamic {
		for name, path := range p.Routers {
			fmt.Fprintf(&b, "import { %sRouter } from \"%s\";\n", name, path)
		}
		b.WriteString("\n")
	}

	// Init
	b.WriteString("const { mergeRouters, defaults } = jsandy.init();\n\n")

	// Hono app
	fmt.Fprintf(&b, "const %s = new Hono()\n", p.Name)
	b.WriteString("\t.use(defaults.cors)\n")
	b.WriteString("\t.onError(defaults.errorHandler);\n\n")

	// Merge routers
	b.WriteString("export const appRouter = mergeRouters(")
	fmt.Fprintf(&b, "%s, {\n", p.Name)
	for name, path := range p.Routers {
		if p.UseDynamic {
			fmt.Fprintf(&b, "\t%s: dynamic(() => import(\"%s\")),\n", name, path)
		} else {
			fmt.Fprintf(&b, "\t%s: %sRouter,\n", name, name)
		}
	}
	b.WriteString("});\n\n")

	b.WriteString("export type AppRouter = typeof appRouter;\n")

	return b.String()
}
