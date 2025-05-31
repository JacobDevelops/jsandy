# @jsandy/rpc

## Introduction

`@jsandy/rpc` is a lightweight, TypeScript-based RPC (Remote Procedure Call) framework built on top of Hono. It provides a simple and efficient way to create type-safe RPC services with built-in support for schema validation, error handling, and WebSocket communication.

## Features

- TypeScript-first implementation with full type safety
- Built on Hono for high performance and modern web standards
- Support for schema validation using Zod v4
- Built-in error handling with HTTP exceptions
- WebSocket support for real-time communication
- Procedure-based API design
- Client-side implementation with type inference
- Middleware support for custom functionality

## Usage

### Creating Procedures

To define RPC procedures, use the procedure builder with schema validation:

```typescript
import { jsandy } from "@jsandy/rpc";
import { z } from "zod";

const { procedure, router } = jsandy.init();

// Define input/output schemas
const getUserSchema = z.object({ id: z.string() });
const userOutputSchema = z.object({ 
  name: z.string(), 
  email: z.string() 
});

// Create procedures
const getUser = procedure
  .input(getUserSchema)
  .output(userOutputSchema)
  .query(async ({ input }) => {
    // Implementation here
    return { name: "John Doe", email: "john@example.com" };
  });

const createUser = procedure
  .input(z.object({ name: z.string(), email: z.string() }))
  .output(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    // Implementation here
    return { id: "new-user-id" };
  });

// Create router with procedures
const userRouter = router({
  getUser,
  createUser,
});

export { userRouter };
```

### Creating a Server

To create an RPC server using Hono:

```typescript
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { userRouter } from "./user-router";

const app = new Hono();

// Mount the router
app.route("/api/users", userRouter.app);

// Start the server
serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("RPC server listening on port 3000");
```

### Creating a Client

To create a type-safe RPC client:

```typescript
import { createClient } from "@jsandy/rpc";
import type { userRouter } from "./user-router";

const client = createClient<typeof userRouter>(
  "http://localhost:3000/api/users"
);

async function main() {
  // Type-safe client calls
  const user = await client.getUser.query({ id: "user-1" });
  console.log(user);
  
  const newUser = await client.createUser.mutate({
    name: "Jane Doe",
    email: "jane@example.com"
  });
  console.log(newUser);
}

main().catch(console.error);
```

## API Reference

### `jsandy.init()`

Initializes the RPC stack and returns utilities for building procedures and routers.

Returns:

- `procedure`: Procedure builder for creating type-safe RPC operations
- `router`: Function to create routers from procedures
- `middleware`: Function to create type-safe middleware
- `mergeRouters`: Function to merge multiple routers

### `procedure`

Builder for creating type-safe RPC procedures.

Methods:

- `.input(schema)`: Define input validation schema
- `.output(schema)`: Define output validation schema  
- `.query(handler)`: Create a query operation (GET)
- `.mutation(handler)`: Create a mutation operation (POST)

### `createClient<T>(baseUrl)`

Creates a type-safe RPC client for consuming a remote service.

- `T`: The router type for full type safety
- `baseUrl`: The base URL of your RPC server

## Error Handling

`@jsandy/rpc` provides built-in error handling using Hono's HTTP exceptions. Errors thrown in your procedures will be automatically caught and returned as appropriate HTTP responses with proper status codes.

```typescript
import { HTTPException } from "hono/http-exception";

const getUserProcedure = procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    if (!input.id) {
      throw new HTTPException(400, { message: "User ID is required" });
    }
    // Implementation here
  });
```

## WebSocket Support

The package includes built-in WebSocket support for real-time communication:

```typescript
const chatProcedure = procedure
  .input(z.object({ message: z.string() }))
  .subscription(async ({ input, emit }) => {
    // Handle real-time messaging
    emit("message", { text: input.message, timestamp: Date.now() });
  });
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
