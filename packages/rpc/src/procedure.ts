import superjson from "superjson";
import type { Env } from "hono/types";
import type { StatusCode } from "hono/utils/http-status";
import type { ZodObject } from "zod/v4";
import type { IO } from "./sockets";
import type {
	ContextWithSuperJSON,
	GetOperation,
	InferSchema,
	InferWebSocketData,
	MiddlewareFunction,
	OptionalPromise,
	PostOperation,
	ResponseType,
	WebSocketHandler,
	WebSocketOperation,
} from "./types";
export class Procedure<
	E extends Env = Env,
	Ctx = Record<string, unknown>,
	InputSchema extends ZodObject | void = void,
	Incoming extends ZodObject | void = void,
	Outgoing extends ZodObject | void = void,
> {
	private readonly middlewares: MiddlewareFunction<Ctx, void, E>[] = [];
	private readonly inputSchema?: InputSchema;
	private readonly incomingSchema?: Incoming;
	private readonly outgoingSchema?: Outgoing;

	private superjsonMiddleware: MiddlewareFunction<Ctx, void, E> =
		async function superjsonMiddleware({ c, next }) {
			type JSONRespond = typeof c.json;

			c.superjson = (<T>(data: T, status?: StatusCode): Response => {
				const serialized = superjson.stringify(data);

				return c.newResponse(serialized, status, {
					...Object.fromEntries(c.res.headers.entries()),
					"x-is-superjson": "true",
				});
			}) as JSONRespond;

			await next();
		};

	constructor(
		middlewares: MiddlewareFunction<Ctx, void, E>[] = [],
		inputSchema?: InputSchema,
		incomingSchema?: Incoming,
		outgoingSchema?: Outgoing,
	) {
		this.middlewares = middlewares;
		this.inputSchema = inputSchema;
		this.incomingSchema = incomingSchema;
		this.outgoingSchema = outgoingSchema;

		if (!this.middlewares.some((mw) => mw.name === "superjsonMiddleware")) {
			this.middlewares.push(this.superjsonMiddleware);
		}
	}

	/**
	 * Validates incoming WebSocket messages using a Zod schema.
	 */
	incoming<Schema extends ZodObject>(schema: Schema) {
		return new Procedure<E, Ctx, InputSchema, Schema, Outgoing>(
			this.middlewares,
			this.inputSchema,
			schema,
			this.outgoingSchema,
		);
	}

	/**
	 * Validates outgoing WebSocket messages using a Zod schema.
	 */
	outgoing<Schema extends ZodObject>(schema: Schema) {
		return new Procedure<E, Ctx, InputSchema, Incoming, Schema>(
			this.middlewares,
			this.inputSchema,
			this.incomingSchema,
			schema,
		);
	}

	/**
	 * Validates input parameters using a Zod schema.
	 */
	input<Schema extends ZodObject>(schema: Schema) {
		return new Procedure<E, Ctx, Schema, Incoming, Outgoing>(
			this.middlewares,
			schema,
			this.incomingSchema,
			this.outgoingSchema,
		);
	}

	/**
	 * Adds a middleware function to the procedure chain.
	 */
	use<T extends Record<string, unknown>, Return = void>(
		handler: MiddlewareFunction<Ctx, Return, E>,
	): Procedure<E, Ctx & T & Return, InputSchema, Incoming, Outgoing> {
		const typedHandler = handler as MiddlewareFunction<Ctx, void, E>;
		return new Procedure<E, Ctx & T & Return, InputSchema, Incoming, Outgoing>(
			[...this.middlewares, typedHandler],
			this.inputSchema,
			this.incomingSchema,
			this.outgoingSchema,
		);
	}

	get<Return extends OptionalPromise<ResponseType<unknown>>>(
		handler: (params: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferSchema<InputSchema>;
		}) => Return,
	): GetOperation<InputSchema, ReturnType<typeof handler>, E> {
		const operation: GetOperation<InputSchema, Return, E> = {
			type: "get",
			schema: this.inputSchema,
			handler: (params) => {
				const result = handler({
					ctx: params.ctx as Ctx,
					c: params.c,
					input: params.input,
				});
				// Handle void return by converting to Response
				return (result === undefined ? new Response() : result) as ReturnType<
					GetOperation<InputSchema, Return, E>["handler"]
				>;
			},
			middlewares: this.middlewares as MiddlewareFunction<
				Record<string, unknown>,
				unknown,
				E
			>[],
		};
		return operation;
	}

	query<Return extends OptionalPromise<ResponseType<unknown>>>(
		handler: (params: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferSchema<InputSchema>;
		}) => Return,
	): GetOperation<InputSchema, Return, E> {
		return this.get(handler);
	}

	post<Return extends OptionalPromise<ResponseType<unknown>>>(
		handler: (params: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferSchema<InputSchema>;
		}) => Return,
	): PostOperation<InputSchema, ReturnType<typeof handler>, E> {
		const operation: PostOperation<InputSchema, Return, E> = {
			type: "post",
			schema: this.inputSchema,
			handler: (params) => {
				const result = handler({
					ctx: params.ctx as Ctx,
					c: params.c,
					input: params.input,
				});
				// Handle void return by converting to Response
				return (result === undefined ? new Response() : result) as ReturnType<
					PostOperation<InputSchema, Return, E>["handler"]
				>;
			},
			middlewares: this.middlewares as MiddlewareFunction<
				Record<string, unknown>,
				unknown,
				E
			>[],
		};
		return operation;
	}

	mutation<Return extends OptionalPromise<ResponseType<unknown>>>(
		handler: (params: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferSchema<InputSchema>;
		}) => Return,
	): PostOperation<InputSchema, Return, E> {
		return this.post(handler);
	}

	ws(
		handler: (params: {
			io: IO<InferWebSocketData<Outgoing>>;
			c: ContextWithSuperJSON<E>;
			ctx: Ctx;
		}) => OptionalPromise<WebSocketHandler<Incoming, Outgoing>>,
	): WebSocketOperation<Incoming, Outgoing, E> {
		const operation: WebSocketOperation<Incoming, Outgoing, E> = {
			type: "ws",
			outputFormat: "ws",
			handler: (params) => {
				return handler({
					io: params.io as IO<InferWebSocketData<Outgoing>>,
					c: params.c,
					ctx: params.ctx as Ctx,
				});
			},
			middlewares: this.middlewares as MiddlewareFunction<
				Record<string, unknown>,
				unknown,
				E
			>[],
		};
		return operation;
	}
}
