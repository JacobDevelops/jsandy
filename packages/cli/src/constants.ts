import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PackageJson } from "type-fest";
import { dependencyVersionMap } from "./installers/dep-version-map";

// With the move to TSUP as a build tool, this keeps path routes in other files (installers, loaders, etc) in check more easily.
// Path is in relation to a single index.js file inside ./dist
const __filename = fileURLToPath(import.meta.url);
const distPath = path.dirname(__filename);

export const PKG_ROOT = path.join(distPath, "../");
export const BASE_PACKAGE_JSON: PackageJson = {
	name: "jsandy-app",
	version: "0.0.0",
	private: true,
	scripts: {
		dev: "next dev",
		build: "next build",
		start: "next start",
	},
	dependencies: {
		"@tailwindcss/postcss": dependencyVersionMap["@tailwindcss/postcss"],
		"@tanstack/react-query": dependencyVersionMap["@tanstack/react-query"],
		clsx: dependencyVersionMap.clsx,
		"drizzle-orm": dependencyVersionMap["drizzle-orm"],
		hono: dependencyVersionMap.hono,
		"@jsandy/rpc": dependencyVersionMap["@jsandy/rpc"],
		next: dependencyVersionMap.next,
		react: dependencyVersionMap.react,
		"react-dom": dependencyVersionMap["react-dom"],
		"tailwind-merge": dependencyVersionMap["tailwind-merge"],
		zod: dependencyVersionMap.zod,
	},
	devDependencies: {
		"@types/node": dependencyVersionMap["@types/node"],
		"@types/react": dependencyVersionMap["@types/react"],
		"@types/react-dom": dependencyVersionMap["@types/react-dom"],
		postcss: dependencyVersionMap.postcss,
		tailwindcss: dependencyVersionMap.tailwindcss,
		typescript: dependencyVersionMap.typescript,
		wrangler: dependencyVersionMap.wrangler,
	},
};
