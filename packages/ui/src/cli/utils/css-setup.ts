import fs from "node:fs/promises";
import path from "node:path";
import { ensureDirectoryExists, findFile } from "./file-helpers";

/**
 * CSS variables to be added to globals.css
 */
const layerBaseContent = `:root {
  --background: oklch(0.97 0.015 240);
  --foreground: oklch(0.33 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.52 0.03 250);
  --popover: oklch(0.98 0.01 230);
  --popover-foreground: oklch(0.42 0.035 255);
  --primary: oklch(0.63 0.15 255);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.7 0.13 170);
  --secondary-foreground: oklch(1 0 0);
  --muted: oklch(0.96 0.01 245);
  --muted-foreground: oklch(0.55 0.015 245);
  --accent: oklch(0.93 0 0);
  --accent-foreground: oklch(0.21 0.02 245);
  --destructive: oklch(0.58 0.14 25);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9 0.04 250);
  --input: oklch(0.65 0.025 245);
  --ring: oklch(0.6 0.17 280);
  --radius: 0.5rem;
  --chart-1: oklch(0.65 0.15 30);
  --chart-2: oklch(0.5 0.12 180);
  --chart-3: oklch(0.35 0.08 210);
  --chart-4: oklch(0.75 0.16 110);
  --chart-5: oklch(0.73 0.17 80);
  --sidebar: oklch(0.94 0.04 250);
  --sidebar-foreground: oklch(0.3 0.1 250);
  --sidebar-primary: oklch(0.63 0.15 255);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.9 0.03 250);
  --sidebar-accent-foreground: oklch(0.4 0.1 250);
  --sidebar-border: oklch(0.9 0.04 250);
  --sidebar-ring: oklch(0.6 0.17 280);
}

.dark {
  --background: oklch(0.15 0.015 240);
  --foreground: oklch(0.95 0.01 240);
  --card: oklch(0.21 0.02 240);
  --card-foreground: oklch(0.88 0.02 245);
  --popover: oklch(0.18 0.015 235);
  --popover-foreground: oklch(0.9 0.02 240);
  --primary: oklch(0.67 0.17 255);
  --primary-foreground: oklch(0.15 0.01 240);
  --secondary: oklch(0.6 0.15 170);
  --secondary-foreground: oklch(0.12 0.01 240);
  --muted: oklch(0.25 0.02 240);
  --muted-foreground: oklch(0.75 0.02 240);
  --accent: oklch(0.28 0.03 245);
  --accent-foreground: oklch(0.95 0.02 240);
  --destructive: oklch(0.65 0.18 25);
  --destructive-foreground: oklch(0.12 0.01 240);
  --border: oklch(0.3 0.03 240);
  --input: oklch(0.25 0.02 240);
  --ring: oklch(0.7 0.18 145);
  --chart-1: oklch(0.7 0.2 30);
  --chart-2: oklch(0.65 0.16 180);
  --chart-3: oklch(0.6 0.15 210);
  --chart-4: oklch(0.75 0.2 110);
  --chart-5: oklch(0.78 0.19 80);
  --sidebar: oklch(0.21 0.02 240);
  --sidebar-foreground: oklch(0.95 0.01 240);
  --sidebar-primary: oklch(0.67 0.17 255);
  --sidebar-primary-foreground: oklch(0.15 0.01 240);
  --sidebar-accent: oklch(0.28 0.03 245);
  --sidebar-accent-foreground: oklch(0.95 0.02 240);
  --sidebar-border: oklch(0.3 0.03 240);
  --sidebar-ring: oklch(0.7 0.18 145);
}`;

/**
 * Utility function to find the tailwind config file
 */
async function findTailwindConfig(currentDir: string): Promise<string | null> {
	const possibleConfigs = [
		"tailwind.config.js",
		"tailwind.config.ts",
		"tailwind.config.mjs",
		"tailwind.config.cjs",
	];

	for (const config of possibleConfigs) {
		const configPath = path.join(currentDir, config);
		try {
			await fs.access(configPath);
			return configPath;
		} catch {
			// File doesn't exist, try next
		}
	}

	return null;
}

/**
 * Default template when creating a new globals.css file
 */
