import type { PackageManager } from "@/utils/get-user-pkg-manager";
import { drizzleInstaller } from "./drizzle";
import { neonInstaller } from "./neon";
import { noOrmInstaller } from "./no-orm";
import { postgresInstaller } from "./postgres";
import { vercelPostgresInstaller } from "./vercel-postgres";
import { planetscaleInstaller } from "./planetscale";

// Turning this into a const allows the list to be iterated over for programmatically creating prompt options
// Should increase extensibility in the future
export const orms = ["none", "drizzle"] as const;
export type Orm = (typeof orms)[number];

export const dialects = ["postgres"] as const;
export type Dialect = (typeof dialects)[number];

export const providers = [
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
};

export interface InstallerOptions {
	projectDir: string;
	pkgManager: PackageManager;
	noInstall: boolean;
	installers: InstallerMap;
	appRouter?: boolean;
	projectName: string;
	databaseProvider: Provider;
}

export type Installer = (opts: InstallerOptions) => void;

export const buildInstallerMap = (
	selectedOrm: Orm = "none",
	selectedProvider?: Provider,
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
});
