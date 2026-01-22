import { existsSync } from "node:fs";
import path from "node:path";
import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";

export const biomeInstaller: Installer = async ({
	projectDir,
	monorepoInfo,
}) => {
	// Skip adding biome dependency if it's already in monorepo root
	if (
		!monorepoInfo?.isMonorepo ||
		!monorepoInfo?.rootPackageJson?.devDependencies?.["@biomejs/biome"]
	) {
		await addPackageDependency({
			dependencies: ["@biomejs/biome"],
			devDependencies: true,
			projectDir,
		});
	}

	// If in monorepo, create a config that extends the root
	let biomeConfig: object;
	if (monorepoInfo?.isMonorepo && monorepoInfo.rootPath) {
		// Check if root biome.json exists
		const rootBiomeExists = existsSync(
			path.join(monorepoInfo.rootPath, "biome.json"),
		);

		if (rootBiomeExists) {
			// Extend from root config
			biomeConfig = {
				extends: [
					`${"../".repeat(
						path.relative(projectDir, monorepoInfo.rootPath).split(path.sep)
							.length,
					)}biome.json`,
				],
				// Only include overrides specific to this project
				files: {
					includes: ["**", "!**/worker-configuration.d.ts"],
				},
			};
		} else {
			// Use full config if no root config exists
			biomeConfig = BIOME_CONFIG;
		}
	} else {
		// Not in monorepo, use full config
		biomeConfig = BIOME_CONFIG;
	}

	await Bun.write(
		path.join(projectDir, "biome.json"),
		JSON.stringify(biomeConfig, null, 2),
	);
};

const BIOME_CONFIG = {
	$schema: "https://biomejs.dev/schemas/2.3.11/schema.json",
	assist: {
		actions: {
			source: {
				organizeImports: "on",
			},
		},
		enabled: true,
		includes: [
			"**/*.js",
			"**/*.jsx",
			"**/*.ts",
			"**/*.tsx",
			"**/*.d.ts",
			"**/*.json",
			"**/*.jsonc",
			"!**/coverage/**",
			"!**/dist/**",
			"!**/build/**",
			"!**/.next/**",
			"!**/node_modules/**",
			"!**/bun.lock",
		],
	},
	files: {
		ignoreUnknown: false,
		includes: [
			"**",
			"!**/coverage",
			"!**/dist",
			"!**/node_modules",
			"!**/bun.lock",
			"!**/.next",
			"!**/.content-collections",
			"!**/*env*",
			"!**/.open-next",
			"!**/worker-configuration.d.ts",
		],
	},
	formatter: {
		enabled: true,
		indentStyle: "tab",
	},
	javascript: {
		formatter: {
			quoteStyle: "double",
		},
	},
	linter: {
		domains: {
			next: "recommended",
			react: "recommended",
		},
		enabled: true,
		rules: {
			correctness: {
				noUnusedImports: "error",
				noUnusedVariables: "error",
			},
			recommended: true,
		},
	},
	overrides: [
		{
			includes: ["**/*.test.ts", "**/*.test.tsx"],
			linter: {
				rules: {
					suspicious: {
						noExplicitAny: "off",
					},
				},
			},
		},
	],
	vcs: {
		clientKind: "git",
		enabled: false,
		useIgnoreFile: true,
	},
};
