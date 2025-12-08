import type { PackageJson } from "type-fest";
import { dependencyVersionMap } from "@/installers/dep-version-map";

export const BASE_PACKAGE_JSON: PackageJson = {
	dependencies: {
		"@jsandy/rpc": dependencyVersionMap["@jsandy/rpc"],
		"@tailwindcss/postcss": dependencyVersionMap["@tailwindcss/postcss"],
		"@tanstack/react-query": dependencyVersionMap["@tanstack/react-query"],
		clsx: dependencyVersionMap.clsx,
		hono: dependencyVersionMap.hono,
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
	name: "jsandy-app",
	private: true,
	scripts: {
		build: "next build",
		dev: "next dev",
		start: "next start",
	},
	version: "0.0.0",
};
