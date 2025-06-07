import { jsandy } from "jsandy";

interface Env {
	// Replace with your own binding types
	Bindings: Record<string, unknown>;
}

export const j = jsandy.init<Env>();

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const publicProcedure = j.procedure;
