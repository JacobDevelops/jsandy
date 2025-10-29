import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Inter } from "next/font/google";
import { constructMetadata } from "@/lib/metadata";

const inter = Inter({
	subsets: ["latin"],
});

export const metadata = constructMetadata({
	title: "JSandy - RPC Service Framework",
	description:
		"A cutting-edge RPC service framework built on top of Hono with WebSocket support",
});

export default function Layout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className={inter.className} suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">
				<RootProvider>{children}</RootProvider>
			</body>
		</html>
	);
}
