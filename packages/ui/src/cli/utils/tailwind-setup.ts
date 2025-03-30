import { execSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { PackageManager } from "./detect-package-manager";

/**
 * Installs Tailwind CSS and related dependencies
 */
export async function installDependencies(
	packageManager: PackageManager,
): Promise<void> {
	const installCmd = {
		npm: "npm install -D",
		yarn: "yarn add -D",
		pnpm: "pnpm add -D",
	}[packageManager];

	try {
		console.log("Installing Tailwind CSS dependencies...");
		execSync(
			`${installCmd} tailwindcss tailwindcss-animate @tailwindcss/postcss postcss`,
			{
				stdio: "inherit",
			},
		);
		console.log("Dependencies installed successfully");
	} catch (error) {
		console.error("Error installing dependencies:", error);
		throw error;
	}
}

/**
 * Creates a postcss.config.mjs file at the root of the project
 */
export async function createPostcssConfig(): Promise<void> {
	const postcssConfigContent = `export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
`;

	try {
		const configPath = path.join(process.cwd(), "postcss.config.mjs");
		await fs.writeFile(configPath, postcssConfigContent, "utf-8");
		console.log("✅ Created postcss.config.mjs");
	} catch (error) {
		console.error("❌ Failed to create postcss.config.mjs:", error);
		throw error;
	}
}
