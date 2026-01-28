# Pagination Pattern

Cursor-based and offset pagination for list procedures.

## Cursor-Based Pagination

Preferred for large datasets. Uses an opaque cursor for efficient traversal:

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";

const { procedure } = jsandy.init();

const paginationInput = z.object({
	cursor: z.optional(z.string()),
	limit: z.optional(z.number().int().min(1).max(100)),
});

function paginatedOutput(itemSchema: z.ZodType) {
	return z.object({
		items: z.array(itemSchema),
		nextCursor: z.nullable(z.string()),
		hasMore: z.boolean(),
	});
}

const userSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
});

const listUsers = procedure
	.input(paginationInput)
	.output(paginatedOutput(userSchema))
	.describe({ description: "List users with cursor pagination" })
	.query(async ({ c, input }) => {
		const limit = input.limit ?? 20;
		const users = await db.users.findMany({
			cursor: input.cursor ? { id: input.cursor } : undefined,
			take: limit + 1,
			orderBy: { createdAt: "desc" },
		});

		const hasMore = users.length > limit;
		const items = hasMore ? users.slice(0, limit) : users;
		const nextCursor = hasMore ? items[items.length - 1].id : null;

		return c.superjson({ items, nextCursor, hasMore });
	});

export { listUsers };
```

## Offset Pagination

Simpler but less efficient for large datasets:

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";

const { procedure } = jsandy.init();

const listPosts = procedure
	.input(z.object({
		page: z.optional(z.number().int().min(1)),
		pageSize: z.optional(z.number().int().min(1).max(100)),
	}))
	.output(z.object({
		items: z.array(z.object({
			id: z.string(),
			title: z.string(),
		})),
		total: z.number(),
		page: z.number(),
		pageSize: z.number(),
		totalPages: z.number(),
	}))
	.query(async ({ c, input }) => {
		const page = input.page ?? 1;
		const pageSize = input.pageSize ?? 20;
		const skip = (page - 1) * pageSize;

		const [items, total] = await Promise.all([
			db.posts.findMany({ skip, take: pageSize, orderBy: { createdAt: "desc" } }),
			db.posts.count(),
		]);

		return c.superjson({
			items,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize),
		});
	});

export { listPosts };
```
