# Client Usage Guide

The `@jsandy/rpc` client provides type-safe API calls with automatic SuperJSON deserialization.

## Setup

```typescript
import { createClient } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/router";

const client = createClient<AppRouter>({
	baseUrl: "http://localhost:3000/api",
});
```

## Type-Safe API Calls

The client infers types from your router definition:

```typescript
// Query — GET request
const user = await client.getUser({ id: "123" });
// user is typed: { id: string, name: string, email: string }

// Mutation — POST request
const post = await client.createPost({
	title: "Hello World",
	body: "My first post",
	authorId: "123",
});
// post is typed: { id: string, title: string, createdAt: string }
```

## Error Handling

Use try/catch or check the response:

```typescript
import { createClient } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/router";

const client = createClient<AppRouter>({
	baseUrl: "http://localhost:3000/api",
});

try {
	const user = await client.getUser({ id: "invalid" });
} catch (error) {
	if (error instanceof Error) {
		console.error("API error:", error.message);
	}
}
```

## URL Generation with $url()

Generate typed URLs without making a request:

```typescript
const url = client.getUser.$url({ id: "123" });
// url: "http://localhost:3000/api/getUser?input=%7B%22id%22%3A%22123%22%7D"
```

Useful for prefetching, link generation, or passing to other APIs.

## WebSocket Connections with $ws()

```typescript
import { createClient } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/router";

const client = createClient<AppRouter>({
	baseUrl: "http://localhost:3000/api",
});

const socket = client.chat.$ws();

socket.on("message", (data) => {
	console.log("Received:", data);
});

socket.emit("sendMessage", {
	room: "general",
	text: "Hello everyone\!",
});
```

## SuperJSON Automatic Handling

The client automatically deserializes SuperJSON responses. Dates, Maps, Sets, BigInt, and other non-JSON types are restored to their native JavaScript types:

```typescript
const post = await client.getPost({ id: "1" });
// post.createdAt is a Date object, not a string
console.log(post.createdAt instanceof Date); // true
```
