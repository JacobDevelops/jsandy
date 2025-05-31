import { logger } from "./logger";
import { type ZodObject, type ZodType, z } from "zod/v4";
import type { OptionalPromise } from "../types";
import {
	EventEmitter,
	type EventHandler,
	type InferSchemaType,
} from "./event-emitter";

/**
 * Configuration options for ServerSocket initialization
 */
interface ServerSocketOptions {
	/** Upstash Redis REST API URL */
	redisUrl: string;
	/** Authentication token for Upstash Redis API */
	redisToken: string;
	/** Zod schema for validating incoming messages */
	incomingSchema: ZodObject | void;
	/** Zod schema for validating outgoing messages */
	outgoingSchema: ZodObject | void;
}

/**
 * System-level events that are automatically handled by the socket infrastructure
 */
export interface SystemEvents {
	/** Fired when a client connects to the WebSocket */
	onConnect: void;
	/** Fired when an error occurs in the WebSocket connection */
	onError: Error;
}

/**
 * Extracts event key names from schema types
 * @template T - Schema type to extract keys from
 */
type EventKeys<T> = T extends ZodObject
	? keyof T["shape"]
	: T extends Record<PropertyKey, unknown>
		? keyof T
		: string;

/**
 * Infers event data types from schema and event key
 * @template T - Schema type containing event definitions
 * @template K - Event key to extract data type for
 */
type EventData<T, K extends PropertyKey> = T extends ZodObject
	? K extends keyof T["shape"]
		? T["shape"][K] extends ZodType
			? z.infer<T["shape"][K]>
			: T["shape"][K]
		: never
	: T extends Record<PropertyKey, unknown>
		? K extends keyof T
			? T[K]
			: never
		: unknown;

/**
 * Server-side WebSocket connection handler with Redis pub/sub integration
 * Manages individual client connections with room-based messaging, heartbeat monitoring,
 * and automatic reconnection handling
 *
 * @template IncomingEvents - Type definition for events that can be received from clients
 * @template OutgoingEvents - Type definition for events that can be sent to clients
 *
 * Features:
 * - **Room Management**: Join/leave rooms for targeted messaging
 * - **Redis Integration**: Scalable pub/sub messaging through Upstash Redis
 * - **Heartbeat Monitoring**: Automatic connection health checks with reconnection
 * - **Schema Validation**: Type-safe message validation using Zod schemas
 * - **Event Handling**: Comprehensive event system with error handling
 * - **Resource Cleanup**: Proper cleanup of timers and subscriptions
 *
 * @example
 * ```typescript
 * interface ChatEvents {
 *   message: { user: string; text: string };
 *   userJoined: { userId: string; name: string };
 * }
 *
 * const socket = new ServerSocket<ChatEvents, ChatEvents>(websocket, {
 *   redisUrl: process.env.UPSTASH_REDIS_REST_URL,
 *   redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
 *   incomingSchema: chatSchema,
 *   outgoingSchema: chatSchema
 * });
 *
 * // Join a chat room
 * await socket.join('general-chat');
 *
 * // Listen for messages
 * socket.on('message', (data) => {
 *   console.log(`${data.user}: ${data.text}`);
 * });
 * ```
 */
export class ServerSocket<IncomingEvents, OutgoingEvents> {
	/** Current room the socket is subscribed to */
	private room = "DEFAULT_ROOM";

	/** WebSocket connection instance */
	private ws: WebSocket;

	/** Map of AbortControllers for managing Redis subscriptions */
	private controllers: Map<string, AbortController> = new Map();

	/** EventEmitter instance for handling WebSocket events */
	private emitter: EventEmitter;

	/** Upstash Redis REST API URL */
	private redisUrl: string;

	/** Authentication token for Upstash Redis API */
	private redisToken: string;

	/** Map tracking last ping timestamps for heartbeat monitoring */
	private lastPingTimes: Map<string, number> = new Map();

	/** Map of heartbeat timers for connection health monitoring */
	private heartbeatTimers: Map<
		string,
		{
			/** Timer for sending periodic ping messages */
			sender: NodeJS.Timeout;
			/** Timer for monitoring ping response timeouts */
			monitor: NodeJS.Timeout;
		}
	> = new Map();

