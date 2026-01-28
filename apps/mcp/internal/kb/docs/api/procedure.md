# procedure

Build typed API endpoints with input/output validation, middleware, and handlers.

## Builder Chain

The procedure builder uses a fluent API. Methods must be called in order:

```
procedure
  .use(middleware)      // optional, repeatable
  .input(zodSchema)     // optional
  .output(zodSchema)    // optional
  .describe({ ... })    // optional
  .query(handler)       // or .mutation(handler)
```

**Important**: `.input()`, `.output()`, and `.use()` must come BEFORE `.query()` or `.mutation()`.

## Query (Read Operations)

```typescript
const getUser = procedure
  .input(z.object({ id: z.string() }))
  .output(z.object({ id: z.string(), name: z.string() }))
  .query(async ({ c, ctx, input }) => {
    const user = await db.users.find(input.id);
    return c.superjson(user);
  });
```

## Mutation (Write Operations)

```typescript
const createUser = procedure
  .input(z.object({ name: z.string(), email: z.string().email() }))
  .mutation(async ({ c, ctx, input }) => {
    const user = await db.users.create(input);
    return c.superjson(user);
  });
```

## Handler Parameters

| Parameter | Description |
|-----------|-------------|
| `c` | Hono context — use `c.superjson()` for responses |
| `ctx` | Accumulated middleware context |
| `input` | Validated input (typed from `.input()` schema) |

## WebSocket Procedures

```typescript
const chat = procedure
  .incoming(z.object({ message: z.string() }))
  .outgoing(z.object({ reply: z.string(), timestamp: z.number() }))
  .ws(({ io, c, ctx }) => ({
    onMessage(event, data) {
      io.emit("reply", { reply: data.message, timestamp: Date.now() });
    },
    onOpen() { /* connection opened */ },
    onClose() { /* connection closed */ },
  }));
```

## With Middleware

```typescript
const protectedQuery = procedure
  .use(authMiddleware)
  .use(loggingMiddleware)
  .input(z.object({ id: z.string() }))
  .query(async ({ c, ctx, input }) => {
    // ctx.user available from authMiddleware
    return c.superjson({ data: "protected" });
  });
```

## With Description (OpenAPI)

```typescript
const getUser = procedure
  .input(z.object({ id: z.string() }))
  .describe({
    description: "Fetch a user by ID",
    tags: ["users"],
  })
  .query(async ({ c, input }) => {
    return c.superjson({ id: input.id });
  });
```
