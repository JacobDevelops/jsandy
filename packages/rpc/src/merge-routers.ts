import type { Env, Hono, Schema } from "hono";
import { Router } from "./router";

// Define a generic Router type constraint that preserves the environment type
type AnyRouter<E extends Env = Env> = Router<Record<string, unknown>, E>;

// Define a generic Hono type constraint that preserves the environment type
type AnyHono<S extends Schema, E extends Env = Env> = Hono<E, S, string>;

export type InferSchemaFromRouters<
	R extends Record<string, AnyRouter<E> | (() => Promise<AnyRouter<E>>)>,
	E extends Env = Env,
> = {
	[P in keyof R]: R[P] extends () => Promise<AnyRouter<E>>
		? R[P] extends () => Promise<infer T>
			? T extends Router<infer S, E>
				? S
				: T extends AnyHono<infer S, E>
					? {
							[Q in keyof S]: S[Q];
						}
					: never
			: never
		: R[P] extends Router<infer S, E>
			? S
			: R[P] extends AnyHono<infer S, E>
				? {
						[Q in keyof S]: S[Q];
					}
				: never;
};

export function mergeRouters<
	E extends Env,
	S extends Schema,
	R extends Record<string, AnyRouter<E> | (() => Promise<AnyRouter<E>>)>,
>(api: AnyHono<S, E>, routers: R): Router<InferSchemaFromRouters<R, E>, E> {
	const mergedRouter = new Router<InferSchemaFromRouters<R, E>, E>();
	Object.assign(mergedRouter, api);

	mergedRouter._metadata = {
		subRouters: {},
		config: {},
		procedures: {},
		registeredPaths: [],
	};

	for (const [key, router] of Object.entries(routers)) {
		// lazy-loaded routers using `dynamic()` use proxy to avoid loading bundle initially
		if (typeof router === "function") {
			const proxyRouter = new Router<Record<string, unknown>, E>();

			proxyRouter.all("*", async (c) => {
				const actualRouter = await router();
				mergedRouter._metadata.subRouters[`/api/${key}`] = actualRouter;

				return actualRouter.fetch(c.req.raw, c.env);
			});
			mergedRouter._metadata.subRouters[`/api/${key}`] = proxyRouter;
		} else if (router instanceof Router) {
			// statically imported routers can be assigned directly
			mergedRouter._metadata.subRouters[`/api/${key}`] = router;
		}
	}

	mergedRouter.registerSubrouterMiddleware();

	return mergedRouter as Router<InferSchemaFromRouters<R, E>, E>;
}
