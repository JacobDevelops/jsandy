# Custom PubSub Adapter Guide

PubSub adapters enable WebSocket room broadcasting across multiple server instances.

## PubSubAdapter Interface

Every adapter must implement the `PubSubAdapter` interface:

```typescript
import type { PubSubAdapter, SubscribeOptions } from "@jsandy/rpc";

export interface PubSubAdapter {
	publish(channel: string, message: string): Promise<void>;
	subscribe(
		channel: string,
		onMessage: (message: string) => void,
		options?: SubscribeOptions,
	): Promise<void>;
}

// SubscribeOptions:
// {
//   signal?: AbortSignal;
//   onOpen?: () => void;
//   onError?: (error: Error) => void;
// }
```

## Using UpstashRestPubSub

Built-in adapter for Upstash Redis:

```typescript
import { UpstashRestPubSub } from "@jsandy/rpc/adapters";

const upstashAdapter = new UpstashRestPubSub({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

## Using CloudflareQueuePubSub

Built-in adapter for Cloudflare Queues:

```typescript
import { CloudflareQueuePubSub } from "@jsandy/rpc/adapters";

const cfAdapter = new CloudflareQueuePubSub({
	queue: env.MY_QUEUE,
});
```

## Building a Custom Adapter

```typescript
import type { PubSubAdapter, SubscribeOptions } from "@jsandy/rpc";

class RedisPubSub implements PubSubAdapter {
	private redis: RedisClient;

	constructor(redis: RedisClient) {
		this.redis = redis;
	}

	async publish(channel: string, message: string): Promise<void> {
		await this.redis.publish(channel, message);
	}

	async subscribe(
		channel: string,
		onMessage: (message: string) => void,
		options?: SubscribeOptions,
	): Promise<void> {
		const subscriber = this.redis.duplicate();
		await subscriber.subscribe(channel, (msg) => {
			onMessage(msg);
		});

		if (options?.signal) {
			options.signal.addEventListener("abort", () => {
				subscriber.unsubscribe(channel);
				subscriber.quit();
			});
		}

		options?.onOpen?.();
	}
}

export { RedisPubSub };
```

## Configuring with Router

Pass the adapter to your router config:

```typescript
import { Hono } from "hono";
import { jsandy, mergeRouters } from "@jsandy/rpc";
import { wsChat } from "./procedures/chat";
import { UpstashRestPubSub } from "@jsandy/rpc/adapters";

const { defaults } = jsandy.init();

const upstashAdapter = new UpstashRestPubSub({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const chatRouter = new Hono()
	.use(defaults.cors)
	.onError(defaults.errorHandler);

mergeRouters(chatRouter, { wsChat }, { pubsub: upstashAdapter });

export { chatRouter };
```

Without a PubSub adapter, `io.to(room).emit()` only broadcasts to clients connected to the same server instance. With an adapter, broadcasts are distributed across all instances.
