import { dependencyVersionMap } from "@/installers/dep-version-map";
import type { PackageJson } from "type-fest";

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
