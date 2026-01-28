# Building Procedures

Procedures are the core building blocks of `@jsandy/rpc`. Each procedure defines a typed API endpoint — either a **query** (read) or **mutation** (write).

## Basic Setup

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";

const { procedure } = jsandy.init();
```

## Query Procedure

The handler receives `{ c, ctx, input }`:

- `c` — Hono context (use `c.superjson()` for responses)
- `ctx` — accumulated middleware context
- `input` — validated input from `.input()` schema

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";

const { procedure } = jsandy.init();

const getUser = procedure
	.input(z.object({ id: z.string() }))
	.output(z.object({ id: z.string(), name: z.string(), email: z.string() }))
	.describe({ description: "Get a user by ID" })
	.query(async ({ c, ctx, input }) => {
		const user = await db.users.findById(input.id);
		return c.superjson(user);
	});

export { getUser };
```

## Mutation Procedure

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";

const { procedure } = jsandy.init();

const createPost = procedure
	.input(z.object({
		title: z.string().min(1).max(200),
		body: z.string().min(1),
		authorId: z.string(),
	}))
	.output(z.object({ id: z.string(), title: z.string(), createdAt: z.string() }))
	.describe({ description: "Create a blog post" })
	.mutation(async ({ c, ctx, input }) => {
		const post = await db.posts.create(input);
		return c.superjson({
			id: post.id,
			title: post.title,
			createdAt: post.createdAt.toISOString(),
		});
	});

export { createPost };
```

## Builder Chain Order

The procedure builder follows a strict chain order:

```
procedure
  .use(middleware)       // 1. Middleware (optional, repeatable)
  .input(zodSchema)     // 2. Input schema (optional)
  .output(zodSchema)    // 3. Output schema (optional)
  .describe({ ... })    // 4. Description (optional)
  .query(handler)       // 5. Terminal — .query OR .mutation (required)
```

**Rules:**
- `.use()` must come before `.input()`
- `.input()` must come before `.output()`
- `.output()` must come before `.describe()`
- `.query()` or `.mutation()` must be last
- You can chain multiple `.use()` calls

## Input Schemas (Zod v4)

All schemas must use Zod v4 syntax:

```typescript
z.string()
z.string().min(1).max(255)
z.string().email()
z.string().url()
z.string().uuid()
z.number()
z.number().int()
z.number().min(0).max(100)
z.boolean()
z.optional(z.string())
z.array(z.string())
z.array(z.object({ id: z.string() }))
z.enum(["admin", "user", "guest"])
z.union([z.string(), z.number()])
z.nullable(z.string())
```

## Output Schemas

Output schemas validate the return value:

```typescript
const listUsers = procedure
	.input(z.object({
		page: z.optional(z.number().int().min(1)),
		limit: z.optional(z.number().int().min(1).max(100)),
	}))
	.output(z.object({
		users: z.array(z.object({ id: z.string(), name: z.string() })),
		total: z.number(),
	}))
	.query(async ({ c, input }) => {
		const page = input.page ?? 1;
		const limit = input.limit ?? 20;
		const { users, total } = await db.users.list({ page, limit });
		return c.superjson({ users, total });
	});

export { listUsers };
```

## Using Middleware

Attach middleware with `.use()` before input/output schemas:

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";
import { authMiddleware } from "./middleware/auth";

const { procedure } = jsandy.init();

const updateProfile = procedure
	.use(authMiddleware)
	.input(z.object({
		name: z.optional(z.string()),
		bio: z.optional(z.string()),
	}))
	.mutation(async ({ c, ctx, input }) => {
		const updated = await db.users.update(ctx.user.id, input);
		return c.superjson(updated);
	});

export { updateProfile };
```

## Procedure Without Input

```typescript
const getHealth = procedure
	.describe({ description: "Health check" })
	.query(async ({ c }) => {
		return c.superjson({ status: "ok", timestamp: Date.now() });
	});

export { getHealth };
```

## Response Pattern

Always use `c.superjson()` — never `c.json()`. SuperJSON handles dates, Maps, Sets, BigInt, and other non-JSON-native types:

```typescript
// Correct
return c.superjson({ user, createdAt: new Date() });

// WRONG — do not use c.json()
// return c.json({ user });
```
