import type { Metadata } from "next";

export function constructMetadata({
	title = "JSandy - RPC Service Framework",
	description = "A cutting-edge RPC service framework built on top of Hono with WebSocket support",
	image = "/thumbnail.png",
}: {
	title?: string;
	description?: string;
	image?: string;
} = {}): Metadata {
	return {
		authors: [{ name: "JacobDevelops Team" }],
		creator: "JacobDevelops Team",
		description,
		icons: {
			apple: [
				{ sizes: "57x57", url: "/apple-icon-57x57.png" },
				{ sizes: "60x60", url: "/apple-icon-60x60.png" },
				{ sizes: "72x72", url: "/apple-icon-72x72.png" },
				{ sizes: "76x76", url: "/apple-icon-76x76.png" },
				{ sizes: "114x114", url: "/apple-icon-114x114.png" },
				{ sizes: "120x120", url: "/apple-icon-120x120.png" },
				{ sizes: "144x144", url: "/apple-icon-144x144.png" },
				{ sizes: "152x152", url: "/apple-icon-152x152.png" },
				{ sizes: "180x180", url: "/apple-icon-180x180.png" },
			],
			icon: [
				{ sizes: "16x16", type: "image/png", url: "/favicon-16x16.png" },
				{ sizes: "32x32", type: "image/png", url: "/favicon-32x32.png" },
				{ sizes: "96x96", type: "image/png", url: "/favicon-96x96.png" },
				{
					sizes: "192x192",
					type: "image/png",
					url: "/android-icon-192x192.png",
				},
			],
		},
		keywords: ["RPC", "WebSocket", "Hono", "TypeScript", "API", "Framework"],
		metadataBase: new URL("https://jsandy.com"),
		openGraph: {
			description,
			images: [
				{
					url: image,
				},
			],
			title,
		},
		other: {
			"msapplication-config": "/browserconfig.xml",
			"msapplication-TileColor": "#ffffff",
			"msapplication-TileImage": "/ms-icon-144x144.png",
			"theme-color": "#ffffff",
		},
		robots: {
			follow: true,
			index: true,
		},
		title,
		twitter: {
			card: "summary_large_image",
			creator: "@THEjacob1000",
			description,
			images: [image],
			title,
		},
	};
}
