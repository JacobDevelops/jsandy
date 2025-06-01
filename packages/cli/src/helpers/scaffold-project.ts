import type { InstallerMap, Provider } from "@/installers/index";
import { getUserPkgManager } from "@/utils/get-user-pkg-manager";
import path from "node:path";
import { installBaseTemplate } from "./install-base-template";
import { installPackages } from "./install-packages";

interface ScaffoldProjectOptions {
	projectName: string;
	installers: InstallerMap;
	databaseProvider: Provider;
}

export const scaffoldProject = async ({
	databaseProvider,
	projectName,
	installers,
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
	});

	installPackages({
		projectDir,
		pkgManager,
		noInstall: false,
		installers,
		projectName,
		databaseProvider,
	});

	return projectDir;
};
