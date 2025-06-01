import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { jsandy } from "jsandy";

interface Env {
	Bindings: { POSTGRES_URL: string };
}

export const j = jsandy.init<Env>();

/**
 * Type-safely injects database into all procedures
 *
 * @see https://jsandy.app/docs/backend/middleware
 */
const databaseMiddleware = j.middleware(async ({ next }) => {
	// automatically reads POSTGRES_URL environment variable
	const db = drizzle(sql);

	return await next({ db });
});

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const publicProcedure = j.procedure.use(databaseMiddleware);
