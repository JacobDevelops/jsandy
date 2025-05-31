import type superjson from "superjson";
import type { Context, TypedResponse } from "hono";
import type { Env, Input } from "hono/types";
import type { StatusCode } from "hono/utils/http-status";
import type { ZodObject, ZodRawShape, z } from "zod/v4";
import type { Router } from "../router";
import type { IO, ServerSocket } from "../sockets";

/**
 * Represents the type returned by superjson.parse for a given type T
 * @template T - The type to be parsed by superjson
 */
type SuperJSONParsedType<T> = ReturnType<typeof superjson.parse<T>>;

/**
 * A typed response that uses SuperJSON for serialization
 * @template T - The data type to be serialized
 * @template U - The HTTP status code type, defaults to StatusCode
 */
export type SuperJSONTypedResponse<
	T,
	U extends StatusCode = StatusCode,
> = TypedResponse<SuperJSONParsedType<T>, U, "json">;

/**
 * Configuration interface for router setup
 */
export interface RouterConfig {
	/** Optional name identifier for the router */
	name?: string;
}

/**
 * Handler object that provides superjson serialization functionality
 */
export type SuperJSONHandler = {
	/**
	 * Serializes data using superjson and returns a typed response
	 * @template T - The type of data to serialize
	 * @param data - The data to serialize
	 * @param status - Optional HTTP status code
	 * @returns SuperJSON typed response
	 */
	superjson: <T>(data: T, status?: number) => SuperJSONTypedResponse<T>;
};

/**
 * Extended Hono context that includes SuperJSON serialization capabilities
 * @template E - Environment type, defaults to Env
 * @template P - Path parameter type, defaults to string
 * @template I - Input type, defaults to Input
 */
export type ContextWithSuperJSON<
	E extends Env = Env,
	P extends string = string,
	I extends Input = Input,
> = Context<E, P, I> & SuperJSONHandler;

/**
 * Infers the output type from a middleware function
 * @template T - The middleware function type to infer from
 */
export type InferMiddlewareOutput<T> = T extends MiddlewareFunction<
	unknown,
	infer R,
	Env
>
	? R
	: unknown;

/**
 * Function type for middleware operations with context chaining
 * @template T - Context object type, defaults to Record<string, unknown>
 * @template R - Return type, defaults to void
 * @template E - Environment type, defaults to Env
 */
export type MiddlewareFunction<
	T = Record<string, unknown>,
	R = void,
	E extends Env = Env,
> = (params: {
	/** Current context object */
	ctx: T;
	/** Function to call next middleware with optional context extension */
	next: <B extends Record<string, unknown>>(args?: B) => Promise<B & T>;
	/** Hono context with SuperJSON capabilities */
	c: ContextWithSuperJSON<E>;
}) => Promise<R>;

/**
 * Function type for emitting events to all connected clients
 * @param event - Event name to emit
 * @param data - Optional data to send with the event
 * @returns Promise that resolves when event is emitted
 */
export type EmitFunction = (event: string, data?: unknown) => Promise<void>;

/**
 * Function type for emitting events to a specific room
 * @param room - Room identifier to emit to
 * @param data - Optional data to send with the event
 * @returns Promise that resolves when event is emitted
 */
export type RoomEmitFunction = (room: string, data?: unknown) => Promise<void>;

/**
 * Infers the data type from a WebSocket schema, returning void if not a ZodObject
 * @template T - The schema type to infer from
 */
export type InferWebSocketData<T> = T extends ZodObject ? z.infer<T> : void;

/**
 * Handler object for WebSocket lifecycle events
 * @template IncomingSchema - Schema type for incoming messages
 * @template OutgoingSchema - Schema type for outgoing messages
 */
export type WebSocketHandler<IncomingSchema, OutgoingSchema> = {
	/** Optional handler called when a client connects */
	onConnect?: ({
		socket,
	}: {
		socket: ServerSocket<IncomingSchema, OutgoingSchema>;
	}) => unknown;
	/** Optional handler called when a client disconnects */
	onDisconnect?: ({
		socket,
	}: {
		socket: ServerSocket<IncomingSchema, OutgoingSchema>;
	}) => unknown;
	/** Optional handler called when an error occurs */
	onError?: ({
		socket,
		error,
	}: {
		socket: ServerSocket<IncomingSchema, OutgoingSchema>;
		error: Event;
	}) => unknown;
};

/**
 * Operation definition for WebSocket endpoints
 * @template IncomingSchema - Schema type for incoming messages
 * @template OutgoingSchema - Schema type for outgoing messages
 * @template E - Environment type, defaults to Env
 */
export type WebSocketOperation<
	IncomingSchema,
	OutgoingSchema,
	E extends Env = Env,
