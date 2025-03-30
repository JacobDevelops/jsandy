import { dirname, join, resolve } from "node:path";
import type { StorybookConfig } from "@storybook/react-webpack5";
import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
	return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		getAbsolutePath("@storybook/addon-webpack5-compiler-swc"),
		getAbsolutePath("@storybook/addon-onboarding"),
		getAbsolutePath("@storybook/addon-links"),
		getAbsolutePath("@storybook/addon-essentials"),
		getAbsolutePath("@storybook/addon-interactions"),
	],
	framework: {
		name: getAbsolutePath("@storybook/react-webpack5"),
		options: {},
	},
	swc: () => ({
		jsc: {
			transform: {
				react: {
					runtime: "automatic",
				},
			},
		},
	}),
	webpackFinal: async (webpackConfig) => {
		// biome-ignore lint/style/noNonNullAssertion: We know this exists
		webpackConfig.resolve!.plugins = [
			// biome-ignore lint/style/noNonNullAssertion: We know this exists
			...(webpackConfig.resolve!.plugins || []),
			new TsconfigPathsPlugin(),
		];
		// biome-ignore lint/style/noNonNullAssertion: We know this exists
		webpackConfig.resolve!.alias = {
			// biome-ignore lint/style/noNonNullAssertion: We know this exists
			...(webpackConfig.resolve!.alias || {}),
			"@/storybook": resolve(__dirname, "."),
		};

		return webpackConfig;
	},
};
export default config;
