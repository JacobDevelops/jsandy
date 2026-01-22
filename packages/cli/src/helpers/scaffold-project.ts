import path from "node:path";
import type { Linter } from "@/cli";
import type { InstallerMap, Provider } from "@/installers/index";
import { getUserPkgManager } from "@/utils/get-user-pkg-manager";
import type { MonorepoInfo } from "@/utils/monorepo-detection";
import { installBaseTemplate } from "./install-base-template";
import { installPackages } from "./install-packages";

interface ScaffoldProjectOptions {
	projectName: string;
	installers: InstallerMap;
	databaseProvider: Provider;
	linter: Linter;
	setupVSCode?: boolean;
	monorepoInfo?: MonorepoInfo;
}

export const scaffoldProject = async ({
	databaseProvider,
	projectName,
	installers,
	linter,
	setupVSCode,
	monorepoInfo,
}: ScaffoldProjectOptions) => {
	const projectDir = path.resolve(process.cwd(), projectName);
	// Use monorepo package manager if detected, otherwise fall back to lockfile detection
	const pkgManager = monorepoInfo?.packageManager || getUserPkgManager();

	await installBaseTemplate({
		databaseProvider,
		installers,
		linter,
		monorepoInfo,
		noInstall: false,
		pkgManager,
		projectDir,
		projectName,
		setupVSCode,
	});

	await installPackages({
		databaseProvider,
		installers,
		linter,
		monorepoInfo,
		noInstall: false,
		pkgManager,
		projectDir,
		projectName,
		setupVSCode,
	});

	return projectDir;
};
