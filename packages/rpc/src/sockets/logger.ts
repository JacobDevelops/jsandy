export const logger = {
	debug(message: string, ...args: unknown[]) {
		console.log(`[Socket] 🔍 ${message}`, ...args);
	},

	error(message: string, error?: Error | unknown) {
		console.error(`[Socket] ❌ ${message}`, error || "");
	},
	info(message: string, ...args: unknown[]) {
		console.log(`[Socket] ℹ️ ${message}`, ...args);
	},

	success(message: string, ...args: unknown[]) {
		console.log(`[Socket] ✅ ${message}`, ...args);
	},

	warn(message: string, ...args: unknown[]) {
		console.warn(`[Socket] ⚠️ ${message}`, ...args);
	},
};
