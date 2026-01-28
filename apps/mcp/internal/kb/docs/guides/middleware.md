# Middleware Guide

Middleware in `@jsandy/rpc` intercepts procedure calls to add authentication, logging, rate limiting, and more. Middleware accumulates context for downstream procedures.

## Creating Custom Middleware

```typescript
import { jsandy } from "@jsandy/rpc";

const { middleware } = jsandy.init();

const logMiddleware = middleware(async ({ c, ctx, next }) => {
	const start = Date.now();
	const result = await next();
	const duration = Date.now() - start;
	console.log(`${c.req.method} ${c.req.url} - ${duration}ms`);
	return result;
});

export { logMiddleware };
```

## Context Accumulation

Middleware adds data to context by passing an object to `next()`. Subsequent middleware and handlers receive the accumulated context:

```typescript
import { jsandy } from "@jsandy/rpc";
import { HTTPException } from "hono/http-exception";

const { middleware } = jsandy.init();

const authMiddleware = middleware(async ({ c, ctx, next }) => {
	const token = c.req.header("Authorization")?.replace("Bearer ", "");
	if (\!token) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}
	const user = await verifyToken(token);
	if (\!user) {
		throw new HTTPException(401, { message: "Invalid token" });
	}
	return next({
		user: { id: user.id, email: user.email, role: user.role },
	});
});

export { authMiddleware };
```

The handler receives accumulated context:

```typescript
const getProfile = procedure
	.use(authMiddleware)
	.query(async ({ c, ctx }) => {
		const profile = await db.users.findById(ctx.user.id);
		return c.superjson(profile);
	});

export { getProfile };
```

## Chaining Multiple Middleware

Chain middleware by calling `.use()` multiple times:

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rateLimit";

const { procedure } = jsandy.init();

const sensitiveAction = procedure
	.use(rateLimitMiddleware)
	.use(authMiddleware)
	.input(z.object({ action: z.string() }))
	.mutation(async ({ c, ctx, input }) => {
		console.log(`User ${ctx.user.id} performing ${input.action}`);
		return c.superjson({ success: true });
	});

export { sensitiveAction };
```

**Order matters.** Middleware executes in the order defined. If `rateLimitMiddleware` throws, `authMiddleware` is never reached.

## fromHono — Reuse Existing Hono Middleware

Convert Hono middleware into `@jsandy/rpc` middleware with `fromHono`:

```typescript
import { jsandy, fromHono } from "@jsandy/rpc";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const { procedure } = jsandy.init();

const corsMiddleware = fromHono(
	cors({
		origin: ["https://example.com"],
		allowMethods: ["GET", "POST"],
	})
);

const loggerMiddleware = fromHono(logger());

const myProcedure = procedure
	.use(corsMiddleware)
	.use(loggerMiddleware)
	.query(async ({ c }) => {
		return c.superjson({ ok: true });
	});

export { myProcedure };
```

## Error Handling in Middleware

Throw `HTTPException` for expected errors:

```typescript
import { jsandy } from "@jsandy/rpc";
import { HTTPException } from "hono/http-exception";

const { middleware } = jsandy.init();

const adminOnly = middleware(async ({ c, ctx, next }) => {
	if (\!ctx.user) {
		throw new HTTPException(401, { message: "Authentication required" });
	}
	if (ctx.user.role \!== "admin") {
		throw new HTTPException(403, { message: "Admin access required" });
	}
	return next();
});

export { adminOnly };
```

## Built-in Defaults

`jsandy.init()` provides built-in middleware via `defaults`:

```typescript
import { Hono } from "hono";
import { jsandy } from "@jsandy/rpc";

const { defaults } = jsandy.init();

const api = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);
```
