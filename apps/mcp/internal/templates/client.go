package templates

import (
	"fmt"
	"strings"
)

// ClientParams defines parameters for generating a client setup.
type ClientParams struct {
	BaseURL          string // API base URL
	RouterTypeName   string // router type name to import
	RouterImportPath string // import path for router type
}

// RenderClient generates a createClient setup with typed usage.
func RenderClient(p ClientParams) string {
	var b strings.Builder

	// Imports
	b.WriteString("import { createClient } from \"@jsandy/rpc/client\";\n")
	fmt.Fprintf(&b, "import type { %s } from \"%s\";\n\n", p.RouterTypeName, p.RouterImportPath)

	// Client creation
	fmt.Fprintf(&b, "export const client = createClient<%s>({\n", p.RouterTypeName)
	fmt.Fprintf(&b, "\tbaseUrl: %q,\n", p.BaseURL)
	b.WriteString("});\n\n")

	// Usage examples as comments
	b.WriteString("// Usage examples:\n")
	b.WriteString("// const result = await client.routerName.procedureName({ input: \"value\" });\n")
	b.WriteString("// const url = client.routerName.procedureName.$url({ query: { id: \"123\" } });\n")
	b.WriteString("// const socket = client.routerName.wsProcedure.$ws();\n")

	return b.String()
}
