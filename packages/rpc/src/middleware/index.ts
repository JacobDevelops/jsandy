/**
 * Internal middlewares
 * Do not modify unless you know what you're doing
 */

import type { MiddlewareHandler } from "hono";
import { parseSuperJSON } from "./utils";

/**
 * Middleware to parse GET-request using SuperJSON
 */
export const queryParsingMiddleware: MiddlewareHandler =
	async function queryParsingMiddleware(c, next) {
		const rawQuery = c.req.query();
		const parsedQuery: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(rawQuery)) {
			parsedQuery[key] = parseSuperJSON(value);
		}

		c.set("__parsed_query", parsedQuery);
		await next();
	};

/**
 * Middleware to parse POST-requests using SuperJSON
 * Safely handles missing or empty request bodies
 */
export const bodyParsingMiddleware: MiddlewareHandler =
	async function bodyParsingMiddleware(c, next) {
		let rawBody: Record<string, unknown> = {};

		try {
			rawBody = await c.req.json();
		} catch {
			// No body or invalid JSON - use empty object
		}

		const parsedBody: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(rawBody)) {
			parsedBody[key] = parseSuperJSON(value as string);
		}

		c.set("__parsed_body", parsedBody);
		await next();
	};
