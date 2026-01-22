/*
 * This maps the necessary packages to a version.
 * This improves performance significantly over fetching it from the npm registry.
 */
export const dependencyVersionMap = {
	"@antfu/eslint-config": "^4.14.1",

	// Linters
	"@biomejs/biome": "2.3.11",
	"@jsandy/rpc": "^2.0.0",

	// neon
	"@neondatabase/serverless": "^1.0.0",
	"@planetscale/database": "^1.19.0",
	"@tailwindcss/postcss": "^4.1.18",
	// Base
	"@tanstack/react-query": "^5.80.6",
	"@types/node": "^25.0.10",
	"@types/react": "^19.2.3",
	"@types/react-dom": "^19.2.3",

	// vercel postgres
	"@vercel/postgres": "^0.10.0",
	clsx: "^2.1.1",

	// Drizzle
	"drizzle-kit": "^0.31.1",
	"drizzle-orm": "^0.45.1",
	eslint: "^9.28.0",
	"eslint-config-next": "^15.3.3",
	"eslint-plugin-drizzle": "^0.2.3",
	hono: "^4.11.5",
	next: "^16.1.4",
	postcss: "^8.5.4",
	postgres: "^3.4.7",

	// Formatters
	prettier: "^3.5.3",
	"prettier-plugin-tailwindcss": "^0.6.12",
	react: "^19.2.3",
	"react-dom": "^19.2.3",
	"tailwind-merge": "^3.4.0",

	// TailwindCSS
	tailwindcss: "^4.1.18",
	typescript: "^5.8.3",
	wrangler: "^4.59.3",
	zod: "^4.3.5",
} as const;
export type AvailableDependencies = keyof typeof dependencyVersionMap;
