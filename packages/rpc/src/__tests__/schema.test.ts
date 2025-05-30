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
		it("should be able to get the schema", () => {
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
		});
	});
});

// export type Client<
// 	T extends
// 		| Router<RouterRecord, InferRouterEnv<T>>
// 		| (() => Promise<Router<RouterRecord, InferRouterEnv<T>>>),
// > = T extends Hono<InferRouterEnv<T>, infer S>
// 	? S extends RouterSchema<infer B>
// 		? B extends MergeRoutes<infer C>
// 			? C extends InferSchemaFromRouters<infer D, InferRouterEnv<T>>
// 				? {
// 						[K1 in keyof D]: D[K1] extends () => Promise<
// 							Router<infer P, InferRouterEnv<T>>
// 						>
// 							? {
// 									[K2 in keyof P]: ClientRequest<
// 										OperationSchema<P[K2], InferRouterEnv<T>>
// 									>;
// 								}
// 							: D[K1] extends Router<infer P, InferRouterEnv<T>>
// 								? {
// 										[K2 in keyof P]: ClientRequest<
// 											OperationSchema<P[K2], InferRouterEnv<T>>
// 										>;
// 									}
// 								: never;
// 					}
// 				: never
// 			: never
// 		: never
// 	: never;
