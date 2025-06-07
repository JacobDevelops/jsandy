import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";
import path from "node:path";
import fs from "fs-extra";

export const noLinterInstaller: Installer = ({ projectDir }) => {
	addPackageDependency({
		projectDir,
		dependencies: ["prettier", "prettier-plugin-tailwindcss"],
		devDependencies: true,
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
};
