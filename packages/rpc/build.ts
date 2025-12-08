import { build, spawn } from "bun";

await build({
	entrypoints: ["src/index.ts"],
	external: ["hono", "superjson", "zod"],
	format: "esm",
	minify: true,
	outdir: "dist",
	target: "node",
});

// Generate declarations with TypeScript
spawn(
	[
		"bunx",
		"tsc",
		"-p",
		"tsconfig.build.json",
		"--declaration",
		"--emitDeclarationOnly",
	],
	{
		stdio: ["inherit", "inherit", "inherit"],
	},
);
