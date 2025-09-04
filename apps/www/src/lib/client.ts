import { createClient } from "@jsandy/rpc";
import type { AppRouter } from "@/server";

export const client = createClient<AppRouter>({
	baseUrl: `/api`,
});
