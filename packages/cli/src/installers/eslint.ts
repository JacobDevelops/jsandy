import path from "node:path";
import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";

export const eslintInstaller: Installer = async ({ projectDir }) => {
	await addPackageDependency({
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

	await Bun.write(
		path.join(projectDir, "prettier.config.ts"),
		`import type { Config } from "prettier";
import type { PluginOptions } from "prettier-plugin-tailwindcss";

const config: Config = {
	plugins: ["prettier-plugin-tailwindcss"],
};

export default config;`,
	);

	await Bun.write(
		path.join(projectDir, ".prettierignore"),
		`worker-configuration.d.ts
.next
node_modules
dist
coverage`,
	);

	await Bun.write(
		path.join(projectDir, "eslint.config.ts"),
		`import antfu from '@antfu/eslint-config'

export default antfu({
	ignores: ['worker-configuration.d.ts']
})`,
	);
};
