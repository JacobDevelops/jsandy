import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { Env, HTTPResponseError, MiddlewareHandler } from "hono/types";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod/v4";
import { mergeRouters } from "./merge-routers";
import { Procedure } from "./procedure";
import { Router } from "./router";
import type { MiddlewareFunction } from "./types";

/**
 * Adapts a Hono middleware to be compatible with the type-safe middleware format
 * Converts standard Hono middleware handlers to JSandy's middleware function interface
 *
 * @template E - Environment type extending Hono's Env, defaults to Env
 * @param honoMiddleware - Standard Hono middleware handler function
 * @returns JSandy-compatible middleware function with type-safe context handling
 *
 * @example
 * ```typescript
 * import { logger } from 'hono/logger';
 *
 * const loggerMiddleware = fromHono(logger());
 * const procedure = jsandy.init().procedure.use(loggerMiddleware);
 * ```
 */
export function fromHono<E extends Env = Env>(
	honoMiddleware: MiddlewareHandler<E>,
): MiddlewareFunction<Record<string, unknown>, void, E> {
	return async ({ c, next }) => {
		await honoMiddleware(c, async () => {
			await next();
		});
	};
}

/**
 * Main JSandy framework class providing type-safe API development tools
 * Offers a fluent interface for building APIs with automatic validation, middleware chaining,
 * and WebSocket support while maintaining full TypeScript type safety
 */
class JSandy {
	/**
	 * Initializes a new JSandy instance with environment-specific typing
	 * Returns a toolkit for building type-safe APIs with routers, procedures, and middleware
	 *
	 * @template E - Environment type extending Hono's Env, defaults to Env
	 * @returns Object containing all JSandy development tools and utilities
	 *
	 * @example
	 * ```typescript
	 * // Basic initialization
	 * const { router, procedure, middleware } = jsandy.init();
	 *
	 * // With custom environment type
	 * interface MyEnv {
	 *   Variables: { user: User };
	 *   Bindings: { DATABASE_URL: string };
	 * }
	 * const api = jsandy.init<MyEnv>();
	 * ```
	 */
	init<E extends Env = Env>() {
		return {
			/**
			 * Creates a new Router instance with type-safe procedure definitions
			 * @template T - Record type of procedures and nested routes
			 * @param procedures - Optional initial procedures to register, defaults to empty object
			 * @returns New Router instance with the specified procedures
			 *
			 * @example
			 * ```typescript
			 * const userRouter = router({
			 *   getUser: procedure.input(getUserSchema).get(getUserHandler),
			 *   updateUser: procedure.input(updateUserSchema).post(updateUserHandler)
			 * });
			 * ```
			 */
			router: <T extends Record<string, unknown>>(
				procedures: T = {} as T,
			): Router<T, E> => {
				return new Router(procedures);
			},

			/** Router merging utility for combining multiple routers */
			mergeRouters,

			/**
			 * Type-safe middleware function wrapper for enhanced type inference
			 * Provides better TypeScript support for custom middleware development
			 *
			 * @template T - Context type for the middleware, defaults to Record<string, unknown>
			 * @template R - Return type of the middleware, defaults to void
			 * @param middleware - Middleware function to wrap with type safety
			 * @returns The same middleware function with enhanced type information
			 *
			 * @example
			 * ```typescript
			 * const authMiddleware = middleware(async ({ c, next, ctx }) => {
			 *   const token = c.req.header('Authorization');
			 *   if (!token) throw new HTTPException(401);
			 *
			 *   const user = await validateToken(token);
			 *   await next({ user }); // Type-safe context passing
			 * });
			 * ```
			 */
			middleware: <T = Record<string, unknown>, R = void>(
				middleware: MiddlewareFunction<T, R, E>,
			): MiddlewareFunction<T, R, E> => middleware,

			/** Hono middleware adapter utility */
			fromHono,

			/** Pre-configured Procedure instance for building endpoints */
			procedure: new Procedure<E>(),

			/**
			 * Default configurations and utilities for common API patterns
			 */
			defaults: {
				/**
				 * Pre-configured CORS middleware with SuperJSON support
				 * Allows SuperJSON headers and enables cross-origin requests with credentials
				 *
				 * Configuration:
				 * - Allows 'x-is-superjson' and 'Content-Type' headers
				 * - Exposes 'x-is-superjson' header to clients
				 * - Permits requests from any origin
				 * - Enables credential sharing
				 */
				cors: cors({
					allowHeaders: ["x-is-superjson", "Content-Type"],
					exposeHeaders: ["x-is-superjson"],
					origin: (origin) => origin,
					credentials: true,
				}),

				/**
				 * Comprehensive error handler for common API error scenarios
				 * Automatically converts various error types into appropriate HTTP responses
				 *
				 * Handles:
				 * - **HTTPException**: Returns the exception's built-in response
				 * - **ZodError**: Converts validation errors to 422 status with details
				 * - **HTTP-like errors**: Objects with status property become HTTP responses
				 * - **Unknown errors**: Fallback to 500 status with generic message
				 *
				 * @param err - Error object or HTTP response error to handle
				 * @returns HTTP Response with appropriate status code and error message
				 *
				 * @example
				 * ```typescript
				 * const api = new Hono();
				 * api.onError(jsandy.init().defaults.errorHandler);
				 * ```
				 */
				errorHandler: (err: Error | HTTPResponseError) => {
					console.error("[API Error]", err);

					// Handle Hono HTTP exceptions
					if (err instanceof HTTPException) {
						return err.getResponse();
					}

					// Handle Zod validation errors
					if (err instanceof ZodError) {
						const httpError = new HTTPException(422, {
							message: "Validation error",
							cause: err,
						});

						return httpError.getResponse();
					}

					// Handle objects with HTTP status codes
					if (
						err &&
						typeof err === "object" &&
						"status" in err &&
						typeof err.status === "number"
					) {
						const httpError = new HTTPException(
							err.status as ContentfulStatusCode,
							{
								message: err.message || "API Error",
								cause: err,
							},
						);

						return httpError.getResponse();
					}

					// Fallback for unknown errors
					const httpError = new HTTPException(500, {
						message:
							"An unexpected error occurred. Check server logs for details.",
						cause: err,
					});

					return httpError.getResponse();
				},
			},
		};
	}
}

/**
 * Main JSandy framework instance
 * Entry point for all JSandy API development tools and utilities
 *
 * @example
 * ```typescript
 * import { jsandy } from './jsandy';
 *
 * const { router, procedure } = jsandy.init();
 *
 * const api = router({
 *   hello: procedure.get(() => ({ message: 'Hello World!' }))
 * });
 * ```
 */
export const jsandy = new JSandy();
