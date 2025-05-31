import Bun from "bun";

await Bun.build({
	entrypoints: ["src/index.ts"],
	outdir: "dist",
	sourcemap: "linked",
	external: ["hono", "superjson", "zod"],
	target: "node",
});
