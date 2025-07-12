import { beforeEach, describe, expect, it, mock } from "bun:test";
import { z } from "zod";
import { Procedure } from "../procedure";

describe("Procedure", () => {
	let procedure: Procedure;

	beforeEach(() => {
		procedure = new Procedure();
		mock.restore();
	});

	describe("constructor", () => {
		it("should create procedure with default middlewares", () => {
			const proc = new Procedure();
			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(proc["middlewares"]).toHaveLength(1); // SuperJSON middleware
		});

		it("should create procedure with custom middlewares", () => {
			const middleware1 = mock(async () => {});
			const middleware2 = mock(async () => {});

			const proc = new Procedure([middleware1, middleware2]);
			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(proc["middlewares"]).toHaveLength(3); // Custom + SuperJSON
		});

		it("should not duplicate SuperJSON middleware", () => {
			const superjsonMiddleware = async function superjsonMiddleware() {};
			const proc = new Procedure([superjsonMiddleware]);

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(proc["middlewares"]).toHaveLength(1);
		});
	});

	describe("input schema", () => {
		it("should set input schema", () => {
			const schema = z.object({ name: z.string() });
			const newProcedure = procedure.input(schema);

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(newProcedure["inputSchema"]).toBe(schema);
		});

		it("should preserve existing middlewares when setting input", () => {
			const middleware = mock(async () => {});
			const procWithMiddleware = procedure.use(middleware);
			const procWithInput = procWithMiddleware.input(
				z.object({ id: z.string() }),
			);

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(procWithInput["middlewares"]).toHaveLength(2); // Original + SuperJSON
		});
	});

	describe("incoming schema", () => {
		it("should set incoming WebSocket schema", () => {
			const schema = z.object({ message: z.string() });
			const newProcedure = procedure.incoming(schema);

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(newProcedure["incomingSchema"]).toBe(schema);
		});
	});

	describe("outgoing schema", () => {
		it("should set outgoing WebSocket schema", () => {
			const schema = z.object({ response: z.string() });
			const newProcedure = procedure.outgoing(schema);

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(newProcedure["outgoingSchema"]).toBe(schema);
		});
	});

	describe("middleware", () => {
		it("should add middleware to chain", () => {
			const middleware = mock(async ({ next }) =>
				next({ user: { id: "123" } }),
			);
			const newProcedure = procedure.use(middleware);

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(newProcedure["middlewares"]).toHaveLength(2); // Original + new
		});

		it("should chain multiple middlewares", () => {
			const middleware1 = mock(async ({ next }) => next({ step1: true }));
			const middleware2 = mock(async ({ next }) => next({ step2: true }));

			const newProcedure = procedure.use(middleware1).use(middleware2);

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			expect(newProcedure["middlewares"]).toHaveLength(3); // SuperJSON + 2 custom
		});

		it("should preserve context type through middleware chain", () => {
			const authMiddleware = mock(async ({ next }) =>
				next({ user: { id: "123" } }),
			);
			const loggingMiddleware = mock(async ({ next }) =>
				next({ logged: true }),
			);

			const chainedProcedure = procedure
				.use(authMiddleware)
				.use(loggingMiddleware);

			// This should compile without TypeScript errors
			const handler = chainedProcedure.get(({ ctx, c }) => {
				// ctx should have both user and logged properties
				return c.json({ userId: ctx.user.id, wasLogged: ctx.logged });
			});

			expect(handler.type).toBe("get");
		});
	});

	describe("get operation", () => {
		it("should create GET operation without input", () => {
			const handler = mock(({ c }) => c.json({ message: "hello" }));
			const operation = procedure.get(handler);

			expect(operation.type).toBe("get");
			expect(operation.handler).toBe(handler);
			expect(operation.schema).toBeUndefined();
		});

		it("should create GET operation with input schema", () => {
			const schema = z.object({ id: z.string() });
			const handler = mock(({ input, c }) => c.json({ user: input.id }));

			const operation = procedure.input(schema).get(handler);

			expect(operation.type).toBe("get");
			expect(operation.schema).toBe(schema as any);
		});

		it("should include middlewares in operation", () => {
			const middleware = mock(async ({ next }) => next({ test: true }));
			const handler = mock(({ c }) => c.json({ result: "ok" }));

			const operation = procedure.use(middleware).get(handler);

			expect(operation.middlewares).toHaveLength(2); // SuperJSON + custom
		});
	});

	describe("query operation", () => {
		it("should be alias for get", () => {
			const handler = mock(({ c }) => c.json({ data: [] }));
			const getOp = procedure.get(handler);
			const queryOp = procedure.query(handler);

			expect(queryOp.type).toBe(getOp.type);
			expect(queryOp.handler).toBe(getOp.handler);
		});
	});

	describe("post operation", () => {
		it("should create POST operation without input", () => {
			const handler = mock(({ c }) => c.json({ created: true }));
			const operation = procedure.post(handler);

			expect(operation.type).toBe("post");
			expect(operation.handler).toBe(handler);
			expect(operation.schema).toBeUndefined();
		});

		it("should create POST operation with input schema", () => {
			const schema = z.object({ name: z.string(), email: z.string() });
			const handler = mock(({ input, c }) => c.json({ id: "123", ...input }));

			const operation = procedure.input(schema).post(handler);

			expect(operation.type).toBe("post");
			expect(operation.schema).toBe(schema as any);
		});
	});

	describe("mutation operation", () => {
		it("should be alias for post", () => {
			const handler = mock(({ c }) => c.json({ updated: true }));
			const postOp = procedure.post(handler);
			const mutationOp = procedure.mutation(handler);

			expect(mutationOp.type).toBe(postOp.type);
			expect(mutationOp.handler).toBe(postOp.handler);
		});
	});

	describe("ws operation", () => {
		it("should create WebSocket operation", () => {
			const handler = mock(({ c }) =>
				c.json({
					onConnect: async () => {},
					onDisconnect: async () => {},
				}),
			);

			const operation = procedure.ws(handler);

			expect(operation.type).toBe("ws");
			expect(operation.outputFormat).toBe("ws");
			expect(operation.handler).toBe(handler);
		});

		it("should create WebSocket operation with schemas", () => {
			const incomingSchema = z.object({ message: z.string() });
			const outgoingSchema = z.object({ response: z.string() });
			const handler = mock(() => ({ onConnect: async () => {} }));

			const operation = procedure
				.incoming(incomingSchema)
				.outgoing(outgoingSchema)
				.ws(handler);

			expect(operation.type).toBe("ws");
		});

		it("should include middlewares in WebSocket operation", () => {
			const middleware = mock(async ({ next }) => next({ room: "general" }));
			const handler = mock(() => ({ onConnect: async () => {} }));

			const operation = procedure.use(middleware).ws(handler);

			expect(operation.middlewares).toHaveLength(2); // SuperJSON + custom
		});
	});

	describe("SuperJSON middleware", () => {
		it("should add superjson method to context", async () => {
			const mockContext = {
				newResponse: mock(() => new Response()),
				res: { headers: new Headers() },
			} as any;

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			const middleware = procedure["superjsonMiddleware"];
			const mockNext = mock(async () => {});

			await middleware({
				c: mockContext,
				ctx: {},
				next: mockNext as any,
			});

			expect(mockContext.superjson).toBeDefined();
			expect(typeof mockContext.superjson).toBe("function");
		});

		it("should serialize data with SuperJSON headers", async () => {
			const mockResponse = new Response();
			const mockContext = {
				newResponse: mock(() => mockResponse),
				res: { headers: new Headers() },
			} as any;

			// biome-ignore lint/complexity/useLiteralKeys: a workaround for the test
			const middleware = procedure["superjsonMiddleware"];
			await middleware({
				c: mockContext,
				ctx: {},
				next: mock(async () => {}) as any,
			});

			await mockContext.superjson({ test: "data" }, 200);

			expect(mockContext.newResponse).toHaveBeenCalledWith(
				expect.any(String),
				200,
				expect.objectContaining({
					"x-is-superjson": "true",
				}),
			);
		});
	});

	describe("Type inference", () => {
		it("should infer correct input types", () => {
			const schema = z.object({
				name: z.string(),
				age: z.number().optional(),
			});

			// This should compile without TypeScript errors
			const operation = procedure.input(schema).get(({ input, c }) => {
				// input should be inferred as { name: string; age?: number }
				return c.json({ greeting: `Hello ${input.name}` });
			});

			expect(operation.type).toBe("get");
		});

		it("should infer void for no input schema", () => {
			// This should compile without TypeScript errors
			const operation = procedure.get(({ input, c }) => {
				// input should be inferred as void
				expect(input).toBeUndefined();
				return c.json({ message: "no input required" });
			});

			expect(operation.type).toBe("get");
		});

		it("should accumulate context types through middleware", () => {
			const authMiddleware = mock(async ({ next }) =>
				next({ user: { id: "123" } }),
			);
			const roleMiddleware = mock(async ({ next }) => next({ role: "admin" }));

			// This should compile without TypeScript errors
			const operation = procedure
				.use(authMiddleware)
				.use(roleMiddleware)
				.get(({ ctx, c }) => {
					// ctx should have both user and role
					return c.json({
						userId: ctx.user.id,
						userRole: ctx.role,
					});
				});

			expect(operation.type).toBe("get");
		});
	});
});
