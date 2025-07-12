import { ZodError, type ZodType } from "zod";
import { logger } from "./logger";

/**
 * Schema type that can be either a ZodObject for validation or void for no validation
 */
type Schema = ZodType | undefined;

/**
 * Configuration interface for WebSocket message schemas
 */
interface SchemaConfig {
	/** Schema for validating incoming messages from clients */
	incomingSchema: Schema;
	/** Schema for validating outgoing messages to clients */
	outgoingSchema: Schema;
}

/**
 * Type-safe WebSocket event emitter with automatic schema validation
 * Provides a robust event system for WebSocket communication with built-in validation,
 * error handling, and logging capabilities
 *
 * Features:
 * - **Schema Validation**: Automatic validation of incoming and outgoing messages
 * - **Type Safety**: Full TypeScript inference for event data
 * - **Error Handling**: Comprehensive error logging and recovery
 * - **Event Management**: Register, unregister, and trigger event handlers
 * - **Connection State**: Automatic WebSocket state checking
 */
export class EventEmitter {
	/** Map storing event handlers organized by event name */
	eventHandlers = new Map<string, ((data: any) => any)[]>();

	/** WebSocket connection instance */
	ws: WebSocket;

	/** Zod schema for validating incoming messages */
	incomingSchema: Schema;

	/** Zod schema for validating outgoing messages */
	outgoingSchema: Schema;

	/**
	 * Creates a new EventEmitter instance with WebSocket and schema configuration
	 *
	 * @param ws - WebSocket connection to manage
	 * @param schemas - Schema configuration for message validation
	 * @param schemas.incomingSchema - Schema for validating incoming messages
	 * @param schemas.outgoingSchema - Schema for validating outgoing messages
	 *
	 * @example
	 * ```typescript
	 * const incomingSchema = z.object({
	 *   type: z.string(),
	 *   payload: z.any()
	 * });
	 *
	 * const outgoingSchema = z.object({
	 *   message: z.string(),
	 *   timestamp: z.date()
	 * });
	 *
	 * const emitter = new EventEmitter(websocket, {
	 *   incomingSchema,
	 *   outgoingSchema
	 * });
	 * ```
	 */
	constructor(ws: WebSocket, schemas: SchemaConfig) {
		const { incomingSchema, outgoingSchema } = schemas;

		this.ws = ws;
		this.incomingSchema = incomingSchema;
		this.outgoingSchema = outgoingSchema;
	}

	/**
	 * Emits an event with data through the WebSocket connection
	 * Validates outgoing data against the schema before sending
	 *
	 * @param event - Event name to emit
	 * @param data - Event data to send (will be validated against outgoingSchema)
	 * @returns Promise<boolean> or boolean indicating if the message was sent successfully
	 *
	 * @example
	 * ```typescript
	 * // Emit a chat message
	 * const success = emitter.emit('message', {
	 *   text: 'Hello World!',
	 *   timestamp: new Date()
	 * });
	 *
	 * if (!success) {
	 *   console.log('Failed to send message');
	 * }
	 * ```
	 *
	 * Behavior:
	 * - **Connection Check**: Verifies WebSocket is in OPEN state
	 * - **Schema Validation**: Validates data against outgoingSchema if present
	 * - **Error Handling**: Logs validation errors and returns false on failure
	 * - **Message Format**: Sends data as JSON array: [eventName, data]
	 */
	emit(event: string, data: any): boolean {
		// Check WebSocket connection state
		if (this.ws.readyState !== WebSocket.OPEN) {
			logger.warn("WebSocket is not in OPEN state. Message not sent.");
			return false;
		}

		// Validate outgoing data if schema is configured
		if (this.outgoingSchema) {
			try {
				this.outgoingSchema.parse(data);
			} catch (err) {
				this.handleSchemaMismatch(event, data, err);
				return false;
			}
		}

		// Send message as JSON array
		this.ws.send(JSON.stringify([event, data]));
		return true;
	}

	/**
	 * Handles schema validation errors for outgoing messages
	 * Provides detailed error logging with formatted error trees
	 *
	 * @param event - Event name that failed validation
	 * @param data - Data that failed validation
	 * @param err - Error that occurred during validation
	 *
	 * @private
	 */
	handleSchemaMismatch(event: string, data: any, err: any) {
		if (err instanceof ZodError) {
			logger.error(`Invalid outgoing event data for "${event}":`, {
				errors: err.issues
					.map((e) => `${e.path.join(".")}: ${e.message}`)
					.join(", "),
				data: JSON.stringify(data, null, 2),
			});
		} else {
			logger.error(`Error validating outgoing event "${event}":`, err);
		}
	}

