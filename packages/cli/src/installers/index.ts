import type { Linter } from "@/cli";
import type { PackageManager } from "@/utils/get-user-pkg-manager";
import { biomeInstaller } from "./biome";
import { drizzleInstaller } from "./drizzle";
import { eslintInstaller } from "./eslint";
import { neonInstaller } from "./neon";
import { noLinterInstaller } from "./no-linter";
import { noOrmInstaller } from "./no-orm";
import { planetscaleInstaller } from "./planetscale";
import { postgresInstaller } from "./postgres";
import { vercelPostgresInstaller } from "./vercel-postgres";
import { vscodeInstaller } from "./vscode"; // New import

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
	ide: {
		vscode: {
			installer: vscodeInstaller,
			inUse: setupVSCode === true,
		},
	},
	linter: {
		biome: {
			installer: biomeInstaller,
			inUse: selectedLinter === "biome",
		},
		eslint: {
			installer: eslintInstaller,
			inUse: selectedLinter === "eslint",
		},
		none: {
			installer: noLinterInstaller,
			inUse: selectedLinter === "none",
		},
	},
	orm: {
		drizzle: {
			installer: drizzleInstaller,
			inUse: selectedOrm === "drizzle",
		},
		none: {
			installer: noOrmInstaller,
			inUse: selectedOrm === "none",
		},
	},
	provider: {
		neon: {
			installer: neonInstaller,
			inUse: selectedProvider === "neon",
		},
		planetscale: {
			installer: planetscaleInstaller,
			inUse: selectedProvider === "planetscale",
		},
		postgres: {
			installer: postgresInstaller,
			inUse: selectedProvider === "postgres",
		},
		"vercel-postgres": {
			installer: vercelPostgresInstaller,
			inUse: selectedProvider === "vercel-postgres",
		},
	},
});
