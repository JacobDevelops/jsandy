# jsandy.init()

Initialize the @jsandy/rpc framework. Returns all building blocks.

## Signature

```typescript
import { jsandy } from "@jsandy/rpc";

const { procedure, router, middleware, mergeRouters, defaults } = jsandy.init();
```

## Returns

| Property | Type | Description |
|----------|------|-------------|
| `procedure` | `ProcedureBuilder` | Creates typed query/mutation/ws procedures |
| `router` | `RouterFactory` | Groups procedures into a router |
| `middleware` | `MiddlewareFactory` | Creates middleware with context accumulation |
| `mergeRouters` | `MergeFunction` | Combines multiple routers into an app |
| `defaults` | `Defaults` | Pre-configured CORS and error handler |

## Usage

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";

const { procedure, router, middleware, defaults } = jsandy.init();

// Create a procedure
const getUser = procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ c, input }) => {
    return c.superjson({ id: input.id, name: "Alice" });
  });

// Group into router
const userRouter = router({ getUser });
```

## Important Notes

- Always destructure the result of `jsandy.init()` — do not call it multiple times
- All Zod schemas must use Zod v4 syntax
- Response data should use `c.superjson()` for proper serialization
