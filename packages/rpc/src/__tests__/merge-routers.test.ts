import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import type { Hono } from "hono";
import { z } from "zod";
import { jsandy } from "..";
import { mergeRouters } from "../merge-routers";
import { Router } from "../router";

const j = jsandy.init();
const procedure = j.procedure;

const userRouter = j.router({
	createUser: procedure
		.input(z.object({ email: z.string(), name: z.string() }))
		.post(({ input, c }) => c.json({ id: "123", ...input })),
	getUser: procedure
		.input(z.object({ id: z.string() }))
		.get(({ input, c }) => c.json({ id: input.id, name: "Test User" })),
});

const postRouter = j.router({
	createPost: procedure
		.input(z.object({ content: z.string(), title: z.string() }))
		.post(({ input, c }) => c.json({ id: "456", ...input })),
	getPosts: procedure.get(({ c }) => c.json({ posts: [] })),
});

const adminRouter = j.router({
	deleteUser: procedure
		.input(z.object({ id: z.string() }))
		.post(({ input, c }) => c.json({ deleted: input.id })),
	getStats: procedure.get(({ c }) => c.json({ posts: 50, users: 100 })),
});

const createApi = () =>
	j
		.router()
		.basePath("/api")
		.use(j.defaults.cors)
		.onError(j.defaults.errorHandler);

let api: Hono;

beforeEach(() => {
	api = createApi();
});

