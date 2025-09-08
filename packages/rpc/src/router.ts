import { type Context, Hono, type Next } from "hono";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import type { Env, ErrorHandler, MiddlewareHandler } from "hono/types";
import type { StatusCode } from "hono/utils/http-status";
import { ZodObject, z } from "zod";
import type { JSONSchema } from "zod/v4/core";
import { bodyParsingMiddleware, queryParsingMiddleware } from "./middleware";
import { toJSONSchemaWithDate } from "./openapi";
import type { ProcedureDescription } from "./procedure";
import { IO, ServerSocket, UpstashRestPubSub } from "./sockets";
import { logger } from "./sockets/logger";
import type {
	ContextWithSuperJSON,
	GetOperation,
	InferInput,
	OperationType,
	PostOperation,
	RouterConfig,
	WebSocketOperation,
} from "./types";

/**
 * Utility type that flattens nested route structures into a flat key-value mapping
 * Converts nested route objects into flat paths with "/" separators
 * @template T - The route structure to flatten
 */
type FlattenRoutes<T> = {
	[K in keyof T]: T[K] extends WebSocketOperation<any, any>
		? { [P in `${string & K}`]: T[K] }
		: T[K] extends GetOperation<any, any>
			? { [P in `${string & K}`]: T[K] }
			: T[K] extends PostOperation<any, any>
				? { [P in `${string & K}`]: T[K] }
				: T[K] extends Record<string, any>
					? {
							[SubKey in keyof T[K] as `${string & K}/${string &
								SubKey}`]: T[K][SubKey] extends
								| WebSocketOperation<any, any>
								| GetOperation<any, any>
								| PostOperation<any, any>
								? T[K][SubKey]
								: never;
						}
					: never;
}[keyof T];

/**
 * Merges flattened routes into a single type mapping
 * @template T - The flattened routes structure
 */
export type MergeRoutes<T> = {
	[K in keyof FlattenRoutes<T>]: FlattenRoutes<T>[K];
};

/**
 * Generates schema definitions for router operations based on their types
 * Maps each operation to its corresponding HTTP method and data structure
 * @template T - The record of router operations
 */
export type RouterSchema<T extends Record<string, any>> = {
	[K in keyof T]: T[K] extends WebSocketOperation<any, any>
		? {
				$get: {
					input: InferInput<T[K]>;
					output: {};
					incoming: NonNullable<T[K]["incoming"]>;
					outgoing: NonNullable<T[K]["outgoing"]>;
					outputFormat: "ws";
					status: StatusCode;
				};
			}
		: T[K] extends GetOperation<any, any>
			? {
					$get: {
						input: InferInput<T[K]>;
						output: ReturnType<T[K]["handler"]>;
						outputFormat: "json";
						status: StatusCode;
					};
				}
			: T[K] extends PostOperation<any, any>
				? {
						$post: {
							input: InferInput<T[K]>;
							output: ReturnType<T[K]["handler"]>;
							outputFormat: "json";
							status: StatusCode;
						};
					}
				: never;
};

/**
 * Infers the schema structure for a specific operation type
 * Used for type-safe client-server communication
 * @template T - The operation type to generate schema for
 * @template E - Environment type, defaults to Env
 */
export type OperationSchema<T> = T extends WebSocketOperation<any, any>
	? {
			$get: {
				input: InferInput<T>;
				output: {};
				incoming: NonNullable<T["incoming"]>;
				outgoing: NonNullable<T["outgoing"]>;
				outputFormat: "ws";
				status: StatusCode;
			};
		}
	: T extends GetOperation<any, any>
		? {
				$get: {
					input: InferInput<T>;
					output: ReturnType<T["handler"]>;
					outputFormat: "json";
					status: StatusCode;
				};
			}
		: T extends PostOperation<any, any>
			? {
					$post: {
						input: InferInput<T>;
						output: ReturnType<T["handler"]>;
						outputFormat: "json";
						status: StatusCode;
					};
				}
			: never;

