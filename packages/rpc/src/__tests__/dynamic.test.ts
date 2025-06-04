import { beforeEach, describe, expect, it, mock } from "bun:test";
import { dynamic } from "../dynamic";
import { Router } from "../router";
import { Procedure } from "../procedure";

describe("Dynamic Router Loading", () => {
	let procedure: Procedure;
	let testRouter: Router;

	beforeEach(() => {
		procedure = new Procedure();
		testRouter = new Router({
			health: procedure.get(({ c }) => c.json({ status: "ok" })),
		});
		mock.restore();
	});

	describe("dynamic", () => {
		it("should load router from default export", async () => {
			const mockImport = mock(async () => ({
				default: testRouter,
			}));

			const dynamicRouter = dynamic(mockImport);
			const result = await dynamicRouter();

			expect(mockImport).toHaveBeenCalled();
			expect(result).toBe(testRouter);
		});

		it("should load router from named export", async () => {
			const mockImport = mock(async () => ({
				userRouter: testRouter,
			}));

			const dynamicRouter = dynamic(mockImport);
			const result = await dynamicRouter();

			expect(mockImport).toHaveBeenCalled();
			expect(result).toBe(testRouter);
		});

		it("should throw error for empty module", async () => {
			const mockImport = mock(async () => ({}));

			const dynamicRouter = dynamic(mockImport);

			await expect(dynamicRouter()).rejects.toThrow(
				"Error dynamically loading router: Invalid router module - Expected a default or named export of a Router, but received an empty module. Did you forget to export your router?",
			);
		});

		it("should throw error for multiple exports", async () => {
			const router1 = new Router();
			const router2 = new Router();

			const mockImport = mock(async () => ({
				router1,
				router2,
			}));

			const dynamicRouter = dynamic(mockImport);

			await expect(dynamicRouter()).rejects.toThrow(
				"Error dynamically loading router: Multiple Router exports detected in module (router1, router2). Please export only one Router instance per module.",
			);
		});

		it("should throw error for invalid router type", async () => {
			const invalidRouter = { type: "not-a-router" };

			const mockImport = mock(async () => ({
				default: invalidRouter,
			}));

			const dynamicRouter = dynamic(mockImport as any);

			await expect(dynamicRouter()).rejects.toThrow(
				"Error dynamically loading router: Invalid router module - Expected exported value to be a Router instance, but received object. Are you exporting multiple functions from this file?",
			);
		});

		it("should throw error for null export", async () => {
			const mockImport = mock(async () => ({
				default: null,
			}));

			const dynamicRouter = dynamic(mockImport as any);

			await expect(dynamicRouter()).rejects.toThrow(
				"Error dynamically loading router: Invalid router module - Expected exported value to be a Router instance, but received null. Are you exporting multiple functions from this file?",
			);
		});

		it("should work with ES module syntax", async () => {
			// Simulate ES module import
			const mockImport = mock(async () => {
				return { userRouter: testRouter };
			});

			const dynamicRouter = dynamic(mockImport as any);
			const result = await dynamicRouter();

			expect(result).toBeInstanceOf(Router);
			expect(result).toBe(testRouter);
		});

		it("should work with CommonJS syntax", async () => {
			// Simulate CommonJS module.exports
			const mockImport = mock(async () => ({
				default: testRouter,
			}));

			const dynamicRouter = dynamic(mockImport as any);
			const result = await dynamicRouter();

			expect(result).toBeInstanceOf(Router);
			expect(result).toBe(testRouter);
		});

		it("should handle import errors", async () => {
			const mockImport = mock(async () => {
				throw new Error("Module not found");
			});

			const dynamicRouter = dynamic(mockImport as any);

			await expect(dynamicRouter()).rejects.toThrow("Module not found");
		});

		it("should validate Router instance correctly", async () => {
			const fakeRouter = {
				// Not actually a Router instance
				_metadata: {},
				get: () => {},
			};

			const mockImport = mock(async () => ({
				router: fakeRouter,
			}));

			const dynamicRouter = dynamic(mockImport as any);

			await expect(dynamicRouter()).rejects.toThrow(
				"Error dynamically loading router: Invalid router module - Expected exported value to be a Router instance",
			);
		});

		it("should work with async router factory", async () => {
			const createRouter = async () => {
				// Simulate async router creation
				await new Promise((resolve) => setTimeout(resolve, 1));
				return testRouter;
			};

			const mockImport = mock(async () => ({
				createRouter: await createRouter(),
			}));

			const dynamicRouter = dynamic(mockImport);
			const result = await dynamicRouter();

			expect(result).toBe(testRouter);
		});
	});

	describe("Error messages", () => {
		it("should provide helpful error for development", async () => {
			const mockImport = mock(async () => ({
				someFunction: () => "not a router",
				anotherFunction: () => "also not a router",
			}));

			const dynamicRouter = dynamic(mockImport as any);

			expect(dynamicRouter()).rejects.toThrow(
				"Error dynamically loading router: Multiple Router exports detected in module (someFunction, anotherFunction). Please export only one Router instance per module.",
			);
		});

		it("should identify the problematic exports", async () => {
			const mockImport = mock(async () => ({
				router1: new Router(),
				router2: new Router(),
				router3: new Router(),
			}));

			const dynamicRouter = dynamic(mockImport);

			const error = await dynamicRouter().catch((e) => e);
			expect(error.message).toContain("(router1, router2, router3)");
		});
	});

	describe("Type safety", () => {
		it("should maintain type information", async () => {
			// This tests that TypeScript types are preserved
			const typedRouter = new Router({
				getUser: procedure.get(({ c }) => c.json({ id: "123", name: "Test" })),
			});

			const mockImport = mock(async () => ({
				userRouter: typedRouter,
			}));

			const dynamicRouter = dynamic(mockImport);
			const result = await dynamicRouter();

			// Type should be preserved
			expect(result).toBe(typedRouter);
			expect(result._metadata.procedures.getUser).toBeDefined();
		});
	});

	describe("Performance", () => {
		it("should only load module when called", () => {
			const mockImport = mock(async () => ({ default: testRouter }));

			// Creating the dynamic router should not call the import
			const dynamicRouter = dynamic(mockImport);
			expect(mockImport).not.toHaveBeenCalled();

			// Only when we call it should the import happen
			dynamicRouter();
			expect(mockImport).toHaveBeenCalled();
		});

		it("should not cache the result", async () => {
			const mockImport = mock(async () => ({ default: testRouter }));
			const dynamicRouter = dynamic(mockImport);

			await dynamicRouter();
			await dynamicRouter();

			// Should be called twice (no caching)
			expect(mockImport).toHaveBeenCalledTimes(2);
		});
	});
});
