import { type Context, Hono, type Next } from "hono";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import type { Env, ErrorHandler, MiddlewareHandler, Schema } from "hono/types";
import type { StatusCode } from "hono/utils/http-status";
import type { ZodObject } from "zod/v4";
import { toJSONSchema, z } from "zod/v4";
import { bodyParsingMiddleware, queryParsingMiddleware } from "./middleware";
import { IO, ServerSocket, type InferSchemaType } from "./sockets";
import type {
	ContextWithSuperJSON,
	GetOperation,
	InferInput,
	InferSchema,
	OperationType,
	PostOperation,
	RouterConfig,
	WebSocketOperation,
} from "./types";
import type { ClientRequest } from "./client";

type FlattenRoutes<T> = {
	[K in keyof T]: T[K] extends WebSocketOperation<ZodObject, ZodObject>
		? { [P in `${string & K}`]: T[K] }
		: T[K] extends GetOperation<ZodObject | void>
			? { [P in `${string & K}`]: T[K] }
			: T[K] extends PostOperation<ZodObject | void>
				? { [P in `${string & K}`]: T[K] }
				: T[K] extends Record<string, unknown>
					? {
							[SubKey in keyof T[K] as `${string & K}/${string &
								SubKey}`]: T[K][SubKey] extends
								| WebSocketOperation<ZodObject, ZodObject>
								| GetOperation<ZodObject | void>
								| PostOperation<ZodObject | void>
								? T[K][SubKey]
								: never;
						}
					: never;
}[keyof T];

export type MergeRoutes<T> = {
	[K in keyof FlattenRoutes<T>]: FlattenRoutes<T>[K];
};

