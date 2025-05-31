import type superjson from "superjson";
import type { Context, TypedResponse } from "hono";
import type { Env, Input } from "hono/types";
import type { StatusCode } from "hono/utils/http-status";
import type { ZodObject, ZodRawShape, z } from "zod/v4";
import type { Router } from "../router";
import type { IO, ServerSocket } from "../sockets";

type SuperJSONParsedType<T> = ReturnType<typeof superjson.parse<T>>;

export type SuperJSONTypedResponse<
	T,
	U extends StatusCode = StatusCode,
> = TypedResponse<SuperJSONParsedType<T>, U, "json">;

export interface RouterConfig {
	name?: string;
}

export type SuperJSONHandler = {
	superjson: <T>(data: T, status?: number) => SuperJSONTypedResponse<T>;
};

export type ContextWithSuperJSON<
	E extends Env = Env,
	P extends string = string,
	I extends Input = Input,
> = Context<E, P, I> & SuperJSONHandler;

export type InferMiddlewareOutput<T> = T extends MiddlewareFunction<
	unknown,
	infer R,
	Env
>
	? R
	: unknown;

export type MiddlewareFunction<
	T = Record<string, unknown>,
	R = void,
	E extends Env = Env,
> = (params: {
	ctx: T;
	next: <B extends Record<string, unknown>>(args?: B) => Promise<B & T>;
	c: ContextWithSuperJSON<E>;
}) => Promise<R>;

export type EmitFunction = (event: string, data?: unknown) => Promise<void>;

export type RoomEmitFunction = (room: string, data?: unknown) => Promise<void>;

// Simplified WebSocket data inference
export type InferWebSocketData<T> = T extends ZodObject ? z.infer<T> : void;

export type WebSocketHandler<IncomingSchema, OutgoingSchema> = {
	onConnect?: ({
		socket,
	}: {
		socket: ServerSocket<IncomingSchema, OutgoingSchema>;
	}) => unknown;
	onDisconnect?: ({
		socket,
	}: {
		socket: ServerSocket<IncomingSchema, OutgoingSchema>;
	}) => unknown;
	onError?: ({
		socket,
		error,
	}: {
		socket: ServerSocket<IncomingSchema, OutgoingSchema>;
		error: Event;
	}) => unknown;
};

export type WebSocketOperation<
	IncomingSchema,
	OutgoingSchema,
	E extends Env = Env,
> = {
	type: "ws";
	incoming?: IncomingSchema;
	outgoing?: OutgoingSchema;
	outputFormat: "ws";
	handler: (params: {
		io: IO<OutgoingSchema>;
		c: ContextWithSuperJSON<E>;
		ctx: Record<string, unknown>;
	}) => OptionalPromise<WebSocketHandler<IncomingSchema, OutgoingSchema>>;
	middlewares: MiddlewareFunction<Record<string, unknown>, unknown, E>[];
};

export type ResponseType<Output> =
	| SuperJSONTypedResponse<Output>
	| TypedResponse<Output, StatusCode, "text">
	| Response
	| void;

type UnwrapResponse<T> = Awaited<T> extends TypedResponse<infer U>
	? U
	: Awaited<T> extends SuperJSONTypedResponse<infer U>
		? U
		: Awaited<T> extends Response
			? unknown
			: Awaited<T> extends void
				? void
				: T;

export type GetOperation<
	Schema,
	Return = OptionalPromise<ResponseType<unknown>>,
	E extends Env = Env,
> = {
	type: "get";
	schema?: Schema;
	handler: (params: {
		c: ContextWithSuperJSON<E>;
		ctx: Record<string, unknown>;
		input: InferSchema<Schema>;
	}) => UnwrapResponse<OptionalPromise<Return>>;
	middlewares: MiddlewareFunction<Record<string, unknown>, unknown, E>[];
};

export type PostOperation<
	Schema,
	Return = OptionalPromise<ResponseType<unknown>>,
	E extends Env = Env,
> = {
	type: "post";
	schema?: Schema;
	handler: (params: {
		ctx: Record<string, unknown>;
		c: ContextWithSuperJSON<E>;
		input: InferSchema<Schema>;
	}) => UnwrapResponse<OptionalPromise<Return>>;
	middlewares: MiddlewareFunction<Record<string, unknown>, unknown, E>[];
};

// Fixed: Allow void schemas with simplified constraints
export type OperationType<I, O, E extends Env = Env> =
	| GetOperation<I, O, E>
	| PostOperation<I, O, E>
	| WebSocketOperation<I, O, E>;

// Simplified schema inference to avoid deep instantiation
export type InferSchema<T> = T extends ZodObject<
	infer Shape extends ZodRawShape
>
	? {
			[K in keyof Shape]: Shape[K] extends z.ZodType<infer U> ? U : void;
		}
	: void;

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

export type OptionalPromise<T> = T | Promise<T>;
export type RouterRecord = Record<
	string,
	OperationType<ZodObject | void, ZodObject | void> | Record<string, unknown>
>;
export type InferRouterEnv<T> = T extends Router<RouterRecord, infer E>
	? E
	: never;
