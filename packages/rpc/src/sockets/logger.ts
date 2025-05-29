export const logger = {
	info(message: string, ...args: unknown[]) {
		console.log(`[Socket] ℹ️ ${message}`, ...args);
	},

	error(message: string, error?: Error | unknown) {
		console.error(`[Socket] ❌ ${message}`, error || "");
	},

	debug(message: string, ...args: unknown[]) {
		console.log(`[Socket] 🔍 ${message}`, ...args);
	},

	warn(message: string, ...args: unknown[]) {
		console.warn(`[Socket] ⚠️ ${message}`, ...args);
	},

	success(message: string, ...args: unknown[]) {
		console.log(`[Socket] ✅ ${message}`, ...args);
	},
};
