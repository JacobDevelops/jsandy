import type { AppRouter } from "@/server";
import { createClient } from "@jsandy/rpc";

/**
 * Your type-safe API client
 * @see https://jsandy.com/docs/backend/api-client
 */
export const client = createClient<AppRouter>({
	baseUrl: "http://localhost:3000/api",
});
