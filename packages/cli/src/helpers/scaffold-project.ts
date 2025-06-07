import type { InstallerMap, Provider } from "@/installers/index";
import { getUserPkgManager } from "@/utils/get-user-pkg-manager";
import path from "node:path";
import { installBaseTemplate } from "./install-base-template";
import { installPackages } from "./install-packages";
import type { Linter } from "@/cli";

interface ScaffoldProjectOptions {
	projectName: string;
	installers: InstallerMap;
	databaseProvider: Provider;
	linter: Linter;
}

export const scaffoldProject = async ({
	databaseProvider,
	projectName,
	installers,
	linter,
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
	});

	installPackages({
		projectDir,
		pkgManager,
		noInstall: false,
		installers,
		projectName,
		databaseProvider,
		linter,
	});

	return projectDir;
};
