import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { jsandy } from "@/j";
import { generateOpenAPISpec } from "@/openapi";

const { router, procedure } = jsandy.init();

describe("Procedure .describe() functionality", () => {
	it("should add description metadata to procedures", () => {
		const testProcedure = procedure
			.input(z.object({ id: z.string() }))
			.describe({
				description: "Test endpoint description",
				operationId: "testOperation",
				schema: z.object({ result: z.string() }),
				summary: "Test endpoint",
				tags: ["test"],
			})
			.get(({ input, c }) => c.json({ result: `Hello ${input.id}` }));

		expect(testProcedure.description).toBeDefined();
		expect(testProcedure.description?.description).toBe(
			"Test endpoint description",
		);
		expect(testProcedure.description?.summary).toBe("Test endpoint");
		expect(testProcedure.description?.tags).toEqual(["test"]);
		expect(testProcedure.description?.operationId).toBe("testOperation");
	});

	it("should work without description metadata", () => {
		const simpleProcedure = procedure
			.input(z.object({ name: z.string() }))
			.get(({ input, c }) => c.json({ greeting: `Hello ${input.name}` }));

		expect(simpleProcedure.description).toBeUndefined();
		expect(simpleProcedure.type).toBe("get");
	});

	it("should preserve description through method chaining", () => {
		const chainedProcedure = procedure
			.describe({
				description: "Chained procedure",
				tags: ["chained"],
			})
			.input(z.object({ value: z.number() }))
			.get(({ input, c }) => c.json({ doubled: input.value * 2 }));

		expect(chainedProcedure.description?.description).toBe("Chained procedure");
		expect(chainedProcedure.description?.tags).toEqual(["chained"]);
	});

	it("should work with POST operations", () => {
		const postProcedure = procedure
			.input(z.object({ email: z.string(), name: z.string() }))
			.describe({
				description: "Create a new resource",
				schema: z.object({ created: z.boolean(), id: z.string() }),
				summary: "Create resource",
			})
			.post(({ c }) => c.json({ created: true, id: "123" }));

		expect(postProcedure.type).toBe("post");
		expect(postProcedure.description?.description).toBe(
			"Create a new resource",
		);
	});

	it("should work with WebSocket operations", () => {
		const wsProcedure = procedure
			.incoming(z.object({ message: z.string() }))
			.outgoing(z.object({ response: z.string() }))
			.describe({
				description: "WebSocket chat endpoint",
				tags: ["websocket", "chat"],
			})
			.ws(() => ({
				onConnect: async () => console.log("Connected"),
			}));

		expect(wsProcedure.type).toBe("ws");
		expect(wsProcedure.description?.description).toBe(
			"WebSocket chat endpoint",
		);
		expect(wsProcedure.description?.tags).toEqual(["websocket", "chat"]);
	});

	it("should store operations in router metadata", () => {
		const testRouter = router({
			createTest: procedure
				.input(z.object({ name: z.string() }))
				.post(({ c }) => c.json({ created: true })),
			getTest: procedure
				.input(z.object({ id: z.string() }))
				.describe({
					description: "Get test data",
					operationId: "getTest",
				})
				.get(({ input, c }) => c.json({ id: input.id })),
		});

		const operations = testRouter.getAllOperations();
		expect(Object.keys(operations)).toContain("getTest");
		expect(Object.keys(operations)).toContain("createTest");

		const getTestDescription = testRouter.getOperationDescription("getTest");
		expect(getTestDescription?.description).toBe("Get test data");
		expect(getTestDescription?.operationId).toBe("getTest");

		const createTestDescription =
			testRouter.getOperationDescription("createTest");
		expect(createTestDescription).toBeUndefined();
	});
});

