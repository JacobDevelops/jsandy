import type { ZodSchema } from "zod";
import { type ZodType, z } from "zod";
import { EventEmitter } from "./event-emitter";
import { logger } from "./logger";

/**
 * Configuration options for creating a ServerSocket instance
 */
interface ServerSocketOptions {
	/** Redis server URL for pub/sub functionality */
	redisUrl: string;
	/** Authentication token for Redis connection */
	redisToken: string;
	/** Zod schema for validating incoming events */
	incomingSchema: ZodSchema | ZodType;
	/** Zod schema for validating outgoing events */
	outgoingSchema: ZodSchema | ZodType;
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
 * Server-side WebSocket implementation with Redis pub/sub support for room-based messaging
 * @template IncomingEvents - Type definition for events this socket can receive
 * @template OutgoingEvents - Type definition for events this socket can emit
 */
export class ServerSocket<IncomingEvents, OutgoingEvents> {
	private room = "DEFAULT_ROOM";
	private ws: WebSocket;
	private controllers: Map<string, AbortController> = new Map();
	private emitter: EventEmitter;

	// private redis: Redis
	private redisUrl: string;
	private redisToken: string;
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
	 * @param opts - Configuration options including Redis connection details and schemas
	 */
	constructor(ws: WebSocket, opts: ServerSocketOptions) {
		const { incomingSchema, outgoingSchema, redisUrl, redisToken } = opts;

		this.redisUrl = redisUrl;
		this.redisToken = redisToken;
		// this.redis = new Redis({
		//   url: redisUrl,
		//   token: redisToken,
		// })

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
	 * Joins a room and subscribes to its messages via Redis pub/sub
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
				await fetch(`${this.redisUrl}/publish/${room}`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.redisToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(["ping", null]),
				});
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
	 * Subscribes to Redis pub/sub for a specific room
	 * Establishes Server-Sent Events stream and processes incoming messages
	 * @param room - Room name to subscribe to
	 */
	private async subscribe(room: string): Promise<void> {
		// Return a new Promise that encapsulates the asynchronous logic
		return new Promise<void>((resolve, reject) => {
			// Wrap the entire asynchronous logic in an IIFE or a named async function
			// and call it immediately. This allows you to use await inside.
			(async () => {
				try {
					const controller = new AbortController();
					this.controllers.set(room, controller);

					// initialize heartbeat
					this.lastPingTimes.set(room, Date.now());

					const stream = await fetch(`${this.redisUrl}/subscribe/${room}`, {
						headers: {
							Authorization: `Bearer ${this.redisToken}`,
							accept: "text/event-stream",
						},
						signal: controller.signal,
					});

					const reader = stream.body?.getReader();
					const decoder = new TextDecoder();
					let buffer = "";

					// Resolve the promise once the connection is established and
					// before entering the potentially long-running while loop.
					// This allows the caller of `subscribe` to know the subscription
					// has successfully initiated.
					resolve();

					while (reader) {
						const { done, value } = await reader.read();

						if (done) break;

						const chunk = decoder.decode(value);
						buffer += chunk;

						const messages = buffer.split("\n");
						buffer = messages.pop() || "";

						for (const message of messages) {
							logger.info("Received message:", message);
							if (message.startsWith("data: ")) {
								const data = message.slice(6);
								try {
									// extract payload from message format: message,room,payload
									// skip first two commas to get the start of the payload
									const firstCommaIndex = data.indexOf(",");
									const secondCommaIndex = data.indexOf(
										",",
										firstCommaIndex + 1,
									);

									if (firstCommaIndex === -1 || secondCommaIndex === -1) {
										logger.warn("Invalid message format - missing commas");
										continue;
									}

									const payloadStr = data.slice(secondCommaIndex + 1);

									if (!payloadStr) {
										logger.warn("Missing payload in message");
										continue;
									}

									const parsed = JSON.parse(payloadStr);

									if (parsed[0] === "ping") {
										logger.success("Heartbeat received successfully");
										this.lastPingTimes.set(room, Date.now());
									}

									if (this.ws.readyState === WebSocket.OPEN) {
										this.ws.send(JSON.stringify(parsed));
									} else {
										logger.debug("WebSocket not open, skipping message");
									}
								} catch (err) {
									logger.debug("Failed to parse message payload", err);
								}
							}
						}
					}
				} catch (err) {
					// If an error occurs anywhere within the async operations, reject the promise
					reject(err);
				}
			})(); // Call the IIFE immediately
		});
	}

	/**
	 * Unsubscribes from a room's Redis pub/sub stream
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
