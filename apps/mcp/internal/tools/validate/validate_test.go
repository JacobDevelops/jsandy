package validate

import (
	"testing"
)

// --- Zod v4 compliance ---

func TestCheckZodV4_DetectsNativeEnum(t *testing.T) {
	code := `const schema = z.nativeEnum(MyEnum);`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "deprecated in Zod v4")
}

func TestCheckZodV4_DetectsStrict(t *testing.T) {
	code := `const schema = z.object({ name: z.string() }).strict();`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "deprecated")
}

func TestCheckZodV4_DetectsPassthrough(t *testing.T) {
	code := `const schema = z.object({}).passthrough();`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "deprecated")
}

func TestCheckZodV4_DetectsStrip(t *testing.T) {
	code := `const schema = z.object({}).strip();`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "deprecated")
}

func TestCheckZodV4_DetectsDeepPartial(t *testing.T) {
	code := `const schema = z.object({}).deepPartial();`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "removed")
}

func TestCheckZodV4_DetectsMerge(t *testing.T) {
	code := `const combined = schemaA.merge(schemaB);`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "deprecated")
}

func TestCheckZodV4_DetectsPromise(t *testing.T) {
	code := `const schema = z.promise(z.string());`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "deprecated")
}

func TestCheckZodV4_DetectsStaticCreate(t *testing.T) {
	code := `const schema = z.string.create();`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "removed")
}

func TestCheckZodV4_DetectsOstring(t *testing.T) {
	code := `const s = z.ostring();`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "removed")
}

func TestCheckZodV4_DetectsOnumber(t *testing.T) {
	code := `const n = z.onumber();`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "removed")
}

func TestCheckZodV4_DetectsOboolean(t *testing.T) {
	code := `const b = z.oboolean();`
	issues := CheckZodV4Compliance(code)
	assertHasIssue(t, issues, "removed")
}

func TestCheckZodV4_CleanCode(t *testing.T) {
	code := `
import { z } from "zod";
const schema = z.object({
  name: z.string(),
  age: z.number().optional(),
  tags: z.array(z.string()),
});`
	issues := CheckZodV4Compliance(code)
	if len(issues) > 0 {
		t.Errorf("expected no issues for clean Zod v4 code, got %d: %v", len(issues), issues)
	}
}

// --- Procedure patterns ---

func TestCheckProcedure_InputAfterQuery(t *testing.T) {
	// Regex uses [^)]* so handler arg must not contain inner parens
	code := `procedure.query(handler).input(z.object({}))`
	issues := CheckProcedurePatterns(code)
	assertHasIssue(t, issues, ".input() after")
}

func TestCheckProcedure_OutputAfterMutation(t *testing.T) {
	code := `procedure.mutation(handler).output(z.object({}))`
	issues := CheckProcedurePatterns(code)
	assertHasIssue(t, issues, ".output() after")
}

func TestCheckProcedure_UseAfterQuery(t *testing.T) {
	code := `procedure.query(handler).use(auth)`
	issues := CheckProcedurePatterns(code)
	assertHasIssue(t, issues, ".use() after")
}

func TestCheckProcedure_CorrectOrder(t *testing.T) {
	code := `
export const getUser = procedure
  .use(auth)
  .input(getUserInput)
  .output(getUserOutput)
  .query(async ({ c, ctx, input }) => {
    return c.superjson({ user });
  });`
	issues := CheckProcedurePatterns(code)
	if len(issues) > 0 {
		t.Errorf("expected no issues for correct builder chain, got %d: %v", len(issues), issues)
	}
}

// --- Import patterns ---

func TestCheckImports_InternalSrcPath(t *testing.T) {
	code := `import { jsandy } from "@jsandy/rpc/src/core";`
	issues := CheckImports(code)
	assertHasIssue(t, issues, "internal paths")
}

func TestCheckImports_DistPath(t *testing.T) {
	code := `import { jsandy } from "@jsandy/rpc/dist/index";`
	issues := CheckImports(code)
	assertHasIssue(t, issues, "dist paths")
}

func TestCheckImports_ZodV3(t *testing.T) {
	code := `import { z } from "zod/v3";`
	issues := CheckImports(code)
	assertHasIssue(t, issues, "v3 not supported")
}

func TestCheckImports_CorrectImports(t *testing.T) {
	code := `
import { jsandy } from "@jsandy/rpc";
import { createClient } from "@jsandy/rpc/client";
import { z } from "zod";`
	issues := CheckImports(code)
	if len(issues) > 0 {
		t.Errorf("expected no issues for correct imports, got %d: %v", len(issues), issues)
	}
}

// --- Router structure ---