describe("OpenAPI generation", () => {
	it("should generate OpenAPI spec from described procedures", async () => {
		const documentedRouter = router({
			createUser: procedure
				.input(
					z.object({
						email: z.string(),
						name: z.string(),
					}),
				)
				.describe({
					description: "Create a new user",
					schema: z.object({
						created: z.boolean(),
						id: z.string(),
					}),
					summary: "Create user",
					tags: ["users"],
				})
				.post(({ c }) => c.json({ created: true, id: "123" })),
			getUser: procedure
				.input(z.object({ id: z.string() }))
				.describe({
					description: "Get user by ID",
					operationId: "getUser",
					schema: z.object({
						email: z.string(),
						id: z.string(),
						name: z.string(),
					}),
					summary: "Get user",
					tags: ["users"],
				})
				.get(({ input, c }) =>
					c.json({ email: "test@example.com", id: input.id, name: "Test" }),
				),
		});

		const spec = await generateOpenAPISpec(documentedRouter, {
			description: "Test API for validation",
			title: "Test API",
			version: "1.0.0",
		});

		// Verify basic structure
		expect(spec.openapi).toBe("3.0.0");
		expect(spec.info.title).toBe("Test API");
		expect(spec.info.version).toBe("1.0.0");
		expect(spec.paths).toBeDefined();

		// Verify that operations are included
		expect(spec.paths["/getUser"]).toBeDefined();
		expect(spec.paths["/createUser"]).toBeDefined();

		// Verify GET operation
		const getUserOperation = spec.paths["/getUser"].get;
		expect(getUserOperation).toBeDefined();
		expect(getUserOperation.summary).toBe("Get user");
		expect(getUserOperation.description).toBe("Get user by ID");
		expect(getUserOperation.operationId).toBe("getUser");
		expect(getUserOperation.tags).toEqual(["users"]);

		// Verify POST operation
		const createUserOperation = spec.paths["/createUser"].post;
		expect(createUserOperation).toBeDefined();
		expect(createUserOperation.summary).toBe("Create user");
		expect(createUserOperation.description).toBe("Create a new user");
		expect(createUserOperation.tags).toEqual(["users"]);

		// Verify tags are collected
		expect(spec.tags).toEqual([{ name: "users" }]);
	});

	it("should handle procedures without descriptions", async () => {
		const simpleRouter = router({
			health: procedure.get(({ c }) => c.json({ status: "ok" })),
			ping: procedure.post(({ c }) => c.json({ pong: true })),
		});

		const spec = await generateOpenAPISpec(simpleRouter, {
			title: "Simple API",
			version: "1.0.0",
		});

		expect(spec.paths["/health"]).toBeDefined();
		expect(spec.paths["/ping"]).toBeDefined();

		// Should have default descriptions
		const healthOp = spec.paths["/health"].get;
		expect(healthOp.summary).toBe("GET operation");
		expect(healthOp.description).toBe("");
	});

	it("should handle OpenAPI-specific metadata", async () => {
		const secureRouter = router({
			adminData: procedure
				.describe({
					description: "Get admin-only data",
					openapi: {
						responses: {
							403: {
								content: {
									"application/json": {
										schema: {
											properties: {
												error: { type: "string" },
											},
											type: "object",
										},
									},
								},
								description: "Forbidden - Admin access required",
							},
						},
						security: [{ bearerAuth: [] }],
					},
					summary: "Admin data",
					tags: ["admin"],
				})
				.get(({ c }) => c.json({ adminData: "secret" })),
		});

		const spec = await generateOpenAPISpec(secureRouter, {
			securitySchemes: {
				bearerAuth: {
					scheme: "bearer",
					type: "http",
				},
			},
			title: "Secure API",
			version: "1.0.0",
		});

		const adminOp = spec.paths["/adminData"].get;
		expect(adminOp.security).toEqual([{ bearerAuth: [] }]);
		expect(adminOp.responses[403]).toBeDefined();
		expect(adminOp.responses[403].description).toBe(
			"Forbidden - Admin access required",
		);
	});

	it("should handle query parameters for GET requests", async () => {
		const searchRouter = router({
			search: procedure
				.input(
					z.object({
						limit: z.number().min(1).max(100).default(10),
						offset: z.number().min(0).default(0),
						query: z.string().min(1),
						sortBy: z.enum(["name", "date", "relevance"]).optional(),
					}),
				)
				.describe({
					description: "Search endpoint with pagination",
					tags: ["search"],
				})
				.get(({ c }) => c.json({ results: [], total: 0 })),
		});

		const spec = await generateOpenAPISpec(searchRouter, {
			title: "Search API",
			version: "1.0.0",
		});

		const searchOp = spec.paths["/search"].get;
		expect(searchOp.parameters).toBeDefined();
		expect(searchOp.parameters.length).toBe(4);

		const queryParam = searchOp.parameters.find((p: any) => p.name === "query");
		expect(queryParam).toBeDefined();
		expect(queryParam.in).toBe("query");
		expect(queryParam.required).toBe(true);

		const limitParam = searchOp.parameters.find((p: any) => p.name === "limit");
		expect(limitParam.required).toBe(false); // has default value
	});

	it("should handle request body for POST requests", async () => {
		const createRouter = router({
			createPost: procedure
				.input(
					z.object({
						content: z.string().min(10),
						publishedAt: z.date().optional(),
						tags: z.array(z.string()).optional(),
						title: z.string().min(1).max(200),
					}),
				)
				.describe({
					description: "Create a new blog post",
					schema: z.object({
						createdAt: z.date(),
						id: z.string(),
						slug: z.string(),
					}),
					tags: ["posts"],
				})
				.post(({ c }) =>
					c.json({ createdAt: new Date(), id: "1", slug: "test-post" }),
				),
		});

		const spec = await generateOpenAPISpec(createRouter, {
			title: "Blog API",
			version: "1.0.0",
		});

		const createOp = spec.paths["/createPost"].post;
		expect(createOp.requestBody).toBeDefined();
		expect(createOp.requestBody.required).toBe(true);
		expect(createOp.requestBody.content["application/json"]).toBeDefined();
		expect(
			createOp.requestBody.content["application/json"].schema,
		).toBeDefined();
	});

	it("should handle objects in a merged router", async () => {
		const j = jsandy.init();

		const userRouter = j.router({
			create: procedure
				.describe({
					description: "Create user",
					schema: z.object({
						email: z.string(),
						name: z.string(),
					}),
					tags: ["users"],
				})
				.input(
					z.object({
						email: z.string(),
						name: z.string(),
					}),
				)
				.post(({ c }) => c.json({ user: "data" })),
			get: procedure
				.describe({
					description: "Get user",
					schema: z.object({
						email: z.string(),
						id: z.string(),
						name: z.string(),
					}),
					tags: ["users"],
				})
				.input(z.object({ id: z.string() }))
				.get(({ c }) => c.json({ user: "data" })),
		});

		const postRouter = j.router({
			create: procedure
				.describe({
					description: "Create post",
					schema: z.object({
						content: z.string(),
						id: z.string(),
						title: z.string(),
					}),
					tags: ["posts"],
				})
				.input(
					z.object({
						content: z.string(),
						title: z.string(),
					}),
				)
				.post(({ c }) => c.json({ post: "data" })),
			get: procedure
				.describe({
					description: "Get post",
					schema: z.object({
						content: z.string(),
						id: z.string(),
						title: z.string(),
					}),
					tags: ["posts"],
				})
				.get(({ c }) => c.json({ post: "data" })),
		});

		const api = j
			.router()
			.basePath("/api")
			.use(j.defaults.cors)
			.onError(j.defaults.errorHandler);

		const merged = j.mergeRouters(api, {
			posts: postRouter,
			users: userRouter,
		});

		const spec = await generateOpenAPISpec(merged, {
			title: "Blog API",
			version: "1.0.0",
		});

		expect(spec.paths["/api/users/get"]).toBeDefined();
		expect(spec.paths["/api/users/create"]).toBeDefined();
		expect(
			spec.paths["/api/users/create"].post.responses["200"].content[
				"application/json"
			].schema.properties,
		).toEqual({
			email: {
				type: "string",
			},
			name: {
				type: "string",
			},
		});
		expect(spec.paths["/api/posts/get"]).toBeDefined();
		expect(spec.paths["/api/posts/create"]).toBeDefined();
	});
});

