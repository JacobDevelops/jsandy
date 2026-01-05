import path from "node:path";
import fs from "fs-extra";
import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";

export const noLinterInstaller: Installer = ({ projectDir }) => {
	addPackageDependency({
		dependencies: ["prettier", "prettier-plugin-tailwindcss"],
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
};
