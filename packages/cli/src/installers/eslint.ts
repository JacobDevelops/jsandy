import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";
import path from "node:path";
import fs from "fs-extra";

export const eslintInstaller: Installer = ({ projectDir }) => {
	addPackageDependency({
		projectDir,
		dependencies: [
			"@antfu/eslint-config",
			"eslint",
			"eslint-config-next",
			"prettier",
			"prettier-plugin-tailwindcss",
		],
		devDependencies: true,
	});

	fs.writeFile(
		path.join(projectDir, "prettier.config.ts"),
		`import type { Config } from "prettier";
import type { PluginOptions } from "prettier-plugin-tailwindcss";

const config: Config = {
	plugins: ["prettier-plugin-tailwindcss"],
};

export default config;`,
	);

	fs.writeFile(
		path.join(projectDir, "eslint.config.ts"),
		`import antfu from '@antfu/eslint-config'

export default antfu()`,
	);
};
