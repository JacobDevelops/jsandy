import { type PubSubAdapter, UpstashRestPubSub } from "@jsandy/rpc/adapters";
import type { ZodSchema } from "zod";
import { type ZodType, z } from "zod";
import { EventEmitter, type Logger } from "./event-emitter";

// --------------------- local logger defaults + helpers -----------------------
const NullLogger: Logger = {
	debug() {},
	info() {},
	warn() {},
	error() {},
};

type RedactFn = (data: unknown) => unknown;

const defaultRedact: RedactFn = () => "[payload omitted]";

// ------------------------------- Options -------------------------------------
/**
 * Configuration options for creating a ServerSocket instance
 */
interface ServerSocketOptions {
	/**
	 * Generic Pub/Sub adapter implementation. If not provided, a default
	 * REST adapter (Upstash-compatible) will be created from redisUrl/redisToken for
	 * backward compatibility.
	 */
	adapter?: PubSubAdapter;
	/** Backward-compat: Redis server URL for pub/sub functionality (Upstash REST) */
	redisUrl?: string;
	/** Backward-compat: Authentication token for Redis connection (Upstash REST) */
	redisToken?: string;

	/** Zod schema for validating incoming events */
	incomingSchema: ZodSchema | ZodType;
	/** Zod schema for validating outgoing events */
	outgoingSchema: ZodSchema | ZodType;

	/** Heartbeat ping interval in ms (default: 30000) */
	heartbeatIntervalMs?: number;
	/** Heartbeat timeout threshold in ms (default: 45000) */
	heartbeatTimeoutMs?: number;

	/** Inject your own logger; default is no-op */
	logger?: Logger;
	/** Redact/shape data before logging (default: drop payloads) */
	redact?: RedactFn;
	/** Propagated to EventEmitter validation behavior */
	onValidationError?: "silent" | "warn" | "throw";
	/** Throttle identical warnings (ms). Default 5000ms */
	throttleMs?: number;
}

/**
 * System-level events that are automatically handled by socket connections
 */
export interface SystemEvents {
	/** Fired when socket connection is established */
	onConnect: void;
	/** Fired when a connection error occurs */
	onError: Error;
}

/**
 * Server-side WebSocket implementation with pluggable Pub/Sub adapter support for room-based messaging
 * @template IncomingEvents - Type definition for events this socket can receive
 * @template OutgoingEvents - Type definition for events this socket can emit
 */
export class ServerSocket<IncomingEvents, OutgoingEvents> {
	private room = "DEFAULT_ROOM";
	private ws: WebSocket;
	private controllers: Map<string, AbortController> = new Map();
	private emitter: EventEmitter;

	// pluggable pub/sub adapter
	private adapter: PubSubAdapter;

	// logging/redaction
	private logger: Logger;
	private redact: RedactFn;

	// heartbeat & monitoring
	private lastPingTimes: Map<string, number> = new Map();
	private heartbeatTimers: Map<
		string,
		{ sender: NodeJS.Timeout; monitor: NodeJS.Timeout }
	> = new Map();
	private heartbeatIntervalMs: number;
	private heartbeatTimeoutMs: number;

	/**
	 * Creates a new ServerSocket instance
	 * @param ws - WebSocket connection to wrap
	 * @param opts - Configuration options including Pub/Sub adapter and schemas
	 */
	constructor(ws: WebSocket, opts: ServerSocketOptions) {
		const {
			incomingSchema,
			outgoingSchema,
			adapter,
			redisUrl,
			redisToken,
			logger,
			redact,
			heartbeatIntervalMs = 30_000,
			heartbeatTimeoutMs = 45_000,
			onValidationError,
			throttleMs,
		} = opts;

		// Prefer provided adapter; otherwise, fallback to Upstash REST adapter for backward compatibility
		if (adapter) {
			this.adapter = adapter;
		} else if (redisUrl && redisToken) {
			this.adapter = new UpstashRestPubSub(redisUrl, redisToken);
		} else {
			throw new Error(
				"Missing PubSub adapter. Provide `adapter` or `redisUrl` and `redisToken`.",
			);
		}

		this.ws = ws;
		this.logger = logger ?? NullLogger;
		this.redact = redact ?? defaultRedact;
		this.heartbeatIntervalMs = heartbeatIntervalMs;
		this.heartbeatTimeoutMs = heartbeatTimeoutMs;

		this.emitter = new EventEmitter(
			ws,
			{ incomingSchema, outgoingSchema },
			{
				logger: this.logger,
				redact: this.redact,
				onValidationError,
				throttleMs,
			},
		);
	}

