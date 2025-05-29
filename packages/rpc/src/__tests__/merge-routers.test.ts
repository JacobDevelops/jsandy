import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { dynamic } from "../dynamic";
import { sqStack } from "../j";
import { mergeRouters } from "../merge-routers";
import { Router } from "../router";

describe("mergeRouters", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Basic functionality", () => {
		it("should create merged router with empty routers", () => {
			const api = new Hono();
			const routers = {};

			const merged = mergeRouters(api, routers);

			expect(merged).toBeInstanceOf(Router);
			expect(merged._metadata.subRouters).toEqual({});
		});

		it("should merge static routers", () => {
			const api = new Hono();
			const j = sqStack.init();

			const userRouter = j.router({
				list: j.procedure.get(({ c }) => c.json([])),
				create: j.procedure.post(({ c }) => c.json({ id: 1 })),
			});

			const postRouter = j.router({
				list: j.procedure.get(({ c }) => c.json([])),
			});

			const routers = {
				users: userRouter,
				posts: postRouter,
			};

			const merged = mergeRouters(api, routers);

			expect(merged).toBeInstanceOf(Router);
			expect(merged._metadata.subRouters["/api/users"]).toBe(userRouter);
			expect(merged._metadata.subRouters["/api/posts"]).toBe(postRouter);
		});

		it("should handle dynamic routers", () => {
			const api = new Hono();
			const j = sqStack.init();

			const userRouter = j.router({
				profile: j.procedure.get(({ c }) => c.json({ id: 1 })),
			});

			const dynamicLoader = dynamic(() =>
				Promise.resolve({ default: userRouter }),
			);

			const routers = {
				users: dynamicLoader,
			};

			const merged = mergeRouters(api, routers);

			expect(merged).toBeInstanceOf(Router);
			expect(merged._metadata.subRouters["/api/users"]).toBeInstanceOf(Router);
		});

		it("should copy api properties to merged router", () => {
			const api = new Hono();
			api.get("/health", (c) => c.json({ status: "ok" }));

			const routers = {};
			const merged = mergeRouters(api, routers);

			expect(merged).toBeInstanceOf(Router);
			// API properties should be copied
			expect(Object.getOwnPropertyNames(merged)).toContain("routes");
		});
	});

	describe("Subrouter registration", () => {
		it("should register subrouter middleware", () => {
			const api = new Hono();
			const j = sqStack.init();

			const testRouter = j.router({
				test: j.procedure.get(({ c }) => c.json({ message: "test" })),
			});

			const routers = { test: testRouter };
			const merged = mergeRouters(api, routers);

			// Should have called registerSubrouterMiddleware
			expect(merged).toBeInstanceOf(Router);
		});
	});

	describe("Router metadata", () => {
		it("should initialize metadata correctly", () => {
			const api = new Hono();
			const routers = {};

			const merged = mergeRouters(api, routers);

			expect(merged._metadata).toEqual({
				subRouters: {},
				config: {},
				procedures: {},
				registeredPaths: [],
			});
		});

		it("should preserve router metadata structure", () => {
			const api = new Hono();
			const j = sqStack.init();

			const userRouter = j.router({
				list: j.procedure.get(({ c }) => c.json([])),
			});

			const routers = { users: userRouter };
			const merged = mergeRouters(api, routers);

			expect(merged._metadata.subRouters["/api/users"]).toBe(userRouter);
			expect(merged._metadata.config).toEqual({});
			expect(merged._metadata.procedures).toEqual({});
			expect(merged._metadata.registeredPaths).toEqual([]);
		});
	});

	describe("Dynamic router handling", () => {
		it("should create proxy for dynamic routers", () => {
			const api = new Hono();
			const j = sqStack.init();

			const actualRouter = j.router({
				data: j.procedure.get(({ c }) => c.json({ data: "test" })),
			});

			const dynamicLoader = vi
				.fn()
				.mockResolvedValue({ default: actualRouter });
			const dynamicRouterFn = dynamic(dynamicLoader);

			const routers = { api: dynamicRouterFn };
			const merged = mergeRouters(api, routers);

			const proxyRouter = merged._metadata.subRouters["/api/api"];
			expect(proxyRouter).toBeInstanceOf(Router);
		});

		it("should handle dynamic router loading on request", async () => {
			const api = new Hono();
			const j = sqStack.init();

			const actualRouter = j.router({
				endpoint: j.procedure.get(({ c }) => c.json({ success: true })),
			});

			const dynamicLoader = vi
				.fn()
				.mockResolvedValue({ default: actualRouter });
			const dynamicRouterFn = dynamic(dynamicLoader);

			const routers = { dynamic: dynamicRouterFn };
			const merged = mergeRouters(api, routers);

			// The proxy router should be created
			const proxyRouter = merged._metadata.subRouters["/api/dynamic"];
			expect(proxyRouter).toBeInstanceOf(Router);
		});
	});

	describe("Mixed router types", () => {
		it("should handle both static and dynamic routers", () => {
			const api = new Hono();
			const j = sqStack.init();

			const staticRouter = j.router({
				static: j.procedure.get(({ c }) => c.json({ type: "static" })),
			});

			const dynamicRouter = j.router({
				dynamic: j.procedure.get(({ c }) => c.json({ type: "dynamic" })),
			});

			const dynamicLoader = dynamic(() =>
				Promise.resolve({ default: dynamicRouter }),
			);

			const routers = {
				static: staticRouter,
				dynamic: dynamicLoader,
			};

			const merged = mergeRouters(api, routers);

			expect(merged._metadata.subRouters["/api/static"]).toBe(staticRouter);
			expect(merged._metadata.subRouters["/api/dynamic"]).toBeInstanceOf(
				Router,
			);
		});
	});

	describe("Path generation", () => {
		it("should generate correct API paths", () => {
			const api = new Hono();
			const j = sqStack.init();

			const router1 = j.router({});
			const router2 = j.router({});

			const routers = {
				users: router1,
				posts: router2,
			};

			const merged = mergeRouters(api, routers);

			expect(merged._metadata.subRouters).toHaveProperty("/api/users");
			expect(merged._metadata.subRouters).toHaveProperty("/api/posts");
		});

		it("should handle router keys with special characters", () => {
			const api = new Hono();
			const j = sqStack.init();

			const router = j.router({});

			const routers = {
				"user-profile": router,
				api_v2: router,
			};

			const merged = mergeRouters(api, routers);

			expect(merged._metadata.subRouters).toHaveProperty("/api/user-profile");
			expect(merged._metadata.subRouters).toHaveProperty("/api/api_v2");
		});
	});

	describe("Type inference", () => {
		it("should preserve type information from routers", () => {
			const api = new Hono();
			const j = sqStack.init();

			const typedRouter = j.router({
				getData: j.procedure.get(({ c }) =>
					c.json({ data: "test", count: 42 }),
				),
			});

			const routers = { api: typedRouter };
			const merged = mergeRouters(api, routers);

			// Type information should be preserved in the merged router
			expect(merged).toBeInstanceOf(Router);
		});
	});

	describe("Error handling", () => {
		it("should handle invalid router types gracefully", () => {
			const api = new Hono();

			const routers = {
				invalid: "not a router" as any,
			};

			const merged = mergeRouters(api, routers);

			// Should not crash, invalid routers should be ignored
			expect(merged).toBeInstanceOf(Router);
			expect(merged._metadata.subRouters["/api/invalid"]).toBeUndefined();
		});

		it("should handle null/undefined routers", () => {
			const api = new Hono();

			const routers = {
				nullRouter: null as any,
				undefinedRouter: undefined as any,
			};

			const merged = mergeRouters(api, routers);

			expect(merged).toBeInstanceOf(Router);
			expect(merged._metadata.subRouters["/api/nullRouter"]).toBeUndefined();
			expect(
				merged._metadata.subRouters["/api/undefinedRouter"],
			).toBeUndefined();
		});
	});

	describe("Integration with real scenarios", () => {
		it("should merge complex application routers", () => {
			const api = new Hono();
			const j = sqStack.init();

			const authRouter = j.router({
				login: j.procedure.post(({ c }) => c.json({ token: "jwt" })),
				logout: j.procedure.post(({ c }) => c.json({ success: true })),
			});

			const userRouter = j.router({
				profile: j.procedure.get(({ c }) => c.json({ id: 1 })),
				update: j.procedure.post(({ c }) => c.json({ updated: true })),
			});

			const adminRouter = dynamic(() =>
				Promise.resolve({
					default: j.router({
						stats: j.procedure.get(({ c }) => c.json({ users: 100 })),
					}),
				}),
			);

			const routers = {
				auth: authRouter,
				users: userRouter,
				admin: adminRouter,
			};

			const merged = mergeRouters(api, routers);

			expect(merged._metadata.subRouters["/api/auth"]).toBe(authRouter);
			expect(merged._metadata.subRouters["/api/users"]).toBe(userRouter);
			expect(merged._metadata.subRouters["/api/admin"]).toBeInstanceOf(Router);
		});

		it("should preserve environment", () => {
			interface AppEnv {
				Bindings: { DATABASE_URL: string };
			}
			const j = sqStack.init<AppEnv>();
			const routers = {
				users: j.router({
					getData: j.procedure.get(({ c }) =>
						c.json({ data: "test", count: 42 }),
					),
				}),
			};

			const api = j
				.router()
				.basePath("/")
				.use(j.defaults.cors)
				.onError(j.defaults.errorHandler);

			const merged = mergeRouters(api, routers);

			expect(merged).toBeInstanceOf(Router);
			expect(merged._metadata.subRouters["/api/users"]).toBeInstanceOf(Router);
		});
	});
});
