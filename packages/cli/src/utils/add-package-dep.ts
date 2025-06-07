import path from "node:path";
import {
	type AvailableDependencies,
	dependencyVersionMap,
} from "@/installers/dep-version-map";
import fs from "fs-extra";
import sortPackageJson from "sort-package-json";
import type { PackageJson } from "type-fest";

export const addPackageDependency = (opts: {
	dependencies: AvailableDependencies[];
	devDependencies: boolean;
	projectDir: string;
}) => {
	const { dependencies, devDependencies, projectDir } = opts;

	const pkgJson = fs.readJSONSync(
		path.join(projectDir, "package.json"),
	) as PackageJson;

	const mutablePkgJson = {
		...pkgJson,
		dependencies: pkgJson.dependencies ? { ...pkgJson.dependencies } : {},
		devDependencies: pkgJson.devDependencies
			? { ...pkgJson.devDependencies }
			: {},
	};

	for (const pkgName of dependencies) {
		const version = dependencyVersionMap[pkgName];
		if (devDependencies && mutablePkgJson.devDependencies) {
			mutablePkgJson.devDependencies[pkgName] = version;
		} else if (devDependencies) {
			mutablePkgJson.devDependencies = { [pkgName]: version };
		} else if (pkgJson.dependencies) {
			pkgJson.dependencies[pkgName] = version;
		} else {
			pkgJson.dependencies = { [pkgName]: version };
		}
	}
	const sortedPkgJson = sortPackageJson(mutablePkgJson);

	fs.writeJSONSync(path.join(projectDir, "package.json"), sortedPkgJson, {
		spaces: 2,
	});
};
