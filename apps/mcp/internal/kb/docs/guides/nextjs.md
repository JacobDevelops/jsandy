# Next.js Integration Guide

Integrate `@jsandy/rpc` with Next.js App Router.

## Route Handler Setup

Create a catch-all route handler at `app/api/[...path]/route.ts`:

```typescript
import { Hono } from "hono";
import { jsandy, mergeRouters } from "@jsandy/rpc";
import { usersRouter } from "@/server/routers/users";
import { postsRouter } from "@/server/routers/posts";

const { defaults } = jsandy.init();

const api = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);

api.route("/users", usersRouter);
api.route("/posts", postsRouter);

export const GET = api.fetch;
export const POST = api.fetch;
export const OPTIONS = api.fetch;
```

## File Placement

Place the route handler at:
```
app/
  api/
    [...path]/
      route.ts    <-- handler here
```

This catches all requests under `/api/*` and routes them through Hono.

## Using with Middleware

Apply authentication middleware to your API:

```typescript
import { Hono } from "hono";
import { jsandy } from "@jsandy/rpc";
import { cors } from "hono/cors";

const { defaults } = jsandy.init();

const api = new Hono()
	.use(cors({
		origin: ["http://localhost:3000", "https://myapp.com"],
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	}))
	.onError(defaults.errorHandler);
```

## CORS Configuration

For production, configure CORS explicitly:

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { jsandy } from "@jsandy/rpc";

const { defaults } = jsandy.init();

const api = new Hono()
	.use(cors({
		origin: (origin) => {
			const allowed = ["https://myapp.com", "https://staging.myapp.com"];
			return allowed.includes(origin) ? origin : null;
		},
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}))
	.onError(defaults.errorHandler);

export const GET = api.fetch;
export const POST = api.fetch;
export const OPTIONS = api.fetch;
```

## Client-Side Usage

```typescript
import { createClient } from "@jsandy/rpc/client";
import type { AppRouter } from "@/server/router";

const client = createClient<AppRouter>({
	baseUrl: "/api",
});

// Type-safe calls
const users = await client.users.listUsers({ page: 1, limit: 10 });
```
