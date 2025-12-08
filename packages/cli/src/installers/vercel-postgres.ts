import path from "node:path";
import fs from "fs-extra";

import { PKG_ROOT } from "@/constants";
import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";

export const vercelPostgresInstaller: Installer = ({ projectDir }) => {
	const extrasDir = path.join(PKG_ROOT, "template/extras");

	addPackageDependency({
		dependencies: ["@vercel/postgres"],
		devDependencies: false,
		projectDir,
	});

	const configFile = path.join(
		extrasDir,
		"config/drizzle-config-vercel-postgres.ts",
	);
	const configDest = path.join(projectDir, "drizzle.config.ts");

	const schemaSrc = path.join(
		extrasDir,
		"src/server/db/schema",
		"with-postgres.ts",
	);
	const schemaDest = path.join(projectDir, "src/server/db/schema.ts");

	const jsandySrc = path.join(
		extrasDir,
		"src/server/jsandy",
		"drizzle-with-vercel-postgres.ts",
	);
	const jsandyDest = path.join(projectDir, "src/server/jsandy.ts");

	fs.ensureDirSync(path.dirname(configDest));
	fs.ensureDirSync(path.dirname(schemaDest));
	fs.ensureDirSync(path.dirname(jsandyDest));

	try {
		fs.copySync(configFile, configDest);
		fs.copySync(schemaSrc, schemaDest);
		fs.copySync(jsandySrc, jsandyDest);
	} catch (error) {
		throw new Error(
			`Failed to copy Vercel Postgres template files: ${(error as Error).message}`,
		);
	}
};
