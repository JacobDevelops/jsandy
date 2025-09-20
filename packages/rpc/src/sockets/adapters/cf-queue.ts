/**
 * Cloudflare Workers Queue binding interface for sending messages.
 * @template T - The type of message body that can be sent
 */
export interface CFQueuesBinding<T = any> {
	/**
	 * Sends a message to the Cloudflare Queue.
	 * @param body - The message body to send
	 * @returns A promise that resolves when the message is queued
	 */
	send: (body: T) => Promise<void>;
}

/**
 * Standard message body format that includes a topic for message routing.
 */
export type MessageBody = { topic: string; [key: string]: unknown };

/**
 * Function type for handling incoming messages from subscribed topics.
 * @param payload - The message payload received from the topic
 */
type Handler = (payload: unknown) => void;

/**
 * A publish-subscribe adapter for Cloudflare Queues that enables topic-based
 * message routing within a single Worker instance.
 *
 * This class provides a pub/sub interface over Cloudflare Queues, allowing
 * multiple subscribers to listen for messages on specific topics. Messages
 * are sent through the queue and then delivered to local subscribers when
 * the queue consumer processes them.
 *
 * @example
 * ```typescript
 * const pubsub = new CloudflareQueuePubSub(env.MY_QUEUE);
 *
 * // Subscribe to a topic
 * await pubsub.subscribe('user-events', (payload) => {
 *   console.log('User event:', payload);
 * });
 *
 * // Publish a message
 * await pubsub.publish('user-events', { userId: 123, action: 'login' });
 * ```
 */
export class CloudflareQueuePubSub {
	private q: CFQueuesBinding<MessageBody>;
	private subscribers = new Map<string, Set<Handler>>();

	/**
	 * Creates a new CloudflareQueuePubSub instance.
	 * @param queueBinding - The Cloudflare Queue binding to use for message transport
	 */
	constructor(queueBinding: CFQueuesBinding<MessageBody>) {
		this.q = queueBinding;
	}

	// --- PubSubAdapter API -----------------------------------------------------

	/**
	 * Publishes a message to the specified topic.
	 *
	 * The message is wrapped with topic information and sent through the
	 * Cloudflare Queue. When the queue consumer processes it, the message
	 * will be delivered to all local subscribers of the topic.
	 *
	 * @param topic - The topic to publish the message to
	 * @param payload - The message payload to send
	 * @returns A promise that resolves when the message is queued
	 *
	 * @example
	 * ```typescript
	 * await pubsub.publish('notifications', {
	 *   type: 'email',
	 *   recipient: 'user@example.com'
	 * });
	 * ```
	 */
	async publish(topic: string, payload: unknown): Promise<void> {
		// Wrap as { topic, payload } so the consumer can demux
		await this.q.send({ payload, topic });
	}

	/**
	 * Subscribes to messages on the specified topic.
	 *
	 * The subscription is "hot" - it's considered active immediately upon
	 * calling this method. Messages will be delivered to the handler when
	 * they arrive through the queue consumer.
	 *
	 * @param topic - The topic to subscribe to
	 * @param onMessage - Handler function called when messages arrive
	 * @param opts - Optional subscription configuration
	 * @param opts.signal - AbortSignal to cancel the subscription
	 * @param opts.onOpen - Callback fired immediately when subscription is active
	 * @param opts.onError - Error handler (currently unused but part of standard interface)
	 * @returns A promise that resolves when the subscription is established
	 *
	 * @example
	 * ```typescript
	 * const controller = new AbortController();
	 *
	 * await pubsub.subscribe('orders', (payload) => {
	 *   console.log('New order:', payload);
	 * }, {
	 *   signal: controller.signal,
	 *   onOpen: () => console.log('Subscribed to orders'),
	 *   onError: (err) => console.error('Subscription error:', err)
	 * });
	 *
	 * // Later: cancel subscription
	 * controller.abort();
	 * ```
	 */
	async subscribe(
		topic: string,
		onMessage: Handler,
		opts?: {
			signal?: AbortSignal;
			onOpen?: () => void;
			onError?: (e: unknown) => void;
		},
	): Promise<void> {
		let set = this.subscribers.get(topic);
		if (!set) {
			set = new Set<Handler>();
			this.subscribers.set(topic, set);
		}
		set.add(onMessage);

		// This adapter is "hot"—we consider subscription open immediately.
		opts?.onOpen?.();

		// Unsubscribe when aborted
		if (opts?.signal) {
			if (opts.signal.aborted) this._remove(topic, onMessage);
			else
				opts.signal.addEventListener(
					"abort",
					() => this._remove(topic, onMessage),
					{ once: true },
				);
		}
	}

	private _remove(topic: string, onMessage: Handler) {
		const set = this.subscribers.get(topic);
		if (!set) return;
		set.delete(onMessage);
		if (set.size === 0) this.subscribers.delete(topic);
	}

	// --- Called by the Worker queue consumer ----------------------------------

	/**
	 * Delivers a message from the Cloudflare Queue to all local subscribers.
	 *
	 * This method should be called by the Worker's queue consumer handler
	 * when processing messages from the queue. It routes the message to all
	 * handlers subscribed to the specified topic.
	 *
	 * Individual handler errors are caught and ignored to prevent one
	 * failing subscriber from affecting others.
	 *
	 * @param topic - The topic the message was published to
	 * @param payload - The message payload to deliver
	 *
	 * @example
	 * ```typescript
	 * // In your Worker's queue consumer:
	 * export default {
	 *   async queue(batch, env) {
	 *     for (const message of batch.messages) {
	 *       const { topic, payload } = message.body;
	 *       pubsub.deliver(topic, payload);
	 *       message.ack();
	 *     }
	 *   }
	 * };
	 * ```
	 */
	deliver(topic: string, payload: unknown) {
		const set = this.subscribers.get(topic);
		if (set?.size === 0) return;

		// biome-ignore lint/style/noNonNullAssertion: We know that size is not zero
		for (const fn of set!) {
			try {
				fn(payload);
			} catch {
				// Per-subscription errors should not crash the consumer
			}
		}
	}
}
