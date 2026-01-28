# PubSubAdapter

Interface for connecting pub/sub backends to @jsandy/rpc routers.

## Interface

```typescript
interface PubSubAdapter {
  publish(topic: string, payload: unknown): Promise<void>;
  subscribe(
    topic: string,
    onMessage: (payload: unknown) => void,
    options?: SubscribeOptions,
  ): Promise<void>;
}
```

## Built-in Adapters

### UpstashRestPubSub

```typescript
import { UpstashRestPubSub } from "@jsandy/rpc/adapters";

const pubsub = new UpstashRestPubSub(
  process.env.UPSTASH_REDIS_REST_URL!,
  process.env.UPSTASH_REDIS_REST_TOKEN!,
);
```

### CloudflareQueuePubSub

```typescript
import { CloudflareQueuePubSub } from "@jsandy/rpc/adapters";

const pubsub = new CloudflareQueuePubSub(env.MY_QUEUE);
```

## Connecting to Router

```typescript
const myRouter = router({
  // procedures...
}).config({
  getPubSubAdapter: () => pubsub,
  // or with Hono context:
  getPubSubAdapter: (c) => new CloudflareQueuePubSub(c.env.MY_QUEUE),
});
```

## Custom Adapter

```typescript
import type { PubSubAdapter, SubscribeOptions } from "@jsandy/rpc/adapters";

class MyAdapter implements PubSubAdapter {
  async publish(topic: string, payload: unknown): Promise<void> {
    // Send payload to subscribers
  }

  async subscribe(
    topic: string,
    onMessage: (payload: unknown) => void,
    options?: SubscribeOptions,
  ): Promise<void> {
    // Listen for messages
  }
}
```