export type RouterSchema<T extends Record<string, unknown>> = {
	[K in keyof T]: T[K] extends WebSocketOperation<ZodObject, ZodObject>
		? {
				$get: {
					input: InferInput<T[K]>;
					// biome-ignore lint/complexity/noBannedTypes: Empty object for output since WebSocket connections don't have an initial response payload
					output: {};
					incoming: NonNullable<T[K]["incoming"]>;
					outgoing: NonNullable<T[K]["outgoing"]>;
					outputFormat: "ws";
					status: StatusCode;
				};
			}
		: T[K] extends GetOperation<ZodObject | void>
			? {
					$get: {
						input: InferInput<T[K]>;
						output: ReturnType<T[K]["handler"]>;
						outputFormat: "json";
						status: StatusCode;
					};
				}
			: T[K] extends PostOperation<ZodObject | void>
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

export type OperationSchema<
	T,
	E extends Env = Env,
> = T extends WebSocketOperation<
	infer I extends ZodObject,
	infer O extends ZodObject
>
	? {
			$get: {
				input: z.infer<I>;
				output: z.infer<O>;
				incoming: z.infer<NonNullable<T["incoming"]>>;
				outgoing: z.infer<NonNullable<T["outgoing"]>>;
				outputFormat: "ws";
				status: StatusCode;
			};
		}
	: T extends GetOperation<ZodObject | void, Response, E>
		? {
				$get: {
					input: InferInput<T>;
					output: ReturnType<T["handler"]>;
					outputFormat: "json";
					status: StatusCode;
				};
			}
		: T extends PostOperation<ZodObject | void, Response, E>
			? {
					$post: {
						input: InferInput<T>;
						output: ReturnType<T["handler"]>;
						outputFormat: "json";
						status: StatusCode;
					};
				}
			: T extends ClientRequest<infer S>
				? S
				: never;

interface InternalContext {
	__middleware_output?: Record<string, unknown>;
	__parsed_query?: Record<string, unknown>;
	__parsed_body?: Record<string, unknown>;
}

// Type for WebSocket bindings
interface WebSocketBindings {
	UPSTASH_REDIS_REST_URL: string | undefined;
	UPSTASH_REDIS_REST_TOKEN: string | undefined;
}

interface JSONSchema {
	type?: string | string[];
	properties?: Record<string, JSONSchema>;
	required?: string[];
	additionalProperties?: boolean | JSONSchema;
	$schema?: string;
}

// Type for procedures metadata
type ProcedureMetadata = {
	type: "get" | "post" | "ws";
	schema: JSONSchema | null;
};

export class Router<
	T extends Record<string, unknown>,
	E extends Env = Env,
> extends Hono<E, RouterSchema<MergeRoutes<T>>, string> {
	_metadata: {
		subRouters: Record<string, Router<Record<string, unknown>, E>>;
		config: RouterConfig | Record<string, RouterConfig>;
		procedures: Record<string, ProcedureMetadata>;
		registeredPaths: string[];
	};

	_errorHandler: ErrorHandler<E> | undefined = undefined;

	config(config?: RouterConfig) {
		if (config) {
			this._metadata.config = config;
		}

		return this;
	}

	// Used in Hono adapters
	// Strips types to prevent version-mismatch induced infinite recursion warning
	get handler(): Hono<E> {
		return this as unknown as Hono<E>;
	}

	constructor(procedures: T = {} as T) {
		super();

		this._metadata = {
			subRouters: {},
			config: {},
			procedures: {},
			registeredPaths: [],
		};

		for (const [procName, value] of Object.entries(procedures)) {
			const procData = value as {
				type: "get" | "post" | "ws";
				schema?: ZodObject;
			};
			const { schema } = procData;
			this._metadata.procedures[procName] = {
				type: procData.type,
				schema: schema ? toJSONSchema(schema) : null,
			};
		}

		this.onError = (handler: ErrorHandler<E>) => {
			this._errorHandler = handler;
			return this;
		};

		this.setupRoutes(procedures);
	}

	registerSubrouterMiddleware() {
		this.use(async (c, next) => {
			const [basePath, routerName] = c.req.path
				.split("/")
				.filter(Boolean)
				.slice(0, 2);

			const key = `/${basePath}/${routerName}`;
			const subRouter = this._metadata.subRouters[key];

			if (subRouter) {
				const rewrittenPath = `/${c.req.path.split("/").slice(3).join("/")}`;
				const newUrl = new URL(c.req.url);
				newUrl.pathname = rewrittenPath;

				const newRequest = new Request(newUrl, c.req.raw);
				const response = await subRouter.fetch(newRequest, c.env);

				return response;
			}

			return next();
		});
	}

	private setupRoutes(procedures: T) {
		for (const [key, value] of Object.entries(procedures)) {
			if (this.isOperationType(value)) {
				this.registerOperation(key, value);
			} else if (typeof value === "object" && value !== null) {
				const nestedProcedures = value as Record<string, unknown>;
				for (const [subKey, subValue] of Object.entries(nestedProcedures)) {
					if (this.isOperationType(subValue)) {
						this.registerOperation(`${key}/${subKey}`, subValue);
					}
				}
			}
		}
	}

	private isOperationType(
		value: unknown,
	): value is OperationType<ZodObject | void, ZodObject | void, E> {
		return (
			value !== null &&
			typeof value === "object" &&
			"type" in value &&
			typeof (value as { type: unknown }).type === "string" &&
			["get", "post", "ws"].includes((value as { type: string }).type)
		);
	}

	private registerOperation(
		path: string,
		// biome-ignore lint/suspicious/noExplicitAny: Output type is not known
		operation: OperationType<ZodObject | void, any, E>,
	) {
		const routePath = `/${path}` as const;

		if (!this._metadata.procedures[path]) {
			let schema = null;

			if (operation.type === "ws") {
				// Handle WebSocket operation with incoming/outgoing schemas
				const wsOperation = operation;
				schema = {
					incoming: wsOperation.incoming
						? toJSONSchema(wsOperation.incoming)
						: null,
					outgoing: wsOperation.outgoing
						? toJSONSchema(wsOperation.outgoing)
						: null,
				};
			} else if (operation.schema) {
				// Handle regular operations with single schema
				schema = toJSONSchema(operation.schema);
			}

			this._metadata.procedures[path] = {
				type: operation.type,
				schema,
			};
		}

		const operationMiddlewares: MiddlewareHandler<E>[] =
			operation.middlewares.map((middleware) => {
				const middlewareHandler = async (c: Context<E>, next: Next) => {
					const typedC = c as ContextWithSuperJSON<
						E & { Variables: InternalContext }
					>;
					const middlewareOutput = typedC.get("__middleware_output") ?? {};

					const nextWrapper = async <B extends Record<string, unknown>>(
						args?: B,
					): Promise<B> => {
						if (args) {
							Object.assign(middlewareOutput, args);
						}
						return args ?? ({} as B);
					};

					const res = await middleware({
						ctx: middlewareOutput,
						next: nextWrapper,
						c: c as ContextWithSuperJSON<E>,
					});

					if (res && typeof res === "object") {
						Object.assign(middlewareOutput, res);
					}

					typedC.set("__middleware_output", middlewareOutput);
					await next();
				};

				return middlewareHandler;
			});

		if (operation.type === "get") {
			if (operation.schema) {
				this.get(
					routePath,
					queryParsingMiddleware,
					...operationMiddlewares,
					async (c) => {
						const typedC = c as Context<E & { Variables: InternalContext }>;
						const ctx = typedC.get("__middleware_output") || {};
						const parsedQuery = typedC.get("__parsed_query");

						const queryInput =
							parsedQuery && Object.keys(parsedQuery).length > 0
								? parsedQuery
								: undefined;

						// caught at app-level with .onError
						const input = operation.schema?.parse(queryInput);
						const result = await operation.handler({
							c: c as ContextWithSuperJSON<E>,
							ctx,
							input: input as InferSchema<typeof operation.schema>,
						});

						return result === undefined ? c.json(undefined) : result;
					},
				);
			} else {
				this.get(routePath, ...operationMiddlewares, async (c) => {
					const typedC = c as Context<E & { Variables: InternalContext }>;
					const ctx = typedC.get("__middleware_output") || {};

					const result = await operation.handler({
						c: c as ContextWithSuperJSON<E>,
						ctx,
						input: undefined as void,
					});
					return result === undefined ? c.json(undefined) : result;
				});
			}
		} else if (operation.type === "post") {
			if (operation.schema) {
				this.post(
					routePath,
					bodyParsingMiddleware,
					...operationMiddlewares,
					async (c) => {
						const typedC = c as Context<E & { Variables: InternalContext }>;
						const ctx = typedC.get("__middleware_output") || {};
						const parsedBody = typedC.get("__parsed_body");

						const bodyInput =
							parsedBody && Object.keys(parsedBody).length > 0
								? parsedBody
								: undefined;

						// caught at app-level with .onError
						const input = operation.schema?.parse(bodyInput);

						const result = await operation.handler({
							c: c as ContextWithSuperJSON<E>,
							ctx,
							input: input as InferSchema<typeof operation.schema>,
						});

						return result === undefined ? c.json(undefined) : result;
					},
				);
			} else {
				this.post(routePath, ...operationMiddlewares, async (c) => {
					const typedC = c as Context<E & { Variables: InternalContext }>;
					const ctx = typedC.get("__middleware_output") || {};

					const result = await operation.handler({
						c: c as ContextWithSuperJSON<E>,
						ctx,
						input: undefined as void,
					});
					return result === undefined ? c.json(undefined) : result;
				});
			}
		} else if (operation.type === "ws") {
			const wsOp = operation;

			this.get(
				routePath,
				queryParsingMiddleware,
				...operationMiddlewares,
				async (c) => {
					const typedC = c as Context<
						E & {
							Variables: InternalContext;
							Bindings: WebSocketBindings;
						}
					>;

					const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } =
						env(typedC);

					if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
						throw new HTTPException(503, {
							message:
								"Missing required environment variables for WebSockets connection.\n\n" +
								"Real-time WebSockets depend on a persistent connection layer to maintain communication. JSandy uses Upstash Redis to achieve this." +
								"To fix this error:\n" +
								"1. Log in to Upstash Redis at https://upstash.com\n" +
								"2. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to your environment variables\n\n" +
								"Complete WebSockets guide: https://jsandy.app/docs/websockets\n",
						});
					}

					const ctx = typedC.get("__middleware_output") || {};

					const { 0: client, 1: server } = new WebSocketPair();

					server.accept();

					const io = new IO(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN);

					const handler = await wsOp.handler({
						io,
						c: c as ContextWithSuperJSON<E>,
						ctx,
					});

					const socket = new ServerSocket<
						typeof wsOp.incoming,
						typeof wsOp.outgoing
					>(server, {
						redisUrl: UPSTASH_REDIS_REST_URL,
						redisToken: UPSTASH_REDIS_REST_TOKEN,
						incomingSchema: wsOp.incoming,
						outgoingSchema: wsOp.outgoing,
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
							const parsedData = JSON.parse(rawData) as unknown;

							const [eventName, eventData] = eventSchema.parse(parsedData);

							if (eventName === "ping") {
								server.send(JSON.stringify(["pong", null]));
								return;
							}

							socket.handleEvent(
								eventName,
								eventData as InferSchemaType<Schema>,
							);
						} catch (err) {
							console.error("Failed to process message:", err);
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
