import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "JSandy - RPC Service Framework",
	description:
		"A cutting-edge RPC service framework built on top of Hono with WebSocket support",
	keywords: ["RPC", "WebSocket", "Hono", "TypeScript", "API", "Framework"],
	authors: [{ name: "JSandy Team" }],
	creator: "JSandy Team",
	openGraph: {
		title: "JSandy - RPC Service Framework",
		description:
			"A cutting-edge RPC service framework built on top of Hono with WebSocket support",
		type: "website",
		locale: "en_US",
		siteName: "JSandy",
	},
	twitter: {
		card: "summary_large_image",
		title: "JSandy - RPC Service Framework",
		description:
			"A cutting-edge RPC service framework built on top of Hono with WebSocket support",
	},
	robots: {
		index: true,
		follow: true,
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
			{ url: "/android-icon-192x192.png", sizes: "192x192", type: "image/png" },
		],
	},
	other: {
		"msapplication-TileColor": "#ffffff",
		"msapplication-TileImage": "/ms-icon-144x144.png",
		"theme-color": "#ffffff",
		"msapplication-config": "/browserconfig.xml",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={inter.className}>
				<Providers>
					<Navigation />
					<main>{children}</main>
				</Providers>
			</body>
		</html>
	);
}
