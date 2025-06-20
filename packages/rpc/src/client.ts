import type { Hono } from "hono";
import {
	type ClientRequestOptions,
	type ClientResponse,
	hc,
} from "hono/client";
import { HTTPException } from "hono/http-exception";
import type { Endpoint, ResponseFormat, Schema } from "hono/types";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { UnionToIntersection } from "hono/utils/types";
import superjson from "superjson";
import type { InferSchemaFromRouters } from "./merge-routers";
import type {
	MergeRoutes,
	OperationSchema,
	Router,
	RouterSchema,
} from "./router";
import { ClientSocket, type SystemEvents } from "./sockets";
import type { GetOperation, PostOperation } from "./types";

/**
 * Extracts the response type from an endpoint definition
 * Maps endpoint output, format, and status to a ClientResponse type
 * @template T - The endpoint type to extract response from
 */
type ClientResponseOfEndpoint<T extends Endpoint = Endpoint> = T extends {
	output: infer O;
	outputFormat: infer F;
	status: infer S;
}
	? ClientResponse<
			O,
			S extends number ? S : never,
			F extends ResponseFormat ? F : never
		>
	: never;

/**
 * Generates a client interface for making requests to API endpoints
 * Provides type-safe methods for HTTP requests and WebSocket connections
 * @template S - Schema type defining the available endpoints
 */
export type ClientRequest<S extends Schema> = {
	[M in keyof S]: S[M] extends Endpoint & { input: infer R }
		? undefined extends R
			? (
					args?: R,
					options?: ClientRequestOptions,
				) => Promise<ClientResponseOfEndpoint<S[M]>>
			: (
					args: R,
					options?: ClientRequestOptions,
				) => Promise<ClientResponseOfEndpoint<S[M]>>
		: never;
} & {
	/**
	 * Generates a URL for the endpoint with optional parameters
	 * @param arg - Optional parameters including query params and path params
	 * @returns URL object for the endpoint
	 */
	$url: (
		arg?: S[keyof S] extends { input: infer R }
			? R extends { param: infer P }
				? R extends { query: infer Q }
					? { param: P; query: Q }
					: { param: P }
				: R extends { query: infer Q }
					? { query: Q }
					: {}
			: {},
	) => URL;
} & (S["$get"] extends { outputFormat: "ws" }
		? S["$get"] extends {
				input: infer I;
				incoming: infer Incoming extends Record<string, any>;
				outgoing: infer Outgoing extends Record<string, any>;
			}
			? {
					$ws: (args?: I) => ClientSocket<Outgoing & SystemEvents, Incoming>;
				}
			: {}
		: {});

/**
 * Unwraps a RouterSchema to extract the underlying route structure
 * @template T - RouterSchema type to unwrap
 */
export type UnwrapRouterSchema<T> = T extends RouterSchema<infer R> ? R : never;

/**
 * Infers the schema type from a Router instance
 * @template T - Router type to infer schema from
 */
export type InferRouter<T extends Router<any, any>> = T extends Router<
	infer P,
	any
>
	? RouterSchema<P>
	: never;

/**
 * Generates a complete client interface for a Router or Router factory function
 * Provides type-safe access to all routes with proper method signatures
 * @template T - Router instance or Router factory function type
 */
export type Client<T extends Router<any, any> | (() => Promise<Router<any>>)> =
	T extends Hono<any, infer S>
		? S extends RouterSchema<infer B>
			? B extends MergeRoutes<infer C>
				? C extends InferSchemaFromRouters<infer D>
					? {
							[K1 in keyof D]: D[K1] extends () => Promise<Router<infer P, any>>
								? { [K2 in keyof P]: ClientRequest<OperationSchema<P[K2]>> }
								: D[K1] extends Router<infer P, any>
									? { [K2 in keyof P]: ClientRequest<OperationSchema<P[K2]>> }
									: never;
						}
					: never
				: never
			: never
		: never;

/**
 * Extracts input or output types from router operations
 * Used internally for type inference of router I/O schemas
 * @template T - Router or Router factory type
 * @template IOType - Whether to extract "input" or "output" types
 */
type OperationIO<
	T extends Router<any, any> | (() => Promise<Router<any, any>>),
	IOType extends "input" | "output",
