import "tslib";
import { join, sep } from "node:path";
import type { BuildOptions, SameShape } from "esbuild";
import * as esbuild from "esbuild";
import * as tsup from "tsup";

export async function build(path: string, external?: string[]) {
	const normalizedPath = path.split(sep).join("/");
	const file = normalizedPath;
	const dist = join("dist", normalizedPath.split("/").slice(1, -1).join("/"));

	const esbuildConfig: SameShape<BuildOptions, BuildOptions> = {
		entryPoints: [file],
		packages: "external",
		external,
		bundle: true,
		sourcemap: true,
		format: "cjs",
		target: "es2022",
		outdir: dist,
		assetNames: "assets/[name]-[hash]",
	};

	await esbuild.build(esbuildConfig);
	console.info(`Built ${path}/dist/index.js`);

	await esbuild.build({
		...esbuildConfig,
		format: "esm",
		outExtension: { ".js": ".mjs" },
	});
	console.info(`Built ${path}/dist/index.mjs`);

	await tsup.build({
		entry: [file],
		format: ["cjs", "esm"],
		dts: { only: true },
		outDir: dist,
		silent: true,
		external,
	});
	console.info(`Built ${path}/dist/index.d.ts`);
}
