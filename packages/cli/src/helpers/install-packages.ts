import chalk from "chalk";
import ora from "ora";

import type { InstallerOptions } from "@/installers/index";
import { logger } from "@/utils/logger";

type InstallPackagesOptions = InstallerOptions;

// This runs the installer for all the packages that the user has selected
export const installPackages = (options: InstallPackagesOptions) => {
	const { installers } = options;
	logger.info("Adding boilerplate...");

	// Handle ORM installers
	for (const [name, pkgOpts] of Object.entries(installers.orm)) {
		if (pkgOpts.inUse) {
			const spinner = ora(`Boilerplating ORM: ${name}...`).start();
			try {
				pkgOpts.installer(options);
				spinner.succeed(
					`Successfully setup boilerplate for ORM: ${chalk.green.bold(name)}`,
				);
			} catch (error) {
				spinner.fail(`Failed to setup ORM: ${name}`);
				logger.error(`Error installing ${name}:`, error);
				throw error; // Re-throw to halt the process
			}
		}
	}

	// Handle provider installers
	for (const [name, pkgOpts] of Object.entries(installers.provider)) {
		if (pkgOpts.inUse) {
			const spinner = ora(`Boilerplating provider: ${name}...`).start();
			try {
				pkgOpts.installer(options);
				spinner.succeed(
					`Successfully setup boilerplate for provider: ${chalk.green.bold(name)}`,
				);
			} catch (error) {
				spinner.fail(`Failed to setup provider: ${name}`);
				logger.error(`Error installing ${name}:`, error);
				throw error; // Re-throw to halt the process
			}
		}
	}

	logger.info("");
};
