# @squaredmade/rpc

## Introduction

`@squaredmade/rpc` is a lightweight, TypeScript-based HTTP-RPC (Remote Procedure Call) implementation designed for modern Node.js applications. It provides a simple and efficient way to create and consume RPC services over HTTP, with built-in support for context management, error handling, and schema validation.

## Features

- TypeScript-first implementation
- Context management using `@squaredmade/context`
- Built-in error handling
- Support for schema validation using Zod
- Easy-to-use API for creating and consuming RPC services
- Integration with Express.js for server-side implementation
- Client-side implementation using Axios

## Usage

### Defining a Service

To define an RPC service, create a new TypeScript file and define your service interface and implementation:

```typescript
import { Context } from "@squaredmade/context";
import { z } from "zod/v4";

// Define your service interface
interface UserService {
  getUser(
    ctx: Context,
    args: { id: string }
  ): Promise<{ name: string; email: string }>;
  createUser(
    ctx: Context,
    args: { name: string; email: string }
  ): Promise<{ id: string }>;
}

// Implement your service
class UserServiceImpl implements UserService {
  async getUser(ctx: Context, args: { id: string }) {
    // Implementation here
    return { name: "John Doe", email: "john@example.com" };
  }

  async createUser(
    ctx: Context,
    args: { name: string; email: string }
  ) {
    // Implementation here
    return { id: "new-user-id" };
  }
}

// Define schemas for your methods
const userServiceSchema = {
  getUser: {
    input: z.object({ id: z.string() }),
    output: z.object({ name: z.string(), email: z.string() }),
  },
  createUser: {
    input: z.object({ name: z.string(), email: z.string() }),
    output: z.object({ id: z.string() }),
  },
};

export { UserService, UserServiceImpl, userServiceSchema };
```

### Creating a Server

To create an RPC server using Express.js:

```typescript
import express from "express";
import { createRpcHandler } from "@squaredmade/rpc";
import { UserServiceImpl, userServiceSchema } from "./user-service";

const app = express();

const userService = new UserServiceImpl();
const rpcHandler = createRpcHandler(userService, userServiceSchema);

app.use("/rpc/user", rpcHandler);

app.listen(3000, () => {
  console.log("RPC server listening on port 3000");
});
```

### Creating a Client

To create an RPC client:

```typescript
import { createRpcClient } from "@squaredmade/rpc";
import { UserService } from "./user-service";

const userClient = createRpcClient<UserService>(
  "http://localhost:3000/rpc/user"
);

async function main() {
  const user = await userClient.getUser({ id: "user-1" });
  console.log(user);
}

main().catch(console.error);
```

## API Reference

### `createRpcHandler(service, schema)`

Creates an Express.js middleware for handling RPC requests.

- `service`: An instance of your service implementation.
- `schema`: A Zod schema object defining the input and output types for each method.

### `createRpcClient<T>(baseUrl)`

Creates an RPC client for consuming a remote service.

- `T`: The interface type of your service.
- `baseUrl`: The base URL of your RPC server.

## Error Handling

`@squaredmade/rpc` provides built-in error handling. Errors thrown in your service methods will be automatically caught and returned as appropriate HTTP responses.

## Context Management

The package uses `@squaredmade/context` for context management. Each RPC method receives a `Context` object as its first argument, which can be used to pass request-scoped data and manage timeouts.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
