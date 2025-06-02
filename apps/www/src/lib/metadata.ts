import type { Metadata } from "next";

export function constructMetadata({
	title = "JSandy - RPC Service Framework",
	description = "A cutting-edge RPC service framework built on top of Hono with WebSocket support",
	image = "/thumbnail.png",
	icons = "/favicon.ico",
}: {
	title?: string;
	description?: string;
	image?: string;
	icons?: string;
} = {}): Metadata {
	return {
		title,
		description,
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
		icons,
		metadataBase: new URL("https://jsandy.com"),
	};
}
