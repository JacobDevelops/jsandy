import { jsandy } from "@jsandy/rpc";

interface Env {
	// Cloudflare bindings from wrangler types
	Bindings: CloudflareBindings;
}

export const j = jsandy.init<Env>();

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const publicProcedure = j.procedure;