> = {
	/** Operation type identifier */
	type: "ws";
	/** Optional schema for incoming messages */
	incoming?: IncomingSchema;
	/** Optional schema for outgoing messages */
	outgoing?: OutgoingSchema;
	/** Output format specification */
	outputFormat: "ws";
	/** Handler function that returns WebSocket event handlers */
	handler: (params: {
		/** IO interface for WebSocket communication */
		io: IO<OutgoingSchema>;
		/** Hono context with SuperJSON capabilities */
		c: ContextWithSuperJSON<E>;
		/** Current context object */
		ctx: Record<string, unknown>;
	}) => OptionalPromise<WebSocketHandler<IncomingSchema, OutgoingSchema>>;
	/** Array of middleware functions to apply */
	middlewares: MiddlewareFunction<Record<string, unknown>, unknown, E>[];
};

/**
 * Union type for possible response types from route handlers
 * @template Output - The output data type
 */
export type ResponseType<Output> =
	| SuperJSONTypedResponse<Output>
	| TypedResponse<Output, StatusCode, "text">
	| Response
	| void;

/**
 * Utility type to unwrap response types from promises and typed responses
 * @template T - The response type to unwrap
 */
type UnwrapResponse<T> = Awaited<T> extends TypedResponse<infer U>
	? U
	: Awaited<T> extends SuperJSONTypedResponse<infer U>
		? U
		: Awaited<T> extends Response
			? unknown
			: Awaited<T> extends void
				? void
				: T;

/**
 * Operation definition for GET HTTP endpoints
 * @template Schema - Input schema type
 * @template Return - Return type, defaults to OptionalPromise<ResponseType<unknown>>
 * @template E - Environment type, defaults to Env
 */
export type GetOperation<
	Schema,
	Return = OptionalPromise<ResponseType<unknown>>,
	E extends Env = Env,
> = {
	/** Operation type identifier */
	type: "get";
	/** Optional input validation schema */
	schema?: Schema;
	/** Handler function for the GET operation */
	handler: (params: {
		/** Hono context with SuperJSON capabilities */
		c: ContextWithSuperJSON<E>;
		/** Current context object */
		ctx: Record<string, unknown>;
		/** Validated input data based on schema */
		input: InferSchema<Schema>;
	}) => UnwrapResponse<OptionalPromise<Return>>;
	/** Array of middleware functions to apply */
	middlewares: MiddlewareFunction<Record<string, unknown>, unknown, E>[];
};

/**
 * Operation definition for POST HTTP endpoints
 * @template Schema - Input schema type
 * @template Return - Return type, defaults to OptionalPromise<ResponseType<unknown>>
 * @template E - Environment type, defaults to Env
 */
export type PostOperation<
	Schema,
	Return = OptionalPromise<ResponseType<unknown>>,
	E extends Env = Env,
> = {
	/** Operation type identifier */
	type: "post";
	/** Optional input validation schema */
	schema?: Schema;
	/** Handler function for the POST operation */
	handler: (params: {
		/** Current context object */
		ctx: Record<string, unknown>;
		/** Hono context with SuperJSON capabilities */
		c: ContextWithSuperJSON<E>;
		/** Validated input data based on schema */
		input: InferSchema<Schema>;
	}) => UnwrapResponse<OptionalPromise<Return>>;
	/** Array of middleware functions to apply */
	middlewares: MiddlewareFunction<Record<string, unknown>, unknown, E>[];
};

/**
 * Union type for all possible operation types
 * @template I - Input schema type
 * @template O - Output schema type
 * @template E - Environment type, defaults to Env
 */
export type OperationType<I, O, E extends Env = Env> =
	| GetOperation<I, O, E>
	| PostOperation<I, O, E>
	| WebSocketOperation<I, O, E>;

/**
 * Infers TypeScript types from Zod schemas, returning void for non-ZodObject types
 * @template T - The schema type to infer from
 */
export type InferSchema<T> = T extends ZodObject<
	infer Shape extends ZodRawShape
>
	? {
			[K in keyof Shape]: Shape[K] extends z.ZodType<infer U> ? U : void;
		}
	: void;

/**
 * Infers the input type from various operation types
 * @template T - The operation type to infer input from
 */
// biome-ignore lint/suspicious/noExplicitAny: We don't know what type the Env is
export type InferInput<T> = T extends OperationType<infer I, unknown, any>
	? InferSchema<I>
	: T extends GetOperation<infer I, unknown, Env>
		? InferSchema<I>
		: T extends PostOperation<infer I, unknown, Env>
			? InferSchema<I>
			: T extends WebSocketOperation<infer I, unknown, Env>
				? InferSchema<I>
				: void;

/**
 * Utility type that allows a value to be either synchronous or wrapped in a Promise
 * @template T - The value type
 */
export type OptionalPromise<T> = T | Promise<T>;

/**
 * Record type representing a collection of router operations and nested routes
 */
export type RouterRecord = Record<
	string,
	OperationType<ZodObject | void, ZodObject | void> | Record<string, unknown>
>;

/**
 * Infers the environment type from a Router instance
 * @template T - The Router type to infer environment from
 */
export type InferRouterEnv<T> = T extends Router<RouterRecord, infer E>
	? E
	: never;