	/**
	 * Creates a new ServerSocket instance for managing a WebSocket connection
	 *
	 * @param ws - WebSocket connection to manage
	 * @param opts - Configuration options including Redis credentials and schemas
	 *
	 * @example
	 * ```typescript
	 * const socket = new ServerSocket(websocket, {
	 *   redisUrl: 'https://your-redis.upstash.io',
	 *   redisToken: 'your-redis-token',
	 *   incomingSchema: z.object({ type: z.string(), data: z.any() }),
	 *   outgoingSchema: z.object({ event: z.string(), payload: z.any() })
	 * });
	 * ```
	 */
	constructor(ws: WebSocket, opts: ServerSocketOptions) {
		const { incomingSchema, outgoingSchema, redisUrl, redisToken } = opts;

		this.redisUrl = redisUrl;
		this.redisToken = redisToken;

		this.ws = ws;
		this.emitter = new EventEmitter(ws, { incomingSchema, outgoingSchema });
	}

	/**
	 * Gets the list of rooms this socket is currently subscribed to
	 * @returns Array of room names (currently only supports one room)
	 */
	get rooms() {
		return [this.room];
	}

	/**
	 * Closes the WebSocket connection and cleans up all resources
	 * Aborts all Redis subscriptions and clears heartbeat timers
	 *
	 * @example
	 * ```typescript
	 * // Clean shutdown
	 * socket.close();
	 * ```
	 */
	close() {
		this.ws.close();

		// Clear all active Redis subscriptions
		for (const controller of this.controllers.values()) {
			controller.abort();
		}
		this.controllers.clear();

		// Clear all heartbeat monitoring timers
		for (const timers of this.heartbeatTimers.values()) {
			clearInterval(timers.sender);
			clearInterval(timers.monitor);
		}
		this.heartbeatTimers.clear();
	}

	/**
	 * Removes an event listener for incoming events
	 *
	 * @template K - Event key type constrained to incoming events and system events
	 * @param event - Event name to remove listener from
	 * @param callback - Optional specific callback to remove. If not provided, removes all listeners
	 *
	 * @example
	 * ```typescript
	 * // Remove specific handler
	 * socket.off('message', myMessageHandler);
	 *
	 * // Remove all handlers for an event
	 * socket.off('message');
	 * ```
	 */
	off<K extends keyof IncomingEvents & SystemEvents>(
		event: K,
		callback?: (data: IncomingEvents[K]) => unknown,
	) {
		return this.emitter.off(event as string, callback as EventHandler);
	}

	/**
	 * Registers an event listener for incoming events
	 *
	 * @template K - Event key type from the IncomingEvents schema
	 * @param event - Event name to listen for
	 * @param callback - Handler function to execute when the event is received
	 *
	 * @example
	 * ```typescript
	 * // Listen for chat messages
	 * socket.on('message', (data) => {
	 *   console.log(`Received: ${data.text} from ${data.user}`);
	 * });
	 *
	 * // Listen for system events
	 * socket.on('onConnect', () => {
	 *   console.log('Client connected');
	 * });
	 * ```
	 */
	on<K extends EventKeys<IncomingEvents>>(
		event: K,
		callback?: (data: EventData<IncomingEvents, K>) => unknown,
	) {
		return this.emitter.on(event as string, callback as EventHandler);
	}

	/**
	 * Emits an event to the connected client
	 *
	 * @template K - Event key type from the OutgoingEvents schema
	 * @param event - Event name to emit
	 * @param data - Event data matching the schema for this event
	 * @returns Promise<boolean> or boolean indicating if the message was sent successfully
	 *
	 * @example
	 * ```typescript
	 * // Send a message to the client
	 * const success = await socket.emit('notification', {
	 *   type: 'info',
	 *   message: 'Welcome to the chat!'
	 * });
	 * ```
	 */
	emit<K extends EventKeys<OutgoingEvents>>(
		event: K,
		data: EventData<OutgoingEvents, K>,
	): OptionalPromise<boolean> {
		return this.emitter.emit(event as string, data);
	}

	/**
	 * Handles incoming events from the WebSocket connection
	 * Delegates to the internal EventEmitter for validation and processing
	 *
	 * @param eventName - Name of the event to handle
	 * @param eventData - Event data to validate and process
	 *
	 * @internal
	 */
	handleEvent(eventName: string, eventData: InferSchemaType<Schema>) {
		this.emitter.handleEvent(eventName, eventData);
	}

