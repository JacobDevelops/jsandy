import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import * as p from "@clack/prompts";
import chalk from "chalk";
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
	linter,
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

	const packageJson = { ...BASE_PACKAGE_JSON };
	if (projectName !== ".") {
		packageJson.name = projectName.includes("/")
			? projectName.split("/").pop()
			: projectName;
	}

	try {
		// Copy template directory recursively using Bun
		await copyDirectory(srcDir, projectDir);
		await Bun.write(
			path.join(projectDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);
		await Bun.write(path.join(projectDir, ".gitignore"), GITIGNORE_CONTENTS);

		// Generate Cloudflare Worker types using wrangler
		spinner.text = "Generating Cloudflare Worker types...";
		try {
			const result = Bun.spawnSync(
				[
					"npx",
					"wrangler",
					"types",
					"--env-interface",
					"CloudflareBindings",
					"worker-configuration.d.ts",
				],
				{
					cwd: projectDir,
					stderr: "pipe",
					stdout: "pipe",
				},
			);
			if (!result.success) {
				// Type generation is optional - don't fail the installation if it doesn't work
				logger.warn(
					"Could not generate Cloudflare Worker types. You may need to run 'wrangler types' manually.",
				);
			} else {
				// Format the generated file with the chosen formatter
				const workerTypesPath = path.join(
					projectDir,
					"worker-configuration.d.ts",
				);
				if (existsSync(workerTypesPath)) {
					try {
						if (linter === "biome") {
							// Format with Biome
							Bun.spawnSync(
								[
									"npx",
									"@biomejs/biome",
									"format",
									"--write",
									"worker-configuration.d.ts",
								],
								{
									cwd: projectDir,
									stderr: "pipe",
									stdout: "pipe",
								},
							);
						} else {
							// Format with Prettier (for eslint or no linter)
							Bun.spawnSync(
								["npx", "prettier", "--write", "worker-configuration.d.ts"],
								{
									cwd: projectDir,
									stderr: "pipe",
									stdout: "pipe",
								},
							);
						}
					} catch {
						// Formatting is optional, don't fail if it doesn't work
					}
				}
			}
		} catch {
			// Type generation is optional - don't fail the installation if it doesn't work
			logger.warn(
				"Could not generate Cloudflare Worker types. You may need to run 'wrangler types' manually.",
			);
		}
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
	if (existsSync(projectDir)) {
		if (readdirSync(projectDir).length === 0) {
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
				// Empty directory by removing and recreating it
				rmSync(projectDir, { force: true, recursive: true });
				mkdirSync(projectDir, { recursive: true });
				return { directoryCleared: true, shouldContinue: true };
			}
		}
	}
	return { directoryCleared: false, shouldContinue: true };
};

// Helper function to recursively copy a directory
async function copyDirectory(src: string, dest: string): Promise<void> {
	// Ensure destination directory exists
	mkdirSync(dest, { recursive: true });

	// Read all items in source directory
	const items = readdirSync(src, { withFileTypes: true });

	// Copy each item
	for (const item of items) {
		const srcPath = path.join(src, item.name);
		const destPath = path.join(dest, item.name);

		if (item.isDirectory()) {
			// Recursively copy subdirectories
			await copyDirectory(srcPath, destPath);
		} else {
			// Copy file using Bun
			await Bun.write(destPath, Bun.file(srcPath));
		}
	}
}
