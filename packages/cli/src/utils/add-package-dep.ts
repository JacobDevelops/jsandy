import path from "node:path";
import fs from "fs-extra";
import sortPackageJson from "sort-package-json";
import type { PackageJson } from "type-fest";
import {
	type AvailableDependencies,
	dependencyVersionMap,
} from "@/installers/dep-version-map";

export const addPackageDependency = (opts: {
	dependencies: AvailableDependencies[];
	devDependencies: boolean;
	projectDir: string;
}) => {
	const { dependencies, devDependencies, projectDir } = opts;

	const pkgJson = structuredClone(
		fs.readJSONSync(path.join(projectDir, "package.json")),
	) as PackageJson;

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

	fs.writeJSONSync(path.join(projectDir, "package.json"), sortedPkgJson, {
		spaces: 2,
	});
};
