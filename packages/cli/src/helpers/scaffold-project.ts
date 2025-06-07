import path from "node:path";
import type { Linter } from "@/cli";
import type { InstallerMap, Provider } from "@/installers/index";
import { getUserPkgManager } from "@/utils/get-user-pkg-manager";
import { installBaseTemplate } from "./install-base-template";
import { installPackages } from "./install-packages";

interface ScaffoldProjectOptions {
	projectName: string;
	installers: InstallerMap;
	databaseProvider: Provider;
	linter: Linter;
	setupVSCode?: boolean;
}

export const scaffoldProject = async ({
	databaseProvider,
	projectName,
	installers,
	linter,
	setupVSCode,
}: ScaffoldProjectOptions) => {
	const projectDir = path.resolve(process.cwd(), projectName);
	const pkgManager = getUserPkgManager();

	await installBaseTemplate({
		projectDir,
		pkgManager,
		noInstall: false,
		installers,
		projectName,
		databaseProvider,
		linter,
		setupVSCode,
	});

	installPackages({
		projectDir,
		pkgManager,
		noInstall: false,
		installers,
		projectName,
		databaseProvider,
		linter,
		setupVSCode,
	});

	return projectDir;
};
