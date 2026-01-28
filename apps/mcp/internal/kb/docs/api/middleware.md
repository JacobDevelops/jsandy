# middleware

Create reusable middleware that accumulates context for downstream procedures.

## Creating Middleware

```typescript
import { jsandy } from "@jsandy/rpc";

const { middleware } = jsandy.init();

export const authMiddleware = middleware(async ({ c, ctx, next }) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = await verifyToken(token);

  return next({
    user,
    role: user.role,
  });
});
```

## Key Rules

1. **Must call `next()`**: Every middleware must call and return `next()` to continue the chain
2. **Must return `next()`**: The return value of `next()` must be returned (not just called)
3. **Context accumulation**: Pass an object to `next({...})` to add to the context

## Handler Parameters

| Parameter | Description |
|-----------|-------------|
| `c` | Hono context (request, headers, etc.) |
| `ctx` | Context accumulated from upstream middleware |
| `next` | Function to call the next middleware/handler |

## Chaining Middleware

```typescript
const protectedProcedure = procedure
  .use(authMiddleware)     // adds ctx.user
  .use(loggingMiddleware)  // adds ctx.requestId
  .query(async ({ ctx }) => {
    // ctx.user and ctx.requestId available
  });
```

## Common Patterns

### Error Handling Middleware

```typescript
const errorMiddleware = middleware(async ({ c, ctx, next }) => {
  try {
    return next();
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
});
```

### Timing Middleware

```typescript
const timingMiddleware = middleware(async ({ c, ctx, next }) => {
  const start = Date.now();
  const result = next();
  console.log(`Request took ${Date.now() - start}ms`);
  return result;
});
```
