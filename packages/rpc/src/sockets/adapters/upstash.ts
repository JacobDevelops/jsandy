import type { PubSubAdapter, SubscribeOptions } from "./adapter";

const logger = {
	debug(message: string, ...args: unknown[]) {
		console.log(`[Socket] 🔍 ${message}`, ...args);
	},

	error(message: string, error?: Error | unknown) {
		console.error(`[Socket] ❌ ${message}`, error || "");
	},
	info(message: string, ...args: unknown[]) {
		console.log(`[Socket] ℹ️ ${message}`, ...args);
	},

	success(message: string, ...args: unknown[]) {
		console.log(`[Socket] ✅ ${message}`, ...args);
	},

	warn(message: string, ...args: unknown[]) {
		console.warn(`[Socket] ⚠️ ${message}`, ...args);
	},
};

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
			body: JSON.stringify(payload),
			headers: {
				Authorization: `Bearer ${this.token}`,
				"Content-Type": "application/json",
			},
			method: "POST",
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
