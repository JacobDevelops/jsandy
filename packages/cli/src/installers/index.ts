import type { PackageManager } from "@/utils/get-user-pkg-manager";
import { drizzleInstaller } from "./drizzle";
import { neonInstaller } from "./neon";
import { noOrmInstaller } from "./no-orm";
import { postgresInstaller } from "./postgres";
import { vercelPostgresInstaller } from "./vercel-postgres";
import { planetscaleInstaller } from "./planetscale";
import { vscodeInstaller } from "./vscode"; // New import
import type { Linter } from "@/cli";
import { eslintInstaller } from "./eslint";
import { biomeInstaller } from "./biome";
import { noLinterInstaller } from "./no-linter";

// Turning this into a const allows the list to be iterated over for programmatically creating prompt options
// Should increase extensibility in the future
const orms = ["none", "drizzle"] as const;
type Orm = (typeof orms)[number];

const providers = [
	"postgres",
	"neon",
	"vercel-postgres",
	"planetscale",
] as const;
export type Provider = (typeof providers)[number];

export type InstallerMap = {
	orm: {
		[key in Orm]: {
			inUse: boolean;
			installer: Installer;
		};
	};
	provider: {
		[key in Provider]: {
			inUse: boolean;
			installer: Installer;
		};
	};
	linter: {
		[key in Linter]: {
			inUse: boolean;
			installer: Installer;
		};
	};
	ide: {
		vscode: {
			inUse: boolean;
			installer: Installer;
		};
	};
};

export interface InstallerOptions {
	projectDir: string;
	pkgManager: PackageManager;
	noInstall: boolean;
	installers: InstallerMap;
	appRouter?: boolean;
	projectName: string;
	databaseProvider: Provider;
	linter: Linter;
	setupVSCode?: boolean;
}

export type Installer = (opts: InstallerOptions) => void;

export const buildInstallerMap = (
	selectedOrm: Orm = "none",
	selectedProvider?: Provider,
	selectedLinter?: Linter,
	setupVSCode?: boolean,
): InstallerMap => ({
	orm: {
		none: {
			inUse: selectedOrm === "none",
			installer: noOrmInstaller,
		},
		drizzle: {
			inUse: selectedOrm === "drizzle",
			installer: drizzleInstaller,
		},
	},
	provider: {
		postgres: {
			inUse: selectedProvider === "postgres",
			installer: postgresInstaller,
		},
		neon: {
			inUse: selectedProvider === "neon",
			installer: neonInstaller,
		},
		"vercel-postgres": {
			inUse: selectedProvider === "vercel-postgres",
			installer: vercelPostgresInstaller,
		},
		planetscale: {
			inUse: selectedProvider === "planetscale",
			installer: planetscaleInstaller,
		},
	},
	linter: {
		none: {
			inUse: selectedLinter === "none",
			installer: noLinterInstaller,
		},
		eslint: {
			inUse: selectedLinter === "eslint",
			installer: eslintInstaller,
		},
		biome: {
			inUse: selectedLinter === "biome",
			installer: biomeInstaller,
		},
	},
	ide: {
		vscode: {
			inUse: setupVSCode === true,
			installer: vscodeInstaller,
		},
	},
});
