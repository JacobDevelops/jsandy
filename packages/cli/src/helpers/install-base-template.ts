import path from "node:path";
import * as p from "@clack/prompts";
import chalk from "chalk";
import fs from "fs-extra";
import ora, { type Ora } from "ora";
import { BASE_PACKAGE_JSON, GITIGNORE_CONTENTS, PKG_ROOT } from "@/constants";
import type { InstallerOptions } from "@/installers/index";
import { logger } from "@/utils/logger";

// This bootstraps the base Next.js application
export const installBaseTemplate = async ({
	projectName,
	projectDir,
	pkgManager,
	noInstall,
}: InstallerOptions) => {
	const srcDir = path.join(PKG_ROOT, "template/base");
	if (!noInstall) {
		logger.info(`\nUsing: ${chalk.cyan.bold(pkgManager)}\n`);
	} else {
		logger.info("");
	}

	const spinner = ora(`Scaffolding in: ${projectDir}...\n`).start();

	try {
		const result = await handleDirectoryConflict(
			projectDir,
			projectName,
			spinner,
		);
		if (!result.shouldContinue) return;
	} catch (error) {
		spinner.fail(
			`Failed to handle directory conflict: ${(error as Error).message}`,
		);
		throw error;
	}

	spinner.start();

	if (!fs.existsSync(path.join(projectDir, "package.json"))) {
		await fs.createFile(path.join(projectDir, "package.json"));
	}

	const packageJson = { ...BASE_PACKAGE_JSON };
	if (projectName !== ".") {
		packageJson.name = projectName.includes("/")
			? projectName.split("/").pop()
			: projectName;
	}

	try {
		fs.copySync(srcDir, projectDir);
		fs.writeJSONSync(path.join(projectDir, "package.json"), BASE_PACKAGE_JSON);
		fs.writeFileSync(path.join(projectDir, ".gitignore"), GITIGNORE_CONTENTS);
	} catch (error) {
		spinner.fail(`Failed to create project files: ${(error as Error).message}`);
		throw error;
	}

	const scaffoldedName =
		projectName === "." ? "App" : chalk.cyan.bold(projectName);

	spinner.succeed(
		`${scaffoldedName} ${chalk.green("scaffolded successfully!")}\n`,
	);
};

const handleDirectoryConflict = async (
	projectDir: string,
	projectName: string,
	spinner: Ora,
) => {
	if (fs.existsSync(projectDir)) {
		if (fs.readdirSync(projectDir).length === 0) {
			if (projectName !== ".")
				spinner.info(
					`${chalk.cyan.bold(projectName)} exists but is empty, continuing...\n`,
				);
		} else {
			spinner.stopAndPersist();
			const overwriteDir = await p.select({
				initialValue: "abort",
				message: `${chalk.redBright.bold("Warning:")} ${chalk.cyan.bold(
					projectName,
				)} already exists and isn't empty. How would you like to proceed?`,
				options: [
					{
						label: "Abort installation (recommended)",
						value: "abort",
					},
					{
						label: "Clear the directory and continue installation",
						value: "clear",
					},
					{
						label: "Continue installation and overwrite conflicting files",
						value: "overwrite",
					},
				],
			});
			if (overwriteDir === "abort") {
				spinner.fail("Aborting installation...");
				process.exit(1);
			}

			const overwriteAction =
				overwriteDir === "clear"
					? "clear the directory"
					: "overwrite conflicting files";

			const confirmOverwriteDir = await p.confirm({
				initialValue: false,
				message: `Are you sure you want to ${overwriteAction}?`,
			});

			if (!confirmOverwriteDir) {
				spinner.fail("Aborting installation...");
				process.exit(1);
			}

			if (overwriteDir === "clear") {
				spinner.info(
					`Emptying ${chalk.cyan.bold(projectName)} and creating JSandy app..\n`,
				);
				await fs.emptyDir(projectDir);
				return { directoryCleared: true, shouldContinue: true };
			}
		}
	}
	return { directoryCleared: false, shouldContinue: true };
};
