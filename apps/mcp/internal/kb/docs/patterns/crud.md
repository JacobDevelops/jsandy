# CRUD Procedures Pattern

Standard create, read, update, delete, and list operations.

## Full CRUD Example

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";
import { authMiddleware } from "./middleware/auth";

const { procedure } = jsandy.init();

const postSchema = z.object({
	id: z.string(),
	title: z.string(),
	body: z.string(),
	authorId: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// CREATE
const createPost = procedure
	.use(authMiddleware)
	.input(z.object({
		title: z.string().min(1).max(200),
		body: z.string().min(1),
	}))
	.output(postSchema)
	.describe({ description: "Create a new post" })
	.mutation(async ({ c, ctx, input }) => {
		const post = await db.posts.create({
			...input,
			authorId: ctx.user.id,
		});
		return c.superjson(post);
	});

// READ
const getPost = procedure
	.input(z.object({ id: z.string() }))
	.output(postSchema)
	.describe({ description: "Get a post by ID" })
	.query(async ({ c, input }) => {
		const post = await db.posts.findById(input.id);
		if (\!post) {
			throw new HTTPException(404, { message: "Post not found" });
		}
		return c.superjson(post);
	});

// UPDATE
const updatePost = procedure
	.use(authMiddleware)
	.input(z.object({
		id: z.string(),
		title: z.optional(z.string().min(1).max(200)),
		body: z.optional(z.string().min(1)),
	}))
	.output(postSchema)
	.describe({ description: "Update an existing post" })
	.mutation(async ({ c, ctx, input }) => {
		const { id, ...data } = input;
		const post = await db.posts.update(id, data);
		return c.superjson(post);
	});

// DELETE
const deletePost = procedure
	.use(authMiddleware)
	.input(z.object({ id: z.string() }))
	.output(z.object({ success: z.boolean() }))
	.describe({ description: "Delete a post" })
	.mutation(async ({ c, ctx, input }) => {
		await db.posts.delete(input.id);
		return c.superjson({ success: true });
	});

// LIST (with pagination)
const listPosts = procedure
	.input(z.object({
		cursor: z.optional(z.string()),
		limit: z.optional(z.number().int().min(1).max(100)),
	}))
	.output(z.object({
		posts: z.array(postSchema),
		nextCursor: z.nullable(z.string()),
	}))
	.describe({ description: "List posts with cursor pagination" })
	.query(async ({ c, input }) => {
		const limit = input.limit ?? 20;
		const { posts, nextCursor } = await db.posts.list({
			cursor: input.cursor,
			limit,
		});
		return c.superjson({ posts, nextCursor });
	});

export { createPost, getPost, updatePost, deletePost, listPosts };
```

## Router Registration

```typescript
import { Hono } from "hono";
import { jsandy, mergeRouters } from "@jsandy/rpc";
import { createPost, getPost, updatePost, deletePost, listPosts } from "./procedures/posts";

const { defaults } = jsandy.init();

const postsRouter = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);

mergeRouters(postsRouter, {
	createPost,
	getPost,
	updatePost,
	deletePost,
	listPosts,
});

export { postsRouter };
export type PostsRouter = typeof postsRouter;
```
