import type { Env } from "hono/types";
import type { StatusCode } from "hono/utils/http-status";
import superjson from "superjson";
import type { ZodType as ZodV3Type } from "zod";
import type { ZodType as ZodV4Type } from "zod/v4";
import type { IO } from "./sockets";
import type {
	ContextWithSuperJSON,
	GetOperation,
	InferZodType,
	MiddlewareFunction,
	OptionalPromise,
	PostOperation,
	ResponseType,
	WebSocketHandler,
	WebSocketOperation,
	ZodAny,
} from "./types";

/**
 * Description configuration for procedures
 * Provides OpenAPI documentation metadata for endpoints
 */
export interface ProcedureDescription {
	/** Human-readable description of what this endpoint does */
	description: string;
	/** Optional summary for the endpoint (shorter than description) */
	summary?: string;
	/** Zod schema defining the expected output/response structure */
	schema?: ZodAny;
	/** Optional tags for grouping endpoints in documentation */
	tags?: string[];
	/** Optional operation ID for OpenAPI specification */
	operationId?: string;
	/** Whether this endpoint is deprecated */
	deprecated?: boolean;
	/** Additional OpenAPI metadata */
	openapi?: {
		/** Security requirements for this endpoint */
		security?: Array<Record<string, string[]>>;
		/** Additional response definitions */
		responses?: Record<string, any>;
		/** Request body examples */
		examples?: Record<string, any>;
	};
}

/**
 * Procedure class for building type-safe API endpoints with middleware chaining and OpenAPI documentation
 * Provides a fluent interface for configuring input validation, middleware, handlers, and documentation
 *
 * @template E - Environment type extending Hono's Env, defaults to Env
 * @template Ctx - Context object type accumulated from middleware, defaults to Record<string, unknown>
 * @template InputSchema - Zod schema type for input validation, defaults to void
 * @template Incoming - Zod schema type for incoming WebSocket messages, defaults to void
 * @template Outgoing - Zod schema type for outgoing WebSocket messages, defaults to void
 */
export class Procedure<
	E extends Env = any,
	Ctx = {},
	InputSchema extends ZodAny | void = void,
	Incoming extends ZodAny | void = void,
	Outgoing extends ZodAny | void = void,
