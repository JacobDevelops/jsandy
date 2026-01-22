import path from "node:path";
import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";

export const noLinterInstaller: Installer = async ({ projectDir }) => {
	await addPackageDependency({
		dependencies: ["prettier", "prettier-plugin-tailwindcss"],
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
};
