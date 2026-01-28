# Error Handling Pattern

Structured error handling with HTTPException, custom errors, and client-side handling.

## Using HTTPException

Throw `HTTPException` for expected errors with proper status codes:

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";

const { procedure } = jsandy.init();

const getUser = procedure
	.input(z.object({ id: z.string() }))
	.query(async ({ c, input }) => {
		const user = await db.users.findById(input.id);
		if (\!user) {
			throw new HTTPException(404, { message: "User not found" });
		}
		return c.superjson(user);
	});

export { getUser };
```

## Custom Error Types

```typescript
import { HTTPException } from "hono/http-exception";

class NotFoundError extends HTTPException {
	constructor(resource: string, id: string) {
		super(404, { message: `${resource} with id ${id} not found` });
	}
}

class ValidationError extends HTTPException {
	constructor(message: string) {
		super(400, { message });
	}
}

class ConflictError extends HTTPException {
	constructor(message: string) {
		super(409, { message });
	}
}

export { NotFoundError, ValidationError, ConflictError };
```

## Error Middleware

Global error handling at the router level:

```typescript
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { jsandy } from "@jsandy/rpc";

const { defaults } = jsandy.init();

const api = new Hono()
	.onError((err, c) => {
		if (err instanceof HTTPException) {
			return c.superjson({
				error: {
					message: err.message,
					code: err.status,
				},
			}, err.status);
		}

		console.error("Unhandled error:", err);
		return c.superjson({
			error: {
				message: "Internal Server Error",
				code: 500,
			},
		}, 500);
	});
```

## Client-Side Error Handling

```typescript
import { createClient } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/router";

const client = createClient<AppRouter>({
	baseUrl: "http://localhost:3000/api",
});

try {
	const user = await client.getUser({ id: "nonexistent" });
} catch (error) {
	if (error instanceof Error) {
		const status = (error as any).status;
		switch (status) {
			case 404:
				console.log("User not found");
				break;
			case 401:
				console.log("Not authenticated");
				break;
			case 403:
				console.log("Not authorized");
				break;
			default:
				console.error("Unexpected error:", error.message);
		}
	}
}
```
