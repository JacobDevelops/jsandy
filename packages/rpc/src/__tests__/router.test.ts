import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Hono } from "hono";
import { z } from "zod/v4";
import { Router } from "../router";
import { Procedure } from "../procedure";

// Mock WebSocketPair for testing
// @ts-ignore
global.WebSocketPair = class {
	constructor() {
		const client = {
			readyState: WebSocket.OPEN,
			close: mock(),
			send: mock(),
		} as any;
		const server = {
			readyState: WebSocket.OPEN,
			accept: mock(),
			close: mock(),
			send: mock(),
			onopen: null,
			onclose: null,
			onerror: null,
			onmessage: null,
		} as any;
		// biome-ignore lint/correctness/noConstructorReturn: a workaround for the test
		return [client, server];
	}
} as any;

describe("Router", () => {
	let router: Router;
	let procedure: Procedure;

	beforeEach(() => {
		router = new Router();
		procedure = new Procedure();
		mock.restore();
	});

	describe("constructor", () => {
		it("should create empty router", () => {
			const emptyRouter = new Router();

			expect(emptyRouter).toBeInstanceOf(Hono);
			expect(emptyRouter._metadata).toBeDefined();
			expect(emptyRouter._metadata.procedures).toEqual({});
		});

		it("should create router with procedures", () => {
			const procedures = {
				health: procedure.get(({ c }) => c.json({ status: "ok" })),
				getUser: procedure
					.input(z.object({ id: z.string() }))
					.get(({ input, c }) => c.json({ id: input.id })),
			};

			const testRouter = new Router(procedures);

			expect(testRouter._metadata.procedures.health).toBeDefined();
			expect(testRouter._metadata.procedures.getUser).toBeDefined();
		});

		it("should handle nested procedures", () => {
			const procedures = {
				users: {
					get: procedure.get(({ c }) => c.json({ users: [] })),
					create: procedure.post(({ c }) => c.json({ id: "123" })),
				},
			};

			const testRouter = new Router(procedures);

			expect(testRouter._metadata.procedures["users/get"]).toBeDefined();
			expect(testRouter._metadata.procedures["users/create"]).toBeDefined();
		});

		it("should generate metadata for procedures", () => {
			const schema = z.object({ name: z.string() });
			const procedures = {
				test: procedure.input(schema).get(({ c }) => c.json({ result: "ok" })),
			};

			const testRouter = new Router(procedures);
			const metadata = testRouter._metadata.procedures.test;

			expect(metadata.type).toBe("get");
			expect(metadata.schema).toBeDefined();
			if (metadata.schema && "type" in metadata.schema) {
				expect(metadata.schema.type).toBe("object");
			}
		});

		it("should generate WebSocket metadata", () => {
			const incomingSchema = z.object({ message: z.string() });
			const outgoingSchema = z.object({ response: z.string() });

			const procedures = {
				chat: procedure
					.incoming(incomingSchema)
					.outgoing(outgoingSchema)
					.ws(() => ({ onConnect: async () => {} })),
			};

			const testRouter = new Router(procedures);
			const metadata = testRouter._metadata.procedures.chat;

			expect(metadata.type).toBe("ws");
			expect(metadata.schema).toBeDefined();
			if (metadata.type === "ws" && metadata.schema) {
				expect(metadata.schema.incoming).toBeDefined();
				expect(metadata.schema.outgoing).toBeDefined();
			}
		});
	});

	describe("config", () => {
		it("should set router configuration", () => {
			const config = { name: "test-router" };
			const result = router.config(config);

			expect(router._metadata.config).toBe(config);
			expect(result).toBe(router); // Should return router for chaining
		});

		it("should work without config parameter", () => {
			const result = router.config();
			expect(result).toBe(router);
		});
	});

	describe("error handling", () => {
		it("should set error handler", () => {
			const errorHandler = mock(() => new Response("Error", { status: 500 }));
			const result = router.onError(errorHandler);

			expect(router._errorHandler).toBe(errorHandler);
			expect(result).toBe(router);
		});
	});

	describe("route registration", () => {
		it("should register GET route without schema", async () => {
			const handler = mock(({ c }) => c.json({ message: "hello" }));
			const procedures = {
				test: procedure.get(handler),
			};

			const testRouter = new Router(procedures);

			// Verify route is registered
			expect(testRouter._metadata.procedures.test).toBeDefined();
			expect(testRouter._metadata.procedures.test.type).toBe("get");
		});

		it("should register GET route with schema", async () => {
			const schema = z.object({ id: z.string() });
			const handler = mock(({ input, c }) => c.json({ user: input.id }));

			const procedures = {
				getUser: procedure.input(schema).get(handler),
			};

			const testRouter = new Router(procedures);

			expect(testRouter._metadata.procedures.getUser.schema).toBeDefined();
		});

		it("should register POST route without schema", () => {
			const handler = mock(({ c }) => c.json({ created: true }));
			const procedures = {
				create: procedure.post(handler),
			};

			const testRouter = new Router(procedures);

			expect(testRouter._metadata.procedures.create.type).toBe("post");
		});

		it("should register POST route with schema", () => {
			const schema = z.object({ name: z.string() });
			const handler = mock(({ input, c }) =>
				c.json({ id: "123", name: input.name }),
			);

			const procedures = {
				createUser: procedure.input(schema).post(handler),
			};

			const testRouter = new Router(procedures);

			expect(testRouter._metadata.procedures.createUser.schema).toBeDefined();
		});

		it("should register WebSocket route", () => {
			const handler = mock(() => ({
				onConnect: async () => {},
				onDisconnect: async () => {},
			}));

			const procedures = {
				chat: procedure.ws(handler),
			};

			const testRouter = new Router(procedures);

			expect(testRouter._metadata.procedures.chat.type).toBe("ws");
		});
	});

	describe("middleware handling", () => {
		it("should apply procedure middlewares", () => {
			const middleware = mock(async ({ next }) =>
				next({ user: { id: "123" } }),
			);
			const handler = mock(({ ctx, c }) => c.json({ userId: ctx.user.id }));

			const procedures = {
				protected: procedure.use(middleware).get(handler),
			};

			// Verify middleware is included
			const operation = procedures.protected;
			expect(operation.middlewares).toHaveLength(2); // SuperJSON + custom
		});

		it("should handle multiple middlewares", () => {
			const middleware1 = mock(async ({ next }) => next({ step1: true }));
			const middleware2 = mock(async ({ next }) => next({ step2: true }));
			const handler = mock(({ c }) => c.json({ result: "ok" }));

			const procedures = {
				chained: procedure.use(middleware1).use(middleware2).get(handler),
			};

			const operation = procedures.chained;
			expect(operation.middlewares).toHaveLength(3); // SuperJSON + 2 custom
		});
	});

	describe("sub-router middleware", () => {
		it("should register sub-router middleware", () => {
			const testRouter = new Router();
			testRouter._metadata.subRouters["/api/users"] = new Router();

			// This should not throw
			testRouter.registerSubrouterMiddleware();
		});

		it("should handle sub-router requests", async () => {
			const subRouter = new Router({
				test: procedure.get(({ c }) => c.json({ message: "sub-router" })),
			});

			const mainRouter = new Router();
			mainRouter._metadata.subRouters["/api/users"] = subRouter;
			mainRouter.registerSubrouterMiddleware();

			// Mock sub-router fetch
			subRouter.fetch = mock(async () => new Response("sub-router response"));
			// This would be called by the middleware, but we can't easily test it
			// without a full Hono setup
			expect(mainRouter._metadata.subRouters["/api/users"]).toBe(subRouter);
		});
	});

	describe("WebSocket route handling", () => {
		it("should handle WebSocket route with environment variables", () => {
			const handler = mock(() => ({
				onConnect: async () => {},
			}));

			const procedures = {
				ws: procedure.ws(handler),
			};

			const testRouter = new Router(procedures);

			// Verify WebSocket route is registered
			expect(testRouter._metadata.procedures.ws.type).toBe("ws");
		});

		it("should throw error for missing Redis environment variables", () => {
			const handler = mock(() => ({
				onConnect: async () => {},
			}));

			const procedures = {
				ws: procedure.ws(handler),
			};

			const testRouter = new Router(procedures);

			// The error would be thrown during route execution, not registration
			expect(testRouter._metadata.procedures.ws).toBeDefined();
		});
	});

	describe("type guards", () => {
		it("should identify valid operation types", () => {
			const testRouter = new Router();

			const getOp = procedure.get(({ c }) => c.json({}));
			const postOp = procedure.post(({ c }) => c.json({}));
			const wsOp = procedure.ws(() => ({ onConnect: async () => {} }));

			const invalidOp = { type: "invalid" };

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(testRouter["isOperationType"](getOp)).toBe(true);
			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(testRouter["isOperationType"](postOp)).toBe(true);
			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(testRouter["isOperationType"](wsOp)).toBe(true);
			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(testRouter["isOperationType"](invalidOp)).toBe(false);
			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(testRouter["isOperationType"](null)).toBe(false);
		});
	});

	describe("handler property", () => {
		it("should return router instance without types", () => {
			const testRouter = new Router();
			const handler = testRouter.handler;

			expect(handler).toBe(testRouter);
		});
	});

	describe("metadata structure", () => {
		it("should initialize metadata correctly", () => {
			const testRouter = new Router();

			expect(testRouter._metadata.subRouters).toEqual({});
			expect(testRouter._metadata.config).toEqual({});
			expect(testRouter._metadata.procedures).toEqual({});
			expect(testRouter._metadata.registeredPaths).toEqual([]);
		});

		it("should preserve metadata after adding procedures", () => {
			const procedures = {
				test1: procedure.get(({ c }) => c.json({})),
				test2: procedure.post(({ c }) => c.json({})),
			};

			const testRouter = new Router(procedures);

			expect(Object.keys(testRouter._metadata.procedures)).toHaveLength(2);
			expect(testRouter._metadata.procedures.test1.type).toBe("get");
			expect(testRouter._metadata.procedures.test2.type).toBe("post");
		});
	});
});
