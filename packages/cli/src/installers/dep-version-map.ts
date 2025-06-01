/*
 * This maps the necessary packages to a version.
 * This improves performance significantly over fetching it from the npm registry.
 */
export const dependencyVersionMap = {
	// neon
	"@neondatabase/serverless": "^1.0.0",

	// vercel postgres
	"@vercel/postgres": "^0.10.0",

	// Drizzle
	"drizzle-kit": "^0.31.1",
	"drizzle-orm": "^0.44.1",
	"eslint-plugin-drizzle": "^0.2.3",
	"@planetscale/database": "^1.19.0",
	postgres: "^3.4.7",

	// TailwindCSS
	tailwindcss: "^4.1.8",
	postcss: "^8.5.4",
	prettier: "^3.5.3",
	"prettier-plugin-tailwindcss": "^0.6.12",
} as const;
export type AvailableDependencies = keyof typeof dependencyVersionMap;
