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
		assetNames: "assets/[name]-[hash]",
		bundle: true,
		entryPoints: [file],
		external,
		format: "cjs",
		outdir: dist,
		packages: "external",
		sourcemap: true,
		target: "es2022",
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
		dts: { only: true },
		entry: [file],
		external,
		format: ["cjs", "esm"],
		outDir: dist,
		silent: true,
	});
	console.info(`Built ${path}/dist/index.d.ts`);
}
