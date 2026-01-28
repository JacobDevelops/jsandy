# @jsandy/rpc/client Exports

Client entry point: `import { ... } from "@jsandy/rpc/client"`

## Named Exports

| Export | Type | Description |
|--------|------|-------------|
| `createClient` | Function | Creates a type-safe RPC client |

## Usage

```typescript
import { createClient } from "@jsandy/rpc/client";
import type { AppRouter } from "./server/app";

const client = createClient<AppRouter>({
  baseUrl: "http://localhost:3000/api",
});

// Queries
const user = await client.users.getUser({ id: "123" });

// Mutations
const result = await client.users.createUser({ name: "Alice" });

// URL generation
const url = client.users.getUser.$url({ query: { id: "123" } });

// WebSocket
const ws = client.chat.liveChat.$ws();
```
