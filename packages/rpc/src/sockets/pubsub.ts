import { logger } from "./logger";

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

/**
 * REST-based Upstash Redis Pub/Sub adapter.
 *
 * Uses Upstash's REST API for:
 * - Publishing: POST {url}/publish/{topic}
 * - Subscribing: GET  {url}/subscribe/{topic} (SSE stream)
 *
 * Notes:
 * - Expects payloads to be JSON-serializable.
 * - For SSE, Upstash emits "data: message,room,payload" lines. We parse the payload
 *   portion (JSON) and pass it to `onMessage`.
 */
export class UpstashRestPubSub implements PubSubAdapter {
	private url: string;
	private token: string;

	/**
	 * @param url - Upstash Redis REST URL (e.g. https://xxx.upstash.io)
	 * @param token - Upstash Redis REST token
	 */
	constructor(url: string, token: string) {
		this.url = url;
		this.token = token;
	}

	async publish(topic: string, payload: unknown): Promise<void> {
		await fetch(`${this.url}/publish/${encodeURIComponent(topic)}`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});
	}

	/**
	 * Establishes an SSE subscription and forwards parsed messages to `onMessage`.
	 *
	 * Parsing details:
	 * - Each SSE "data: " line is expected to include "message,room,payload"
	 * - The payload portion is parsed as JSON and emitted
	 */
	async subscribe(
		topic: string,
		onMessage: (payload: unknown) => void,
		options?: SubscribeOptions,
	): Promise<void> {
		const controller = new AbortController();
		const signal = options?.signal;

		// If an external signal is passed, forward aborts to our local controller.
		if (signal) {
			if (signal.aborted) controller.abort();
			else
				signal.addEventListener("abort", () => controller.abort(), {
					once: true,
				});
		}

		try {
			const stream = await fetch(
				`${this.url}/subscribe/${encodeURIComponent(topic)}`,
				{
					headers: {
						Authorization: `Bearer ${this.token}`,
						accept: "text/event-stream",
					},
					signal: controller.signal,
				},
			);

			// The subscription is considered "open" once we get a body reader
			const reader = stream.body?.getReader();
			if (!reader) {
				throw new Error("Failed to establish SSE stream (no body reader).");
			}

			options?.onOpen?.();

			const decoder = new TextDecoder();
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				buffer += chunk;

				const lines = buffer.split("\n");
				// keep the last partial line in the buffer
				buffer = lines.pop() ?? "";

				for (const line of lines) {
					if (!line.startsWith("data: ")) continue;

					const data = line.slice(6);
					// Upstash format: "message,room,payload"
					// We want to extract JSON payload after the second comma.
					const firstComma = data.indexOf(",");
					const secondComma = data.indexOf(",", firstComma + 1);

					if (firstComma === -1 || secondComma === -1) {
						logger.warn("Upstash SSE: invalid message format (missing commas)");
						continue;
					}

					const payloadStr = data.slice(secondComma + 1);
					if (!payloadStr) {
						logger.warn("Upstash SSE: empty payload");
						continue;
					}

					try {
						const parsed = JSON.parse(payloadStr);
						onMessage(parsed);
					} catch (err) {
						logger.debug("Upstash SSE: failed to parse JSON payload", err);
					}
				}
			}
		} catch (err) {
			if (options?.onError) {
				options.onError(err);
			} else {
				logger.error("Upstash SSE: subscription error", err);
			}
		}
	}
}
