import { mkdir } from "node:fs/promises";
import path from "node:path";

import { PKG_ROOT } from "@/constants";
import { addPackageDependency } from "@/utils/add-package-dep";
import type { Installer } from "./index";

export const planetscaleInstaller: Installer = async ({ projectDir }) => {
	const extrasDir = path.join(PKG_ROOT, "template/extras");

	await addPackageDependency({
		dependencies: ["@planetscale/database"],
		devDependencies: false,
		projectDir,
	});

	const configFile = path.join(
		extrasDir,
		"config/drizzle-config-planetscale.ts",
	);
	const configDest = path.join(projectDir, "drizzle.config.ts");

	const schemaSrc = path.join(
		extrasDir,
		"src/server/db/drizzle",
		"with-mysql.ts",
	);
	const schemaDest = path.join(projectDir, "src/server/db/schema.ts");

	const jsandySrc = path.join(
		extrasDir,
		"src/server/jsandy",
		"drizzle-with-planetscale.ts",
	);
	const jsandyDest = path.join(projectDir, "src/server/jsandy.ts");

	await mkdir(path.dirname(configDest), { recursive: true });
	await mkdir(path.dirname(schemaDest), { recursive: true });
	await mkdir(path.dirname(jsandyDest), { recursive: true });

	await Bun.write(configDest, Bun.file(configFile));
	await Bun.write(schemaDest, Bun.file(schemaSrc));
	await Bun.write(jsandyDest, Bun.file(jsandySrc));
};
