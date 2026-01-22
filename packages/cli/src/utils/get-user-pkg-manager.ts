import { detectPackageManagerFromLockfile } from "./monorepo-detection";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

export const getUserPkgManager: () => PackageManager = () => {
	// First check for lockfiles in the current directory and parent directories
	// This is more reliable than the user agent, especially in monorepos
	const lockfileDetected = detectPackageManagerFromLockfile(process.cwd());
	if (lockfileDetected) {
		return lockfileDetected;
	}

	// Fall back to checking the user agent from the command used to run the CLI
	const userAgent = process.env.npm_config_user_agent;

	if (userAgent) {
		if (userAgent.startsWith("yarn")) {
			return "yarn";
		}
		if (userAgent.startsWith("pnpm")) {
			return "pnpm";
		}
		if (userAgent.startsWith("bun")) {
			return "bun";
		}
	}

	// Default to npm if nothing else is detected
	return "npm";
};
