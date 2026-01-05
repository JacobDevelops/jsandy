import path from "node:path";
import fs from "fs-extra";
import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";

export const eslintInstaller: Installer = ({ projectDir }) => {
	addPackageDependency({
		dependencies: [
			"@antfu/eslint-config",
			"eslint",
			"eslint-config-next",
			"prettier",
			"prettier-plugin-tailwindcss",
		],
		devDependencies: true,
		projectDir,
	});

	fs.writeFileSync(
		path.join(projectDir, "prettier.config.ts"),
		`import type { Config } from "prettier";
import type { PluginOptions } from "prettier-plugin-tailwindcss";

const config: Config = {
	plugins: ["prettier-plugin-tailwindcss"],
};

export default config;`,
	);

	fs.writeFileSync(
		path.join(projectDir, "eslint.config.ts"),
		`import antfu from '@antfu/eslint-config'

export default antfu()`,
	);
};
