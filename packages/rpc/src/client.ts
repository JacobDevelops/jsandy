import superjson from "superjson";
import type { Hono } from "hono";
import {
	type ClientRequestOptions,
	type ClientResponse,
	hc,
} from "hono/client";
import { HTTPException } from "hono/http-exception";
import type { Endpoint, Env, ResponseFormat, Schema } from "hono/types";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { UnionToIntersection } from "hono/utils/types";
import type { ZodObject } from "zod/v4";
import type { InferSchemaFromRouters } from "./merge-routers";
import type {
	MergeRoutes,
	OperationSchema,
	Router,
	RouterSchema,
} from "./router";
import { ClientSocket, type SystemEvents } from "./sockets";
import type { GetOperation, OperationType, PostOperation } from "./types";

// Define the router constraint type
export type RouterRecord = Record<
	string,
	OperationType<ZodObject, ZodObject> | Record<string, unknown>
>;

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
	$url: (
		arg?: S[keyof S] extends { input: infer R }
			? R extends { param: infer P }
				? R extends { query: infer Q }
					? { param: P; query: Q }
					: { param: P }
				: R extends { query: infer Q }
					? { query: Q }
					: Record<string, never>
			: Record<string, never>,
	) => URL;
} & (S["$get"] extends { outputFormat: "ws" }
		? S["$get"] extends {
				input: infer I;
				incoming: infer Incoming;
				outgoing: infer Outgoing;
			}
			? {
					$ws: (args?: I) => ClientSocket<Outgoing & SystemEvents, Incoming>;
				}
			: Record<string, never>
		: void);

export type UnwrapRouterSchema<T> = T extends RouterSchema<infer R> ? R : never;

export type InferRouter<T extends Router<RouterRecord, Env>> = T extends Router<
	infer P,
	Env
>
	? RouterSchema<P>
	: never;

type ClientRouteMapping<P, E extends Env> = {
	[K in keyof P]: P[K] extends OperationType<unknown, Response, E>
		? ClientRequest<OperationSchema<P[K], E>>
		: P[K] extends Record<string, OperationType<unknown, Response, E>>
			? {
					[SubK in keyof P[K]]: ClientRequest<OperationSchema<P[K][SubK], E>>;
				}
			: never;
};

export type Client<
	T extends
		| Router<RouterRecord, InferRouterEnv<T>>
		| (() => Promise<Router<RouterRecord, InferRouterEnv<T>>>),
> = T extends Hono<InferRouterEnv<T>, infer S>
	? S extends RouterSchema<infer B>
		? B extends MergeRoutes<infer C>
			? C extends InferSchemaFromRouters<infer D, InferRouterEnv<T>>
				? {
						[K1 in keyof D]: D[K1] extends () => Promise<
							Router<infer P, InferRouterEnv<T>>
						>
							? ClientRouteMapping<P, InferRouterEnv<T>>
							: D[K1] extends Router<infer P, InferRouterEnv<T>>
								? ClientRouteMapping<P, InferRouterEnv<T>>
								: never;
					}
				: never
			: never
		: never
	: never;

type OperationIO<
	T extends
		| Router<RouterRecord, Env>
		| (() => Promise<Router<RouterRecord, Env>>),
	IOType extends "input" | "output",
