import { type PubSubAdapter, UpstashRestPubSub } from "@jsandy/rpc/adapters";
import type { Logger } from "./event-emitter"; // reuse the tiny Logger interface you added there

// ---------- defaults ----------
const NullLogger: Logger = {
	debug() {},
	info() {},
	warn() {},
	error() {},
};
type RedactFn = (data: unknown) => unknown;
const defaultRedact: RedactFn = () => "[payload omitted]";

export interface IOOptions {
	/** Inject your own logger (pino/winston/console adapter) */
	logger?: Logger;
	/** Redact/shape payloads before logging (default: omit) */
	redact?: RedactFn;
	/**
	 * Channel used when no specific room is targeted. If omitted,
	 * calling `emit(...)` without `.to(room)` will log a warning and skip publish.
	 */
	broadcastChannel?: string | null;
}

/**
 * IO class for managing WebSocket communications through a generic Pub/Sub adapter
 * Provides type-safe event broadcasting to connected clients with room-based targeting
 *
 * @template OutgoingEvents - Type definition for events that can be sent to clients
 *
 * Features:
 * - Type Safety: Full TypeScript inference for event names and data
 * - Room Support: Target specific rooms or broadcast to all clients
 * - Provider Agnostic: Pluggable Pub/Sub adapter (Redis, Kafka, NATS, etc.)
 * - Fluent Interface: Chainable methods for intuitive API usage
 * - Automatic Cleanup: Resets target room after each emission
 *
 * @example
 * ```typescript
 * interface GameEvents {
 *   playerJoined: { playerId: string; name: string };
 *   gameStarted: { gameId: string; players: string[] };
 *   scoreUpdate: { playerId: string; score: number };
 * }
 *
 * const io = new IO<GameEvents>(pubsubAdapter);
 *
 * // Broadcast to all clients
 * await io.emit('gameStarted', { gameId: '123', players: ['Alice', 'Bob'] });
 *
 * // Send to specific room
 * await io.to('room-123').emit('scoreUpdate', { playerId: 'Alice', score: 100 });
 * ```
 */
export class IO<_IncomingEvents, OutgoingEvents> {
	/** Current target room for the next emission, null for broadcast to all */
	private targetRoom: string | null = null;

	/** Pluggable Pub/Sub adapter for message transport */
	private adapter: PubSubAdapter;

	/** Logging & redaction */
	private logger: Logger;
	private redact: RedactFn;

	/** Optional broadcast channel */
	private broadcastChannel: string | null;

	/**
	 * Creates a new IO instance for WebSocket communication management
	 *
	 * @param adapter - Generic Pub/Sub adapter implementation
	 *
	 * @example
	 * ```typescript
	 * // Example: Using a custom adapter implementation
	 * const io = new IO(pubsubAdapter)
	 * ```
	 */
	constructor(adapter: PubSubAdapter, opts?: IOOptions);
	constructor(redisUrl: string, redisToken: string, opts?: IOOptions);
	constructor(
		adapterOrUrl: PubSubAdapter | string,
		tokenOrOpts?: string | IOOptions,
		maybeOpts?: IOOptions,
	) {
		if (typeof adapterOrUrl === "string") {
			const url = adapterOrUrl;
			const token = typeof tokenOrOpts === "string" ? tokenOrOpts : "";
			this.adapter = new UpstashRestPubSub(url, token);
			const opts = typeof tokenOrOpts === "object" ? tokenOrOpts : maybeOpts;
			this.logger = opts?.logger ?? NullLogger;
			this.redact = opts?.redact ?? defaultRedact;
			this.broadcastChannel = opts?.broadcastChannel ?? null; // here
		} else {
			this.adapter = adapterOrUrl;
			const opts = typeof tokenOrOpts === "object" ? tokenOrOpts : maybeOpts;
			this.logger = opts?.logger ?? NullLogger;
			this.redact = opts?.redact ?? defaultRedact;
			this.broadcastChannel = opts?.broadcastChannel ?? null;
		}
	}

	/**
	 * Emits an event to connected clients through the configured Pub/Sub adapter
	 * Sends to a specific room if targeted, or broadcasts to all clients
	 *
	 * @template K - Event name type constrained to keys of OutgoingEvents
	 * @param event - Type-safe event name from the OutgoingEvents interface
	 * @param data - Event data matching the type defined for this event
	 * @returns Promise that resolves when the message is published
	 *
	 * @example
	 * ```typescript
	 * // Type-safe event emission
	 * await io.emit('playerJoined', {
	 *   playerId: 'user123',
	 *   name: 'Alice'
	 * });
	 *
	 * // Emit to specific room
	 * await io.to('game-room-1').emit('gameStarted', {
	 *   gameId: 'game123',
	 *   players: ['Alice', 'Bob']
	 * });
	 * ```
	 *
	 * Process:
	 * 1. Room Check: If a target room is set, publishes to that room via adapter
	 * 2. Adapter Publish: Sends event and data as JSON array to the adapter
	 * 3. Logging: Records the emission for debugging and monitoring
	 * 4. Cleanup: Resets target room to null for next emission
	 *
	 * Note: The target room is automatically reset after each emission to prevent
	 * accidental reuse. Use `.to(room)` before each `.emit()` call when targeting rooms.
	 */
	async emit<K extends Extract<keyof OutgoingEvents, string>>(
		event: K,
		data: OutgoingEvents[K],
	): Promise<void> {
		const dest = this.targetRoom ?? this.broadcastChannel ?? null;

		if (!dest) {
			this.logger.warn(
				"emit() called without .to(room) and no broadcastChannel set; skipping publish",
				{
					event,
				},
			);
			this.targetRoom = null; // always cleanup
			return;
		}

		try {
			await this.adapter.publish(dest, [event, data]);
			this.logger.info("IO publish", {
				room: this.targetRoom ? this.targetRoom : "(broadcast)",
				event,
				data: this.redact(data),
			});
		} catch (e) {
			this.logger.error("IO publish failed", {
				room: this.targetRoom ? this.targetRoom : "(broadcast)",
				event,
				error: e instanceof Error ? e.message : String(e),
			});
			// Intentionally don't rethrow; caller can decide if they need a strict variant
		} finally {
			// Reset target room after emitting to prevent accidental reuse
			this.targetRoom = null;
		}
	}

	/**
	 * Targets a specific room for the next emission
	 * Returns the IO instance for method chaining with emit()
	 *
	 * @param room - Room identifier to target for the next emission
	 * @returns The IO instance for method chaining
	 *
	 * @example
	 * ```typescript
	 * // Target a specific room and emit
	 * await io.to('chat-room-general').emit('message', {
	 *   user: 'Alice',
	 *   text: 'Hello everyone!'
	 * });
	 *
	 * // Target multiple rooms with separate calls
	 * await io.to('room-1').emit('notification', { type: 'info' });
	 * await io.to('room-2').emit('notification', { type: 'warning' });
	 * ```
	 *
	 * Behavior:
	 * - Fluent Interface: Enables chaining with `.emit()` for clean syntax
	 * - Single Use: Target room is reset after each emission
	 * - Room Scoping: Only clients subscribed to the specified room receive the message
	 *
	 * Note: If `.to()` is not called before `.emit()`, the message will broadcast
	 * to all connected clients (global broadcast).
	 */
	to(room: string): this {
		this.targetRoom = room;
		return this;
	}
}