	/**
	 * Processes incoming events by validating data and executing registered handlers
	 * Validates incoming data against schema and calls all registered event handlers
	 *
	 * @param eventName - Name of the event to handle
	 * @param data - Event data to validate and pass to handlers
	 *
	 * @throws {Error} If one or more handlers fail during execution
	 *
	 * @example
	 * ```typescript
	 * // This is typically called internally when messages are received
	 * emitter.handleEvent('userJoined', { userId: '123', name: 'Alice' });
	 * ```
	 *
	 * Process:
	 * 1. **Handler Check**: Verifies handlers are registered for the event
	 * 2. **Schema Validation**: Validates data against incomingSchema if present
	 * 3. **Handler Execution**: Calls all registered handlers with validated data
	 * 4. **Error Collection**: Logs individual handler errors and throws if any fail
	 */
	handleEvent(eventName: string, data: any) {
		const handlers = this.eventHandlers.get(eventName);

		if (!handlers?.length) {
			logger.warn(
				`No handlers registered for event "${eventName}". Did you forget to call .on("${eventName}", handler)?`,
			);
			return;
		}

		let validatedData = data;
		if (this.incomingSchema) {
			try {
				validatedData = this.incomingSchema.parse(data);
			} catch (err) {
				if (err instanceof ZodError) {
					logger.error(`Invalid incoming event data for "${eventName}":`, {
						errors: err.issues
							.map((e) => `${e.path.join(".")}: ${e.message}`)
							.join(", "),
						data: JSON.stringify(data, null, 2),
					});
				} else {
					logger.error(`Error validating incoming event "${eventName}":`, err);
				}
				return;
			}
		}

		let hasErrors = false;
		handlers.forEach((handler, index) => {
			try {
				handler(validatedData);
			} catch (err) {
				hasErrors = true;
				const error = err instanceof Error ? err : new Error(String(err));
				logger.error(
					`Error in handler ${index + 1}/${handlers.length} for event "${eventName}":`,
					{
						error: error.message,
						stack: error.stack,
						data: JSON.stringify(validatedData, null, 2),
					},
				);
			}
		});

		if (hasErrors) {
			throw new Error(
				`One or more handlers failed for event "${eventName}". Check logs for details.`,
			);
		}
	}

	/**
	 * Removes event handlers for a specific event
	 * Can remove all handlers for an event or a specific handler function
	 *
	 * @param event - Event name to remove handlers from
	 * @param callback - Optional specific handler to remove. If not provided, removes all handlers for the event
	 *
	 * @example
	 * ```typescript
	 * // Remove specific handler
	 * emitter.off('message', myMessageHandler);
	 *
	 * // Remove all handlers for an event
	 * emitter.off('message');
	 * ```
	 */
	off(event: string, callback?: (data: any) => any) {
		if (!callback) {
			// Remove all handlers for the event
			this.eventHandlers.delete(event as string);
		} else {
			// Remove specific handler
			const handlers = this.eventHandlers.get(event as string);
			if (handlers) {
				const index = handlers.indexOf(callback);
				if (index !== -1) {
					handlers.splice(index, 1);
					// Clean up empty handler arrays
					if (handlers.length === 0) {
						this.eventHandlers.delete(event as string);
					}
				}
			}
		}
	}

	/**
	 * Registers an event handler for a specific event
	 * Multiple handlers can be registered for the same event
	 *
	 * @param event - Event name to listen for
	 * @param callback - Handler function to execute when the event is received
	 *
	 * @example
	 * ```typescript
	 * // Register a message handler
	 * emitter.on('message', (data) => {
	 *   console.log('Received message:', data.text);
	 * });
	 *
	 * // Register multiple handlers for the same event
	 * emitter.on('userJoined', logUserJoin);
	 * emitter.on('userJoined', notifyOtherUsers);
	 * ```
	 *
	 * Note: If no callback is provided, an error is logged and the handler is not registered
	 */
	on(event: string, callback?: (data: any) => any): void {
		if (!callback) {
			logger.error(
				`No callback provided for event handler "${event.toString()}". Ppass a callback to handle this event.`,
			);
			return;
		}

		const handlers = this.eventHandlers.get(event as string) || [];
		handlers.push(callback);
		this.eventHandlers.set(event as string, handlers);
	}
}