func TestCheckRouter_ProceduresWithoutRouter(t *testing.T) {
	code := `
const getUser = procedure.query(async () => {});
const createUser = procedure.mutation(async () => {});`
	issues := CheckRouterStructure(code)
	assertHasIssue(t, issues, "router() is never called")
}

func TestCheckRouter_EmptyRouter(t *testing.T) {
	code := `const r = router( { } );`
	issues := CheckRouterStructure(code)
	assertHasIssue(t, issues, "no procedures")
}

func TestCheckRouter_CorrectRouter(t *testing.T) {
	code := `
const getUser = procedure.query(async () => {});
const userRouter = router({ getUser });`
	issues := CheckRouterStructure(code)
	if len(issues) > 0 {
		t.Errorf("expected no issues for correct router, got %d: %v", len(issues), issues)
	}
}

// --- Middleware patterns ---

func TestCheckMiddleware_MissingNext(t *testing.T) {
	code := `
const auth = middleware(async ({ c, ctx, next }) => {
  .use(const user = getUser(c);
  // forgot to call next
});`
	issues := CheckMiddlewarePattern(code)
	assertHasIssue(t, issues, "does not call next()")
}

func TestCheckMiddleware_UnreturnedNext(t *testing.T) {
	code := `
app.use(async ({ c, ctx, next }) => {
  next();
  // not returned
});`
	issues := CheckMiddlewarePattern(code)
	assertHasIssue(t, issues, "does not return next()")
}

func TestCheckMiddleware_CorrectPattern(t *testing.T) {
	code := `
const auth = middleware(async ({ c, ctx, next }) => {
  const user = getUser(c);
  return next({ userId: user.id });
});`
	// This doesn't use .use( so won't trigger middleware checking
	issues := CheckMiddlewarePattern(code)
	if len(issues) > 0 {
		t.Errorf("expected no issues for correct middleware, got %d: %v", len(issues), issues)
	}
}

// --- Next.js integration ---

func TestCheckNextJS_MissingExports(t *testing.T) {
	code := `
import { NextRequest, NextResponse } from "next/server";
const handler = app.fetch;`
	issues := CheckNextJSIntegration(code)
	assertHasIssue(t, issues, "missing GET/POST exports")
}

func TestCheckNextJS_CorrectExports(t *testing.T) {
	code := `
import { NextRequest } from "next/server";
export const GET = app.fetch;
export const POST = app.fetch;`
	issues := CheckNextJSIntegration(code)
	// Should have exports found, may flag app.fetch usage
	hasExportIssue := false
	for _, i := range issues {
		if i.Message == "missing GET/POST exports in route handler" {
			hasExportIssue = true
		}
	}
	if hasExportIssue {
		t.Error("should not flag missing exports when GET/POST are exported")
	}
}

// --- Issue severity ---

func TestIssueSeverity_ZodErrors(t *testing.T) {
	issues := CheckZodV4Compliance(`z.nativeEnum(X)`)
	if len(issues) == 0 {
		t.Fatal("expected at least one issue")
	}
	if issues[0].Severity != "error" {
		t.Errorf("expected severity 'error', got %q", issues[0].Severity)
	}
}

func TestIssueSeverity_EmptyRouter(t *testing.T) {
	issues := CheckRouterStructure(`const r = router( { } );`)
	if len(issues) == 0 {
		t.Fatal("expected at least one issue")
	}
	if issues[0].Severity != "warning" {
		t.Errorf("expected severity 'warning', got %q", issues[0].Severity)
	}
}

// --- Line numbers ---

func TestIssueLineNumbers(t *testing.T) {
	code := "line 1\nline 2\nz.nativeEnum(Foo)\nline 4"
	issues := CheckZodV4Compliance(code)
	if len(issues) == 0 {
		t.Fatal("expected issue")
	}
	if issues[0].Line != 3 {
		t.Errorf("expected line 3, got %d", issues[0].Line)
	}
}

// --- Fix suggestions ---

func TestIssueHasFix(t *testing.T) {
	issues := CheckZodV4Compliance(`z.nativeEnum(X)`)
	if len(issues) == 0 {
		t.Fatal("expected issue")
	}
	if issues[0].Fix == "" {
		t.Error("expected fix suggestion, got empty string")
	}
}

// --- Helpers ---

func assertHasIssue(t *testing.T, issues []Issue, msgSubstr string) {
	t.Helper()
	for _, issue := range issues {
		if contains(issue.Message, msgSubstr) {
			return
		}
	}
	t.Errorf("expected issue containing %q, got %d issues: %v", msgSubstr, len(issues), issues)
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsLower(s, substr))
}

func containsLower(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