	/**
	 * Joins a Redis pub/sub room for receiving targeted messages
	 * Establishes subscription and starts heartbeat monitoring
	 *
	 * @param room - Room identifier to join
	 * @returns Promise that resolves when the room is successfully joined
	 *
	 * @example
	 * ```typescript
	 * // Join a game room
	 * await socket.join('game-room-123');
	 *
	 * // Join a chat channel
	 * await socket.join('chat-general');
	 * ```
	 *
	 * Process:
	 * 1. Sets the current room
	 * 2. Establishes Redis subscription
	 * 3. Starts heartbeat monitoring
	 * 4. Handles subscription errors gracefully
	 */
	async join(room: string): Promise<void> {
		this.room = room;
		logger.info(`Socket trying to join room: "${room}".`);
		await this.subscribe(room)
			.catch((error) => {
				logger.error(`Subscription error for room ${room}:`, error);
			})
			.then(() => logger.info(`Joined room: ${room}`))
			.then(() => this.createHeartbeat(room));
	}

	/**
	 * Leaves a Redis pub/sub room and stops receiving messages
	 *
	 * @param room - Room identifier to leave
	 *
	 * @example
	 * ```typescript
	 * // Leave current room
	 * socket.leave('game-room-123');
	 * ```
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
	 * Creates heartbeat monitoring system for connection health
	 * Sets up periodic ping messages and timeout detection
	 *
	 * @param room - Room to monitor heartbeat for
	 * @private
	 */
	private createHeartbeat(room: string) {
		const heartbeat = {
			// Send ping every 30 seconds
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

			// Monitor for ping responses every 5 seconds
			monitor: setInterval(() => {
				const lastPingTime = this.lastPingTimes.get(room) ?? 0;

				// If no ping response in 45 seconds, reconnect
				if (Date.now() - lastPingTime > 45000) {
					logger.warn("Heartbeat timeout detected");
					this.unsubscribe(room).then(() => this.subscribe(room));
				}
			}, 5000),
		};

		this.heartbeatTimers.set(room, heartbeat);
	}

	/**
	 * Establishes Redis subscription for real-time message streaming
	 * Creates an AbortController for subscription management
	 *
	 * @param room - Room to subscribe to
	 * @returns Promise that resolves when subscription is established
	 * @private
	 */
	private async subscribe(room: string): Promise<void> {
		try {
			const controller = new AbortController();
			this.controllers.set(room, controller);

			// Initialize heartbeat tracking
			this.lastPingTimes.set(room, Date.now());

			// Establish Server-Sent Events stream
			const stream = await fetch(`${this.redisUrl}/subscribe/${room}`, {
				headers: {
					Authorization: `Bearer ${this.redisToken}`,
					accept: "text/event-stream",
				},
				signal: controller.signal,
			});

			const reader = stream.body?.getReader();
			const decoder = new TextDecoder();
			const buffer = "";

			// Start background message processing
			this.processStreamMessages(reader, decoder, buffer, room);

			return;
		} catch (err) {
			logger.error("Error establishing subscription:", err);
			throw err;
		}
	}