const defaultGlobalsCss = (globalsPath: string, hasTailwindConfig = false) => {
	// Calculate the relative path from the globals.css file to the
	// node_modules directory.
	const globalsDir = path.dirname(globalsPath);
	const projectRoot = process.cwd();

	const relativePathToPackage = path.relative(
		globalsDir,
		path.join(projectRoot, "node_modules", "@jsandy", "ui"),
	);

	let tailwindConfigPath = "";
	if (hasTailwindConfig) {
		tailwindConfigPath = `\n@config "${path.relative(globalsDir, projectRoot)}";`;
	}

	return `@import "tailwindcss";

@plugin "tailwindcss-animate";
@source "${relativePathToPackage}";${tailwindConfigPath}

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

${layerBaseContent}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;
};

/**
 * Updates or creates the globals.css file with the required CSS variables
 * Only updates if project has tailwind
 */
export async function updateGlobalsCss(customPath?: string): Promise<void> {
	const currentDir = process.cwd();
	let globalsPath: string | null = null;

	if (customPath) {
		globalsPath = path.join(currentDir, customPath);
	} else {
		globalsPath = await findFile("globals.css", currentDir);

		if (!globalsPath) {
			// Try common locations
			const commonLocations = [
				path.join(currentDir, "src", "app", "globals.css"),
				path.join(currentDir, "app", "globals.css"),
				path.join(currentDir, "styles", "globals.css"),
				path.join(currentDir, "src", "styles", "globals.css"),
			];

			for (const location of commonLocations) {
				try {
					await fs.access(location);
					globalsPath = location;
					break;
				} catch {
					// File doesn't exist at this location, continue checking
				}
			}

			if (!globalsPath) {
				// Default to app/globals.css if not found elsewhere
				globalsPath = path.join(currentDir, "app", "globals.css");
			}
		}
	}

	// Check if tailwind config exists
	const tailwindConfigExists = (await findTailwindConfig(currentDir)) !== null;

	let existingContent = "";
	let fileExists = false;

	try {
		existingContent = await fs.readFile(globalsPath, "utf-8");
		fileExists = true;
		console.log(
			`Existing globals.css found at: ${path.relative(currentDir, globalsPath)}`,
		);
	} catch {
		console.log(
			`globals.css not found at ${path.relative(currentDir, globalsPath)}, creating a new one`,
		);
		await ensureDirectoryExists(globalsPath);
	}

	if (fileExists) {
		// Check if Tailwind directives already exist
		if (
			existingContent.includes("@tailwind") ||
			existingContent.includes('@import "tailwindcss"')
		) {
			console.log("Tailwind directives already exist in globals.css.");

			// Update the @source path
			const packagePath = path.relative(
				path.dirname(globalsPath),
				path.join(currentDir, "node_modules", "@jsandy", "ui"),
			);

			// Update the source path
			const sourceRegex = /@source\s+["'].*["'];/;
			if (existingContent.match(sourceRegex)) {
				existingContent = existingContent.replace(
					sourceRegex,
					`@source "${packagePath}";`,
				);
			}

			// Update or add config path if tailwind config exists
			const configRegex = /@config\s+["'].*["'];/;
			if (tailwindConfigExists) {
				const configPath = path.relative(path.dirname(globalsPath), currentDir);
				if (existingContent.match(configRegex)) {
					existingContent = existingContent.replace(
						configRegex,
						`@config "${configPath}";`,
					);
				} else {
					// Add config after source
					existingContent = existingContent.replace(
						/@source\s+["'].*["'];/,
						`@source "${packagePath}";\n@config "${configPath}";`,
					);
				}
			}

			// Replace or add @layer base block with CSS variables
			const rootRegex = /:root\s*{[\s\S]*?}[\s\S]*?\.dark\s*{[\s\S]*?}/;
			if (existingContent.match(rootRegex)) {
				existingContent = existingContent.replace(rootRegex, layerBaseContent);
			} else {
				// Add CSS variables after @theme inline block
				const themeRegex = /@theme\s+inline\s*{[\s\S]*?}/;
				if (existingContent.match(themeRegex)) {
					existingContent = existingContent.replace(
						themeRegex,
						`$&\n\n${layerBaseContent}`,
					);
				} else {
					// If theme block doesn't exist, add CSS variables at the end
					existingContent += `\n\n${layerBaseContent}`;
				}
			}
		} else {
			// If Tailwind directives don't exist, create a new file with the default content
			existingContent = defaultGlobalsCss(globalsPath, tailwindConfigExists);
		}
	} else {
		// Create new file with default content
		existingContent = defaultGlobalsCss(globalsPath, tailwindConfigExists);
	}

	await fs.writeFile(globalsPath, existingContent);
	console.log(
		`globals.css updated successfully at: ${path.relative(currentDir, globalsPath)}`,
	);
}
