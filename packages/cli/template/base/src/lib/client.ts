import { createClient } from "@jsandy/rpc";
import type { AppRouter } from "@/server";

/**
 * Your type-safe API client
 * @see https://jsandy.com/docs/backend/api-client
 */
export const client = createClient<AppRouter>({
	baseUrl: "/api",
});
