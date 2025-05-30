import { beforeEach, describe, it, vi } from "vitest";
import { createClient } from "..";
import { j } from "./__mocks__/jsandy.mock";
import { combinedRouter } from "./__mocks__/router.mock";

vi.mock("hono/client", () => ({
	hc: vi.fn(() => ({
		$get: vi.fn(),
		$post: vi.fn(),
	})),
}));

describe("Schema", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	describe("Schema Methods", () => {
		it("should be able to get the schema", async () => {
			const api = j
				.router()
				.basePath("/api")
				.use(j.defaults.cors)
				.onError(j.defaults.errorHandler);
			const appRouter = j.mergeRouters(api, {
				rpc: combinedRouter,
			});
			type AppRouter = typeof appRouter;
			const client = createClient<AppRouter>({
				baseUrl: "https://api.example.com",
			});

			console.log(
				"Combined Router Metadata: ",
				appRouter._metadata.subRouters["/api/rpc"]._metadata.procedures,
			);
		});
	});
});
