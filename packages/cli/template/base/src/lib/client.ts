import { createClient } from "@jsandy/rpc";
import type { AppRouter } from "@/server";

/**
 * Your type-safe API client
 * @see https://jsandy.com/docs/backend/api-client
 */
export const client = createClient<AppRouter>({
	baseUrl: `${getBaseUrl()}/api`,
});

function getBaseUrl() {
	if (typeof window !== "undefined") return window.location.origin;
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
	if (process.env.NODE_ENV === "production")
		return `https://${process.env.AMPLIFY_URL}`;
	return `http://localhost:${process.env.PORT ?? 3000}`;
}