> = T extends Hono<any, infer S>
	? S extends RouterSchema<infer B>
		? B extends MergeRoutes<infer C>
			? C extends InferSchemaFromRouters<infer D>
				? {
						[K1 in keyof D]: D[K1] extends
							| Router<infer P, any>
							// biome-ignore lint/suspicious/noRedeclare: P is only declared once
							| (() => Promise<Router<infer P, any>>)
							? {
									[K2 in keyof P]: P[K2] extends infer Operation
										? Operation extends PostOperation<any>
											? OperationSchema<Operation> extends {
													$post: { [key in IOType]: any };
												}
												? OperationSchema<Operation>["$post"][IOType]
												: never
											: Operation extends GetOperation<any>
												? OperationSchema<Operation> extends {
														$get: { [key in IOType]: any };
													}
													? OperationSchema<Operation>["$get"][IOType]
													: never
												: Operation
										: never;
								}
							: never;
					}
				: never
			: never
		: never
	: never;

/**
 * Infers all output types from router operations
 * Useful for understanding what data types the router returns
 * @template T - Router type to extract outputs from
 */
export type InferRouterOutputs<T extends Router<any>> = OperationIO<
	T,
	"output"
>;

/**
 * Infers all input types from router operations
 * Useful for understanding what data types the router accepts
 * @template T - Router type to extract inputs from
 */
export type InferRouterInputs<T extends Router<any>> = OperationIO<T, "input">;

/**
 * Configuration options for the API client
 * Extends Hono's ClientRequestOptions with additional settings
 */
export interface ClientConfig extends ClientRequestOptions {
	/** Base URL for all API requests (required) */
	baseUrl: string;
	/** Credential policy for requests, defaults to "include" */
	credentials?: RequestCredentials;
}

/**
 * Creates a type-safe HTTP client for communicating with JSandy routers
 * Provides automatic serialization, error handling, and type inference
 *
 * @template T - Router type that defines the API structure
 * @param options - Client configuration options including base URL
 * @returns Type-safe client with methods matching the router's API
 *
 * @example
 * ```typescript
 * // Create client for a specific router
 * const client = createClient<typeof myRouter>({
 *   baseUrl: 'https://api.example.com'
 * });
 *
 * // Type-safe API calls
 * const user = await client.users.getUser({ id: '123' });
 * const result = await client.posts.createPost({ title: 'Hello', content: '...' });
 *
 * // WebSocket connections
 * const socket = client.chat.$ws();
 * socket.emit('message', { text: 'Hello!' });
 * ```
 *
 * Features:
 * - **Type Safety**: Full TypeScript inference for all API methods
 * - **SuperJSON Support**: Automatic serialization of complex objects
 * - **Error Handling**: Converts HTTP errors to HTTPException instances
 * - **WebSocket Support**: Type-safe real-time communication
 * - **Credential Management**: Configurable authentication handling
 * - **URL Generation**: Helper methods for constructing endpoint URLs
 */
export const createClient = <T extends Router<any>>(
	options?: ClientConfig,
): UnionToIntersection<Client<T>> => {
	const {
		baseUrl = "",
		credentials = "include",
		...opts
	} = options ?? ({} as ClientConfig);

	// Validate base URL format
	if (baseUrl !== "" && !baseUrl.startsWith("http")) {
		throw new Error("baseUrl must start with http:// or https://");
	}

	/**
	 * Enhanced fetch function with automatic error handling and SuperJSON support
	 * @param input - Request URL or Request object
	 * @param init - Request initialization options
	 * @returns Promise resolving to enhanced Response object
	 */
	const jfetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		// Remove baseUrl from input if already included (useful during SSR)
		const inputPath = input.toString().replace(baseUrl, "");
		const targetUrl = baseUrl + inputPath;

		const res = await fetch(targetUrl, {
			...init,
			credentials,
			cache: "no-store",
		});

		// Convert HTTP errors to exceptions
		if (!res.ok) {
			const message = await res.text();
			throw new HTTPException(res.status as ContentfulStatusCode, {
				message,
			});
		}

		// Override json() method to support SuperJSON
		res.json = () => parseJsonResponse(res);
		return res;
	};

	// Create base Hono client
	const baseClient = hc(baseUrl, {
		...opts,
		fetch: opts.fetch || jfetch,
	}) as unknown as UnionToIntersection<Client<T>>;

	return createProxy(baseClient, baseUrl) as typeof baseClient;
};

