#!/usr/bin/env node

import fs from "fs-extra";
import path from "node:path";
import { runCli } from "./cli/index";
import { scaffoldProject } from "./helpers/scaffold-project";
import { buildInstallerMap } from "./installers/index";
import { logger } from "./utils/logger";
import { installDependencies } from "./helpers/install-deps";

const main = async () => {
	const results = await runCli();

	if (!results) {
		logger.info("Operation cancelled by user.");
		return;
	}

	const { projectName, orm, provider } = results;

	const installers = buildInstallerMap(orm, provider);

	const projectDir = await scaffoldProject({
		databaseProvider: provider ?? "neon",
		installers,
		projectName,
	});

	try {
		const pkgJsonPath = path.join(projectDir, "package.json");
		const pkgJson = fs.readJSONSync(pkgJsonPath);
		pkgJson.name = projectName;

		fs.writeJSONSync(pkgJsonPath, pkgJson, {
			spaces: 2,
		});
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
