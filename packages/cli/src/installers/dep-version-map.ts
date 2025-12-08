/*
 * This maps the necessary packages to a version.
 * This improves performance significantly over fetching it from the npm registry.
 */
export const dependencyVersionMap = {
	"@antfu/eslint-config": "^4.14.1",

	// Linters
	"@biomejs/biome": "1.9.4",
	"@jsandy/rpc": "^2.0.0",

	// neon
	"@neondatabase/serverless": "^1.0.0",
	"@planetscale/database": "^1.19.0",
	"@tailwindcss/postcss": "^4.1.8",
	// Base
	"@tanstack/react-query": "^5.80.6",
	"@types/node": "^22.15.30",
	"@types/react": "^19.1.6",
	"@types/react-dom": "^19.1.6",

	// vercel postgres
	"@vercel/postgres": "^0.10.0",
	clsx: "^2.1.1",

	// Drizzle
	"drizzle-kit": "^0.31.1",
	"drizzle-orm": "^0.44.1",
	eslint: "^9.28.0",
	"eslint-config-next": "^15.3.3",
	"eslint-plugin-drizzle": "^0.2.3",
	hono: "^4.7.11",
	next: "^15.3.3",
	postcss: "^8.5.4",
	postgres: "^3.4.7",

	// Formatters
	prettier: "^3.5.3",
	"prettier-plugin-tailwindcss": "^0.6.12",
	react: "^19.1.0",
	"react-dom": "^19.1.0",
	"tailwind-merge": "^3.3.0",

	// TailwindCSS
	tailwindcss: "^4.1.8",
	typescript: "^5.8.3",
	wrangler: "^4.19.1",
	zod: "^4.0.5",
} as const;
export type AvailableDependencies = keyof typeof dependencyVersionMap;
