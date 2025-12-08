import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
	bundler: "webpack", // OpenNext/Cloudflare doesn't support Turbopack yet
	reactStrictMode: true,
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

export default withMDX(config);
