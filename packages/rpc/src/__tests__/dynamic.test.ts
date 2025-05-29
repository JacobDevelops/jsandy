import { describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { dynamic } from "../dynamic";
import { sqStack } from "../j";
import { Router } from "../router";

describe("Dynamic router loading", () => {
	describe("dynamic", () => {
		it("should create dynamic router loader", () => {
			const importFn = vi.fn();
			const loader = dynamic(importFn);

			expect(typeof loader).toBe("function");
		});

		it("should load router from default export", async () => {
			const j = sqStack.init();
			const testRouter = j.router({
				test: j.procedure.get(({ c }) => c.json({ message: "test" })),
			});

			const importFn = vi.fn().mockResolvedValue({
				default: testRouter,
			});

			const loader = dynamic(importFn);
			const result = await loader();

			expect(result).toBe(testRouter);
			expect(importFn).toHaveBeenCalled();
		});

		it("should load router from named export", async () => {
			const j = sqStack.init();
			const testRouter = j.router({
				test: j.procedure.get(({ c }) => c.json({ message: "test" })),
			});

			const importFn = vi.fn().mockResolvedValue({
				userRouter: testRouter,
			});

			const loader = dynamic(importFn);
			const result = await loader();

			expect(result).toBe(testRouter);
		});

		it("should throw error when module has no exports", async () => {
			const importFn = vi.fn().mockResolvedValue({});

			const loader = dynamic(importFn);

			await expect(loader()).rejects.toThrow(
				"Error dynamically loading router: Invalid router module - Expected a default or named export of a Router, but received an empty module. Did you forget to export your router?",
			);
		});

		it("should throw error when module has multiple exports", async () => {
			const j = sqStack.init();
			const router1 = j.router({});
			const router2 = j.router({});

			const importFn = vi.fn().mockResolvedValue({
				router1,
				router2,
			});

			const loader = dynamic(importFn);

			await expect(loader()).rejects.toThrow(
				"Error dynamically loading router: Multiple Router exports detected in module (router1, router2). Please export only one Router instance per module.",
			);
		});

		it("should throw error when export is not a Router instance", async () => {
			const importFn = vi.fn().mockResolvedValue({
				notARouter: { some: "object" },
			});

			const loader = dynamic(importFn);

			await expect(loader()).rejects.toThrow(
				"Error dynamically loading router: Invalid router module - Expected exported value to be a Router instance, but received object. Are you exporting multiple functions from this file?",
			);
		});

		it("should throw error when export is null", async () => {
			const importFn = vi.fn().mockResolvedValue({
				nullRouter: null,
			});

			const loader = dynamic(importFn);

			await expect(loader()).rejects.toThrow(
				"Error dynamically loading router: Invalid router module - Expected exported value to be a Router instance, but received null. Are you exporting multiple functions from this file?",
			);
		});

		it("should handle import errors", async () => {
			const importFn = vi.fn().mockRejectedValue(new Error("Module not found"));

			const loader = dynamic(importFn);

			await expect(loader()).rejects.toThrow("Module not found");
		});

		it("should work with real import scenario", async () => {
			const j = sqStack.init();
			const testRouter = j.router({
				users: j.procedure.get(({ c }) => c.json([])),
				create: j.procedure.post(({ c }) => c.json({ id: 1 })),
			});

			// Simulate dynamic import
			const importFn = async () => {
				// This would normally be: import("./path/to/router")
				return { default: testRouter };
			};

			const loader = dynamic(importFn);
			const result = await loader();

			expect(result).toBeInstanceOf(Router);
			expect(result).toBe(testRouter);
		});

		it("should support TypeScript export patterns", async () => {
			const j = sqStack.init();
			const apiRouter = j.router({
				health: j.procedure.get(({ c }) => c.json({ status: "ok" })),
			});

			// Common TypeScript export patterns
			const patterns = [
				{ default: apiRouter }, // export default
				{ apiRouter }, // export { apiRouter }
				{ router: apiRouter }, // export { router }
			];

			for (const pattern of patterns) {
				const importFn = vi.fn().mockResolvedValue(pattern);
				const loader = dynamic(importFn);
				const result = await loader();

				expect(result).toBe(apiRouter);
			}
		});

		it("should preserve router functionality after dynamic loading", async () => {
			const j = sqStack.init();
			const testRouter = j.router({
				echo: j.procedure
					.input(z.object({ message: z.string() }))
					.post(({ c, input }) => c.json({ echo: input.message })),
			});

			const importFn = vi.fn().mockResolvedValue({ default: testRouter });
			const loader = dynamic(importFn);
			const loadedRouter = await loader();

			// Should preserve router metadata
			expect(loadedRouter._metadata).toBeDefined();
			expect(loadedRouter._metadata.procedures).toBeDefined();

			// Should preserve handler access
			expect(loadedRouter.handler).toBe(loadedRouter);
		});
	});
});
