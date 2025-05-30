import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
		exclude: ["**/node_modules/**", "**/dist/**"],
		setupFiles: ["src/__tests__/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov", "html"],
			exclude: ["**/node_modules/**", "**/dist/**", "**/*.d.ts"],
		},
	},
});
