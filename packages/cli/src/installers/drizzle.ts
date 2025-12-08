import path from "node:path";
import fs from "fs-extra";
import type { PackageJson } from "type-fest";

import { PKG_ROOT } from "@/constants";
import type { Installer } from "@/installers/index";
import { addPackageDependency } from "@/utils/add-package-dep";

export const drizzleInstaller: Installer = ({
	projectDir,
	databaseProvider,
	linter,
}) => {
	const devDependencies: ("drizzle-kit" | "eslint-plugin-drizzle")[] = [
		"drizzle-kit",
	];
	if (linter === "eslint") {
		devDependencies.push("eslint-plugin-drizzle");
	}
	addPackageDependency({
		dependencies: devDependencies,
		devDependencies: true,
		projectDir,
	});
	addPackageDependency({
		dependencies: ["drizzle-orm"],
		devDependencies: false,
		projectDir,
	});

	const extrasDir = path.join(PKG_ROOT, "template/extras");
	const routerSrc = path.join(
		extrasDir,
		"src/server/routers/post/with-drizzle.ts",
	);
	const routerDest = path.join(projectDir, "src/server/routers/post-router.ts");
	const envSrc = path.join(extrasDir, "config/_env-drizzle");
	const vercelPostgresEnvSrc = path.join(
		extrasDir,
		"config/_env-drizzle-vercel-postgres",
	);
	const envDest = path.join(projectDir, ".env");
	// add db:* scripts to package.json
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJsonContent = fs.readJSONSync(packageJsonPath) as PackageJson;
	packageJsonContent.scripts = {
		...packageJsonContent.scripts,
		"db:generate": "drizzle-kit generate",
		"db:migrate": "drizzle-kit migrate",
		"db:push": "drizzle-kit push",
		"db:studio": "drizzle-kit studio",
	};
	if (!fs.existsSync(routerSrc)) {
		// Verify source files exist
		throw new Error(`Router template not found: ${routerSrc}`);
	}
	const selectedEnvSrc =
		databaseProvider === "vercel-postgres" ? vercelPostgresEnvSrc : envSrc;
	if (!fs.existsSync(selectedEnvSrc)) {
		throw new Error(`Environment template not found: ${selectedEnvSrc}`);
	}
	try {
		fs.copySync(routerSrc, routerDest);
		fs.copySync(
			databaseProvider === "vercel-postgres" ? vercelPostgresEnvSrc : envSrc,
			envDest,
		);
	} catch (error) {
		throw new Error(
			`Failed to copy Drizzle template files: ${(error as Error).message}`,
		);
	}

	fs.writeJSONSync(packageJsonPath, packageJsonContent, {
		spaces: 2,
	});
};
