import { jsandy } from "jsandy";

interface Env {
	// biome-ignore lint/complexity/noBannedTypes: Fill these with your own types
	Bindings: {};
}

export const j = jsandy.init<Env>();

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const publicProcedure = j.procedure;
