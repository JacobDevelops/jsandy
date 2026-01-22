import Bun from "bun";

Bun.build({
	entrypoints: ["./src/index.ts"],
	external: ["@clack/prompts", "chalk", "execa", "ora", "sort-package-json"],
	outdir: "./dist",
	sourcemap: "linked",
	target: "node",
});
