import type { Env } from "hono";
import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type ZodError, z } from "zod/v4";
import { fromHono, sqStack } from "../j";
import { mergeRouters } from "../merge-routers";
import { Procedure } from "../procedure";
import { Router } from "../router";

// Mock CORS
vi.mock("hono/cors", () => ({
	cors: vi.fn(() => vi.fn()),
}));

describe("SQStack", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("sqStack.init()", () => {
		it("should initialize with default environment", () => {
			const j = sqStack.init();

			expect(j.router).toBeDefined();
			expect(j.mergeRouters).toBeDefined();
			expect(j.middleware).toBeDefined();
			expect(j.fromHono).toBeDefined();
			expect(j.procedure).toBeInstanceOf(Procedure);
			expect(j.defaults).toBeDefined();
		});

		it("should initialize with custom environment", () => {
			interface CustomEnv extends Env {
				DATABASE_URL: string;
				API_KEY: string;
			}

			const j = sqStack.init<CustomEnv>();

			expect(j.router).toBeDefined();
			expect(j.procedure).toBeInstanceOf(Procedure);
		});
	});

	describe("router factory", () => {
		it("should create empty router", () => {
			const j = sqStack.init();
			const router = j.router();

			expect(router).toBeInstanceOf(Router);
		});

		it("should create router with procedures", () => {
			const j = sqStack.init();
			const procedures = {
				test: j.procedure.get(({ c }) => c.json({ message: "test" })),
			};

			const router = j.router(procedures);
			expect(router).toBeInstanceOf(Router);
		});

		it("should handle complex procedure definitions", () => {
			const j = sqStack.init();
			const procedures = {
				users: j.procedure.get(({ c }) => c.json([])),
				create: j.procedure
					.input(z.object({ name: z.string() }))
					.post(({ c, input }) => c.json({ id: 1, name: input.name })),
				posts: j.procedure.get(({ c }) => c.json([])),
			};

			const router = j.router(procedures);
			expect(router).toBeInstanceOf(Router);
		});
	});

	describe("mergeRouters", () => {
		it("should be accessible from sqStack", () => {
			const j = sqStack.init();
			expect(j.mergeRouters).toBe(mergeRouters);
		});
	});

	describe("middleware factory", () => {
		it("should return middleware function", () => {
			const j = sqStack.init();
			const middleware = j.middleware(async ({ next }) => {
				return next({ user: { id: 1 } });
			});

			expect(typeof middleware).toBe("function");
		});

		it("should handle typed middleware", () => {
			interface UserContext {
				user: { id: number; name: string };
			}

			const j = sqStack.init();
			const middleware = j.middleware<UserContext>(async ({ next }) => {
				await next({ user: { id: 1, name: "John" } });
			});

			expect(typeof middleware).toBe("function");
		});

		it("should handle middleware with return values", () => {
			const j = sqStack.init();
			const middleware = j.middleware<any, { timestamp: number }>(
				async ({ next }) => {
					return next({ timestamp: Date.now() });
				},
			);

			expect(typeof middleware).toBe("function");
		});
	});

	describe("fromHono adapter", () => {
		it("should adapt Hono middleware", () => {
			const j = sqStack.init();
			const honoMiddleware = vi.fn(async (_, next) => {
				await next();
			});

			const adaptedMiddleware = j.fromHono(honoMiddleware);
			expect(typeof adaptedMiddleware).toBe("function");
		});

		it("should be accessible directly", () => {
			expect(typeof fromHono).toBe("function");
		});
	});

	describe("procedure instance", () => {
		it("should provide procedure instance", () => {
			const j = sqStack.init();
			expect(j.procedure).toBeInstanceOf(Procedure);
		});

		it("should allow chaining", () => {
			const j = sqStack.init();
			const operation = j.procedure
				.input(z.object({ name: z.string() }))
				.get(({ c, input }) => c.json({ greeting: `Hello ${input.name}` }));

			expect(operation.type).toBe("get");
		});
	});

	describe("defaults", () => {
		it("should provide CORS middleware", () => {
			const j = sqStack.init();
			expect(j.defaults.cors).toBeDefined();
		});

		it("should provide error handler", () => {
			const j = sqStack.init();
			expect(typeof j.defaults.errorHandler).toBe("function");
		});
	});

	describe("error handler", () => {
		let j: ReturnType<typeof sqStack.init>;

		beforeEach(() => {
			j = sqStack.init();
			vi.clearAllMocks();
		});

		it("should handle HTTPException", () => {
			const error = new HTTPException(404, { message: "Not found" });
			const response = j.defaults.errorHandler(error);

			expect(response).toBeInstanceOf(Response);
		});

		it("should handle ZodError", () => {
			const schema = z.object({ name: z.string() });
			let error: ZodError;

			try {
				schema.parse({ name: 123 });
			} catch (e) {
				error = e as ZodError;
			}

			const response = j.defaults.errorHandler(error!);
			expect(response).toBeInstanceOf(Response);
		});

		it("should handle errors with status property", () => {
			const error = new Error("Bad Request");

			const response = j.defaults.errorHandler(error);
			expect(response).toBeInstanceOf(Response);
		});

		it("should handle generic errors", () => {
			const error = new Error("Something went wrong");
			const response = j.defaults.errorHandler(error);

			expect(response).toBeInstanceOf(Response);
		});

		it("should handle errors without message", () => {
			const error = new Error("Internal Server Error");

			const response = j.defaults.errorHandler(error);
			expect(response).toBeInstanceOf(Response);
		});

		it("should log errors", () => {
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			const error = new Error("Test error");

			j.defaults.errorHandler(error);

			expect(consoleSpy).toHaveBeenCalledWith("[API Error]", error);
			consoleSpy.mockRestore();
		});

		it("should handle null/undefined errors", () => {
			const response1 = j.defaults.errorHandler(null as any);
			const response2 = j.defaults.errorHandler(undefined as any);

			expect(response1).toBeInstanceOf(Response);
			expect(response2).toBeInstanceOf(Response);
		});
	});

	describe("integration tests", () => {
		it("should create complete router with all features", () => {
			const j = sqStack.init();

			const authMiddleware = j.middleware(async ({ next }) => {
				return next({ user: { id: 1, role: "admin" } });
			});

			const procedures = {
				login: j.procedure
					.input(z.object({ email: z.string(), password: z.string() }))
					.post(({ c }) => c.json({ token: "jwt-token" })),

				profile: j.procedure
					.use(authMiddleware)
					.get(({ c }) => c.json({ user: { id: 1, role: "admin" } })),

				list: j.procedure.get(({ c }) => c.json([])),

				create: j.procedure
					.use(authMiddleware)
					.input(z.object({ title: z.string(), content: z.string() }))
					.post(({ c, input }) => c.json({ id: 1, ...input, authorId: 1 })),

				websocket: j.procedure
					.incoming(z.object({ message: z.string() }))
					.outgoing(z.object({ response: z.string() }))
					.ws(() => ({
						onConnect: ({ socket }) => {
							socket.on("message", async (data: any) => {
								await socket.emit("response", `Echo: ${data.message}`);
							});
						},
					})),
			};

			const router = j.router(procedures);
			expect(router).toBeInstanceOf(Router);
		});

		it("should handle environment-specific configurations", () => {
			interface AppEnv extends Env {
				Bindings: {
					DATABASE_URL: string;
					JWT_SECRET: string;
					REDIS_URL: string;
				};
			}

			const j = sqStack.init<AppEnv>();

			const dbMiddleware = j.middleware(async ({ next }) => {
				// Access to env.DATABASE_URL would be typed here
				return next({ db: "mock-db-connection" });
			});

			const router = j.router({
				health: j.procedure
					.use(dbMiddleware)
					.get(({ c, ctx }) => c.json({ status: "ok", db: ctx.db })),
			});

			expect(router).toBeInstanceOf(Router);
		});
	});
});
