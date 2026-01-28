# mergeRouters

Combine multiple routers into a single Hono application with defaults.

## Basic Usage

```typescript
import { Hono } from "hono";
import { jsandy } from "@jsandy/rpc";
import { userRouter } from "./routers/user";
import { postRouter } from "./routers/post";

const { mergeRouters, defaults } = jsandy.init();

const app = new Hono()
  .use(defaults.cors)
  .onError(defaults.errorHandler);

export const appRouter = mergeRouters(app, {
  users: userRouter,
  posts: postRouter,
});

export type AppRouter = typeof appRouter;
```

## With Dynamic Imports (Code Splitting)

```typescript
import { jsandy, dynamic } from "@jsandy/rpc";

const { mergeRouters, defaults } = jsandy.init();

const app = new Hono()
  .use(defaults.cors)
  .onError(defaults.errorHandler);

export const appRouter = mergeRouters(app, {
  users: dynamic(() => import("./routers/user")),
  posts: dynamic(() => import("./routers/post")),
});
```

## Defaults

The `defaults` object provides pre-configured middleware:

| Property | Description |
|----------|-------------|
| `defaults.cors` | CORS middleware with sensible defaults |
| `defaults.errorHandler` | Error handler that formats errors as JSON |

## Important Notes

- Always apply `defaults.cors` and `defaults.errorHandler` to the Hono app
- Export `AppRouter` type for client-side type inference
- Use `dynamic()` for lazy loading routers in large applications
- The merged router becomes the root of your API
