import path from "node:path";
import fs from "fs-extra";
import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";

export const biomeInstaller: Installer = ({ projectDir }) => {
	addPackageDependency({
		dependencies: ["@biomejs/biome"],
		devDependencies: true,
		projectDir,
	});

	fs.writeFileSync(
		path.join(projectDir, "biome.json"),
		JSON.stringify(BIOME_CONFIG, null, 2),
	);
};

const BIOME_CONFIG = {
	$schema: "https://biomejs.dev/schemas/1.9.4/schema.json", // TODO: Consider using dynamic version
	files: {
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
		ignoreUnknown: false,
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
		enabled: true,
		rules: {
			correctness: {
				noUnusedImports: "error",
				noUnusedVariables: "error",
			},
			recommended: true,
		},
	},
	organizeImports: {
		enabled: true,
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
	vcs: {
		clientKind: "git",
		enabled: false,
		useIgnoreFile: true,
	},
};