	/**
	 * Processes incoming Redis stream messages in real-time
	 * Handles message parsing, heartbeat tracking, and WebSocket forwarding
	 *
	 * @param reader - ReadableStream reader for processing chunks
	 * @param decoder - TextDecoder for converting bytes to strings
	 * @param buffer - String buffer for incomplete messages
	 * @param room - Room being processed
	 * @private
	 */
	private async processStreamMessages(
		reader: ReadableStreamDefaultReader<Uint8Array> | undefined,
		decoder: TextDecoder,
		buffer: string,
		room: string,
	): Promise<void> {
		try {
			let newBuffer = buffer;
			while (reader) {
				const { done, value } = await reader.read();

				if (done) break;

				const chunk = decoder.decode(value);
				newBuffer += chunk;

				// Split messages by newlines
				const messages = newBuffer.split("\n");
				newBuffer = messages.pop() || "";

				for (const message of messages) {
					logger.info("Received message:", message);
					if (message.startsWith("data: ")) {
						const data = message.slice(6);
						try {
							// Parse Redis message format: message,room,payload
							const firstCommaIndex = data.indexOf(",");
							const secondCommaIndex = data.indexOf(",", firstCommaIndex + 1);

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

							// Handle heartbeat responses
							if (parsed[0] === "ping") {
								logger.info("Heartbeat received successfully");
								this.lastPingTimes.set(room, Date.now());
							}

							// Forward message to WebSocket client
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
			logger.error("Error processing stream messages:", err);
		}
	}

	/**
	 * Unsubscribes from a Redis room and cleans up the controller
	 *
	 * @param room - Room to unsubscribe from
	 * @private
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
 * Schema type for client socket validation
 */
type Schema = ZodObject | undefined;

/**
 * Client-side WebSocket connection with automatic reconnection and event handling
 * Manages WebSocket connections from the client side with built-in reconnection logic,
 * heartbeat monitoring, and type-safe event communication
 *
 * @template IncomingEvents - Type definition for events that can be received from server
 * @template OutgoingEvents - Type definition for events that can be sent to server
 *
 * Features:
 * - **Automatic Reconnection**: Handles connection drops with retry logic
 * - **Schema Validation**: Type-safe message validation using Zod schemas
 * - **Event Handling**: Comprehensive event system with error handling
 * - **Connection State**: Tracks connection status and manages cleanup
 * - **Development Helpers**: Provides helpful error messages for common issues
 *
 * @example
 * ```typescript
 * interface GameEvents {
 *   move: { player: string; position: { x: number; y: number } };
 *   gameOver: { winner: string; score: number };
 * }
 *
 * const socket = new ClientSocket<GameEvents, GameEvents>(
 *   'wss://api.example.com/game',
 *   {
 *     incomingSchema: gameEventSchema,
 *     outgoingSchema: gameEventSchema
 *   }
 * );
 *
 * // Listen for game events
 * socket.on('gameOver', (data) => {
 *   console.log(`Game over! Winner: ${data.winner}`);
 * });
 *
 * // Send player moves
 * socket.emit('move', { player: 'alice', position: { x: 10, y: 20 } });
 * ```
 */
export class ClientSocket<IncomingEvents extends SystemEvents, OutgoingEvents> {
	/** WebSocket connection instance */
	private ws!: WebSocket;

	/** EventEmitter instance for handling WebSocket events */
	private emitter!: EventEmitter;

	/** WebSocket URL for connection */
	private url: string | URL;

	/** Zod schema for validating incoming messages */
	private incomingSchema: Schema;

	/** Zod schema for validating outgoing messages */
	private outgoingSchema: Schema;

	/** Timer for sending periodic ping messages */
	private pingTimer?: NodeJS.Timeout;

	/** Timer for monitoring pong responses */
	private pongTimer?: NodeJS.Timeout;

	/** Counter for tracking reconnection attempts */
	private reconnectAttempts = 0;

	/** Current connection status */
	isConnected = false;

	/**
	 * Creates a new ClientSocket instance and establishes connection
	 *
	 * @param url - WebSocket URL to connect to (ws:// or wss://)
	 * @param options - Optional configuration including validation schemas
	 * @param options.incomingSchema - Schema for validating incoming messages
	 * @param options.outgoingSchema - Schema for validating outgoing messages
	 *
	 * @example
	 * ```typescript
	 * // Basic connection
	 * const socket = new ClientSocket('wss://api.example.com/ws');
	 *
	 * // With schema validation
	 * const socket = new ClientSocket('wss://api.example.com/ws', {
	 *   incomingSchema: z.object({ type: z.string(), data: z.any() }),
	 *   outgoingSchema: z.object({ event: z.string(), payload: z.any() })
	 * });
	 * ```
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
	 * Cleans up all timers and resources
	 * Called during connection cleanup or before reconnection
	 *
	 * @private
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
	 * Closes the WebSocket connection and cleans up resources
	 *
	 * @example
	 * ```typescript
	 * // Clean shutdown
	 * socket.close();
	 * ```
	 */
	close() {
		this.cleanup();

		if (this.ws.readyState === WebSocket.OPEN) {
			this.ws.close(1000, "Client closed connection");
		}

		this.isConnected = false;
	}

	/**
	 * Establishes WebSocket connection with comprehensive event handling
	 * Sets up automatic reconnection, error handling, and message processing
	 *
	 * @example
	 * ```typescript
	 * // Manually reconnect (usually automatic)
	 * socket.connect();
	 * ```
	 *
	 * Connection Process:
	 * 1. Creates new WebSocket instance
	 * 2. Preserves existing event handlers during reconnection
	 * 3. Sets up error, open, close, and message event handlers
	 * 4. Implements automatic reconnection with exponential backoff
	 */
	connect() {
		const ws = new WebSocket(this.url);

		// Preserve existing event handlers during reconnection
		const existingHandlers = this.emitter?.eventHandlers;

		this.emitter = new EventEmitter(ws, {
			incomingSchema: this.incomingSchema,
			outgoingSchema: this.outgoingSchema,
		});

		if (existingHandlers) {
			this.emitter.eventHandlers = new Map(existingHandlers);
		}

		this.ws = ws;

		// Handle connection errors with helpful development messages
		ws.onerror = (err) => {
			const url = (err.currentTarget as WebSocket)?.url;

			if (typeof url === "string") {
				if (url.includes(":3000")) {
					console.error(`🚨 Cannot connect to WebSocket server

WebSocket connections require Cloudflare Workers (port 8080).
Node.js servers (port 3000) do not support WebSocket connections.

To start your Cloudflare Worker locally:
$ wrangler dev

Fix this issue: https://jsandy.app/docs/getting-started/local-development
          `);
				}
			} else {
				console.error("Connection error:", err);
			}

			this.emitter.handleEvent("onError", err);
		};

		// Handle successful connection
		ws.onopen = () => {
			console.info("Connected");
			this.isConnected = true;
			this.reconnectAttempts = 0;

			this.emitter.handleEvent("onConnect", undefined);
		};

		// Handle connection close with automatic reconnection
		ws.onclose = () => {
			console.warn("Connection closed, trying to reconnect...");
			this.isConnected = false;

			this.reconnectAttempts++;

			// Retry up to 3 times with 1.5 second delay
			if (this.reconnectAttempts < 3) {
				setTimeout(() => this.connect(), 1500);
			} else {
				console.error(
					"Failed to establish connection after multiple attempts. Check your network connection, or refresh the page to try again.",
				);
			}
		};

		// Handle incoming messages with validation
		ws.onmessage = (event) => {
			const data = z.string().parse(event.data);
			const eventSchema = z.tuple([z.string(), z.unknown()]);

			const parsedData = JSON.parse(data);
			const parseResult = eventSchema.safeParse(parsedData);

			if (parseResult.success) {
				const [eventName, eventData] = parseResult.data;
				this.emitter.handleEvent(
					eventName,
					eventData as InferSchemaType<Schema>,
				);
			} else {
				console.warn("Unable to parse event:", event.data);
			}
		};
	}

	/**
	 * Emits an event to the server
	 *
	 * @template K - Event key type from the OutgoingEvents schema
	 * @param event - Event name to emit
	 * @param data - Event data matching the schema for this event
	 * @returns Promise<boolean> or boolean indicating if the message was sent successfully
	 *
	 * @example
	 * ```typescript
	 * // Send a chat message
	 * const success = await socket.emit('message', {
	 *   text: 'Hello everyone!',
	 *   timestamp: new Date()
	 * });
	 *
	 * if (!success) {
	 *   console.log('Failed to send message');
	 * }
	 * ```
	 */
	emit<K extends keyof OutgoingEvents>(
		event: K,
		data: OutgoingEvents[K],
	): OptionalPromise<boolean> {
		return this.emitter.emit(event as string, data);
	}

	/**
	 * Removes an event listener for incoming events
	 *
	 * @template K - Event key type constrained to incoming events and system events
	 * @param event - Event name to remove listener from
	 * @param callback - Optional specific callback to remove. If not provided, removes all listeners
	 *
	 * @example
	 * ```typescript
	 * // Remove specific handler
	 * socket.off('message', myMessageHandler);
	 *
	 * // Remove all handlers for an event
	 * socket.off('message');
	 * ```
	 */
	off<K extends keyof IncomingEvents & SystemEvents>(
		event: K,
		callback?: (data: IncomingEvents[K]) => unknown,
	) {
		return this.emitter.off(event as string, callback as EventHandler);
	}

	/**
	 * Registers an event listener for incoming events
	 *
	 * @template K - Event key type from the IncomingEvents schema
	 * @param event - Event name to listen for
	 * @param callback - Handler function to execute when the event is received
	 *
	 * @example
	 * ```typescript
	 * // Listen for server messages
	 * socket.on('notification', (data) => {
	 *   showNotification(data.message, data.type);
	 * });
	 *
	 * // Listen for connection events
	 * socket.on('onConnect', () => {
	 *   console.log('Successfully connected to server');
	 * });
	 *
	 * socket.on('onError', (error) => {
	 *   console.error('Connection error:', error);
	 * });
	 * ```
	 */
	on<K extends keyof IncomingEvents>(
		event: K,
		callback?: (data: IncomingEvents[K]) => unknown,
	) {
		return this.emitter.on(event as string, callback as EventHandler);
	}
}
