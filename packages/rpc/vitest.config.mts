import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
		exclude: ["**/node_modules/**", "**/dist/**"],
		setupFiles: ["src/__tests__/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov", "html"],
			exclude: [
				"**/node_modules/**",
				"**/dist/**",
				"**/*.d.ts",
				"src/__tests__/setup.ts",
			],
		},
	},
});
