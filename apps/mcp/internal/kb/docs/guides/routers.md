# Router Patterns

Routers group related procedures and define the API surface of your application.

## Creating a Router

```typescript
import { Hono } from "hono";
import { jsandy, mergeRouters } from "@jsandy/rpc";
import { getUser, listUsers, createUser, updateUser, deleteUser } from "./procedures/users";

const { defaults } = jsandy.init();

const usersRouter = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);

mergeRouters(usersRouter, {
	getUser,
	listUsers,
	createUser,
	updateUser,
	deleteUser,
});

export { usersRouter };
export type UsersRouter = typeof usersRouter;
```

## Router Config

Configure router-level settings (e.g., PubSub adapter for WebSockets):

```typescript
import { Hono } from "hono";
import { jsandy, mergeRouters } from "@jsandy/rpc";
import { wsChat } from "./procedures/chat";
import { upstashAdapter } from "./adapters/upstash";

const { defaults } = jsandy.init();

const chatRouter = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);

mergeRouters(chatRouter, { wsChat }, { pubsub: upstashAdapter });

export { chatRouter };
export type ChatRouter = typeof chatRouter;
```

The third argument to `mergeRouters` is the router config object:
- `pubsub` — a PubSubAdapter for WebSocket room broadcasting

## Nested Routes

Compose routers by mounting sub-routers on a parent:

```typescript
import { Hono } from "hono";
import { jsandy } from "@jsandy/rpc";
import { usersRouter } from "./routers/users";
import { postsRouter } from "./routers/posts";
import { chatRouter } from "./routers/chat";

const { defaults } = jsandy.init();

const api = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);

api.route("/users", usersRouter);
api.route("/posts", postsRouter);
api.route("/chat", chatRouter);

export { api };
export type AppRouter = typeof api;
```

This creates routes like:
- `POST /users/getUser`
- `POST /users/createUser`
- `POST /posts/listPosts`
- `GET /chat/wsChat` (WebSocket upgrade)

## Dynamic Imports (Code Splitting)

For large applications, use dynamic imports:

```typescript
import { Hono } from "hono";
import { jsandy } from "@jsandy/rpc";

const { defaults } = jsandy.init();

const api = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);

api.route("/users", (await import("./routers/users")).usersRouter);
api.route("/posts", (await import("./routers/posts")).postsRouter);

export { api };
export type AppRouter = typeof api;
```

## Exporting Router Types

Always export the router type for client-side type safety:

```typescript
// server/router.ts
export { api };
export type AppRouter = typeof api;

// client.ts
import { createClient } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/router";

const client = createClient<AppRouter>({
	baseUrl: "http://localhost:3000/api",
});
```

## Error Handling

Use `defaults.errorHandler` or add custom error handling:

```typescript
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { jsandy } from "@jsandy/rpc";

const { defaults } = jsandy.init();

const api = new Hono()
	.onError((err, c) => {
		if (err instanceof HTTPException) {
			return c.superjson({ error: err.message, code: err.status }, err.status);
		}
		return c.superjson({ error: "Internal Server Error", code: 500 }, 500);
	});
```
