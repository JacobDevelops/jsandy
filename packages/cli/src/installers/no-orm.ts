import fs from "fs-extra";
import path from "node:path";

import type { Installer } from "./index";
import { PKG_ROOT } from "@/constants";

export const noOrmInstaller: Installer = ({ projectDir }) => {
	const extrasDir = path.join(PKG_ROOT, "template/extras");

	const routerSrc = path.join(extrasDir, "src/server/routers/post/base.ts");
	const routerDest = path.join(projectDir, "src/server/routers/post-router.ts");

	const jsandySrc = path.join(extrasDir, "src/server/jsandy", "base.ts");
	const jsandyDest = path.join(projectDir, "src/server/jsandy.ts");

	fs.ensureDirSync(path.dirname(routerDest));
	fs.ensureDirSync(path.dirname(jsandyDest));

	fs.copySync(routerSrc, routerDest);
	fs.copySync(jsandySrc, jsandyDest);
};
