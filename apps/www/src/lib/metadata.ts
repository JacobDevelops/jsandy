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
		title,
		description,
		keywords: ["RPC", "WebSocket", "Hono", "TypeScript", "API", "Framework"],
		authors: [{ name: "JacobDevelops Team" }],
		creator: "JacobDevelops Team",
		openGraph: {
			title,
			description,
			images: [
				{
					url: image,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [image],
			creator: "@THEjacob1000",
		},
		icons: {
			apple: [
				{ url: "/apple-icon-57x57.png", sizes: "57x57" },
				{ url: "/apple-icon-60x60.png", sizes: "60x60" },
				{ url: "/apple-icon-72x72.png", sizes: "72x72" },
				{ url: "/apple-icon-76x76.png", sizes: "76x76" },
				{ url: "/apple-icon-114x114.png", sizes: "114x114" },
				{ url: "/apple-icon-120x120.png", sizes: "120x120" },
				{ url: "/apple-icon-144x144.png", sizes: "144x144" },
				{ url: "/apple-icon-152x152.png", sizes: "152x152" },
				{ url: "/apple-icon-180x180.png", sizes: "180x180" },
			],
			icon: [
				{ url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
				{ url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
				{ url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
				{
					url: "/android-icon-192x192.png",
					sizes: "192x192",
					type: "image/png",
				},
			],
		},
		robots: {
			index: true,
			follow: true,
		},
		metadataBase: new URL("https://jsandy.com"),
		other: {
			"msapplication-TileColor": "#ffffff",
			"msapplication-TileImage": "/ms-icon-144x144.png",
			"theme-color": "#ffffff",
			"msapplication-config": "/browserconfig.xml",
		},
	};
}
