import path from "node:path";
import fs from "fs-extra";

import { PKG_ROOT } from "@/constants";
import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";

export const neonInstaller: Installer = ({ projectDir }) => {
	const extrasDir = path.join(PKG_ROOT, "template/extras");

	addPackageDependency({
		dependencies: ["@neondatabase/serverless"],
		devDependencies: false,
		projectDir,
	});

	const configFile = path.join(extrasDir, "config/drizzle-config-neon.ts");
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
		"drizzle-with-neon.ts",
	);
	const jsandyDest = path.join(projectDir, "src/server/jsandy.ts");

	fs.ensureDirSync(path.dirname(configDest));
	fs.ensureDirSync(path.dirname(schemaDest));
	fs.ensureDirSync(path.dirname(jsandyDest));

	fs.copySync(configFile, configDest);
	fs.copySync(schemaSrc, schemaDest);
	fs.copySync(jsandySrc, jsandyDest);
};
