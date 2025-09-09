import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type Mock,
	mock,
	spyOn,
} from "bun:test";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import { fromHono, jsandy } from "../j";
import { Procedure } from "../procedure";
import { Router } from "../router";

describe("JSandy Framework", () => {
	beforeEach(() => {
		mock.restore();
	});

	describe("jsandy.init()", () => {
		it("should initialize with default environment", () => {
			const api = jsandy.init();

			expect(api.router).toBeDefined();
			expect(api.mergeRouters).toBeDefined();
			expect(api.middleware).toBeDefined();
			expect(api.fromHono).toBeDefined();
			expect(api.procedure).toBeInstanceOf(Procedure);
			expect(api.defaults).toBeDefined();
		});

		it("should initialize with custom environment type", () => {
			interface CustomEnv {
				Variables: { user: { id: string } };
				Bindings: { DATABASE_URL: string };
			}

			const api = jsandy.init<CustomEnv>();
			expect(api.procedure).toBeInstanceOf(Procedure);
		});

		it("should create router with procedures", () => {
			const { router, procedure } = jsandy.init();

			const testRouter = router({
				test: procedure.get(({ c }) => c.json({ message: "test" })),
			});

			expect(testRouter).toBeInstanceOf(Router);
		});

		it("should wrap middleware with type safety", () => {
			const { middleware } = jsandy.init();

			const testMiddleware = middleware(async ({ next }) => {
				const user = { id: "123" };
				return next({ user });
			});

			expect(typeof testMiddleware).toBe("function");
		});
	});

	describe("fromHono", () => {
		it("should adapt Hono middleware to JSandy format", async () => {
			const mockHonoMiddleware = mock(async (c: any, next: any) => {
				c.set("test", "value");
				await next();
			});

			const adaptedMiddleware = fromHono(mockHonoMiddleware);

			const mockNext = mock(async () => ({}));
			const mockContext = {
				set: mock(),
				get: mock(),
			};

			await adaptedMiddleware({
				c: mockContext as any,
				ctx: {},
				next: mockNext,
			});

			expect(mockHonoMiddleware).toHaveBeenCalled();
		});

		it("should preserve context modifications", async () => {
			const honoMiddleware = async (c: any, next: any) => {
				c.set("userId", "123");
				await next();
			};

			const adaptedMiddleware = fromHono(honoMiddleware);
			const mockNext = mock(async () => ({ existing: "data" }));
			const mockContext = {
				set: mock(),
				get: mock(),
			};

			await adaptedMiddleware({
				c: mockContext as any,
				ctx: {},
				next: mockNext,
			});

			expect(mockContext.set).toHaveBeenCalledWith("userId", "123");
		});
	});

	describe("defaults", () => {
		it("should provide CORS middleware with SuperJSON support", () => {
			const { defaults } = jsandy.init();

			expect(defaults.cors).toBeDefined();
			// CORS middleware should be a function
			expect(typeof defaults.cors).toBe("function");
		});

		describe("errorHandler", () => {
			const { defaults } = jsandy.init();
			let consoleSpy: Mock<{
				(...data: any[]): void;
				(...data: any[]): void;
				(...data: any[]): void;
				(message?: any, ...optionalParams: any[]): void;
			}>;
			beforeEach(() => {
				consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			});
			afterEach(() => {
				consoleSpy.mockRestore();
			});

			it("should handle HTTPException", () => {
				const httpError = new HTTPException(400, { message: "Bad Request" });
				const response = defaults.errorHandler(httpError);

				expect(response).toBeInstanceOf(Response);

				consoleSpy.mockRestore();
			});

			it("should handle Zod validation errors", () => {
				const zodError = new ZodError([
					{
						code: "invalid_type",
						expected: "string",
						input: 123,
						path: ["email"],
						message: "Expected string, received number",
					},
				]);

				const response = defaults.errorHandler(zodError);

				expect(response).toBeInstanceOf(Response);
				expect(response.status).toBe(422);
			});

			it("should handle errors with status property", () => {
				const customError = {
					status: 403,
					message: "Forbidden",
				};

				const response = defaults.errorHandler(customError as any);

				expect(response).toBeInstanceOf(Response);
				expect(response.status).toBe(403);
			});

			it("should handle generic errors", () => {
				const genericError = new Error("Something went wrong");

				const response = defaults.errorHandler(genericError);

				expect(response).toBeInstanceOf(Response);
				expect(response.status).toBe(500);
			});

			it("should log errors", () => {
				const consoleSpy = spyOn(console, "error");
				const error = new Error("Test error");

				defaults.errorHandler(error);

				expect(consoleSpy).toHaveBeenCalledWith("[API Error]", error);
				consoleSpy.mockRestore();
			});
		});
	});

	describe("Router creation", () => {
		it("should create empty router", () => {
			const { router } = jsandy.init();
			const emptyRouter = router();

			expect(emptyRouter).toBeInstanceOf(Router);
			expect(emptyRouter._metadata.procedures).toEqual({});
		});

		it("should create router with procedures", () => {
			const { router, procedure } = jsandy.init();

			const testRouter = router({
				health: procedure.get(({ c }) => c.json({ status: "ok" })),
				create: procedure.post(({ c }) => c.json({ id: "123" })),
			});

			expect(testRouter).toBeInstanceOf(Router);
			expect(Object.keys(testRouter._metadata.procedures)).toContain("health");
			expect(Object.keys(testRouter._metadata.procedures)).toContain("create");
		});
	});

	describe("Integration", () => {
		it("should work together for complete API setup", () => {
			const { router, procedure, defaults } = jsandy.init();

			const api = router().use(defaults.cors).onError(defaults.errorHandler);

			const userRouter = router({
				getUser: procedure.get(({ c }) => c.json({ id: "123", name: "Test" })),
			});

			expect(api).toBeInstanceOf(Router);
			expect(userRouter).toBeInstanceOf(Router);
		});

		it("should support middleware chaining", () => {
			const { procedure, middleware } = jsandy.init();

			const authMiddleware = middleware(async ({ next }) => {
				return next({ user: { id: "123" } });
			});

			const protectedProcedure = procedure
				.use(authMiddleware)
				.get(({ c, ctx }) => c.json({ userId: ctx.user.id }));

			expect(protectedProcedure.type).toBe("get");
			expect(protectedProcedure.middlewares).toHaveLength(2); // SuperJSON + auth
		});
	});

	describe("Error bubbling with mergeRouters", () => {
		// Helper to build a fresh app + merged router for each test
		async function makeMergedRouter() {
			const { router, procedure, mergeRouters } = jsandy.init();
			const { Hono } = await import("hono");

			const userRouter = router({
				getUser: procedure.get(() => {
					throw new HTTPException(404, { message: "User not found" });
				}),
				createUser: procedure.post(() => {
					throw new Error("Database connection failed");
				}),
			});

			const postRouter = router({
				getPost: procedure.get(() => {
					throw new HTTPException(403, { message: "Access denied to post" });
				}),
			});

			const app = new Hono();
			return mergeRouters(app, { users: userRouter, posts: postRouter });
		}

		it("bubbles 404 from users.getUser to main router onError", async () => {
			const mergedRouter = await makeMergedRouter();

			const mainErrorHandler = mock((err: any) => {
				return new Response(
					JSON.stringify({ error: err.message, source: "main-router" }),
					{
						status: err.status || 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			});

			mergedRouter.onError(mainErrorHandler);

			const res = await mergedRouter.fetch(
				new Request("http://localhost/api/users/getUser"),
			);

			expect(mainErrorHandler).toHaveBeenCalledTimes(1);
			expect(res.status).toBe(404);

			const body = await res.json();
			expect((body as any).error).toBe("User not found");
			expect((body as any).source).toBe("main-router");
		});

		it("bubbles 403 from posts.getPost to main router onError", async () => {
			const mergedRouter = await makeMergedRouter();

			const mainErrorHandler = mock((err: any) => {
				return new Response(
					JSON.stringify({ error: err.message, source: "main-router" }),
					{
						status: err.status || 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			});

			mergedRouter.onError(mainErrorHandler);

			const res = await mergedRouter.fetch(
				new Request("http://localhost/api/posts/getPost"),
			);

			expect(mainErrorHandler).toHaveBeenCalledTimes(1);
			expect(res.status).toBe(403);

			const body = await res.json();
			expect((body as any).error).toBe("Access denied to post");
			expect((body as any).source).toBe("main-router");
		});

		it("bubbles generic Error from users.createUser to main router onError", async () => {
			const mergedRouter = await makeMergedRouter();

			const mainErrorHandler = mock((err: any) => {
				return new Response(
					JSON.stringify({ error: err.message, type: err.constructor.name }),
					{
						status: err.status || 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			});

			mergedRouter.onError(mainErrorHandler);

			const res = await mergedRouter.fetch(
				new Request("http://localhost/api/users/createUser", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "Test User" }),
				}),
			);

			expect(mainErrorHandler).toHaveBeenCalledTimes(1);
			expect(res.status).toBe(500);

			const body = await res.json();
			expect((body as any).error).toBe("Database connection failed");
			expect((body as any).type).toBe("HTTPException");
		});

		it("should maintain error handler hierarchy in nested merged routers", async () => {
			const { router, procedure, mergeRouters } = jsandy.init();
			const { Hono } = await import("hono");

			const topLevelErrorHandler = mock((err) => {
				return new Response(
					JSON.stringify({
						error: err.message,
						level: "top",
					}),
					{
						status: err.status || 500,
						headers: { "Content-Type": "application/json" },
					},
				);
			});

			// Create nested routers
			const leafRouter = router({
				throwError: procedure.get(() => {
					throw new HTTPException(418, { message: "I'm a teapot" });
				}),
			});

			const middleApp = new Hono();
			const middleRouter = mergeRouters(middleApp, {
				leaf: leafRouter,
			});

			const topApp = new Hono();
			const topRouter = mergeRouters(topApp, {
				middle: middleRouter,
			});

			topRouter.onError(topLevelErrorHandler);

			// Test error bubbling through nested structure
			const nestedErrorReq = new Request(
				"http://localhost/api/middle/api/leaf/throwError",
			);
			const nestedErrorRes = await topRouter.fetch(nestedErrorReq);

			expect(topLevelErrorHandler).toHaveBeenCalledTimes(1);
			expect(nestedErrorRes.status).toBe(418);

			const nestedErrorBody = await nestedErrorRes.json();
			expect((nestedErrorBody as any).error).toBe("I'm a teapot");
			expect((nestedErrorBody as any).level).toBe("top");
		});
	});
});
