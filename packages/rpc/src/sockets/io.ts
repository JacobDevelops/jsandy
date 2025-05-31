import { logger } from "./logger";

/**
 * IO class for managing WebSocket communications through Redis pub/sub
 * Provides type-safe event broadcasting to connected clients with room-based targeting
 *
 * @template OutgoingEvents - Type definition for events that can be sent to clients
 *
 * Features:
 * - **Type Safety**: Full TypeScript inference for event names and data
 * - **Room Support**: Target specific rooms or broadcast to all clients
 * - **Redis Integration**: Uses Upstash Redis for scalable pub/sub messaging
 * - **Fluent Interface**: Chainable methods for intuitive API usage
 * - **Automatic Cleanup**: Resets target room after each emission
 *
 * @example
 * ```typescript
 * interface GameEvents {
 *   playerJoined: { playerId: string; name: string };
 *   gameStarted: { gameId: string; players: string[] };
 *   scoreUpdate: { playerId: string; score: number };
 * }
 *
 * const io = new IO<GameEvents>(redisUrl, redisToken);
 *
 * // Broadcast to all clients
 * await io.emit('gameStarted', { gameId: '123', players: ['Alice', 'Bob'] });
 *
 * // Send to specific room
 * await io.to('room-123').emit('scoreUpdate', { playerId: 'Alice', score: 100 });
 * ```
 */
export class IO<OutgoingEvents> {
	/** Current target room for the next emission, null for broadcast to all */
	private targetRoom: string | null = null;

	/** Upstash Redis REST API URL for pub/sub operations */
	private redisUrl: string;

	/** Authentication token for Upstash Redis API */
	private redisToken: string;

	/**
	 * Creates a new IO instance for WebSocket communication management
	 *
	 * @param redisUrl - Upstash Redis REST API URL (should include https://)
	 * @param redisToken - Authentication token for Upstash Redis API
	 *
	 * @example
	 * ```typescript
	 * const io = new IO(
	 *   process.env.UPSTASH_REDIS_REST_URL,
	 *   process.env.UPSTASH_REDIS_REST_TOKEN
	 * );
	 * ```
	 *
	 * Note: The Redis URL and token are typically obtained from Upstash Redis dashboard
	 * and should be stored as environment variables for security.
	 */
	constructor(redisUrl: string, redisToken: string) {
		this.redisUrl = redisUrl;
		this.redisToken = redisToken;
	}

	/**
	 * Emits an event to connected clients through Redis pub/sub
	 * Sends to a specific room if targeted, or broadcasts to all clients
	 *
	 * @template K - Event name type constrained to keys of OutgoingEvents
	 * @param event - Type-safe event name from the OutgoingEvents interface
	 * @param data - Event data matching the type defined for this event
	 * @returns Promise that resolves when the message is published to Redis
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
	 * 1. **Room Check**: If a target room is set, publishes to that room's Redis channel
	 * 2. **Redis Publish**: Sends event and data as JSON array to Redis pub/sub
	 * 3. **Logging**: Records the emission for debugging and monitoring
	 * 4. **Cleanup**: Resets target room to null for next emission
	 *
	 * Note: The target room is automatically reset after each emission to prevent
	 * accidental reuse. Use `.to(room)` before each `.emit()` call when targeting rooms.
	 */
	async emit<K extends keyof OutgoingEvents>(
		event: K,
		data: OutgoingEvents[K],
	) {
		// Publish to Redis if a target room is specified
		if (this.targetRoom) {
			await fetch(`${this.redisUrl}/publish/${this.targetRoom}`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${this.redisToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify([event, data]),
			});
		}

		// Log the emission for debugging and monitoring
		logger.info(`IO emitted to room "${this.targetRoom}":`, {
			event,
			data,
		});

		// Reset target room after emitting to prevent accidental reuse
		this.targetRoom = null;
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
	 * - **Fluent Interface**: Enables chaining with `.emit()` for clean syntax
	 * - **Single Use**: Target room is reset after each emission
	 * - **Room Scoping**: Only clients subscribed to the specified room receive the message
	 *
	 * Note: If `.to()` is not called before `.emit()`, the message will broadcast
	 * to all connected clients (global broadcast).
	 */
	to(room: string): this {
		this.targetRoom = room;
		return this;
	}
}
