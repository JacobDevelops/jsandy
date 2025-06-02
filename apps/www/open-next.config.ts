import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// R2 is used for edge cache persistence
export default defineCloudflareConfig({
	incrementalCache: r2IncrementalCache,
});
