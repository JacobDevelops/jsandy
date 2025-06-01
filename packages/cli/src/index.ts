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
		return;
	}

	const { projectName, orm, dialect, provider } = results;

	const installers = buildInstallerMap(orm, provider);

	const projectDir = await scaffoldProject({
		dialect,
		databaseProvider: provider ?? "neon",
		installers,
		projectName,
	});

	const pkgJson = fs.readJSONSync(path.join(projectDir, "package.json"));
	pkgJson.name = projectName;

	fs.writeJSONSync(path.join(projectDir, "package.json"), pkgJson, {
		spaces: 2,
	});

	if (!results.noInstall) {
		await installDependencies({ projectDir });
	}

	process.exit(0);
};

main().catch((err) => {
	logger.error("Aborting installation...");
	if (err instanceof Error) {
		logger.error(err);
	} else {
		logger.error(
			"An unknown error has occurred. Please open an issue on github with the below:",
		);
		console.log(err);
	}
	process.exit(1);
});
