import { beforeEach, describe, expect, it, mock } from "bun:test";
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

			// These calls should compile without TypeScript errors
			const healthResponse = client.rpc.health.$get();
			const userResponse = client.rpc.user.$get({
				id: "1",
			});
			const profileResponse = client.rpc.profile.$get();

			// Verify the methods return promises
			expect(healthResponse).toBeInstanceOf(Promise);
			expect(userResponse).toBeInstanceOf(Promise);
			expect(profileResponse).toBeInstanceOf(Promise);
		});
	});
});