/**
 * Internal context interface for storing middleware outputs and parsed data
 */
interface InternalContext {
	/** Storage for middleware output data */
	__middleware_output?: Record<string, unknown>;
	/** Storage for parsed query parameters */
	__parsed_query?: Record<string, unknown>;
	/** Storage for parsed request body data */
	__parsed_body?: Record<string, unknown>;
}

/**
 * Metadata structure for GET and POST procedures
 */
type GetPostProcedureMetadata = {
	/** Operation type identifier */
	type: "get" | "post";
	/** JSON Schema for input validation, null if no schema */
	schema: JSONSchema.BaseSchema | null;
};

/**
 * Metadata structure for WebSocket procedures
 */
type WSProcedureMetadata = {
	/** Operation type identifier */
	type: "ws";
	/** Schema definitions for incoming and outgoing messages */
	schema: {
		/** JSON Schema for incoming messages, null if no schema */
		incoming: JSONSchema.BaseSchema | null;
		/** JSON Schema for outgoing messages, null if no schema */
		outgoing: JSONSchema.BaseSchema | null;
	} | null;
};

/**
 * Union type for all procedure metadata types
 */
type ProcedureMetadata = GetPostProcedureMetadata | WSProcedureMetadata;

/**
 * Router class that extends Hono with type-safe route definitions and WebSocket support
 * Provides automatic schema validation, middleware chaining, and metadata generation
 * @template T - Record of route operations and nested routes
 * @template E - Environment type extending Hono's Env, defaults to Env
 */
export class Router<
	T extends Record<string, OperationType<any, any> | Record<string, any>> = {},
	E extends Env = any,
