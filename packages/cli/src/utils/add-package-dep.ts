import path from "node:path";
import sortPackageJson from "sort-package-json";
import type { PackageJson } from "type-fest";
import {
	type AvailableDependencies,
	dependencyVersionMap,
} from "@/installers/dep-version-map";

export const addPackageDependency = async (opts: {
	dependencies: AvailableDependencies[];
	devDependencies: boolean;
	projectDir: string;
}) => {
	const { dependencies, devDependencies, projectDir } = opts;

	const packageJsonPath = path.join(projectDir, "package.json");
	const pkgJson = (await Bun.file(packageJsonPath).json()) as PackageJson;

	for (const pkgName of dependencies) {
		const version = dependencyVersionMap[pkgName];
		if (devDependencies && pkgJson.devDependencies) {
			pkgJson.devDependencies[pkgName] = version;
		} else if (devDependencies) {
			pkgJson.devDependencies = { [pkgName]: version };
		} else if (pkgJson.dependencies) {
			pkgJson.dependencies[pkgName] = version;
		} else {
			pkgJson.dependencies = { [pkgName]: version };
		}
	}

	const sortedPkgJson = sortPackageJson(pkgJson);

	await Bun.write(packageJsonPath, JSON.stringify(sortedPkgJson, null, 2));
};
