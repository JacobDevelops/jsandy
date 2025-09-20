/**
 * Generic Pub/Sub adapter interface for decoupling real-time messaging from a specific provider.
 *
 * Implementations can use any backend (Redis REST, native Redis, Kafka, NATS, etc.)
 * as long as they satisfy this interface.
 */
export interface PubSubAdapter {
	/**
	 * Publish a message to a topic/room.
	 *
	 * @param topic - The topic/room/channel to publish to
	 * @param payload - Arbitrary payload; serializable to JSON
	 */
	publish(topic: string, payload: unknown): Promise<void>;

	/**
	 * Subscribe to a topic/room and receive messages.
	 *
	 * Implementations should:
	 * - Start a streaming subscription (SSE, WebSocket, or long-poll)
	 * - Call onMessage for each received payload
	 * - Respect AbortSignal cancellation for cleanup
	 *
	 * @param topic - The topic/room/channel to subscribe to
	 * @param onMessage - Handler invoked for each received payload
	 * @param options - Additional subscription options
	 */
	subscribe(
		topic: string,
		onMessage: (payload: unknown) => void,
		options?: SubscribeOptions,
	): Promise<void>;
}

/**
 * Options for subscriptions across adapters.
 */
export interface SubscribeOptions {
	/**
	 * AbortSignal for cancellation. When aborted, the subscription must close.
	 */
	signal?: AbortSignal;
	/**
	 * Optional callback invoked once the subscription is established.
	 */
	onOpen?: () => void;
	/**
	 * Optional callback invoked if the subscription encounters an error.
	 */
	onError?: (error: unknown) => void;
}
