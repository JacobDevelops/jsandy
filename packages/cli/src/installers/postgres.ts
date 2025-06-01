import fs from "fs-extra";
import path from "node:path";

import { PKG_ROOT } from "@/constants";
import { addPackageDependency } from "@/utils/add-package-dep";
import { logger } from "@/utils/logger";
import type { Installer } from "./index";

export const postgresInstaller: Installer = ({ projectDir }) => {
	const extrasDir = path.join(PKG_ROOT, "src/template/extras");
	logger.info("Installing Postgres...");

	addPackageDependency({
		projectDir,
		dependencies: ["postgres"],
		devDependencies: false,
	});

	const configFile = path.join(extrasDir, "config/drizzle-config-postgres.ts");
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
		"drizzle-with-postgres.ts",
	);
	const jsandyDest = path.join(projectDir, "src/server/jsandy.ts");

	fs.ensureDirSync(path.dirname(configDest));
	fs.ensureDirSync(path.dirname(schemaDest));
	fs.ensureDirSync(path.dirname(jsandyDest));

	fs.copySync(configFile, configDest);
	fs.copySync(schemaSrc, schemaDest);
	fs.copySync(jsandySrc, jsandyDest);
};
