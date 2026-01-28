package templates

import (
	"fmt"
	"strings"
)

// ProcedureParams defines parameters for generating a query or mutation procedure.
type ProcedureParams struct {
	Name         string // camelCase procedure name
	Type         string // "query" or "mutation"
	InputSchema  string // human-readable field descriptions
	OutputSchema string // human-readable field descriptions
	Middleware   string // comma-separated middleware names
	Description  string // OpenAPI description
}

// RenderProcedure generates a typed @jsandy/rpc procedure definition.
func RenderProcedure(p ProcedureParams) string {
	var b strings.Builder

	// Imports
	b.WriteString("import { jsandy } from \"@jsandy/rpc\";\n")
	b.WriteString("import { z } from \"zod\";\n\n")

	// Init
	b.WriteString("const { procedure } = jsandy.init();\n\n")

	// Input schema
	if p.InputSchema != "" {
		fmt.Fprintf(&b, "const %sInput = z.object({\n", p.Name)
		writeZodFields(&b, p.InputSchema)
		b.WriteString("});\n\n")
	}

	// Output schema
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
			if mw != "" {
				fmt.Fprintf(&b, "\t.use(%s)\n", mw)
			}
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

// WSProcedureParams defines parameters for generating a WebSocket procedure.
type WSProcedureParams struct {
	Name           string // camelCase procedure name
	IncomingSchema string // human-readable incoming event fields
	OutgoingSchema string // human-readable outgoing event fields
	Middleware     string // comma-separated middleware names
	Description    string // OpenAPI description
}

// RenderWSProcedure generates a typed @jsandy/rpc WebSocket procedure definition.
func RenderWSProcedure(p WSProcedureParams) string {
	var b strings.Builder

	// Imports
	b.WriteString("import { jsandy } from \"@jsandy/rpc\";\n")
	b.WriteString("import { z } from \"zod\";\n\n")

	// Init
	b.WriteString("const { procedure } = jsandy.init();\n\n")

	// Incoming schema
	if p.IncomingSchema != "" {
		fmt.Fprintf(&b, "const %sIncoming = z.object({\n", p.Name)
		writeZodFields(&b, p.IncomingSchema)
		b.WriteString("});\n\n")
	}

	// Outgoing schema
	if p.OutgoingSchema != "" {
		fmt.Fprintf(&b, "const %sOutgoing = z.object({\n", p.Name)
		writeZodFields(&b, p.OutgoingSchema)
		b.WriteString("});\n\n")
	}

	// Procedure definition
	fmt.Fprintf(&b, "export const %s = procedure\n", p.Name)

	// Middleware
	if p.Middleware != "" {
		for _, mw := range strings.Split(p.Middleware, ",") {
			mw = strings.TrimSpace(mw)
			if mw != "" {
				fmt.Fprintf(&b, "\t.use(%s)\n", mw)
			}
		}
	}

	// Incoming/outgoing schemas
	if p.IncomingSchema != "" {
		fmt.Fprintf(&b, "\t.incoming(%sIncoming)\n", p.Name)
	}
	if p.OutgoingSchema != "" {
		fmt.Fprintf(&b, "\t.outgoing(%sOutgoing)\n", p.Name)
	}

	// Description
	if p.Description != "" {
		fmt.Fprintf(&b, "\t.describe({ description: %q })\n", p.Description)
	}

	// WS handler
	b.WriteString("\t.ws(({ io, c, ctx }) => ({\n")
	b.WriteString("\t\tonMessage(event, data) {\n")
	b.WriteString("\t\t\t// TODO: Handle incoming message\n")
	b.WriteString("\t\t\t// io.emit(\"eventName\", { /* data */ });\n")
	b.WriteString("\t\t},\n")
	b.WriteString("\t\tonOpen() {\n")
	b.WriteString("\t\t\t// TODO: Handle connection open\n")
	b.WriteString("\t\t},\n")
	b.WriteString("\t\tonClose() {\n")
	b.WriteString("\t\t\t// TODO: Handle connection close\n")
	b.WriteString("\t\t},\n")
	b.WriteString("\t}));\n")

	return b.String()
}
