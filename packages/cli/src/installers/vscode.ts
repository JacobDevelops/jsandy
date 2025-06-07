import path from "node:path";
import fs from "fs-extra";
import type { Installer } from "./index";

export const vscodeInstaller: Installer = ({
	projectDir,
	linter,
	databaseProvider,
}) => {
	const orm = databaseProvider !== undefined ? databaseProvider : "none";
	const vscodeDir = path.join(projectDir, ".vscode");
	fs.ensureDirSync(vscodeDir);

	// Create settings.json
	const settings = createVSCodeSettings(linter, orm);
	fs.writeJSONSync(path.join(vscodeDir, "settings.json"), settings, {
		spaces: 2,
	});

	// Create extensions.json
	const extensions = createVSCodeExtensions(linter, orm);
	fs.writeJSONSync(path.join(vscodeDir, "extensions.json"), extensions, {
		spaces: 2,
	});
};

function createVSCodeSettings(linter: string, orm: string) {
	const baseSettings = {
		// TypeScript settings
		"typescript.preferences.quoteStyle": "double",
		"typescript.preferences.includePackageJsonAutoImports": "on",
		"typescript.preferences.preferTypeOnlyAutoImports": true,
		"typescript.suggest.autoImports": true,
		"typescript.updateImportsOnFileMove.enabled": "always",

		// Editor settings
		"editor.formatOnSave": true,
		"[markdown]": {
			"editor.defaultFormatter": "DavidAnson.vscode-markdownlint",
		},

		// File settings
		"files.eol": "\n",
		"files.trimTrailingWhitespace": true,
		"files.insertFinalNewline": true,

		// Next.js specific
		"emmet.includeLanguages": {
			typescript: "html",
			typescriptreact: "html",
		},

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
		"css.validate": false,
		"scss.validate": false,
		"less.validate": false,
	};

	// Linter-specific settings
	if (linter === "eslint") {
		Object.assign(baseSettings, {
			"editor.defaultFormatter": "esbenp.prettier-vscode",
			"eslint.validate": [
				"javascript",
				"javascriptreact",
				"typescript",
				"typescriptreact",
			],
			"editor.codeActionsOnSave": {
				"source.fixAll.eslint": "explicit",
				"source.organizeImports": "explicit",
			},
		});
	} else if (linter === "biome") {
		Object.assign(baseSettings, {
			"editor.defaultFormatter": "biomejs.biome",
			"editor.codeActionsOnSave": {
				"quickfix.biome": "explicit",
				"source.organizeImports.biome": "explicit",
			},
			"[json]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[typescriptreact]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[typescript]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[jsonc]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[css]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
			"[javascript]": {
				"editor.defaultFormatter": "biomejs.biome",
			},
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
			// SQL formatting (if using SQL tools extension)
			"sqltools.useNodeRuntime": true,
			"sqltools.connections": [],
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