	/**
	 * Gets the current rooms this socket is subscribed to
	 * @returns Array of room names (currently only supports single room)
	 */
	get rooms() {
		return [this.room];
	}

	/**
	 * Closes the WebSocket connection and cleans up all resources
	 * Aborts all active subscriptions and clears heartbeat timers
	 */
	close() {
		this.ws.close();

		// clear all active subscriptions
		for (const controller of this.controllers.values()) {
			controller.abort();
		}
		this.controllers.clear();

		// clear all heartbeat timers
		for (const timers of this.heartbeatTimers.values()) {
			clearInterval(timers.sender);
			clearInterval(timers.monitor);
		}
		this.heartbeatTimers.clear();
	}

	/**
	 * Removes an event listener
	 * @param event - Event name to stop listening to
	 * @param callback - Optional specific callback to remove
	 */
	off<K extends keyof (IncomingEvents & SystemEvents)>(
		event: K,
		callback?: (data: (IncomingEvents & SystemEvents)[K]) => any,
	): void {
		this.emitter.off(event as string, callback as any);
	}

	/**
	 * Adds an event listener for incoming events
	 * @param event - Event name to listen for
	 * @param callback - Function to call when event is received
	 */
	on<K extends keyof IncomingEvents>(
		event: K,
		callback?: (data: IncomingEvents[K]) => any,
	): void {
		this.emitter.on(event as string, callback as any);
	}

	/**
	 * Emits an event to the connected client
	 * @param event - Event name to emit
	 * @param data - Data to send with the event
	 * @returns True if the event was successfully emitted
	 */
	emit<K extends keyof OutgoingEvents>(
		event: K,
		data: OutgoingEvents[K],
	): boolean {
		return this.emitter.emit(event as string, data);
	}

	/**
	 * Handles incoming events from the client
	 * @param eventName - Name of the event received
	 * @param eventData - Data payload of the event
	 */
	handleEvent(eventName: string, eventData: unknown) {
		this.emitter.handleEvent(eventName, eventData);
	}

	/**
	 * Joins a room and subscribes to its messages via the configured Pub/Sub adapter
	 * Sets up heartbeat monitoring for connection health
	 * @param room - Name of the room to join
	 */
	async join(room: string): Promise<void> {
		this.room = room;
		this.logger.info("Joining room", { room });

		await this.subscribe(room)
			.catch((error) => {
				this.logger.error("Subscription error", { room, error: String(error) });
			})
			.then(() => this.logger.info("Joined room", { room }))
			.then(() => this.createHeartbeat(room));
	}

	/**
	 * Leaves a room and unsubscribes from its messages
	 * @param room - Name of the room to leave
	 */
	leave(room: string) {
		const controller = this.controllers.get(room);

		if (controller) {
			controller.abort();
			this.controllers.delete(room);
			this.logger.info("Left room", { room });
		} else {
			this.logger.warn("Attempted to leave non-active room", { room });
		}
	}

	/**
	 * Creates heartbeat mechanism for monitoring connection health
	 * Sends ping messages and monitors for timeouts
	 * @param room - Room name for the heartbeat context
	 */
	private createHeartbeat(room: string) {
		const heartbeat = {
			sender: setInterval(async () => {
				try {
					await this.adapter.publish(room, ["ping", null]);
				} catch (e) {
					this.logger.warn("Heartbeat publish failed", {
						room,
						error: e instanceof Error ? e.message : String(e),
					});
				}
			}, this.heartbeatIntervalMs),

			monitor: setInterval(
				() => {
					const lastPingTime = this.lastPingTimes.get(room) ?? 0;

					if (Date.now() - lastPingTime > this.heartbeatTimeoutMs) {
						this.logger.warn("Heartbeat timeout; resubscribing", { room });
						this.unsubscribe(room).then(() => this.subscribe(room));
					}
				},
				Math.max(2_000, Math.floor(this.heartbeatIntervalMs / 6)),
			),
		};

		this.heartbeatTimers.set(room, heartbeat);
	}

