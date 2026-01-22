import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Installer } from "./index";

export const vscodeInstaller: Installer = async ({
	projectDir,
	linter,
	databaseProvider,
}) => {
	const dbProvider = databaseProvider !== undefined ? databaseProvider : "none";
	const vscodeDir = path.join(projectDir, ".vscode");
	await mkdir(vscodeDir, { recursive: true });

	// Create settings.json
	const settings = createVSCodeSettings(linter, dbProvider);
	await Bun.write(
		path.join(vscodeDir, "settings.json"),
		JSON.stringify(settings, null, 2),
	);

	// Create extensions.json
	const extensions = createVSCodeExtensions(linter, dbProvider);
	await Bun.write(
		path.join(vscodeDir, "extensions.json"),
		JSON.stringify(extensions, null, 2),
	);
};

function createVSCodeSettings(linter: string, orm: string) {
	const baseSettings = {
		"[markdown]": {
			"editor.defaultFormatter": "DavidAnson.vscode-markdownlint",
		},
		"css.validate": false,

		// Editor settings
		"editor.formatOnSave": true,

		// Next.js specific
		"emmet.includeLanguages": {
			typescript: "html",
			typescriptreact: "html",
		},

		// File settings
		"files.eol": "\n",
		"files.insertFinalNewline": true,
		"files.trimTrailingWhitespace": true,
		"less.validate": false,
		"scss.validate": false,

		// Tailwind CSS
		"tailwindCSS.experimental.classRegex": [
			["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
			["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
			["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
			["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
		],
		"tailwindCSS.includeLanguages": {
			typescript: "html",
			typescriptreact: "html",
		},
		"typescript.preferences.includePackageJsonAutoImports": "on",
		"typescript.preferences.preferTypeOnlyAutoImports": true,
		// TypeScript settings
		"typescript.preferences.quoteStyle": "double",
		"typescript.suggest.autoImports": true,
		"typescript.updateImportsOnFileMove.enabled": "always",
	};

	// Linter-specific settings
	if (linter === "eslint") {
		Object.assign(baseSettings, {
			"editor.codeActionsOnSave": {
				"source.fixAll.eslint": "explicit",
				"source.organizeImports": "explicit",
			},
			"editor.defaultFormatter": "esbenp.prettier-vscode",
			"eslint.validate": [
				"javascript",
				"javascriptreact",
				"typescript",
				"typescriptreact",
			],
		});
	} else if (linter === "biome") {
		Object.assign(baseSettings, {
			"[css]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[javascript]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[json]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[jsonc]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[typescript]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[typescriptreact]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"editor.codeActionsOnSave": {
				"quickfix.biome": "explicit",
				"source.organizeImports.biome": "explicit",
			},
			"editor.defaultFormatter": "biomejs.biome",
		});
	} else {
		// No linter - just use Prettier
		Object.assign(baseSettings, {
			"editor.defaultFormatter": "esbenp.prettier-vscode",
		});
	}

	// Database-specific settings
	if (orm === "drizzle") {
		Object.assign(baseSettings, {
			// Drizzle Kit integration
			"files.associations": {
				"*.sql": "sql",
				"drizzle.config.*": "typescript",
			},
			"sqltools.connections": [],
			// SQL formatting (if using SQL tools extension)
			"sqltools.useNodeRuntime": true,
		});
	}

	return baseSettings;
}

function createVSCodeExtensions(linter: string, orm: string) {
	const baseExtensions = [
		// Essential TypeScript/React
		"ms-vscode.vscode-typescript-next",
		"bradlc.vscode-tailwindcss",

		// Next.js/React specific
		"ms-vscode.vscode-json",
		"formulahendry.auto-rename-tag",
		"ms-vscode.vscode-react-native",

		// Git integration
		"eamodio.gitlens",
		"github.vscode-github-actions",

		// Productivity & Code Quality
		"streetsidesoftware.code-spell-checker",
		"usernamehw.errorlens",
		"wix.vscode-import-cost",
		"christian-kohler.npm-intellisense",

		// File & Project Management
		"ms-vscode.hexeditor",
		"redhat.vscode-yaml",
		"ms-vscode.vscode-json",
	];

	// Linter-specific extensions
	if (linter === "eslint") {
		baseExtensions.push("dbaeumer.vscode-eslint");
		baseExtensions.push("esbenp.prettier-vscode");
	} else if (linter === "biome") {
		baseExtensions.push("biomejs.biome");
	}

	// Database-specific extensions
	if (orm === "drizzle") {
		baseExtensions.push(
			"mtxr.sqltools",
			"mtxr.sqltools-driver-pg", // PostgreSQL driver
		);
	}

	return {
		recommendations: baseExtensions,
		unwantedRecommendations: [
			// Conflicting formatters
			"hookyqr.beautify",
			"ms-vscode.vscode-typescript",
		],
	};
}
