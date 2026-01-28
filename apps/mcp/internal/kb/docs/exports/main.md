# @jsandy/rpc Exports

Main entry point: `import { ... } from "@jsandy/rpc"`

## Named Exports

| Export | Type | Description |
|--------|------|-------------|
| `jsandy` | Object | Main framework object with `.init()` method |
| `dynamic` | Function | Lazy-load wrapper for router code splitting |

## jsandy.init() Returns

| Property | Description |
|----------|-------------|
| `procedure` | Procedure builder for queries, mutations, and WebSocket handlers |
| `router` | Router factory to group procedures |
| `middleware` | Middleware factory with context accumulation |
| `mergeRouters` | Combine multiple routers into a Hono app |
| `defaults` | Pre-configured CORS and error handler |

## Usage

```typescript
import { jsandy, dynamic } from "@jsandy/rpc";

const { procedure, router, middleware, mergeRouters, defaults } = jsandy.init();
```