> = T extends Hono<Env, infer S>
	? S extends RouterSchema<infer B>
		? B extends MergeRoutes<infer C>
			? C extends InferSchemaFromRouters<infer D>
				? {
						[K1 in keyof D]: D[K1] extends
							| Router<infer P, Env>
							// biome-ignore lint/suspicious/noRedeclare: This isn't a redeclaration, it's a type
							| (() => Promise<Router<infer P, Env>>)
							? {
									[K2 in keyof P]: P[K2] extends infer Operation
										? Operation extends PostOperation<ZodObject | void>
											? OperationSchema<Operation> extends {
													$post: { [key in IOType]: unknown };
												}
												? OperationSchema<Operation>["$post"][IOType]
												: never
											: Operation extends GetOperation<ZodObject | void>
												? OperationSchema<Operation> extends {
														$get: { [key in IOType]: unknown };
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

export type InferRouterOutputs<T extends Router<RouterRecord, Env>> =
	OperationIO<T, "output">;
export type InferRouterInputs<T extends Router<RouterRecord, Env>> =
	OperationIO<T, "input">;

export interface ClientConfig extends ClientRequestOptions {
	baseUrl: string;
	credentials?: RequestCredentials;
}

// Type for the serialized data structure
type SerializableValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| SerializableValue[]
	| { [key: string]: SerializableValue };

// Type for HTTP method arguments
type HttpMethodArgs<T = unknown> = [data?: T, options?: ClientRequestOptions];

// Improved proxy target interface
interface ProxyTarget {
	$get?: (...args: HttpMethodArgs) => Promise<Response>;
	$post?: (...args: HttpMethodArgs) => Promise<Response>;
	$ws?: () => ClientSocket<SystemEvents, Record<string, unknown>>;
	[key: string]: unknown;
}

type InferRouterEnv<T> = T extends Router<RouterRecord, infer E> ? E : never;

export const createClient = <T extends Router<RouterRecord, InferRouterEnv<T>>>(
	options?: ClientConfig,
): UnionToIntersection<Client<T>> => {
	const {
		baseUrl = "",
		credentials = "include",
		...opts
	} = options ?? ({} as ClientConfig);

	if (baseUrl !== "" && !baseUrl.startsWith("http")) {
		throw new Error("baseUrl must start with http:// or https://");
	}

	const jfetch = async (
		input: RequestInfo | URL,
		init?: RequestInit,
	): Promise<Response> => {
		// remove baseUrl from input if already included, for example during SSR
		const inputPath = input.toString().replace(baseUrl, "");
		const targetUrl = baseUrl + inputPath;

		const res = await fetch(targetUrl, {
			...init,
			credentials,
			cache: "no-store",
		});

		if (!res.ok) {
			const message = await res.text();
			throw new HTTPException(res.status as ContentfulStatusCode, {
				message,
			});
		}

		res.json = () => parseJsonResponse(res);
		return res;
	};

	const baseClient = hc(baseUrl, {
		...opts,
		fetch: opts.fetch || jfetch,
	});

	return createProxy(baseClient, baseUrl) as UnionToIntersection<Client<T>>;
};

const parseJsonResponse = async (response: Response): Promise<unknown> => {
	const text = await response.text();
	const isSuperjson = response.headers.get("x-is-superjson") === "true";

	try {
		return isSuperjson ? superjson.parse(text) : JSON.parse(text);
	} catch (error) {
		console.error("Failed to parse response as JSON:", error);
		throw new Error("Invalid JSON response");
	}
};

function serializeWithSuperJSON(data: unknown): Record<string, string> {
	if (typeof data !== "object" || data === null) {
		return {};
	}

	const record = data as Record<string, unknown>;
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [
			key,
			superjson.stringify(value),
		]),
	);
}

function createProxy(
	baseClient: ProxyTarget,
	baseUrl: string,
	path: string[] = [],
): ProxyTarget {
	return new Proxy(baseClient, {
		get(target: ProxyTarget, prop: string | symbol, receiver): unknown {
			if (typeof prop === "string") {
				const routePath = [...path, prop];

				if (prop === "$get") {
					return async (...args: HttpMethodArgs) => {
						const [data, options] = args;
						const serializedQuery = serializeWithSuperJSON(data);
						return target.$get?.({ query: serializedQuery }, options);
					};
				}

				if (prop === "$post") {
					return async (...args: HttpMethodArgs) => {
						const [data, options] = args;
						const serializedJson = serializeWithSuperJSON(data);
						return target.$post?.({ json: serializedJson }, options);
					};
				}

				if (prop === "$url") {
					return (args?: { query: Record<string, SerializableValue> }): URL => {
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

				if (prop === "$ws") {
					return (): ClientSocket<SystemEvents, Record<string, unknown>> => {
						const endpointPath = `/${routePath.slice(0, -1).join("/")}`;
						const normalizedPath = endpointPath.replace(baseUrl, "");
						const url = new URL(baseUrl + normalizedPath);

						// Change protocol to ws:// or wss:// depending on if https or http
						url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

						return new ClientSocket(url);
					};
				}

				const nestedTarget = target[prop] as ProxyTarget | undefined;
				if (nestedTarget) {
					return createProxy(nestedTarget, baseUrl, routePath);
				}

				// Return empty object for unknown properties to maintain proxy chain
				return createProxy({}, baseUrl, routePath);
			}

			return Reflect.get(target, prop, receiver);
		},
	});
}
