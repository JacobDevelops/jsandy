import { jsandy } from "@jsandy/rpc";
import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";

interface Env {
	Bindings: { DATABASE_URL: string };
}

export const j = jsandy.init<Env>();

/**
 * Type-safely injects database into all procedures
 *
 * @see https://jsandy.com/docs/backend/middleware
 */
const databaseMiddleware = j.middleware(async ({ c, next }) => {
	try {
		const { DATABASE_URL } = env(c);
		if (!DATABASE_URL) {
			throw new HTTPException(400, {
				message: "DATABASE_URL is not configured",
			});
		}
		const client = new Client({ url: DATABASE_URL });
		const db = drizzle(client);
		return await next({ db });
	} catch (error) {
		throw new HTTPException(500, {
			message: `Database connection failed: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		});
	}
});

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const baseProcedure = j.procedure;
export const publicProcedure = baseProcedure.use(databaseMiddleware);