> {
	/** Array of middleware functions to execute in sequence */
	private readonly middlewares: MiddlewareFunction<Ctx, void, E>[] = [];

	/** Zod schema for validating input parameters */
	private readonly inputSchema?: InputSchema;

	/** Zod schema for validating incoming WebSocket messages */
	private readonly incomingSchema?: Incoming;

	/** Zod schema for validating outgoing WebSocket messages */
	private readonly outgoingSchema?: Outgoing;

	/** Description metadata for OpenAPI documentation */
	private readonly description?: ProcedureDescription;

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
	 * Creates a new Procedure instance with optional middleware, schemas, and description
	 *
	 * @param middlewares - Array of middleware functions to apply, defaults to empty array
	 * @param inputSchema - Optional Zod schema for input validation
	 * @param incomingSchema - Optional Zod schema for incoming WebSocket message validation
	 * @param outgoingSchema - Optional Zod schema for outgoing WebSocket message validation
	 * @param description - Optional description metadata for OpenAPI documentation
	 */
	constructor(
		middlewares: MiddlewareFunction<Ctx, void, E>[] = [],
		inputSchema?: InputSchema,
		incomingSchema?: Incoming,
		outgoingSchema?: Outgoing,
		description?: ProcedureDescription,
	) {
		this.middlewares = middlewares;
		this.inputSchema = inputSchema;
		this.incomingSchema = incomingSchema;
		this.outgoingSchema = outgoingSchema;
		this.description = description;

		// Ensure SuperJSON middleware is always included
		if (!this.middlewares.some((mw) => mw.name === "superjsonMiddleware")) {
			this.middlewares.push(this.superjsonMiddleware);
		}
	}

	/**
	 * Sets documentation metadata for the procedure
	 * Creates a new Procedure instance with the provided description
	 *
	 * @param description - Documentation metadata including description, output schema, and OpenAPI details
	 * @returns New Procedure instance with description configured
	 *
	 * @example
	 * ```typescript
	 * const getUserProcedure = procedure
	 *   .input(z.object({ id: z.string() }))
	 *   .describe({
	 *     description: "Retrieves a user by their unique identifier",
	 *     summary: "Get user by ID",
	 *     schema: z.object({
	 *       id: z.string(),
	 *       name: z.string(),
	 *       email: z.string()
	 *     }),
	 *     tags: ["users"],
	 *     operationId: "getUser"
	 *   })
	 *   .get(({ input, c }) => {
	 *     // Handler implementation
	 *   });
	 * ```
	 */
	describe(description: ProcedureDescription) {
		return new Procedure<E, Ctx, InputSchema, Incoming, Outgoing>(
			this.middlewares,
			this.inputSchema,
			this.incomingSchema,
			this.outgoingSchema,
			description,
		);
	}

	/**
	 * Sets the schema for validating incoming WebSocket messages
	 * Creates a new Procedure instance with the updated incoming schema
	 *
	 * @template Schema - Zod object schema type for incoming messages
	 * @param schema - Zod schema to validate incoming WebSocket messages
	 * @returns New Procedure instance with incoming schema configured
	 */
	incoming<Schema extends ZodAny>(schema: Schema) {
		return new Procedure<E, Ctx, InputSchema, Schema, Outgoing>(
			this.middlewares,
			this.inputSchema,
			schema,
			this.outgoingSchema,
			this.description,
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
	outgoing<Schema extends ZodAny>(schema: Schema) {
		return new Procedure<E, Ctx, InputSchema, Incoming, Schema>(
			this.middlewares,
			this.inputSchema,
			this.incomingSchema,
			schema,
			this.description,
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
	input<Schema extends ZodAny>(schema: Schema) {
		return new Procedure<E, Ctx, Schema, Incoming, Outgoing>(
			this.middlewares,
			schema,
			this.incomingSchema,
			this.outgoingSchema,
			this.description,
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
	use<T, Return = void>(
		handler: MiddlewareFunction<Ctx, Return, E>,
	): Procedure<E, Ctx & T & Return, InputSchema, Incoming, Outgoing> {
		return new Procedure<E, Ctx & T & Return, InputSchema, Incoming, Outgoing>(
			[...this.middlewares, handler as any],
			this.inputSchema,
			this.incomingSchema,
			this.outgoingSchema,
			this.description,
		);
	}

	/**
	 * Creates a GET operation with the configured middleware, schemas, and documentation
	 *
	 * @template Return - Return type of the handler function
	 * @param handler - Function to handle GET requests
	 * @param handler.ctx - Context object accumulated from middleware
	 * @param handler.c - Hono context with SuperJSON capabilities
	 * @param handler.input - Validated input data based on input schema
	 * @returns GetOperation configuration object with description metadata
	 */
	get<Return extends OptionalPromise<ResponseType<any>>>(
		handler: ({
			ctx,
			c,
			input,
		}: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferZodType<InputSchema>;
		}) => Return,
	): GetOperation<InputSchema, ReturnType<typeof handler>, E> & {
		description?: ProcedureDescription;
	} {
		return {
			type: "get",
			schema: this.inputSchema as
				| ZodV3Type<InputSchema>
				| ZodV4Type<InputSchema>
				| void,
			handler: handler as any,
			middlewares: this.middlewares,
			description: this.description,
		};
	}

	/**
	 * Alias for the get() method - creates a GET operation (query endpoint)
	 * Semantically indicates this endpoint is for querying data
	 *
	 * @template Return - Return type of the handler function
	 * @param handler - Function to handle query requests
	 * @returns GetOperation configuration object with description metadata
	 */
	query<Return extends OptionalPromise<ResponseType<any>>>(
		handler: ({
			ctx,
			c,
			input,
		}: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferZodType<InputSchema>;
		}) => Return,
	): GetOperation<InputSchema, Return, E> & {
		description?: ProcedureDescription;
	} {
		return this.get(handler);
	}

	/**
	 * Creates a POST operation with the configured middleware, schemas, and documentation
	 *
	 * @template Return - Return type of the handler function
	 * @param handler - Function to handle POST requests
	 * @param handler.ctx - Context object accumulated from middleware
	 * @param handler.c - Hono context with SuperJSON capabilities
	 * @param handler.input - Validated input data based on input schema
	 * @returns PostOperation configuration object with description metadata
	 */
	post<Return extends OptionalPromise<ResponseType<any>>>(
		handler: ({
			ctx,
			c,
			input,
		}: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferZodType<InputSchema>;
		}) => Return,
	): PostOperation<InputSchema, ReturnType<typeof handler>, E> & {
		description?: ProcedureDescription;
	} {
		return {
			type: "post",
			schema: this.inputSchema as
				| ZodV3Type<InputSchema>
				| ZodV4Type<InputSchema>
				| void,
			handler: handler as any,
			middlewares: this.middlewares,
			description: this.description,
		};
	}

	/**
	 * Alias for the post() method - creates a POST operation (mutation endpoint)
	 * Semantically indicates this endpoint is for mutating/changing data
	 *
	 * @template Return - Return type of the handler function
	 * @param handler - Function to handle mutation requests
	 * @returns PostOperation configuration object with description metadata
	 */
	mutation<Return extends OptionalPromise<ResponseType<any>>>(
		handler: ({
			ctx,
			c,
			input,
		}: {
			ctx: Ctx;
			c: ContextWithSuperJSON<E>;
			input: InferZodType<InputSchema>;
		}) => Return,
	): PostOperation<InputSchema, Return, E> & {
		description?: ProcedureDescription;
	} {
		return this.post(handler);
	}

	/**
	 * Creates a WebSocket operation with the configured middleware, schemas, and documentation
	 * Enables real-time bidirectional communication with message validation
	 *
	 * @param handler - Function to handle WebSocket connections
	 * @param handler.io - IO interface for WebSocket communication with validated outgoing data
	 * @param handler.c - Hono context with SuperJSON capabilities
	 * @param handler.ctx - Context object accumulated from middleware
	 * @returns WebSocketOperation configuration object with incoming/outgoing schemas and description
	 */
	ws(
		handler: ({
			io,
			c,
			ctx,
		}: {
			io: IO<InferZodType<Incoming>, InferZodType<Outgoing>>;
			c: ContextWithSuperJSON<E>;
			ctx: Ctx;
		}) => OptionalPromise<
			WebSocketHandler<InferZodType<Incoming>, InferZodType<Outgoing>>
		>,
	): WebSocketOperation<InferZodType<Incoming>, InferZodType<Outgoing>, E> & {
		description?: ProcedureDescription;
	} {
		return {
			type: "ws",
			outputFormat: "ws",
			handler: handler as any,
			middlewares: this.middlewares,
			description: this.description,
		};
	}
}
