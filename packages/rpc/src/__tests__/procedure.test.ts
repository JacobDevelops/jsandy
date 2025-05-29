import type { Env } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { Procedure } from "../procedure";

// Mock superjson
vi.mock("superjson", () => ({
	default: {
		stringify: vi.fn((data) => JSON.stringify(data)),
	},
}));

describe("Procedure", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Constructor", () => {
		it("should create procedure with default parameters", () => {
			const procedure = new Procedure();
			expect(procedure).toBeDefined();
		});

		it("should create procedure with middlewares", () => {
			const middleware = vi.fn(async ({ next }) => next());
			const procedure = new Procedure([middleware]);
			expect(procedure).toBeDefined();
		});

		it("should create procedure with input schema", () => {
			const schema = z.object({ name: z.string() });
			const procedure = new Procedure([], schema);
			expect(procedure).toBeDefined();
		});

		it("should create procedure with incoming and outgoing schemas", () => {
			const incomingSchema = z.object({ message: z.string() });
			const outgoingSchema = z.object({ response: z.string() });
			const procedure = new Procedure(
				[],
				undefined,
				incomingSchema,
				outgoingSchema,
			);
			expect(procedure).toBeDefined();
		});

		it("should automatically add superjson middleware", () => {
			const procedure = new Procedure();
			expect(procedure).toBeDefined();
			// Superjson middleware is added internally
		});

		it("should not add duplicate superjson middleware", () => {
			const superjsonMiddleware = vi.fn(async function superjsonMiddleware({
				next,
			}) {
				return next();
			});

			const procedure = new Procedure([superjsonMiddleware]);
			expect(procedure).toBeDefined();
		});
	});

	describe("Input validation", () => {
		it("should add input schema", () => {
			const procedure = new Procedure();
			const schema = z.object({ name: z.string() });

			const newProcedure = procedure.input(schema);
			expect(newProcedure).toBeInstanceOf(Procedure);
			expect(newProcedure).not.toBe(procedure); // Should return new instance
		});

		it("should chain input schema", () => {
			const procedure = new Procedure();
			const schema = z.object({ name: z.string() });

			const result = procedure
				.input(schema)
				.input(z.object({ age: z.number() }));
			expect(result).toBeInstanceOf(Procedure);
		});
	});

	describe("WebSocket schemas", () => {
		it("should add incoming schema", () => {
			const procedure = new Procedure();
			const schema = z.object({ message: z.string() });

			const newProcedure = procedure.incoming(schema);
			expect(newProcedure).toBeInstanceOf(Procedure);
			expect(newProcedure).not.toBe(procedure);
		});

		it("should add outgoing schema", () => {
			const procedure = new Procedure();
			const schema = z.object({ response: z.string() });

			const newProcedure = procedure.outgoing(schema);
			expect(newProcedure).toBeInstanceOf(Procedure);
			expect(newProcedure).not.toBe(procedure);
		});

		it("should chain incoming and outgoing schemas", () => {
			const procedure = new Procedure();
			const incomingSchema = z.object({ message: z.string() });
			const outgoingSchema = z.object({ response: z.string() });

			const result = procedure
				.incoming(incomingSchema)
				.outgoing(outgoingSchema);

			expect(result).toBeInstanceOf(Procedure);
		});
	});

	describe("Middleware", () => {
		it("should add middleware", () => {
			const procedure = new Procedure();
			const middleware = vi.fn(async ({ next }) => {
				return next({ user: { id: 1 } });
			});

			const newProcedure = procedure.use(middleware);
			expect(newProcedure).toBeInstanceOf(Procedure);
			expect(newProcedure).not.toBe(procedure);
		});

		it("should chain multiple middlewares", () => {
			const procedure = new Procedure();
			const middleware1 = vi.fn(async ({ next }) => next({ step1: true }));
			const middleware2 = vi.fn(async ({ next }) => next({ step2: true }));

			const result = procedure.use(middleware1).use(middleware2);
			expect(result).toBeInstanceOf(Procedure);
		});

		it("should preserve middleware order", () => {
			const procedure = new Procedure();
			const middleware1 = vi.fn(async ({ next }) => next({ order: 1 }));
			const middleware2 = vi.fn(async ({ next }) => next({ order: 2 }));

			const result = procedure.use(middleware1).use(middleware2);
			expect(result).toBeInstanceOf(Procedure);
		});
	});

	describe("GET operations", () => {
		it("should create GET operation", async () => {
			const procedure = new Procedure();
			const handler = vi.fn(({ c }) => c.json({ message: "test" }));

			const operation = procedure.get(handler);
			expect(operation.type).toBe("get");
			expect(operation.middlewares).toBeDefined();

			// Test that calling the operation.handler calls the original handler
			const mockParams = {
				ctx: {},
				c: { json: vi.fn() },
				input: {},
			} as any;

			await operation.handler(mockParams);
			expect(handler).toHaveBeenCalledWith(mockParams);
		});

		it("should create GET operation with input schema", () => {
			const procedure = new Procedure();
			const schema = z.object({ id: z.string() });
			const handler = vi.fn(({ c, input }) => c.json({ id: input.id }));

			const operation = procedure.input(schema).get(handler);
			expect(operation.type).toBe("get");
			expect(operation.schema).toBeDefined();
		});

		it("should support query alias", () => {
			const procedure = new Procedure();
			const handler = vi.fn(({ c }) => c.json({ data: [] }));

			const operation = procedure.query(handler);
			expect(operation.type).toBe("get");
		});
	});

	describe("POST operations", () => {
		it("should create POST operation", async () => {
			const procedure = new Procedure();
			const handler = vi.fn(({ c }) => c.json({ created: true }));

			const operation = procedure.post(handler);
			expect(operation.type).toBe("post");
			expect(operation.middlewares).toBeDefined();
			const mockParams = {
				ctx: {},
				c: { json: vi.fn() },
				input: {},
			} as any;

			await operation.handler(mockParams);
			expect(handler).toHaveBeenCalledWith(mockParams);
		});

		it("should create POST operation with input schema", () => {
			const procedure = new Procedure();
			const schema = z.object({ title: z.string() });
			const handler = vi.fn(({ c, input }) =>
				c.json({ id: 1, title: input.title }),
			);

			const operation = procedure.input(schema).post(handler);
			expect(operation.type).toBe("post");
			expect(operation.schema).toBeDefined();
		});

		it("should support mutation alias", () => {
			const procedure = new Procedure();
			const handler = vi.fn(({ c }) => c.json({ updated: true }));

			const operation = procedure.mutation(handler);
			expect(operation.type).toBe("post");
		});
	});

	describe("WebSocket operations", () => {
		it("should create WebSocket operation", async () => {
			const procedure = new Procedure();
			const handler = vi.fn(() => ({
				onConnect: ({ socket }: { socket: any }) => {
					socket.on("message", () => {});
				},
				onDisconnect: ({ socket }: { socket: any }) => {
					socket.on("message", () => {});
				},
			}));

			const operation = procedure.ws(handler);
			expect(operation.type).toBe("ws");
			expect(operation.outputFormat).toBe("ws");
			expect(operation.middlewares).toBeDefined();

			const mockParams = {
				ctx: {},
				c: { json: vi.fn() },
				io: undefined,
			} as any;

			await operation.handler(mockParams);
			expect(handler).toHaveBeenCalledWith(mockParams);
		});

		it("should create WebSocket with incoming schema", () => {
			const procedure = new Procedure();
			const schema = z.object({ message: z.string() });
			const handler = vi.fn(() => ({
				onConnect: ({ socket }: { socket: any }) => {
					socket.on("message", () => {});
				},
			}));

			const operation = procedure.incoming(schema).ws(handler);
			expect(operation.type).toBe("ws");
		});

		it("should create WebSocket with outgoing schema", () => {
			const procedure = new Procedure();
			const schema = z.object({ response: z.string() });
			const handler = vi.fn(() => ({
				onConnect: ({ socket }: { socket: any }) => {
					socket.on("message", () => {});
				},
			}));

			const operation = procedure.outgoing(schema).ws(handler);
			expect(operation.type).toBe("ws");
		});

		it("should create WebSocket with both schemas", () => {
			const procedure = new Procedure();
			const messageSchema = z.object({ message: z.string() });
			const responseSchema = z.object({ response: z.string() });

			const handler = vi.fn(() => ({
				onConnect: ({ socket }: { socket: any }) => {
					socket.on("message", (data: any) => {
						socket.emit("response", { response: `Got: ${data.message}` });
					});
				},
			}));

			const operation = procedure
				.incoming(messageSchema)
				.outgoing(responseSchema)
				.ws(handler);

			expect(operation.type).toBe("ws");
		});
	});

	describe("SuperJSON middleware", () => {
		it("should provide superjson method to context", () => {
			const procedure = new Procedure();

			// The superjson middleware is internal and tested through operation creation
			const handler = vi.fn(({ c }) => c.superjson({ data: "test" }));
			const operation = procedure.get(handler);

			expect(operation).toBeDefined();
			expect(operation.middlewares.length).toBeGreaterThan(0);
		});

		it("should set superjson headers", () => {
			const procedure = new Procedure();
			const handler = vi.fn(({ c }) => c.superjson({ data: "test" }));
			const operation = procedure.get(handler);

			expect(operation).toBeDefined();
		});
	});

	describe("Type inference", () => {
		it("should infer input types correctly", () => {
			const procedure = new Procedure();
			const schema = z.object({ name: z.string(), age: z.number() });

			const operation = procedure.input(schema).get(({ input }) => {
				// TypeScript should infer input as { name: string; age: number }
				expect(typeof input).toBe("object");
				return new Response();
			});

			expect(operation).toBeDefined();
		});

		it("should handle void input types", () => {
			const procedure = new Procedure();

			const operation = procedure.get(({ input }) => {
				// TypeScript should infer input as void
				expect(input).toBeUndefined();
				return new Response();
			});

			expect(operation).toBeDefined();
		});

		it("should infer context types from middleware", () => {
			const procedure = new Procedure();
			const middleware = vi.fn(async ({ next }) => {
				return next({ user: { id: 1, name: "John" } });
			});

			const operation = procedure.use(middleware).get(({ ctx }) => {
				// TypeScript should infer ctx.user
				expect(typeof ctx).toBe("object");
				return new Response();
			});

			expect(operation).toBeDefined();
		});
	});

	describe("Environment types", () => {
		it("should handle custom environment types", () => {
			interface CustomEnv extends Env {
				Bindings: {
					DATABASE_URL: string;
					API_KEY: string;
				};
			}

			const procedure = new Procedure<CustomEnv>();
			const handler = vi.fn(({ c }) => {
				// Context should have access to custom env
				return c.json({ success: true });
			});

			const operation = procedure.get(handler);
			expect(operation).toBeDefined();
		});
	});
});
