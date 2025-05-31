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

/**
 * Procedure class for building type-safe API endpoints with middleware chaining
 * Provides a fluent interface for configuring input validation, middleware, and handlers
 *
 * @template E - Environment type extending Hono's Env, defaults to Env
 * @template Ctx - Context object type accumulated from middleware, defaults to Record<string, unknown>
 * @template InputSchema - Zod schema type for input validation, defaults to void
 * @template Incoming - Zod schema type for incoming WebSocket messages, defaults to void
 * @template Outgoing - Zod schema type for outgoing WebSocket messages, defaults to void
 */
export class Procedure<
	E extends Env = Env,
	Ctx = Record<string, unknown>,
	InputSchema extends ZodObject | void = void,
	Incoming extends ZodObject | void = void,
	Outgoing extends ZodObject | void = void,
> {
	/** Array of middleware functions to execute in sequence */
	private readonly middlewares: MiddlewareFunction<Ctx, void, E>[] = [];

	/** Zod schema for validating input parameters */
	private readonly inputSchema?: InputSchema;

	/** Zod schema for validating incoming WebSocket messages */
	private readonly incomingSchema?: Incoming;

	/** Zod schema for validating outgoing WebSocket messages */
	private readonly outgoingSchema?: Outgoing;

	/**
	 * Built-in middleware that adds SuperJSON serialization support to the context
	 * Automatically serializes complex JavaScript objects (dates, sets, maps, etc.)
	 */
	private superjsonMiddleware: MiddlewareFunction<Ctx, void, E> =
		async function superjsonMiddleware({ c, next }) {
			type JSONRespond = typeof c.json;

			/**
			 * Adds superjson method to context for enhanced serialization
			 * @template T - Type of data to serialize
			 * @param data - Data to serialize using SuperJSON
			 * @param status - Optional HTTP status code
			 * @returns Response with SuperJSON serialized data
			 */
			c.superjson = (<T>(data: T, status?: StatusCode): Response => {
				const serialized = superjson.stringify(data);

				return c.newResponse(serialized, status, {
					...Object.fromEntries(c.res.headers.entries()),
					"x-is-superjson": "true",
				});
			}) as JSONRespond;

			await next();
		};

	/**
	 * Creates a new Procedure instance with optional middleware and schemas
	 *
	 * @param middlewares - Array of middleware functions to apply, defaults to empty array
	 * @param inputSchema - Optional Zod schema for input validation
	 * @param incomingSchema - Optional Zod schema for incoming WebSocket message validation
	 * @param outgoingSchema - Optional Zod schema for outgoing WebSocket message validation
	 */
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

		// Ensure SuperJSON middleware is always included
		if (!this.middlewares.some((mw) => mw.name === "superjsonMiddleware")) {
			this.middlewares.push(this.superjsonMiddleware);
		}
	}

	/**
	 * Sets the schema for validating incoming WebSocket messages
	 * Creates a new Procedure instance with the updated incoming schema
	 *
	 * @template Schema - Zod object schema type for incoming messages
	 * @param schema - Zod schema to validate incoming WebSocket messages
	 * @returns New Procedure instance with incoming schema configured
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
	 * Sets the schema for validating outgoing WebSocket messages
	 * Creates a new Procedure instance with the updated outgoing schema
	 *
	 * @template Schema - Zod object schema type for outgoing messages
	 * @param schema - Zod schema to validate outgoing WebSocket messages
	 * @returns New Procedure instance with outgoing schema configured
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
	 * Sets the schema for validating input parameters (query params for GET, body for POST)
	 * Creates a new Procedure instance with the updated input schema
	 *
	 * @template Schema - Zod object schema type for input validation
	 * @param schema - Zod schema to validate input parameters
	 * @returns New Procedure instance with input schema configured
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
	 * Adds a middleware function to the procedure chain
	 * Middleware functions are executed in the order they are added
	 *
	 * @template T - Type of additional context data the middleware provides
	 * @template Return - Return type of the middleware function, defaults to void
	 * @param handler - Middleware function to add to the chain
	 * @returns New Procedure instance with the middleware added and updated context type
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

	/**
	 * Creates a GET operation with the configured middleware and schemas
	 *
	 * @template Return - Return type of the handler function
	 * @param handler - Function to handle GET requests
	 * @param handler.ctx - Context object accumulated from middleware
	 * @param handler.c - Hono context with SuperJSON capabilities
	 * @param handler.input - Validated input data based on input schema
	 * @returns GetOperation configuration object
	 */
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

	/**
	 * Alias for the get() method - creates a GET operation (query endpoint)
	 * Semantically indicates this endpoint is for querying data
	 *
	 * @template Return - Return type of the handler function
	 * @param handler - Function to handle query requests
	 * @returns GetOperation configuration object
	 */
	query<Return extends OptionalPromise<ResponseType<unknown>>>(
		handler: (params: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferSchema<InputSchema>;
		}) => Return,
	): GetOperation<InputSchema, Return, E> {
		return this.get(handler);
	}

	/**
	 * Creates a POST operation with the configured middleware and schemas
	 *
	 * @template Return - Return type of the handler function
	 * @param handler - Function to handle POST requests
	 * @param handler.ctx - Context object accumulated from middleware
	 * @param handler.c - Hono context with SuperJSON capabilities
	 * @param handler.input - Validated input data based on input schema
	 * @returns PostOperation configuration object
	 */
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

	/**
	 * Alias for the post() method - creates a POST operation (mutation endpoint)
	 * Semantically indicates this endpoint is for mutating/changing data
	 *
	 * @template Return - Return type of the handler function
	 * @param handler - Function to handle mutation requests
	 * @returns PostOperation configuration object
	 */
	mutation<Return extends OptionalPromise<ResponseType<unknown>>>(
		handler: (params: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferSchema<InputSchema>;
		}) => Return,
	): PostOperation<InputSchema, Return, E> {
		return this.post(handler);
	}

	/**
	 * Creates a WebSocket operation with the configured middleware and schemas
	 * Enables real-time bidirectional communication with message validation
	 *
	 * @param handler - Function to handle WebSocket connections
	 * @param handler.io - IO interface for WebSocket communication with validated outgoing data
	 * @param handler.c - Hono context with SuperJSON capabilities
	 * @param handler.ctx - Context object accumulated from middleware
	 * @returns WebSocketOperation configuration object with incoming/outgoing schemas
	 */
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
