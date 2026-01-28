# dynamic()

Lazy-load routers for code splitting in large applications.

## Usage

```typescript
import { jsandy, dynamic } from "@jsandy/rpc";

const { mergeRouters } = jsandy.init();

const appRouter = mergeRouters(app, {
  users: dynamic(() => import("./routers/user")),
  posts: dynamic(() => import("./routers/post")),
});
```

## How It Works

- Routers wrapped in `dynamic()` are only imported when first accessed
- Reduces initial bundle size for applications with many routers
- The import is cached after first load

## When to Use

- Applications with 5+ routers
- When initial load time is critical
- Server-side route handlers where cold start matters

## Important Notes

- The dynamic import must return a module with a default export of the router
- Type inference works the same as static imports
- Import from `"@jsandy/rpc"` (not `"@jsandy/rpc/client"`)
