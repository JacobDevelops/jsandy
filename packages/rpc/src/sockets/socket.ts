import type { ZodSchema } from "zod";
import { type ZodType, z } from "zod";
import { EventEmitter } from "./event-emitter";
import { logger } from "./logger";
import { UpstashRestPubSub, type PubSubAdapter } from "./pubsub";

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
	private lastPingTimes: Map<string, number> = new Map();
	private heartbeatTimers: Map<
		string,
		{
			sender: NodeJS.Timeout;
			monitor: NodeJS.Timeout;
		}
	> = new Map();

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
		this.emitter = new EventEmitter(ws, { incomingSchema, outgoingSchema });
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
	off<K extends keyof IncomingEvents & SystemEvents>(
		event: K,
		callback?: (data: IncomingEvents[K]) => any,
	): void {
		this.emitter.off(event as string, callback);
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
		this.emitter.on(event as string, callback);
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
		logger.info(`Socket trying to join room: "${room}".`);
		await this.subscribe(room)
			.catch((error) => {
				logger.error(`Subscription error for room ${room}:`, error);
			})
			.then(() => logger.success(`Joined room: ${room}`))
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
			logger.info(`Left room: ${room}`);
		} else {
			logger.warn(
				`Attempted to leave room "${room}" but no active controller found`,
			);
		}
	}

	/**
	 * Creates heartbeat mechanism for monitoring connection health
	 * Sends ping messages every 30 seconds and monitors for timeouts
	 * @param room - Room name for the heartbeat context
	 */
	private createHeartbeat(room: string) {
		const heartbeat = {
			sender: setInterval(async () => {
				await this.adapter.publish(room, ["ping", null]);
			}, 30000),

			monitor: setInterval(() => {
				const lastPingTime = this.lastPingTimes.get(room) ?? 0;

				if (Date.now() - lastPingTime > 45000) {
					logger.warn("Heartbeat timeout detected");
					this.unsubscribe(room).then(() => this.subscribe(room));
				}
			}, 5000),
		};

		this.heartbeatTimers.set(room, heartbeat);
	}

	/**
	 * Subscribes to a topic/room via the configured Pub/Sub adapter
	 * and processes incoming messages
	 * @param room - Room name to subscribe to
	 */
	private async subscribe(room: string): Promise<void> {
		// Return a new Promise that resolves once the subscription opens
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
								logger.info("Received message:", payload as any);

								const parsed = payload as any;

								if (Array.isArray(parsed)) {
									if (parsed[0] === "ping") {
										logger.success("Heartbeat received successfully");
										this.lastPingTimes.set(room, Date.now());
									}

									if (this.ws.readyState === WebSocket.OPEN) {
										this.ws.send(JSON.stringify(parsed));
									} else {
										logger.debug("WebSocket not open, skipping message");
									}
								} else {
									logger.warn("Invalid message payload (expected [event, data])");
								}
							} catch (err) {
								logger.debug("Failed to process message payload", err);
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
			logger.info(`Unsubscribed from room: ${room}`);
		} else {
			logger.warn(`No active subscription found for room: ${room}`);
		}
	}
}

/**
 * Type alias for optional Zod schema validation
 */
type Schema = ZodSchema | ZodType | undefined;

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

	private pingTimer?: NodeJS.Timeout;
	private pongTimer?: NodeJS.Timeout;
	private reconnectAttempts = 0;

	isConnected = false;

	/**
	 * Creates a new ClientSocket instance and immediately connects
	 * @param url - WebSocket server URL to connect to
	 * @param options - Optional configuration object
	 * @param options.incomingSchema - Zod schema for validating incoming events
	 * @param options.outgoingSchema - Zod schema for validating outgoing events
	 */
	constructor(
		url: string | URL,
		{
			incomingSchema,
			outgoingSchema,
		}: { incomingSchema?: Schema; outgoingSchema?: Schema } = {},
	) {
		this.url = url;
		this.incomingSchema = incomingSchema;
		this.outgoingSchema = outgoingSchema;

		this.connect();
	}

	/**
	 * Cleans up timers and intervals
	 * Called internally during connection lifecycle management
	 */
	cleanup() {
		if (this.pingTimer) {
			clearInterval(this.pingTimer);
			this.pingTimer = undefined;
		}

		if (this.pongTimer) {
			clearTimeout(this.pongTimer);
			this.pongTimer = undefined;
		}
	}

	/**
	 * Closes the WebSocket connection gracefully
	 * Cleans up timers and sets connection state to disconnected
	 */
	close() {
		this.cleanup();

		if (this.ws.readyState === WebSocket.OPEN) {
			this.ws.close(1000, "Client closed connection");
		}

		this.isConnected = false;
	}

	/**
	 * Establishes WebSocket connection with automatic reconnection logic
	 * Preserves existing event handlers across reconnections
	 * Implements exponential backoff for failed connections
	 */
	connect() {
		const ws = new WebSocket(this.url);

		const existingHandlers = this.emitter?.eventHandlers;

		this.emitter = new EventEmitter(ws, {
			incomingSchema: this.incomingSchema,
			outgoingSchema: this.outgoingSchema,
		});

		if (existingHandlers) {
			this.emitter.eventHandlers = new Map(existingHandlers);
		}

		this.ws = ws;

		ws.onerror = (err) => {
			const url = (err.currentTarget as WebSocket)?.url;

			if (typeof url === "string") {
				if (url.includes(":3000")) {
					console.error(`🚨 Cannot connect to WebSocket server

WebSocket connections require Cloudflare Workers (port 8080).
Node.js servers (port 3000) do not support WebSocket connections.

To start your Cloudflare Worker locally:
$ wrangler dev

Fix this issue: https://jsandy.com/docs/getting-started/local-development
          `);
				}
			} else {
				logger.error("Connection error:", err);
			}

			this.emitter.handleEvent("onError", err);
		};

		ws.onopen = () => {
			logger.success("Connected");
			this.isConnected = true;
			this.reconnectAttempts = 0;

			this.emitter.handleEvent("onConnect", undefined);
		};

		ws.onclose = () => {
			logger.warn("Connection closed, trying to reconnect...");
			this.isConnected = false;

			this.reconnectAttempts++;

			if (this.reconnectAttempts < 3) {
				setTimeout(() => this.connect(), 1500);
			} else {
				logger.error(
					"Failed to establish connection after multiple attempts. Check your network connection, or refresh the page to try again.",
				);
			}
		};

		ws.onmessage = (event) => {
			const data = z.string().parse(event.data);
			const eventSchema = z.tuple([z.string(), z.unknown()]);

			const parsedData = JSON.parse(data);

			const parseResult = eventSchema.safeParse(parsedData);

			if (parseResult.success) {
				const [eventName, eventData] = parseResult.data;
				this.emitter.handleEvent(eventName, eventData);
			} else {
				logger.warn("Unable to parse event:", event.data);
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
	off<K extends keyof IncomingEvents & SystemEvents>(
		event: K,
		callback?: (data: IncomingEvents[K]) => any,
	): void {
		this.emitter.off(event as string, callback);
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
		this.emitter.on(event as string, callback);
	}
}
