interface DocsCategoryConfig {
	title: string;
	emoji: string;
	order: number;
	items: string[];
}

interface DocsConfig {
	categories: Record<string, DocsCategoryConfig>;
}

export const DOCS_CONFIG: DocsConfig = {
	categories: {
		introduction: {
			title: "Introduction",
			emoji: "🐥",
			order: 1,
			items: ["why-jsandy", "key-features"],
		},
		"getting-started": {
			title: "Getting Started",
			emoji: "👷‍♂️",
			order: 2,
			items: ["first-steps", "local-development", "environment-variables"],
		},
		backend: {
			title: "Backend",
			emoji: "⚙️",
			order: 3,
			items: [
				"app-router",
				"routers",
				"procedures",
				"api-client",
				"middleware",
				"websockets",
				"performance",
				"open-api",
			],
		},
		deploy: {
			title: "Deploy",
			emoji: "💻",
			order: 4,
			items: ["vercel", "cloudflare"],
		},
	},
};
