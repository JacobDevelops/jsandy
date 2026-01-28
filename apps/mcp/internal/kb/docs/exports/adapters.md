# @jsandy/rpc/adapters Exports

Adapters entry point: `import { ... } from "@jsandy/rpc/adapters"`

## Named Exports

| Export | Type | Description |
|--------|------|-------------|
| `UpstashRestPubSub` | Class | Upstash Redis-based pub/sub adapter |
| `CloudflareQueuePubSub` | Class | Cloudflare Queues pub/sub adapter |

## Type Exports

| Export | Description |
|--------|-------------|
| `PubSubAdapter` | Interface for custom pub/sub implementations |
| `SubscribeOptions` | Options for subscribe method |
| `CFQueuesBinding` | Cloudflare Queue binding type |

## Usage

```typescript
import { UpstashRestPubSub, CloudflareQueuePubSub } from "@jsandy/rpc/adapters";
import type { PubSubAdapter, SubscribeOptions, CFQueuesBinding } from "@jsandy/rpc/adapters";
```
