import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PKG_ROOT } from "@/constants";
import type { Installer } from "./index";

export const noOrmInstaller: Installer = async ({ projectDir }) => {
	const extrasDir = path.join(PKG_ROOT, "template/extras");

	const routerSrc = path.join(extrasDir, "src/server/routers/post/base.ts");
	const routerDest = path.join(projectDir, "src/server/routers/post-router.ts");

	const jsandySrc = path.join(extrasDir, "src/server/jsandy", "base.ts");
	const jsandyDest = path.join(projectDir, "src/server/jsandy.ts");

	await mkdir(path.dirname(routerDest), { recursive: true });
	await mkdir(path.dirname(jsandyDest), { recursive: true });

	// Copy files using Bun
	await Bun.write(routerDest, Bun.file(routerSrc));
	await Bun.write(jsandyDest, Bun.file(jsandySrc));
};
