import type { PubSubAdapter } from "@jsandy/rpc/adapters";
import type { Context, TypedResponse } from "hono";
import type { Env, Input } from "hono/types";
import type { StatusCode } from "hono/utils/http-status";
import type superjson from "superjson";
import type { z } from "zod";
import type { ProcedureDescription } from "./procedure";
import type { IO, ServerSocket } from "./sockets";

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
	/**
	 * Provide a Pub/Sub adapter for WebSocket routes.
	 * Called for each WebSocket request; return a provider-agnostic adapter.
	 */
	getPubSubAdapter?: (c: Context) => PubSubAdapter;
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
	E extends Env = any,
	P extends string = any,
	I extends Input = {},
> = Context<E, P, I> & SuperJSONHandler;

/**
 * Infers the output type from a middleware function
 * @template T - The middleware function type to infer from
 */
export type InferMiddlewareOutput<T> =
	T extends MiddlewareFunction<any, infer R, any> ? R : unknown;

/**
 * Function type for middleware operations with context chaining
 * @template T - Context object type, defaults to Record<string, unknown>
 * @template R - Return type, defaults to void
 * @template E - Environment type, defaults to Env
 */
export type MiddlewareFunction<
	T = {},
	R = void,
	E extends Env = any,
> = (params: {
	/** Current context object */
	ctx: T;
	/** Function to call next middleware with optional context extension */
	next: <B>(args?: B) => Promise<B & T>;
	/** Hono context with SuperJSON capabilities */
	c: ContextWithSuperJSON<E>;
}) => Promise<R>;

/**
 * Function type for emitting events to all connected clients
 * @param event - Event name to emit
 * @param data - Optional data to send with the event
 * @returns Promise that resolves when event is emitted
 */
export type EmitFunction = (event: string, data?: any) => Promise<void>;

/**
 * Function type for emitting events to a specific room
 * @param room - Room identifier to emit to
 * @param data - Optional data to send with the event
 * @returns Promise that resolves when event is emitted
 */
export type RoomEmitFunction = (room: string, data?: any) => Promise<void>;

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
	}) => any;
	/** Optional handler called when a client disconnects */
	onDisconnect?: ({
		socket,
	}: {
		socket: ServerSocket<IncomingSchema, OutgoingSchema>;
	}) => any;
	/** Optional handler called when an error occurs */
	onError?: ({
		socket,
		error,
	}: {
		socket: ServerSocket<IncomingSchema, OutgoingSchema>;
		error: Event;
	}) => any;
};

/**
 * Operation definition for WebSocket endpoints
 * @template IncomingSchema - Schema type for incoming messages
 * @template OutgoingSchema - Schema type for outgoing messages
 * @template E - Environment type, defaults to Env
 */
export type WebSocketOperation<
	// FIXME: Record<string,unknown> type error
	IncomingSchema extends Record<string, any>,
	OutgoingSchema extends Record<string, any>,
	E extends Env = any,
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
	handler: <Input>(params: {
		/** IO interface for WebSocket communication */
		io: IO<IncomingSchema, OutgoingSchema>;
		/** Hono context with SuperJSON capabilities */
		c: ContextWithSuperJSON<E>;
		/** Current context object */
		ctx: Input;
	}) => OptionalPromise<WebSocketHandler<IncomingSchema, OutgoingSchema>>;
	/** Array of middleware functions to apply */
	middlewares: MiddlewareFunction<any, any, E>[];
	/** Optional description metadata for OpenAPI documentation */
	description?: ProcedureDescription;
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
type UnwrapResponse<T> =
	Awaited<T> extends TypedResponse<infer U>
		? U
		: Awaited<T> extends SuperJSONTypedResponse<infer U>
			? U
			: Awaited<T> extends Response
				? any
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
	Schema extends Record<string, any> | void,
	Return = OptionalPromise<ResponseType<any>>,
	E extends Env = any,
> = {
	/** Operation type identifier */
	type: "get";
	/** Optional input validation schema */
	schema?: z.ZodType<Schema> | void;
	/** Handler function for the GET operation */
	handler: <Input>({
		c,
		ctx,
		input,
	}: {
		/** Hono context with SuperJSON capabilities */
		c: ContextWithSuperJSON<E>;
		/** Current context object */
		ctx: Input;
		/** Validated input data based on schema */
		input: Schema extends Record<string, any> ? Schema : void;
	}) => UnwrapResponse<OptionalPromise<Return>>;
	/** Array of middleware functions to apply */
	middlewares: MiddlewareFunction<any, any, E>[];
	/** Optional description metadata for OpenAPI documentation */
	description?: ProcedureDescription;
};

/**
 * Operation definition for POST HTTP endpoints
 * @template Schema - Input schema type
 * @template Return - Return type, defaults to OptionalPromise<ResponseType<unknown>>
 * @template E - Environment type, defaults to Env
 */
export type PostOperation<
	Schema extends Record<string, any> | void,
	Return = OptionalPromise<ResponseType<any>>,
	E extends Env = any,
> = {
	/** Operation type identifier */
	type: "post";
	/** Optional input validation schema */
	schema?: z.ZodType<Schema> | void;
	/** Handler function for the POST operation */
	handler: <Input, _Output>({
		ctx,
		c,
		input,
	}: {
		/** Current context object */
		ctx: Input;
		/** Hono context with SuperJSON capabilities */
		c: ContextWithSuperJSON<E>;
		/** Validated input data based on schema */
		input: Schema extends Record<string, any> ? Schema : void;
	}) => UnwrapResponse<OptionalPromise<Return>>;
	/** Array of middleware functions to apply */
	middlewares: MiddlewareFunction<any, any, E>[];
	/** Optional description metadata for OpenAPI documentation */
	description?: ProcedureDescription;
};

/**
 * Union type for all possible operation types
 * @template I - Input schema type
 * @template O - Output schema type
 * @template E - Environment type, defaults to Env
 */
export type OperationType<
	I extends Record<string, any>,
	O extends Record<string, unknown>,
	E extends Env = any,
> =
	| GetOperation<I, O, E>
	| PostOperation<I, O, E>
	| WebSocketOperation<I, O, E>;

// Keys that are required ({} is NOT assignable to Pick<T, K>)
type RequiredKeys<T> = {
	[K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// True if T is an object with no required keys (including `{}`)
type AllOptionalObject<T> = T extends object
	? RequiredKeys<T> extends never
		? true
		: false
	: false;

// Collapse all-optional object inputs to `void | T` (so arg can be omitted)
type CollapseOptionalObject<T> =
	AllOptionalObject<T> extends true ? void | T : T;

/**
 * Infers the input type from various operation types
 * @template T - The operation type to infer input from
 */
export type InferInput<T> =
	T extends OperationType<infer I, any>
		? CollapseOptionalObject<InferZodInput<I, I>>
		: void;

/**
 * Infers the output type from various operation types
 * @template T - The operation type to infer output from
 */
export type InferOutput<T> =
	T extends OperationType<any, infer O> ? InferZodType<O, O> : void;

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
	| OperationType<Record<string, any>, Record<string, any>>
	| Record<string, unknown>
>;

export type InferZodInput<S, T = void> = S extends void
	? T
	: S extends z.ZodTypeAny
		? z.input<S>
		: T;

export type InferZodType<S, T = void> = S extends void
	? T
	: S extends z.ZodTypeAny
		? z.output<S>
		: T;