/**
 * Parses JSON responses with SuperJSON support
 * Automatically detects and deserializes SuperJSON-encoded responses
 * @param response - HTTP response to parse
 * @returns Parsed response data with complex objects restored
 */
const parseJsonResponse = async (response: Response): Promise<any> => {
	const text = await response.text();
	const isSuperjson = response.headers.get("x-is-superjson") === "true";

	try {
		return isSuperjson ? superjson.parse(text) : JSON.parse(text);
	} catch (error) {
		console.error("Failed to parse response as JSON:", error);
		throw new Error("Invalid JSON response");
	}
};

/**
 * Serializes data using SuperJSON for transmission
 * Converts object properties to SuperJSON-encoded strings
 * @param data - Data object to serialize
 * @returns Record with SuperJSON-serialized string values
 */
function serializeWithSuperJSON(data: any): any {
	if (typeof data !== "object" || data === null) {
		return data;
	}
	return Object.fromEntries(
		Object.entries(data).map(([key, value]) => [
			key,
			superjson.stringify(value),
		]),
	);
}

/**
 * Creates a dynamic proxy for client method delegation
 * Enables type-safe access to nested routes and automatic request handling
 *
 * @param baseClient - Base client instance to proxy requests through
 * @param baseUrl - Base URL for constructing request URLs
 * @param path - Current path segments for nested route handling
 * @returns Proxy object with dynamic method resolution
 *
 * The proxy handles:
 * - **$get**: GET requests with query parameter serialization
 * - **$post**: POST requests with body serialization
 * - **$url**: URL generation for endpoints
 * - **$ws**: WebSocket connection creation
 * - **Dynamic nesting**: Automatic proxy chaining for nested routes
 */
function createProxy(
	baseClient: any,
	baseUrl: string,
	path: string[] = [],
): any {
	return new Proxy(baseClient, {
		get(target, prop, receiver) {
			if (typeof prop === "string") {
				const routePath = [...path, prop];

				// Handle GET requests with query parameter serialization
				if (prop === "$get") {
					return async (...args: any[]) => {
						const [data, options] = args;
						const serializedQuery = serializeWithSuperJSON(data);

						// Create the nested client path for the Hono client
						const nestedClient = path.reduce((client, segment) => {
							return client[segment];
						}, baseClient);

						return nestedClient.$get({ query: serializedQuery }, options);
					};
				}

				// Handle POST requests with body serialization
				if (prop === "$post") {
					return async (...args: any[]) => {
						const [data, options] = args;
						const serializedJson = serializeWithSuperJSON(data);

						// Create the nested client path for the Hono client
						const nestedClient = path.reduce((client, segment) => {
							return client[segment];
						}, baseClient);

						return nestedClient.$post({ json: serializedJson }, options);
					};
				}

				// Handle URL generation for endpoints
				if (prop === "$url") {
					return (args?: any) => {
						const endpointPath = `/${routePath.slice(0, -1).join("/")}`;
						const normalizedPath = endpointPath.replace(baseUrl, "");
						const url = new URL(baseUrl + normalizedPath);

						if (args?.query) {
							for (const [key, value] of Object.entries(args.query)) {
								if (value !== null && value !== undefined) {
									url.searchParams.append(key, String(value));
								}
							}
						}

						return url;
					};
				}

				// Handle WebSocket connection creation
				if (prop === "$ws") {
					return () => {
						const endpointPath = `/${routePath.slice(0, -1).join("/")}`;
						const normalizedPath = endpointPath.replace(baseUrl, "");
						const url = new URL(baseUrl + normalizedPath);

						// Change protocol to ws:// or wss:// depending on if https or http
						url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

						return new ClientSocket(url);
					};
				}

				// For nested routes, continue the proxy chain but maintain the base client reference
				// This ensures that $get/$post methods are still available at deeper levels
				return createProxy(baseClient, baseUrl, routePath);
			}

			return Reflect.get(target, prop, receiver);
		},
	});
}
