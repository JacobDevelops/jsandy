import fs from "node:fs/promises";
import path from "node:path";

export type PackageManager = "npm" | "yarn" | "pnpm";

/**
 * Detects the package manager being used in the current project
 */
export async function detectPackageManager(): Promise<PackageManager> {
	const currentDir = process.cwd();
	console.log("Current directory:", currentDir);

	try {
		// Check for lock files
		const files = await fs.readdir(currentDir);
		if (files.includes("pnpm-lock.yaml")) return "pnpm";
		if (files.includes("yarn.lock")) return "yarn";
		if (files.includes("package-lock.json")) return "npm";

		// If no lock file, check package.json
		const packageJsonPath = path.join(currentDir, "package.json");
		const packageJsonContent = await fs.readFile(packageJsonPath, "utf8");
		const packageJson = JSON.parse(packageJsonContent);

		if (packageJson.packageManager) {
			const [name] = packageJson.packageManager.split("@");
			if (name === "npm" || name === "yarn" || name === "pnpm") {
				return name as PackageManager;
			}
		}

		// Default to npm if nothing else is found
		return "npm";
	} catch (error) {
		console.error("Error detecting package manager:", error);
		return "npm"; // Default to npm if there's an error
	}
}
