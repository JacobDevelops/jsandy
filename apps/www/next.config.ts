import { withContentCollections } from "@content-collections/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		// Enable CSS inlining for performance - monitor for any SSR issues
		inlineCss: true,
	},
	redirects: async () => {
		return [
			{
				source: "/docs",
				destination: "/docs/getting-started/first-steps",
				permanent: true,
			},
		];
	},
};

export default withContentCollections(nextConfig);
