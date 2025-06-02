import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { Providers } from "@/components/providers";
import { constructMetadata } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata = constructMetadata({
	title: "JSandy - RPC Service Framework",
	description:
		"A cutting-edge RPC service framework built on top of Hono with WebSocket support",
});

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