	/**
	 * Subscribes to a topic/room via the configured Pub/Sub adapter
	 * and processes incoming messages
	 * @param room - Room name to subscribe to
	 */
	private async subscribe(room: string): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			(async () => {
				try {
					const controller = new AbortController();
					this.controllers.set(room, controller);

					// initialize heartbeat
					this.lastPingTimes.set(room, Date.now());

					await this.adapter.subscribe(
						room,
						(payload: unknown) => {
							try {
								const parsed = payload as any;

								if (Array.isArray(parsed)) {
									if (parsed[0] === "ping") {
										this.lastPingTimes.set(room, Date.now());
										this.logger.debug("Heartbeat received", { room });
										return;
									}

									if (this.ws.readyState === WebSocket.OPEN) {
										this.ws.send(JSON.stringify(parsed));
									} else {
										this.logger.debug("WebSocket not open; dropping message", {
											room,
											event: parsed[0],
										});
									}
								} else {
									this.logger.warn(
										"Invalid message payload (expected [event, data])",
										{
											room,
											payload: this.redact(payload),
										},
									);
								}
							} catch (err) {
								this.logger.warn("Failed to process message payload", {
									room,
									error: err instanceof Error ? err.message : String(err),
								});
							}
						},
						{
							signal: controller.signal,
							onOpen: () => resolve(),
							onError: (err) => reject(err),
						},
					);
				} catch (err) {
					reject(err);
				}
			})();
		});
	}

	/**
	 * Unsubscribes from a room's Pub/Sub adapter stream
	 * @param room - Room name to unsubscribe from
	 */
	private async unsubscribe(room: string) {
		const controller = this.controllers.get(room);
		if (controller) {
			controller.abort();
			this.controllers.delete(room);
			this.logger.info("Unsubscribed from room", { room });
		} else {
			this.logger.warn("No active subscription for room", { room });
		}
	}
}

// -----------------------------------------------------------------------------
// Client Socket
// -----------------------------------------------------------------------------

/**
 * Type alias for optional Zod schema validation
 */
type Schema = ZodSchema | ZodType | undefined;

interface ClientReconnectOptions {
	/** Max reconnection attempts (default 3) */
	maxAttempts?: number;
	/** Initial backoff (default 1500ms) */
	baseDelayMs?: number;
	/** Maximum backoff (default 8000ms) */
	maxDelayMs?: number;
	/** If true, logs a tip when URL looks like a Node dev server port */
	showBannerOnWrongPort?: boolean;
}

/**
 * Client-side WebSocket implementation with automatic reconnection and schema validation
 * @template IncomingEvents - Type definition for events this socket can receive (must extend SystemEvents)
 * @template OutgoingEvents - Type definition for events this socket can emit
 */
export class ClientSocket<IncomingEvents extends SystemEvents, OutgoingEvents> {
	private ws!: WebSocket;
	private emitter!: EventEmitter;

	private url: string | URL;
	private incomingSchema: Schema;
	private outgoingSchema: Schema;

	private reconnectAttempts = 0;
	private reconnectOpts: Required<ClientReconnectOptions>;

	// logging/redaction passthrough
	private logger: Logger;
	private redact: RedactFn;

	isConnected = false;

	/**
	 * Creates a new ClientSocket instance and immediately connects
	 * @param url - WebSocket server URL to connect to
	 * @param options - Optional configuration object
	 */
	constructor(
		url: string | URL,
		{
			incomingSchema,
			outgoingSchema,
			logger,
			redact,
			onValidationError,
			throttleMs,
			reconnect,
		}: {
			incomingSchema?: Schema;
			outgoingSchema?: Schema;
			logger?: Logger;
			redact?: RedactFn;
			onValidationError?: "silent" | "warn" | "throw";
			throttleMs?: number;
			reconnect?: ClientReconnectOptions;
		} = {},
	) {
		this.url = url;
		this.incomingSchema = incomingSchema;
		this.outgoingSchema = outgoingSchema;

		this.logger = logger ?? NullLogger;
		this.redact = redact ?? defaultRedact;

		this.reconnectOpts = {
			maxAttempts: reconnect?.maxAttempts ?? 3,
			baseDelayMs: reconnect?.baseDelayMs ?? 1500,
			maxDelayMs: reconnect?.maxDelayMs ?? 8000,
			showBannerOnWrongPort: reconnect?.showBannerOnWrongPort ?? true,
		};

		this.connect({
			onValidationError,
			throttleMs,
		});
	}

