# createClient

Create a type-safe client for calling @jsandy/rpc procedures from the browser or server.

## Basic Usage

```typescript
import { createClient } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/app";

export const client = createClient<AppRouter>({
  baseUrl: "http://localhost:3000/api",
});
```

## Calling Procedures

```typescript
// Query (GET request)
const user = await client.users.getUser({ id: "123" });

// Mutation (POST request)
const newUser = await client.users.createUser({
  name: "Alice",
  email: "alice@example.com",
});
```

## URL Generation

```typescript
// Get the URL for a procedure (useful for prefetching, links)
const url = client.users.getUser.$url({ query: { id: "123" } });
```

## WebSocket Connection

```typescript
const socket = client.chat.liveChat.$ws();

socket.on("message", (data) => {
  console.log("Received:", data);
});

socket.emit("message", { text: "Hello!" });
```

## Configuration Options

```typescript
const client = createClient<AppRouter>({
  baseUrl: "http://localhost:3000/api",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Important Notes

- Import the router TYPE only (`import type`) — not the actual router
- The `baseUrl` must match the server's base path
- Client methods are fully typed based on the router's input/output schemas
- Query procedures use GET, mutations use POST
