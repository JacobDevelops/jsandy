import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";
import fs from "fs-extra";
import path from "node:path";

export const biomeInstaller: Installer = ({ projectDir }) => {
	addPackageDependency({
		projectDir,
		dependencies: ["@biomejs/biome"],
		devDependencies: true,
	});

	fs.writeFile(
		path.join(projectDir, "biome.json"),
		JSON.stringify(BIOME_CONFIG, null, 2),
	);
};

const BIOME_CONFIG = {
	$schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
	vcs: {
		enabled: false,
		clientKind: "git",
		useIgnoreFile: true,
	},
	files: {
		ignoreUnknown: false,
		ignore: [
			"coverage",
			"dist",
			"node_modules",
			"bun.lock",
			".next",
			".content-collections",
			"*env*",
			".open-next",
		],
	},
	formatter: {
		enabled: true,
		indentStyle: "tab",
	},
	organizeImports: {
		enabled: true,
	},
	linter: {
		enabled: true,
		rules: {
			recommended: true,
			correctness: {
				noUnusedVariables: "error",
				noUnusedImports: "error",
			},
		},
	},
	javascript: {
		formatter: {
			quoteStyle: "double",
		},
	},
	overrides: [
		{
			include: ["**/*.test.ts", "**/*.test.tsx"],
			linter: {
				rules: {
					suspicious: {
						noExplicitAny: "off",
					},
				},
			},
		},
	],
};
