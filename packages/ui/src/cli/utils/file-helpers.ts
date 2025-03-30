import fs from "node:fs/promises";
import path from "node:path";

const PACKAGE_NAME = "@jsandy/ui";

/**
 * Finds a file by recursively searching directories
 */
export async function findFile(
	fileName: string,
	startPath: string,
): Promise<string | null> {
	const queue = [startPath];

	while (queue.length > 0) {
		const currentPath = queue.shift();
		if (!currentPath) continue;
		const entries = await fs.readdir(currentPath, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.name.startsWith(".git") || entry.name === "node_modules")
				continue;

			const fullPath = path.join(currentPath, entry.name);

			if (entry.isDirectory()) {
				queue.push(fullPath);
			} else if (entry.name === fileName) {
				return fullPath;
			}
		}
	}

	return null;
}

/**
 * Ensures a directory exists before writing a file
 */
export async function ensureDirectoryExists(filePath: string): Promise<void> {
	const directory = path.dirname(filePath);
	await fs.mkdir(directory, { recursive: true });
}

/**
 * Checks if the package is installed as a dependency
 */
export async function isInstalledAsDependency(): Promise<boolean> {
	const currentDir = process.cwd();
	const packageJsonPath = path.join(currentDir, "package.json");

	try {
		const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
		const packageJson = JSON.parse(packageJsonContent);

		return (
			packageJson.dependencies?.[PACKAGE_NAME] ||
			packageJson.devDependencies?.[PACKAGE_NAME]
		);
	} catch (error) {
		console.error("Error reading package.json:", error);
		return false;
	}
}
