package validate

import (
	"regexp"
	"strings"
)

const (
	MaxCodeLength     = 50 * 1024
	MaxQueryLength    = 500
	MaxStructureDepth = 10
)

type Issue struct {
	Severity string `json:"severity"`
	Message  string `json:"message"`
	Line     int    `json:"line,omitempty"`
	Fix      string `json:"fix,omitempty"`
}

type antiPattern struct {
	re  *regexp.Regexp
	msg string
	fix string
}

var zodV3Patterns = []antiPattern{
	{regexp.MustCompile(`\.nativeEnum\(`), "deprecated in Zod v4, use z.enum()", "use z.enum()"},
	{regexp.MustCompile(`\.strict\(\)`), "deprecated, objects are strict by default", "remove .strict()"},
	{regexp.MustCompile(`\.passthrough\(\)`), "deprecated, use z.looseObject()", "use z.looseObject()"},
	{regexp.MustCompile(`\.strip\(\)`), "deprecated, strips by default", "remove .strip()"},
	{regexp.MustCompile(`\.deepPartial\(\)`), "removed in v4", "flatten partial structures"},
	{regexp.MustCompile(`\.merge\(`), "deprecated, use spread syntax", "use spread syntax"},
	{regexp.MustCompile(`z\.promise\(`), "deprecated", "handle promises outside schema"},
	{regexp.MustCompile(`z\.\w+\.create\(`), "static .create() removed", "call method directly"},
	{regexp.MustCompile(`z\.ostring\(`), "removed, use z.string().optional()", "use z.string().optional()"},
	{regexp.MustCompile(`z\.onumber\(`), "removed, use z.number().optional()", "use z.number().optional()"},
	{regexp.MustCompile(`z\.oboolean\(`), "removed, use z.boolean().optional()", "use z.boolean().optional()"},
}

var procedurePatterns = []antiPattern{
	{regexp.MustCompile(`\.(query|mutation)\([^)]*\)\s*\.\s*input\(`), ".input() after .query()/.mutation()", "move .input() before handler"},
	{regexp.MustCompile(`\.(query|mutation)\([^)]*\)\s*\.\s*output\(`), ".output() after .query()/.mutation()", "move .output() before handler"},
	{regexp.MustCompile(`\.(query|mutation)\([^)]*\)\s*\.\s*use\(`), ".use() after .query()/.mutation()", "move .use() before handler"},
}

var importPatterns = []antiPattern{
	{regexp.MustCompile(`from\s+.@jsandy/rpc/src/`), "internal paths not allowed", "import from @jsandy/rpc"},
	{regexp.MustCompile(`from\s+.@jsandy/rpc/dist/`), "dist paths not allowed", "import from @jsandy/rpc"},
	{regexp.MustCompile(`from\s+.zod/v3`), "v3 not supported", "import from zod"},
}

var (
	reProcedureDef = regexp.MustCompile(`\.(query|mutation|subscription)\(`)
	reRouterCall   = regexp.MustCompile(`router\(`)
	reEmptyRouter  = regexp.MustCompile(`router\(\s*\{\s*\}\s*\)`)
)

var (
	reNextCall   = regexp.MustCompile(`next\(\)`)
	reReturnNext = regexp.MustCompile(`return\s+(?:await\s+)?next\(\)`)
)

var (
	reNextRouteExport = regexp.MustCompile(`export\s+(?:const|function|async\s+function)\s+(?:GET|POST|PUT|DELETE|PATCH)`)
	reAppFetch        = regexp.MustCompile(`app\.fetch\(`)
)

func checkPatterns(code string, patterns []antiPattern, severity string) []Issue {
	var issues []Issue
	lines := strings.Split(code, "\n")
	for i, line := range lines {
		for _, p := range patterns {
			if p.re.MatchString(line) {
				issues = append(issues, Issue{
					Severity: severity,
					Message:  p.msg,
					Line:     i + 1,
					Fix:      p.fix,
				})
			}
		}
	}
	return issues
}

func CheckZodV4Compliance(code string) []Issue {
	return checkPatterns(code, zodV3Patterns, "error")
}

func CheckProcedurePatterns(code string) []Issue {
	return checkPatterns(code, procedurePatterns, "error")
}

func CheckImports(code string) []Issue {
	return checkPatterns(code, importPatterns, "error")
}

func CheckRouterStructure(code string) []Issue {
	var issues []Issue
	hasProcedures := reProcedureDef.MatchString(code)
	hasRouter := reRouterCall.MatchString(code)
	if hasProcedures && !hasRouter {
		issues = append(issues, Issue{
			Severity: "error",
			Message:  "procedures defined but router() is never called",
			Fix:      "wrap procedures in a router() call",
		})
	}
	if reEmptyRouter.MatchString(code) {
		issues = append(issues, Issue{
			Severity: "warning",
			Message:  "router has no procedures registered",
			Fix:      "add procedures to the router",
		})
	}
	return issues
}

func CheckMiddlewarePattern(code string) []Issue {
	var issues []Issue
	segments := strings.Split(code, ".use(")
	for idx := 1; idx < len(segments); idx++ {
		body := segments[idx]
		bodyLines := strings.Split(body, "\n")
		window := 20
		if len(bodyLines) < window {
			window = len(bodyLines)
		}
		chunk := strings.Join(bodyLines[:window], "\n")
		prefix := strings.Join(segments[:idx], ".use(")
		lineNum := strings.Count(prefix, "\n") + 1
		if !reNextCall.MatchString(chunk) {
			issues = append(issues, Issue{
				Severity: "error",
				Message:  "middleware does not call next()",
				Line:     lineNum,
				Fix:      "call next() inside the middleware",
			})
		} else if !reReturnNext.MatchString(chunk) {
			issues = append(issues, Issue{
				Severity: "warning",
				Message:  "middleware does not return next() result",
				Line:     lineNum,
				Fix:      "return the result of next()",
			})
		}
	}
	return issues
}

func CheckNextJSIntegration(code string) []Issue {
	var issues []Issue
	hasNextImports := strings.Contains(code, "NextRequest") || strings.Contains(code, "NextResponse")
	hasMethodExport := reNextRouteExport.MatchString(code)
	if hasNextImports && !hasMethodExport {
		issues = append(issues, Issue{
			Severity: "error",
			Message:  "missing GET/POST exports in route handler",
			Fix:      "export GET or POST function from the route handler",
		})
	}
	isRouteHandler := hasNextImports || hasMethodExport ||
		strings.Contains(code, "route.ts") ||
		strings.Contains(code, "route.js")
	if isRouteHandler && reAppFetch.MatchString(code) {
		lines := strings.Split(code, "\n")
		for i, line := range lines {
			if reAppFetch.MatchString(line) {
				issues = append(issues, Issue{
					Severity: "error",
					Message:  "using app.fetch instead of proper route handler pattern",
					Line:     i + 1,
					Fix:      "export named HTTP method handlers (GET, POST) instead",
				})
			}
		}
	}
	return issues
}
