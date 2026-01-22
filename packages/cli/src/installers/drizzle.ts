import path from "node:path";

import type { PackageJson } from "type-fest";

import { PKG_ROOT } from "@/constants";
import type { Installer } from "@/installers/index";
import { addPackageDependency } from "@/utils/add-package-dep";

export const drizzleInstaller: Installer = async ({
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
	await addPackageDependency({
		dependencies: devDependencies,
		devDependencies: true,
		projectDir,
	});
	await addPackageDependency({
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
	const packageJsonContent = (await Bun.file(
		packageJsonPath,
	).json()) as PackageJson;
	packageJsonContent.scripts = {
		...packageJsonContent.scripts,
		"db:generate": "drizzle-kit generate",
		"db:migrate": "drizzle-kit migrate",
		"db:push": "drizzle-kit push",
		"db:studio": "drizzle-kit studio",
	};
	const selectedEnvSrc =
		databaseProvider === "vercel-postgres" ? vercelPostgresEnvSrc : envSrc;

	await Bun.write(routerDest, Bun.file(routerSrc));
	await Bun.write(envDest, Bun.file(selectedEnvSrc));

	// Also create .env.example with the same content
	await Bun.write(
		path.join(projectDir, ".env.example"),
		Bun.file(selectedEnvSrc),
	);

	await Bun.write(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
};