> extends Hono<E, RouterSchema<MergeRoutes<T>>, any> {
	/**
	 * Internal metadata storage for router configuration and introspection
	 */
	_metadata: {
		/** Nested sub-routers mapped by path */
		subRouters: Record<string, Promise<Router<any>> | Router<any>>;
		/** Router configuration settings */
		config: RouterConfig | Record<string, RouterConfig>;
		/** Procedure metadata for schema introspection */
		procedures: Record<string, ProcedureMetadata>;
		/** List of registered route paths */
		registeredPaths: string[];
		/** Original operations with description metadata */
		operations: Record<string, OperationType<any, any, E>>;
	};

	/** Global error handler for the router */
	_errorHandler: undefined | ErrorHandler<any> = undefined;

	/**
	 * Configures the router with optional settings
	 * @param config - Optional router configuration
	 * @returns Router instance for method chaining
	 */
	config(config?: RouterConfig) {
		if (config) {
			this._metadata.config = config;
		}

		return this;
	}

	/**
	 * Returns the underlying Hono handler, stripping types to prevent version mismatch issues
	 * Used internally by Hono adapters
	 */
	get handler() {
		return this as any;
	}

	/**
	 * Creates a new Router instance with the given procedures
	 * @param procedures - Record of route operations and nested route structures
	 */
	constructor(procedures: T = {} as T) {
		super();

		this._metadata = {
			subRouters: {},
			config: {},
			procedures: {},
			registeredPaths: [],
			operations: {},
		};

		// Store original operations for OpenAPI generation
		this.storeOperations(procedures);

		// Process procedures to extract metadata
		for (const [procName, value] of Object.entries(procedures)) {
			const procData = value as {
				type: "get" | "post" | "ws";
				schema?: ZodObject;
				incoming?: ZodObject;
				outgoing?: ZodObject;
				description?: ProcedureDescription;
			};

			if (procData.type === "ws") {
				// Handle WebSocket operations
				this._metadata.procedures[procName] = {
					type: "ws",
					schema: {
						incoming: procData.incoming
							? toJSONSchemaWithDate(procData.incoming)
							: null,
						outgoing: procData.outgoing
							? toJSONSchemaWithDate(procData.outgoing)
							: null,
					},
				} satisfies WSProcedureMetadata;
			} else {
				// Handle GET/POST operations
				this._metadata.procedures[procName] = {
					type: procData.type,
					schema: procData.schema
						? toJSONSchemaWithDate(procData.schema)
						: null,
				} satisfies GetPostProcedureMetadata;
			}
		}

		this.onError = (handler: ErrorHandler<E>) => {
			this._errorHandler = handler;
			const parentOnError = Object.getPrototypeOf(
				Object.getPrototypeOf(this),
			).onError;
			parentOnError?.call(this, handler);

			return this;
		};

		this.setupRoutes(procedures);
	}

	/**
	 * Stores original operations with their description metadata
	 * This flattens nested procedures and stores them for OpenAPI generation
	 */
	private storeOperations(procedures: Record<string, any>) {
		for (const [key, value] of Object.entries(procedures)) {
			if (this.isOperationType(value)) {
				this._metadata.operations[key] = value;
			} else if (typeof value === "object" && value !== null) {
				for (const [subKey, subValue] of Object.entries(value)) {
					if (this.isOperationType(subValue)) {
						this._metadata.operations[`${key}/${subKey}`] = subValue;
					}
				}
			}
		}
	}

	/**
	 * Gets the description metadata for a specific operation
	 * @param operationName - Name of the operation to get description for
	 * @returns Description metadata if available
	 */
	getOperationDescription(
		operationName: string,
	): ProcedureDescription | undefined {
		const operation = this._metadata.operations[operationName];
		return operation?.description;
	}

	/**
	 * Gets all operations with their descriptions for OpenAPI generation
	 * @returns Record of operation names to their full operation definitions
	 */
	getAllOperations(): Record<string, OperationType<any, any, E>> {
		return { ...this._metadata.operations };
	}

	/**
	 * Registers middleware for handling sub-router requests
	 * Automatically routes requests to appropriate sub-routers based on path
	 */
	registerSubrouterMiddleware() {
		this.use(async (c, next) => {
			const [basePath, routerName] = c.req.path
				.split("/")
				.filter(Boolean)
				.slice(0, 2);

			const key = `/${basePath}/${routerName}`;
			const subRouter = await this._metadata.subRouters[key];

			if (subRouter) {
				const rewrittenPath = `/${c.req.path.split("/").slice(3).join("/")}`;
				const newUrl = new URL(c.req.url);
				newUrl.pathname = rewrittenPath;

				const newRequest = new Request(newUrl, c.req.raw);

				const response = await subRouter.fetch(newRequest, c.env);

				// If the sub-router returned an error status, we need to convert it back to an exception
				// so the merged router's error handler can catch it
				if (response.status >= 400) {
					let errorMessage = "Sub-router error";

					try {
						const body = await response.clone().text();

						if (body) {
							try {
								const parsed = JSON.parse(body);
								errorMessage =
									parsed.message || parsed.error || parsed.detail || body;
							} catch {
								// Fallback to raw text if not JSON
								errorMessage = body;
							}
						} else {
							errorMessage = `HTTP ${response.status}`;
						}
					} catch {
						// If we can't even read the body
						errorMessage = response.statusText || `HTTP ${response.status}`;
					}

					throw new HTTPException(response.status as any, {
						message: errorMessage,
					});
				}

				return response;
			}

			return next();
		});
	}

	private async callHandlerSafely<T>(
		handler: (...args: any[]) => Promise<T> | T,
		...args: any[]
	): Promise<T> {
		try {
			return await handler(...args);
		} catch (error) {
			// If it's already an HTTPException, just re-throw it
			if (error instanceof HTTPException) {
				throw error;
			}

			// Convert generic errors to HTTPExceptions with original message
			throw new HTTPException(500, {
				message:
					error instanceof Error ? error.message : "Internal server error",
			});
		}
	}

	/**
	 * Sets up routes for all procedures in the router
	 * Handles both flat and nested route structures
	 * @param procedures - The procedures to register as routes
	 */
	private setupRoutes(procedures: Record<string, any>) {
		for (const [key, value] of Object.entries(procedures)) {
			if (this.isOperationType(value)) {
				this.registerOperation(key, value);
			} else if (typeof value === "object" && value !== null) {
				for (const [subKey, subValue] of Object.entries(value)) {
					if (this.isOperationType(subValue)) {
						this.registerOperation(`${key}/${subKey}`, subValue);
					}
				}
			}
		}
	}

	/**
	 * Type guard to check if a value is a valid operation type
	 * @param value - The value to check
	 * @returns True if the value is an operation type
	 */
	private isOperationType(value: any): value is OperationType<any, any, any> {
		if (value === null) return false;
		return (
			value &&
			typeof value === "object" &&
			"type" in value &&
			(value.type === "get" || value.type === "post" || value.type === "ws")
		);
	}

	/**
	 * Registers a single operation as a route with appropriate middleware and validation
	 * @param path - The route path
	 * @param operation - The operation definition to register
	 */
	private registerOperation(
		path: string,
		operation: OperationType<any, any, E>,
	) {
		const routePath = `/${path}` as const;

		// Store procedure metadata if not already present
		if (!this._metadata.procedures[path]) {
			if (operation.type === "ws") {
				// Handle WebSocket operation with incoming/outgoing schemas
				const wsOperation = operation;
				this._metadata.procedures[path] = {
					type: "ws",
					schema: {
						incoming: wsOperation.incoming
							? toJSONSchemaWithDate(wsOperation.incoming)
							: null,
						outgoing: wsOperation.outgoing
							? toJSONSchemaWithDate(wsOperation.outgoing)
							: null,
					},
				} satisfies WSProcedureMetadata;
			} else {
				// Handle regular operations with single schema
				this._metadata.procedures[path] = {
					type: operation.type, // TypeScript knows this is "get" | "post"
					schema:
						operation.schema instanceof ZodObject
							? toJSONSchemaWithDate(operation.schema)
							: null,
				} satisfies GetPostProcedureMetadata;
			}
		}

		// Convert operation middlewares to Hono middleware handlers
		const operationMiddlewares: MiddlewareHandler<E>[] =
			operation.middlewares.map((middleware) => {
				const middlewareHandler = async (c: Context<E>, next: Next) => {
					const typedC = c as ContextWithSuperJSON<
						E & { Variables: InternalContext }
					>;
					const middlewareOutput = typedC.get("__middleware_output") ?? {};

					const nextWrapper = async <B>(args: B) => {
						Object.assign(middlewareOutput, args);
						return middlewareOutput;
					};

					const res = await middleware({
						ctx: middlewareOutput,
						next: nextWrapper,
						c: c as ContextWithSuperJSON<E>,
					});

					if (res) {
						Object.assign(middlewareOutput, res);
					}

					typedC.set("__middleware_output", middlewareOutput);
					await next();
				};

				return middlewareHandler;
			});

		// Register route based on operation type
		if (operation.type === "get") {
			if (operation.schema) {
				// GET with schema validation
				this.get(
					routePath,
					queryParsingMiddleware,
					...operationMiddlewares,
					async (c) => {
						const typedC = c as Context<E & { Variables: InternalContext }>;
						const ctx = typedC.get("__middleware_output") || {};
						const parsedQuery = typedC.get("__parsed_query");

						const queryInput =
							Object.keys(parsedQuery || {}).length === 0
								? undefined
								: parsedQuery;

						// Parse and validate input (errors caught at app-level with .onError)
						const input = operation.schema?.parse(queryInput);
						const result = await this.callHandlerSafely(operation.handler, {
							c: c as ContextWithSuperJSON<E>,
							ctx,
							input,
						});

						return result === undefined ? c.json(undefined) : result;
					},
				);
			} else {
				// GET without schema validation
				this.get(routePath, ...operationMiddlewares, async (c) => {
					const typedC = c as Context<E & { Variables: InternalContext }>;
					const ctx = typedC.get("__middleware_output") || {};

					const result = await this.callHandlerSafely(operation.handler, {
						c: c as ContextWithSuperJSON<E>,
						ctx,
						input: undefined,
					});
					return result === undefined ? c.json(undefined) : result;
				});
			}
		} else if (operation.type === "post") {
			if (operation.schema) {
				// POST with schema validation
				this.post(
					routePath,
					bodyParsingMiddleware,
					...operationMiddlewares,
					async (c) => {
						const typedC = c as Context<E & { Variables: InternalContext }>;
						const ctx = typedC.get("__middleware_output") || {};
						const parsedBody = typedC.get("__parsed_body");

						const bodyInput =
							Object.keys(parsedBody || {}).length === 0
								? undefined
								: parsedBody;

						// caught at app-level with .onError
						const input = operation.schema?.parse(bodyInput);

						const result = await this.callHandlerSafely(operation.handler, {
							c: c as ContextWithSuperJSON<E>,
							ctx,
							input,
						});

						return result === undefined ? c.json(undefined) : result;
					},
				);
			} else {
				// POST without schema validation
				this.post(routePath, ...operationMiddlewares, async (c) => {
					const typedC = c as Context<E & { Variables: InternalContext }>;
					const ctx = typedC.get("__middleware_output") || {};

					const result = await this.callHandlerSafely(operation.handler, {
						c: c as ContextWithSuperJSON<E>,
						ctx,
						input: undefined,
					});
					return result === undefined ? c.json(undefined) : result;
				});
			}
		} else if (operation.type === "ws") {
			this.get(
				routePath,
				queryParsingMiddleware,
				...operationMiddlewares,
				async (c) => {
					const typedC = c as Context<
						E & {
							Variables: InternalContext;
						}
					>;

					const routerConfig: any = this._metadata.config as any;
					const getPubSubAdapter =
						typeof routerConfig?.getPubSubAdapter === "function"
							? routerConfig.getPubSubAdapter
							: undefined;
					let adapter = getPubSubAdapter?.(typedC);
					if (!adapter) {
						const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = env(
							typedC as any,
						);
						if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
							adapter = new UpstashRestPubSub(
								UPSTASH_REDIS_REST_URL,
								UPSTASH_REDIS_REST_TOKEN,
							);
						}
					}

					if (!adapter) {
						throw new HTTPException(503, {
							message:
								"Missing PubSub adapter for WebSockets.\n\n" +
								"Provide a `getPubSubAdapter(c)` function via `router.config({ getPubSubAdapter })` that returns a Pub/Sub adapter instance.\n" +
								"WebSockets guide: https://jsandy.com/docs/websockets\n",
						});
					}

					const ctx = typedC.get("__middleware_output") || {};

					const { 0: client, 1: server } = new WebSocketPair();

					server.accept();

					const io = new IO(adapter);

					const handler = await this.callHandlerSafely(operation.handler, {
						io,
						c: c as ContextWithSuperJSON<E>,
						ctx,
					});

					const socket = new ServerSocket(server, {
						adapter,
						incomingSchema: operation.incoming,
						outgoingSchema: operation.outgoing,
					});

					handler.onConnect?.({ socket });

					server.onclose = async () => {
						socket.close();
						await handler.onDisconnect?.({ socket });
					};

					server.onerror = async (error) => {
						socket.close();
						await handler.onError?.({ socket, error });
					};

					const eventSchema = z.tuple([z.string(), z.unknown()]);
					server.onmessage = async (event) => {
						try {
							const rawData = z.string().parse(event.data);
							const parsedData = JSON.parse(rawData);

							const [eventName, eventData] = eventSchema.parse(parsedData);

							if (eventName === "ping") {
								server.send(JSON.stringify(["pong", null]));
								return;
							}

							socket.handleEvent(eventName, eventData);
						} catch (err) {
							logger.error("Failed to process message:", err);
						}
					};

					return new Response(null, {
						status: 101,
						webSocket: client,
					});
				},
			);
		}
	}
}