describe("Integration with existing functionality", () => {
	it("should work with middleware", () => {
		const { middleware } = jsandy.init();

		const authMiddleware = middleware(async ({ next }) => {
			return next({ user: { id: "123" } });
		});

		const protectedProcedure = procedure
			.use(authMiddleware)
			.input(z.object({ id: z.string() }))
			.describe({
				description: "Protected endpoint requiring authentication",
				tags: ["protected"],
			})
			.get(({ ctx, input, c }) => {
				return c.json({ requestedId: input.id, userId: ctx.user.id });
			});

		expect(protectedProcedure.description?.description).toBe(
			"Protected endpoint requiring authentication",
		);
		expect(protectedProcedure.middlewares.length).toBeGreaterThan(1); // SuperJSON + auth middleware
	});

	it("should work with router merging", () => {
		const userRouter = router({
			get: procedure
				.describe({
					description: "Get user",
					tags: ["users"],
				})
				.get(({ c }) => c.json({ user: "data" })),
		});

		const postRouter = router({
			get: procedure
				.describe({
					description: "Get post",
					tags: ["posts"],
				})
				.get(({ c }) => c.json({ post: "data" })),
		});

		const api = router();
		const merged = jsandy.init().mergeRouters(api, {
			posts: postRouter,
			users: userRouter,
		});

		expect(merged._metadata.subRouters["/api/users"]).toBeDefined();
		expect(merged._metadata.subRouters["/api/posts"]).toBeDefined();
	});

	it("should preserve type safety", () => {
		// This test mainly ensures compilation works correctly
		const typedProcedure = procedure
			.input(
				z.object({
					count: z.number(),
					id: z.string(),
				}),
			)
			.describe({
				description: "Type-safe procedure",
				schema: z.object({
					processedCount: z.number(),
					result: z.string(),
				}),
			})
			.get(({ input, c }) => {
				// TypeScript should infer input types correctly
				const id: string = input.id;
				const count: number = input.count;

				return c.json({
					processedCount: count * 2,
					result: `Processed ${id}`,
				});
			});

		expect(typedProcedure.type).toBe("get");
		expect(typedProcedure.description?.description).toBe("Type-safe procedure");
	});
});