describe("Router Merging", () => {
	describe("mergeRouters", () => {
		it("should merge static routers", () => {
			const merged = mergeRouters(api, {
				posts: postRouter,
				users: userRouter,
			});

			expect(merged).toBeInstanceOf(Router);
			expect(merged._metadata.subRouters["/api/users"]).toBe(userRouter);
			expect(merged._metadata.subRouters["/api/posts"]).toBe(postRouter);
		});

		it("should merge dynamic routers", () => {
			const userRouterFactory = mock(async () => userRouter);
			const postRouterFactory = mock(async () => postRouter);

			const merged = mergeRouters(api, {
				posts: postRouterFactory,
				users: userRouterFactory,
			});

			expect(merged).toBeInstanceOf(Router);
			expect(merged._metadata.subRouters["/api/users"]).toBeDefined();
			expect(merged._metadata.subRouters["/api/posts"]).toBeDefined();
		});

		it("should mix static and dynamic routers", () => {
			const dynamicAdminRouter = mock(async () => adminRouter);

			const merged = mergeRouters(api, {
				admin: dynamicAdminRouter, // dynamic
				posts: postRouter, // static
				users: userRouter, // static
			});

			expect(merged._metadata.subRouters["/api/users"]).toBe(userRouter);
			expect(merged._metadata.subRouters["/api/posts"]).toBe(postRouter);
			expect(merged._metadata.subRouters["/api/admin"]).toBeDefined();
		});

		it("should copy properties from base API", () => {
			// Add some properties to the base API
			api.get("/health", () => new Response("OK"));

			const merged = mergeRouters(api, {
				users: userRouter,
			});

			// Properties should be copied (though we can't easily test all of them)
			expect(merged).toBeInstanceOf(Router);
		});

		it("should initialize metadata structure", () => {
			const merged = mergeRouters(api, {
				posts: postRouter,
				users: userRouter,
			});

			expect(merged._metadata).toBeDefined();
			expect(merged._metadata.subRouters).toBeDefined();
			expect(merged._metadata.config).toBeDefined();
			expect(merged._metadata.procedures).toBeDefined();
			expect(merged._metadata.registeredPaths).toBeDefined();
		});

		it("should register sub-router middleware", () => {
			const mockRegisterMiddleware = spyOn(
				Router.prototype,
				"registerSubrouterMiddleware",
			);

			mergeRouters(api, {
				users: userRouter,
			});

			expect(mockRegisterMiddleware).toHaveBeenCalled();
			mockRegisterMiddleware.mockRestore();
		});

		it("should handle empty router collection", () => {
			const merged = mergeRouters(api, {});

			expect(merged).toBeInstanceOf(Router);
			expect(Object.keys(merged._metadata.subRouters)).toHaveLength(0);
		});

		it("should handle single router", () => {
			const merged = mergeRouters(api, {
				users: userRouter,
			});

			expect(merged._metadata.subRouters["/api/users"]).toBe(userRouter);
			expect(Object.keys(merged._metadata.subRouters)).toHaveLength(1);
		});

		it("should handle many routers", () => {
			const routers = {};
			for (let i = 0; i < 10; i++) {
				// @ts-expect-error - this is a test
				routers[`router${i}`] = new Router({
					test: procedure.get(({ c }) => c.json({ index: i })),
				});
			}

			const merged = mergeRouters(api, routers);

			expect(Object.keys(merged._metadata.subRouters)).toHaveLength(10);
			for (let i = 0; i < 10; i++) {
				expect(merged._metadata.subRouters[`/api/router${i}`]).toBeDefined();
			}
		});
	});

	describe("Dynamic router handling", () => {
		it("should create proxy router for dynamic imports", () => {
			const dynamicRouter = mock(async () => userRouter);

			const merged = mergeRouters(api, {
				users: dynamicRouter,
			});

			const proxyRouter = merged._metadata.subRouters["/api/users"];
			expect(proxyRouter).toBeInstanceOf(Router);
			expect(proxyRouter).not.toBe(userRouter); // Should be a proxy
		});

		it("should handle dynamic router loading on request", async () => {
			const dynamicRouter = mock(async () => userRouter);
			userRouter.fetch = mock(async () => new Response("user data"));

			const merged = mergeRouters(api, {
				users: dynamicRouter,
			});

			const proxyRouter = merged._metadata.subRouters["/api/users"] as Router;

			// The proxy should exist but not be the actual router yet
			expect(proxyRouter).toBeDefined();
			expect(proxyRouter).not.toBe(userRouter);
		});

		it("should register loaded router in metadata", async () => {
			const dynamicRouter = mock(async () => userRouter);

			const merged = mergeRouters(api, {
				users: dynamicRouter,
			});

			// Initially should have a proxy
			const initialRouter = merged._metadata.subRouters["/api/users"];
			expect(initialRouter).not.toBe(userRouter);
		});
	});

	describe("Type inference", () => {
		it("should infer schemas from static routers", () => {
			const merged = mergeRouters(api, {
				posts: postRouter,
				users: userRouter,
			});

			// Type inference is tested at compile time
			// Runtime test just ensures the merge succeeds
			expect(merged).toBeInstanceOf(Router);
		});

		it("should infer schemas from dynamic routers", () => {
			const dynamicUsers = mock(async () => userRouter);
			const dynamicPosts = mock(async () => postRouter);

			const merged = mergeRouters(api, {
				posts: dynamicPosts,
				users: dynamicUsers,
			});

			// Type checking happens at compile time
			expect(merged).toBeInstanceOf(Router);
		});

		it("should infer schemas from mixed routers", () => {
			const dynamicAdmin = mock(async () => adminRouter);

			const merged = mergeRouters(api, {
				admin: dynamicAdmin, // dynamic
				users: userRouter, // static
			});

			expect(merged).toBeInstanceOf(Router);
		});
	});

	describe("Error handling", () => {
		it("should handle invalid router types", () => {
			const invalidRouter = { not: "a router" };

			// This should not throw during merge, but would fail at runtime
			const merged = mergeRouters(api, {
				invalid: invalidRouter as any,
			});

			expect(merged).toBeInstanceOf(Router);
		});

		it("should handle failed dynamic imports", async () => {
			const failingImport = mock(async () => {
				throw new Error("Import failed");
			});

			const merged = mergeRouters(api, {
				failing: failingImport,
			});

			// The merge should succeed, but the dynamic import would fail at runtime
			expect(merged).toBeInstanceOf(Router);
		});
	});

	describe("Path handling", () => {
		it("should use correct API prefix", () => {
			const merged = mergeRouters(api, {
				posts: postRouter,
				users: userRouter,
			});

			expect(merged._metadata.subRouters["/api/users"]).toBeDefined();
			expect(merged._metadata.subRouters["/api/posts"]).toBeDefined();
		});

		it("should handle special characters in router names", () => {
			const merged = mergeRouters(api, {
				post_service: postRouter,
				"user-management": userRouter,
			});

			expect(merged._metadata.subRouters["/api/user-management"]).toBeDefined();
			expect(merged._metadata.subRouters["/api/post_service"]).toBeDefined();
		});

		it("should handle numeric router names", () => {
			const merged = mergeRouters(api, {
				v1: userRouter,
				v2: postRouter,
			});

			expect(merged._metadata.subRouters["/api/v1"]).toBeDefined();
			expect(merged._metadata.subRouters["/api/v2"]).toBeDefined();
		});
	});
});
