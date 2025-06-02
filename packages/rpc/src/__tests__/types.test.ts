import { beforeEach, describe, it, mock } from "bun:test";
import { j } from "./__mocks__/jsandy.mock";
import { combinedRouter } from "./__mocks__/router.mock";
import { createClient } from "..";

mock.module("hono/client", () => ({
	hc: mock(() => ({
		$get: mock(),
		$post: mock(),
	})),
}));

describe("Schema", () => {
	beforeEach(() => {
		mock.restore();
	});

	describe("Type Safety", () => {
		it("should maintain type safety for subrouter access", () => {
			const api = j.router().basePath("/api");
			const appRouter = j.mergeRouters(api, {
				rpc: combinedRouter,
			});

			type AppRouter = typeof appRouter;
			const client = createClient<AppRouter>({
				baseUrl: "https://api.example.com",
			});

			client.rpc.health.$get();
			client.rpc.user.$get({
				id: "1",
			});
			client.rpc.profile.$get();
		});
	});
});
