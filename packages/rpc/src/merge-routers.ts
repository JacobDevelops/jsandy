import type { Hono } from "hono";
import { Router } from "./router";

/**
 * Infers and merges schemas from a collection of routers or lazy-loaded router functions
 * Handles both static routers and dynamic router loading functions while preserving type safety
 *
 * @template R - Record of router instances or router factory functions
 * @template E - Environment type extending Hono's Env, defaults to Env
 *
 * The type performs deep inference to:
 * - Extract schemas from Router instances
 * - Unwrap schemas from async router factory functions
 * - Handle both Router and Hono instance types
 * - Preserve environment type consistency across all routers
 */
export type InferSchemaFromRouters<
	R extends Record<string, Router<any> | (() => Promise<Router<any>>)>,
> = {
	[P in keyof R]: R[P] extends () => Promise<Router<any>>
		? R[P] extends () => Promise<infer T>
			? T extends Hono<any, infer S>
				? { [Q in keyof S]: S[Q] }
				: never
			: never
		: R[P] extends Hono<any, infer S>
			? { [Q in keyof S]: S[Q] }
			: never;
};

/**
 * Merges multiple routers into a single router instance with unified schema inference
 * Supports both static router imports and lazy-loaded dynamic routers for code splitting
 *
 * @template E - Environment type extending Hono's Env
 * @template S - Schema type for the base Hono API instance
 * @template R - Record of router instances or router factory functions
 *
 * @param api - Base Hono API instance to merge routers into
 * @param routers - Record of router instances or async router factory functions
 * @returns Merged Router instance with combined schemas and sub-router support
 *
 * @example
 * ```typescript
 * // Static router merging
 * const api = new Hono();
 * const mergedRouter = mergeRouters(api, {
 *   users: userRouter,
 *   posts: postRouter
 * });
 *
 * // With dynamic/lazy-loaded routers
 * const mergedRouter = mergeRouters(api, {
 *   users: () => import('./routes/users').then(m => m.userRouter),
 *   posts: postRouter
 * });
 * ```
 *
 * Features:
 * - **Static router support**: Direct router instances are immediately available
 * - **Dynamic router support**: Lazy-loaded routers using factory functions for code splitting
 * - **Proxy routing**: Dynamic routers use proxy pattern to avoid initial bundle loading
 * - **Path prefixing**: All sub-routers are automatically prefixed with `/api/{routerName}`
 * - **Type safety**: Full TypeScript inference for merged router schemas
 * - **Environment preservation**: Maintains consistent environment types across all routers
 */
export function mergeRouters<
	R extends Record<string, Router<any> | (() => Promise<Router<any>>)>,
>(api: Hono<any, any, any>, routers: R): Router<InferSchemaFromRouters<R>> {
	// Create a new router with inferred merged schema
	const mergedRouter = new Router();

	// Copy properties from the base API instance
	Object.assign(mergedRouter, api);

	// Initialize metadata structure for sub-router management
	mergedRouter._metadata = {
		config: {},
		operations: {},
		procedures: {},
		registeredPaths: [],
		subRouters: {},
	};

	// Process each router in the collection
	for (const [key, router] of Object.entries(routers)) {
		if (typeof router === "function") {
			// Handle lazy-loaded routers using dynamic imports
			// Create a proxy router to defer loading until first request
			const proxyRouter = new Router();

			/**
			 * Proxy handler that loads the actual router on first request
			 * This enables code splitting by only loading router modules when needed
			 */
			proxyRouter.all("*", async (c) => {
				// Load the actual router from the factory function
				const actualRouter = await router();

				// Register the loaded router in metadata for future requests
				mergedRouter._metadata.subRouters[`/api/${key}`] = actualRouter;

				// Forward the request to the loaded router
				return actualRouter.fetch(c.req.raw, c.env);
			});

			// Register the proxy router temporarily
			mergedRouter._metadata.subRouters[`/api/${key}`] = proxyRouter;
		} else if (router instanceof Router) {
			// Handle statically imported routers
			// These can be assigned directly since they're already loaded
			mergedRouter._metadata.subRouters[`/api/${key}`] = router;
		}
	}

	// Register middleware to handle sub-router request routing
	mergedRouter.registerSubrouterMiddleware();

	// Return the merged router with proper typing
	return mergedRouter as Router<InferSchemaFromRouters<R>>;
}
