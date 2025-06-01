import Bun from "bun";

Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	sourcemap: "linked",
	external: [
		"@clack/prompts",
		"chalk",
		"execa",
		"fs-extra",
		"hono",
		"jsandy",
		"ora",
		"sort-package-json",
	],
});