	/**
	 * Closes the WebSocket connection gracefully
	 */
	close() {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.close(1000, "Client closed connection");
		}
		this.isConnected = false;
	}

	/**
	 * Establishes WebSocket connection with automatic reconnection logic
	 * Preserves existing event handlers across reconnections
	 * Implements exponential backoff for failed connections
	 */
	private connect({
		onValidationError,
		throttleMs,
	}: {
		onValidationError?: "silent" | "warn" | "throw";
		throttleMs?: number;
	}) {
		const ws = new WebSocket(this.url as string);

		const existingHandlers = this.emitter?.eventHandlers;

		this.emitter = new EventEmitter(
			ws,
			{
				incomingSchema: this.incomingSchema,
				outgoingSchema: this.outgoingSchema,
			},
			{
				logger: this.logger,
				redact: this.redact,
				onValidationError,
				throttleMs,
			},
		);

		if (existingHandlers) {
			this.emitter.eventHandlers = new Map(existingHandlers);
		}

		this.ws = ws;

		ws.onerror = (err) => {
			const urlStr = (err.currentTarget as WebSocket)?.url as
				| string
				| undefined;

			if (
				this.reconnectOpts.showBannerOnWrongPort &&
				typeof urlStr === "string" &&
				urlStr.includes(":3000")
			) {
				this.logger.error(
					"Cannot connect to WebSocket at a Node dev server port; use your Worker port (e.g., 8787/8080) while developing.",
					{ url: urlStr },
				);
			} else {
				this.logger.error("Connection error", {
					error: (err as any)?.message ?? String(err),
				});
			}

			this.emitter.handleEvent("onError", err as any as Error);
		};

		ws.onopen = () => {
			this.logger.info("WebSocket connected", { url: String(this.url) });
			this.isConnected = true;
			this.reconnectAttempts = 0;
			this.emitter.handleEvent("onConnect", undefined);
		};

		ws.onclose = () => {
			this.logger.warn("WebSocket closed; attempting reconnect", {
				attempt: this.reconnectAttempts + 1,
			});
			this.isConnected = false;

			this.reconnectAttempts++;

			if (this.reconnectAttempts <= this.reconnectOpts.maxAttempts) {
				const delay = Math.min(
					this.reconnectOpts.baseDelayMs * 2 ** (this.reconnectAttempts - 1),
					this.reconnectOpts.maxDelayMs,
				);
				setTimeout(
					() => this.connect({ onValidationError, throttleMs }),
					delay,
				);
			} else {
				this.logger.error("Max reconnect attempts reached");
			}
		};

		ws.onmessage = (event) => {
			// Expect a JSON-encoded tuple: [eventName, data]
			const text = z.string().parse(event.data);
			const eventSchema = z.tuple([z.string(), z.unknown()]);
			try {
				const parsed = JSON.parse(text);
				const res = eventSchema.safeParse(parsed);
				if (res.success) {
					const [eventName, eventData] = res.data;
					this.emitter.handleEvent(eventName, eventData);
				} else {
					this.logger.warn("Unable to parse event payload", {
						payload: this.redact(text),
						issues: res.error.issues.map((i) => i.message),
					});
				}
			} catch {
				this.logger.warn("Non-JSON message received", {
					payload: this.redact(text),
				});
			}
		};
	}

	/**
	 * Emits an event to the server
	 * @param event - Event name to emit
	 * @param data - Data to send with the event
	 * @returns True if the event was successfully emitted
	 */
	emit<K extends keyof OutgoingEvents>(
		event: K,
		data: OutgoingEvents[K],
	): boolean {
		return this.emitter.emit(event as string, data);
	}

	/**
	 * Removes an event listener
	 * @param event - Event name to stop listening to
	 * @param callback - Optional specific callback to remove
	 */
	off<K extends keyof (IncomingEvents & SystemEvents)>(
		event: K,
		callback?: (data: (IncomingEvents & SystemEvents)[K]) => any,
	): void {
		this.emitter.off(event as string, callback as any);
	}

	/**
	 * Adds an event listener for incoming events
	 * @param event - Event name to listen for
	 * @param callback - Function to call when event is received
	 */
	on<K extends keyof IncomingEvents>(
		event: K,
		callback?: (data: IncomingEvents[K]) => any,
	): void {
		this.emitter.on(event as string, callback as any);
	}
}
