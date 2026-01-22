import path from "node:path";

// With the move to TSUP as a build tool, this keeps path routes in other files (installers, loaders, etc) in check more easily.
// Path is in relation to a single index.js file inside ./dist
const __filename = import.meta.filename ?? "";
const distPath = path.dirname(__filename);

export const PKG_ROOT = path.join(distPath, "../");

export { GITIGNORE_CONTENTS } from "./gitignore";
export { BASE_PACKAGE_JSON } from "./packageJson";
