import { existsSync } from "node:fs";
import path from "node:path";
import type { PackageJson } from "type-fest";

export interface MonorepoInfo {
	isMonorepo: boolean;
	rootPath?: string;
	packageManager?: "npm" | "yarn" | "pnpm" | "bun";
	rootPackageJson?: PackageJson;
	linter?: "eslint" | "biome" | "none";
}

/**
 * Detect if the current project is part of a monorepo and gather relevant info
 */
export async function detectMonorepo(
	projectDir: string,
): Promise<MonorepoInfo> {
	let currentDir = projectDir;
	let rootPath: string | undefined;
	let packageManager: MonorepoInfo["packageManager"] | undefined;
	let rootPackageJson: PackageJson | undefined;
	let linter: MonorepoInfo["linter"] | undefined;

	// Traverse up to find monorepo root
	while (currentDir !== path.parse(currentDir).root) {
		// Check for lockfiles to determine package manager
		if (!packageManager) {
			if (
				existsSync(path.join(currentDir, "bun.lockb")) ||
				existsSync(path.join(currentDir, "bun.lock"))
			) {
				packageManager = "bun";
			} else if (existsSync(path.join(currentDir, "pnpm-lock.yaml"))) {
				packageManager = "pnpm";
			} else if (existsSync(path.join(currentDir, "yarn.lock"))) {
				packageManager = "yarn";
			} else if (existsSync(path.join(currentDir, "package-lock.json"))) {
				packageManager = "npm";
			}
		}

		// Check for monorepo markers
		const hasWorkspaceConfig =
			existsSync(path.join(currentDir, "pnpm-workspace.yaml")) ||
			existsSync(path.join(currentDir, "lerna.json")) ||
			existsSync(path.join(currentDir, "nx.json")) ||
			existsSync(path.join(currentDir, "turbo.json")) ||
			existsSync(path.join(currentDir, "rush.json"));

		// Check package.json for workspaces
		const packageJsonPath = path.join(currentDir, "package.json");
		if (existsSync(packageJsonPath)) {
			try {
				const pkgJson = (await Bun.file(packageJsonPath).json()) as PackageJson;

				// Check if this is the monorepo root
				if (hasWorkspaceConfig || pkgJson.workspaces) {
					rootPath = currentDir;
					rootPackageJson = pkgJson;

					// Detect linter from root package.json
					const allDeps = {
						...pkgJson.dependencies,
						...pkgJson.devDependencies,
					};

					if (allDeps["@biomejs/biome"]) {
						linter = "biome";
					} else if (allDeps.eslint) {
						linter = "eslint";
					} else if (!allDeps["@biomejs/biome"] && !allDeps.eslint) {
						// Check if prettier is present without a linter
						if (allDeps.prettier) {
							linter = "none"; // prettier only
						}
					}

					break; // Found the root
				}
			} catch {
				// Failed to parse package.json, continue searching
			}
		}

		// Move up one directory
		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			break; // Reached filesystem root
		}
		currentDir = parentDir;
	}

	return {
		isMonorepo: !!rootPath && rootPath !== projectDir,
		linter,
		packageManager,
		rootPackageJson,
		rootPath,
	};
}

/**
 * Get the relative path from the monorepo root to the project
 */
export function getRelativePathFromRoot(
	rootPath: string,
	projectDir: string,
): string {
	return path.relative(rootPath, projectDir);
}

/**
 * Detect package manager from lockfile, returns undefined if no lockfile found
 */
export function detectPackageManagerFromLockfile(
	dir: string,
): "npm" | "yarn" | "pnpm" | "bun" | undefined {
	// Start from the given directory and traverse up
	let currentDir = dir;

	while (currentDir !== path.parse(currentDir).root) {
		if (
			existsSync(path.join(currentDir, "bun.lockb")) ||
			existsSync(path.join(currentDir, "bun.lock"))
		) {
			return "bun";
		} else if (existsSync(path.join(currentDir, "pnpm-lock.yaml"))) {
			return "pnpm";
		} else if (existsSync(path.join(currentDir, "yarn.lock"))) {
			return "yarn";
		} else if (existsSync(path.join(currentDir, "package-lock.json"))) {
			return "npm";
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			break;
		}
		currentDir = parentDir;
	}

	// Return undefined if no lockfile found
	return undefined;
}

/**
 * Detect package manager from lockfile, defaults to npm if no lockfile found
 */
export function detectPackageManager(
	dir: string,
): "npm" | "yarn" | "pnpm" | "bun" {
	return detectPackageManagerFromLockfile(dir) ?? "npm";
}
