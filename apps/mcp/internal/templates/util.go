package templates

import (
	"fmt"
	"strings"
	"unicode"
)

// writeZodFields parses a human-readable field description and writes Zod v4 field definitions.
// Input format: "id: string (required), name: string, age: number"
func writeZodFields(b *strings.Builder, schema string) {
	fields := strings.Split(schema, ",")
	for _, field := range fields {
		field = strings.TrimSpace(field)
		if field == "" {
			continue
		}

		parts := strings.SplitN(field, ":", 2)
		if len(parts) != 2 {
			continue
		}

		name := strings.TrimSpace(parts[0])
		typeDesc := strings.TrimSpace(parts[1])

		// Check for (required) or (optional) annotations
		required := false
		if strings.Contains(typeDesc, "(required)") {
			required = true
			typeDesc = strings.TrimSpace(strings.Replace(typeDesc, "(required)", "", 1))
		}
		optional := false
		if strings.Contains(typeDesc, "(optional)") {
			optional = true
			typeDesc = strings.TrimSpace(strings.Replace(typeDesc, "(optional)", "", 1))
		}

		zodType := parseZodType(typeDesc)

		if optional || (!required && !optional) {
			// Default to optional unless explicitly required
			fmt.Fprintf(b, "\t%s: %s.optional(),\n", name, zodType)
		} else {
			fmt.Fprintf(b, "\t%s: %s,\n", name, zodType)
		}
	}
}

// parseZodType converts a human-readable type description to a Zod v4 type.
func parseZodType(typeDesc string) string {
	typeDesc = strings.ToLower(strings.TrimSpace(typeDesc))
	switch typeDesc {
	case "string", "str", "text":
		return "z.string()"
	case "number", "num", "int", "integer", "float":
		return "z.number()"
	case "boolean", "bool":
		return "z.boolean()"
	case "date":
		return "z.date()"
	case "any":
		return "z.any()"
	case "unknown":
		return "z.unknown()"
	case "void", "null":
		return "z.null()"
	case "undefined":
		return "z.undefined()"
	default:
		if strings.HasPrefix(typeDesc, "array") || strings.HasPrefix(typeDesc, "[]") {
			return "z.array(z.unknown())"
		}
		if strings.HasPrefix(typeDesc, "enum") {
			return "z.enum([])" // placeholder
		}
		return "z.string()" // default fallback
	}
}

// indent adds n tabs of indentation to a string.
func indent(s string, n int) string {
	prefix := strings.Repeat("\t", n)
	lines := strings.Split(s, "\n")
	for i, line := range lines {
		if line != "" {
			lines[i] = prefix + line
		}
	}
	return strings.Join(lines, "\n")
}

// camelToTitle converts a camelCase string to Title Case.
func camelToTitle(s string) string {
	if s == "" {
		return s
	}
	var result strings.Builder
	for i, r := range s {
		if i == 0 {
			result.WriteRune(unicode.ToUpper(r))
		} else if unicode.IsUpper(r) {
			result.WriteRune(' ')
			result.WriteRune(r)
		} else {
			result.WriteRune(r)
		}
	}
	return result.String()
}
