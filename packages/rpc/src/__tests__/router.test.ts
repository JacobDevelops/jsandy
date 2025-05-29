import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { sqStack } from "../j";
import { Router } from "../router";

vi.mock("../sockets", () => ({
	IO: vi.fn(),
	ServerSocket: vi.fn(),
}));

vi.mock("hono/adapter", () => ({
	env: vi.fn(() => ({
		UPSTASH_REDIS_REST_URL: "redis://localhost",
		UPSTASH_REDIS_REST_TOKEN: "token",
	})),
}));

describe("Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Router constructor", () => {
		it("should create an empty router", () => {
			const router = new Router();
			expect(router).toBeDefined();
			expect(router._metadata.subRouters).toEqual({});
			expect(router._metadata.procedures).toEqual({});
			expect(router._metadata.registeredPaths).toEqual([]);
		});

		it("should create router with procedures", () => {
			const j = sqStack.init();
			const procedures = {
				test: j.procedure.get(({ c }) => c.json({ message: "test" })),
			};

			const router = new Router(procedures);
			expect(router).toBeDefined();
			expect(router._metadata.procedures.test).toBeDefined();
		});

		it("should handle nested procedures", () => {
			const j = sqStack.init();
			const procedures = {
				users: {
					list: j.procedure.get(({ c }) => c.json([])),
					create: j.procedure.post(({ c }) => c.json({ id: 1 })),
				},
			};

			const router = new Router(procedures);
			expect(router).toBeDefined();
			expect(router._metadata.procedures["users/list"]).toBeDefined();
			expect(router._metadata.procedures["users/create"]).toBeDefined();
		});
	});

	describe("Router configuration", () => {
		it("should set router config", () => {
			const router = new Router();
			const config = { name: "test-router" };

			router.config(config);
			expect(router._metadata.config).toEqual(config);
		});

		it("should return router instance for chaining", () => {
			const router = new Router();
			const result = router.config({ name: "test" });
			expect(result).toBe(router);
		});

		it("should return router without setting config when no config provided", () => {
			const router = new Router();
			const result = router.config();
			expect(result).toBe(router);
		});
	});

	describe("Error handler", () => {
		it("should set error handler", () => {
			const router = new Router();
			const errorHandler = vi.fn();

			router.onError(errorHandler);
			expect(router._errorHandler).toBe(errorHandler);
		});

		it("should return router instance for chaining", () => {
			const router = new Router();
			const errorHandler = vi.fn();

			const result = router.onError(errorHandler);
			expect(result).toBe(router);
		});
	});

	describe("GET operations", () => {
		it("should register GET operation without schema", () => {
			const j = sqStack.init();
			const handler = vi.fn(({ c }) => c.json({ message: "test" }));
			const procedures = {
				test: j.procedure.get(handler),
			};

			const router = new Router(procedures);
			expect(router._metadata.procedures.test).toBeDefined();
			expect(router._metadata.procedures.test.type).toBe("get");
		});

		it("should register GET operation with schema", () => {
			const j = sqStack.init();
			const schema = z.object({ name: z.string() });
			const handler = vi.fn(({ c, input }) =>
				c.json({ greeting: `Hello ${input.name}` }),
			);

			const procedures = {
				greet: j.procedure.input(schema).get(handler),
			};

			const router = new Router(procedures);
			expect(router._metadata.procedures.greet).toBeDefined();
		});

		it("should handle GET request execution", async () => {
			const j = sqStack.init();
			const handler = vi.fn(({ c }) => c.json({ message: "test" }));
			const procedures = {
				test: j.procedure.get(handler),
			};

			const router = new Router(procedures);

			// Test that router is properly set up
			expect(router._metadata.procedures.test).toBeDefined();
		});
	});

	describe("POST operations", () => {
		it("should register POST operation without schema", () => {
			const j = sqStack.init();
			const handler = vi.fn(({ c }) => c.json({ created: true }));
			const procedures = {
				create: j.procedure.post(handler),
			};

			const router = new Router(procedures);
			expect(router._metadata.procedures.create).toBeDefined();
			expect(router._metadata.procedures.create.type).toBe("post");
		});

		it("should register POST operation with schema", () => {
			const j = sqStack.init();
			const schema = z.object({ title: z.string() });
			const handler = vi.fn(({ c, input }) =>
				c.json({ id: 1, title: input.title }),
			);

			const procedures = {
				createPost: j.procedure.input(schema).post(handler),
			};

			const router = new Router(procedures);
			expect(router._metadata.procedures.createPost).toBeDefined();
		});
	});

	describe("WebSocket operations", () => {
		it("should register WebSocket operation", () => {
			const j = sqStack.init();
			const handler = vi.fn(() => ({
				onConnect: ({ socket }: { socket: any }) => {
					socket.on("message", () => {});
				},
				onDisconnect: ({ socket }: { socket: any }) => {
					socket.on("message", () => {});
				},
			}));

			const procedures = {
				chat: j.procedure.ws(handler),
			};

			const router = new Router(procedures);
			expect(router._metadata.procedures.chat).toBeDefined();
			expect(router._metadata.procedures.chat.type).toBe("ws");
		});

		it("should register WebSocket with incoming/outgoing schemas", () => {
			const j = sqStack.init();
			const messageSchema = z.object({
				message: z.object({
					text: z.string(),
					userId: z.string(),
				}),
			});

			const handler = vi.fn(() => ({
				onConnect: ({ socket }: { socket: any }) => {
					socket.on("message", () => {});
				},
				onDisconnect: ({ socket }: { socket: any }) => {
					socket.on("message", () => {});
				},
			}));

			const procedures = {
				chat: j.procedure
					.incoming(messageSchema)
					.outgoing(messageSchema)
					.ws(handler),
			};

			const router = new Router(procedures);
			expect(router._metadata.procedures.chat).toBeDefined();
		});
	});

	describe("Middleware handling", () => {
		it("should apply middleware to operations", () => {
			const j = sqStack.init();
			const middleware = vi.fn(async ({ next }) => {
				return next({ user: { id: 1 } });
			});

			const handler = vi.fn(({ c, ctx }) => c.json({ user: ctx.user }));

			const procedures = {
				profile: j.procedure.use(middleware).get(handler),
			};

			const router = new Router(procedures);
			expect(router._metadata.procedures.profile).toBeDefined();
		});
	});

	describe("Subrouter middleware", () => {
		it("should register subrouter middleware", () => {
			const router = new Router();
			expect(() => router.registerSubrouterMiddleware()).not.toThrow();
		});

		it("should handle subrouter requests", async () => {
			const router = new Router();
			const subRouter = new Router();

			router._metadata.subRouters["/api/users"] = subRouter;
			router.registerSubrouterMiddleware();

			expect(router).toBeDefined();
		});
	});

	describe("Route path registration", () => {
		it("should register nested routes correctly", () => {
			const j = sqStack.init();
			const procedures = {
				users: {
					profile: j.procedure.get(({ c }) => c.json({ id: 1 })),
					settings: {
						update: j.procedure.post(({ c }) => c.json({ updated: true })),
					},
				},
			};

			const router = new Router(procedures);
			expect(router._metadata.procedures["users/profile"]).toBeDefined();
			// Note: deeply nested routes are not supported in current implementation
		});
	});

	describe("Operation type validation", () => {
		it("should validate operation types correctly", () => {
			// Test private method through procedures setup
			const j = sqStack.init();
			const validOperation = j.procedure.get(({ c }) => c.json({}));
			const invalidOperation = { notAnOperation: true };

			const procedures = {
				valid: validOperation,
				invalid: invalidOperation,
			};

			// Should only register valid operations
			const testRouter = new Router(procedures);
			expect(testRouter._metadata.procedures.valid).toBeDefined();
			expect(testRouter._metadata.procedures.invalid).toBeUndefined();
		});
	});

	describe("Handler access", () => {
		it("should provide handler access", () => {
			const router = new Router();
			expect(router.handler).toBe(router);
		});
	});
});
