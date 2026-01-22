#!/usr/bin/env node

import path from "node:path";
import { runCli } from "./cli/index";
import { installDependencies } from "./helpers/install-deps";
import { scaffoldProject } from "./helpers/scaffold-project";
import { buildInstallerMap } from "./installers/index";
import { logger } from "./utils/logger";

const main = async () => {
	const results = await runCli();

	if (!results) {
		logger.info("Operation cancelled by user.");
		return;
	}

	const { projectName, orm, provider, linter, setupVSCode, monorepoInfo } =
		results;

	const installers = buildInstallerMap(orm, provider, linter, setupVSCode);

	const projectDir = await scaffoldProject({
		databaseProvider: provider ?? "neon",
		installers,
		linter: linter ?? "none",
		monorepoInfo,
		projectName,
		setupVSCode,
	});

	try {
		const pkgJsonPath = path.join(projectDir, "package.json");
		const pkgJson = await Bun.file(pkgJsonPath).json();
		pkgJson.name = projectName;

		await Bun.write(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
	} catch (error) {
		logger.error("Failed to update package.json:");
		throw error;
	}

	if (!results.noInstall) {
		await installDependencies({ projectDir });
	}
};

main().catch((err) => {
	logger.error("Aborting installation...");
	if (err instanceof Error) {
		logger.error(err);
	} else {
		logger.error(
			"An unknown error has occurred. Please open an issue on github with the below:",
		);
		logger.error(err);
	}
	process.exit(1);
});
