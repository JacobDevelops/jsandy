# Authentication Pattern

JWT/Bearer token middleware with role-based access control.

## Auth Middleware

```typescript
import { jsandy } from "@jsandy/rpc";
import { HTTPException } from "hono/http-exception";
import { verify } from "hono/jwt";

const { middleware } = jsandy.init();

const authMiddleware = middleware(async ({ c, ctx, next }) => {
	const header = c.req.header("Authorization");
	if (\!header?.startsWith("Bearer ")) {
		throw new HTTPException(401, { message: "Missing Bearer token" });
	}

	const token = header.slice(7);
	try {
		const payload = await verify(token, process.env.JWT_SECRET);
		return next({
			user: {
				id: payload.sub as string,
				email: payload.email as string,
				role: payload.role as string,
			},
		});
	} catch {
		throw new HTTPException(401, { message: "Invalid or expired token" });
	}
});

export { authMiddleware };
```

## Role-Based Access Middleware

```typescript
import { jsandy } from "@jsandy/rpc";
import { HTTPException } from "hono/http-exception";

const { middleware } = jsandy.init();

function requireRole(...roles: string[]) {
	return middleware(async ({ c, ctx, next }) => {
		if (\!ctx.user) {
			throw new HTTPException(401, { message: "Not authenticated" });
		}
		if (\!roles.includes(ctx.user.role)) {
			throw new HTTPException(403, { message: "Insufficient permissions" });
		}
		return next();
	});
}

export { requireRole };
```

## Protected Procedures

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";
import { authMiddleware } from "./middleware/auth";
import { requireRole } from "./middleware/roles";

const { procedure } = jsandy.init();

// Any authenticated user
const getProfile = procedure
	.use(authMiddleware)
	.query(async ({ c, ctx }) => {
		const profile = await db.users.findById(ctx.user.id);
		return c.superjson(profile);
	});

// Admin only
const deleteUser = procedure
	.use(authMiddleware)
	.use(requireRole("admin"))
	.input(z.object({ userId: z.string() }))
	.mutation(async ({ c, ctx, input }) => {
		await db.users.delete(input.userId);
		return c.superjson({ success: true });
	});

// Editor or admin
const publishPost = procedure
	.use(authMiddleware)
	.use(requireRole("admin", "editor"))
	.input(z.object({ postId: z.string() }))
	.mutation(async ({ c, ctx, input }) => {
		const post = await db.posts.publish(input.postId);
		return c.superjson(post);
	});

export { getProfile, deleteUser, publishPost };
```
