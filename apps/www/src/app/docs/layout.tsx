import type { PropsWithChildren } from "react";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Star } from "lucide-react";
import { Suspense } from "react";

import { ShinyButton } from "@/components/shiny-button";
import { constructMetadata } from "@/lib/metadata";
import { Icons } from "@/components/icons";
import SearchBar from "@/components/search-bar";
import { TableOfContents } from "@/components/table-of-contents";
import { MobileNavigation } from "./mobile-nav";
import { DocNavigation } from "./doc-navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { MobileTableOfContents } from "@/components/mobile-table-of-contents";
import { ThemeToggle } from "@/components/theme-toggle";

export const revalidate = 3600;

export interface GitHubResponse {
	stargazers_count: number;
}

export const metadata = constructMetadata({
	title: "JSandy Docs - RPC Service Framework",
});

const getGitHubStars = unstable_cache(
	async () => {
		if (process.env.NODE_ENV === "development" && !process.env.GITHUB_TOKEN) {
			console.warn(
				"GITHUB_TOKEN not set in development, returning mock stars.",
			);
			return 500; // Mock stars for development if token is missing
		}
		if (!process.env.GITHUB_TOKEN) {
			console.error("GITHUB_TOKEN is not set. Cannot fetch GitHub stars.");
			return 0; // Or handle as an error appropriately
		}
		try {
			const response = await fetch(
				"https://api.github.com/repos/JacobDevelops/jsandy",
				{
					headers: {
						Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
						Accept: "application/vnd.github.v3+json",
					},
					next: {
						tags: ["github-stars"],
						revalidate: 60, // Revalidate every 60 seconds
					},
				},
			);
			if (!response.ok) {
				console.error(
					`GitHub API request failed: ${response.status} ${response.statusText}`,
				);
				const errorBody = await response.text();
				console.error("Error body:", errorBody);
				return 0; // Fallback or error indication
			}
			const data = (await response.json()) as GitHubResponse;
			return data.stargazers_count;
		} catch (error) {
			console.error("Failed to fetch GitHub stars:", error);
			return 0; // Fallback or error indication
		}
	},
	["github-stars"], // Cache key
	{
		revalidate: 60,
		tags: ["github-stars"],
	},
);

const DocsLayout = async ({ children }: PropsWithChildren) => {
	const stars = await getGitHubStars();

	return (
		<div className="relative min-h-screen w-full max-w-8xl mx-auto">
			{/* Header: sticky, spans full width, themed background and border */}
			<header
				className={cn(
					"fixed top-0 z-40 w-full border-b supports-[backdrop-filter]:bg-background/60",
					"border-border bg-background/95 backdrop-blur",
					"max-w-8xl",
				)}
			>
				<div className="grid grid-cols-1 lg:grid-cols-[256px_1fr] xl:grid-cols-[256px_1fr_256px] mx-auto">
					{/* Left Header Section (Logo Area) */}
					<div className="h-16 flex items-center justify-between gap-4 px-6 lg:px-4 border-r border-border">
						<Link
							href="/"
							aria-label="Home"
							className="flex items-center gap-2"
						>
							<Image
								src="/logo.png"
								height={512}
								width={512}
								alt="JSandy Logo"
								className="h-6 w-6 text-sand-600 dark:text-sand-400"
							/>
							<div className="flex items-baseline gap-1.5">
								<p className="font-semibold tracking-tight text-foreground">
									JSandy
								</p>
								<p className="text-sm text-muted-foreground">docs</p>
							</div>
						</Link>
						<div className="lg:hidden">
							<SearchBar />
						</div>
					</div>
					{/* Middle Header Section (Search & Actions) */}
					<div className="h-16 px-6 sm:px-8 flex items-center justify-between border-r border-border">
						{/* Desktop Search and GitHub Stars */}
						<div className="hidden lg:flex h-full w-full items-center justify-between gap-4">
							<SearchBar />
							<ShinyButton
								href="https://github.com/JacobDevelops/jsandy"
								target="_blank"
								rel="noopener noreferrer"
								className="group text-sm" // Internal ShinyButton styles will handle text color
							>
								<Icons.github className="size-4 shrink-0 mr-2" />
								Star on GitHub
								<Star className="size-4 shrink-0 fill-sand-400 dark:fill-sand-500 group-hover:fill-sand-500 dark:group-hover:fill-sand-400 transition-colors stroke-transparent ml-2" />
								<span className="ml-1.5">
									{typeof stars === "number" ? stars.toLocaleString() : stars}
								</span>
							</ShinyButton>
						</div>

						{/* Mobile Header Actions */}
						<div className="flex lg:hidden h-full w-full pr-10 items-center justify-between">
							<MobileNavigation />
							<MobileTableOfContents />
						</div>
					</div>
					{/* Right Header Section (Placeholder) */}
					<div className="h-16 hidden xl:flex items-center justify-start pl-8">
						<ThemeToggle />
					</div>
					{/*Kept structure, ensure border if needed*/}
				</div>
			</header>

			{/* Main Content Grid */}
			<div className="relative h-full grid grid-cols-1 lg:grid-cols-[256px_1fr] xl:grid-cols-[256px_1fr_256px] pt-16">
				{/* Left Sidebar: Documentation Navigation */}
				<nav className="relative hidden lg:block border-r border-border">
					<div
						className={cn(
							"fixed top-16 h-[calc(100vh-4rem)] w-[calc(16rem)] overflow-y-auto pr-4 pb-8 pt-4", // Adjusted w- to match 256px, added padding
							"scrollbar-thin scrollbar-thumb-sand-300 dark:scrollbar-thumb-sand-600 scrollbar-track-transparent hover:scrollbar-thumb-sand-400 dark:hover:scrollbar-thumb-sand-500",
						)}
					>
						<DocNavigation className="py-4 pl-2" />
					</div>
				</nav>

				{/* Main Content Area */}
				<main className="w-full h-full bg-sand-50/30 dark:bg-sand-900/10 border-r border-border">
					{/* Max width container for content, with padding top for fixed header */}
					<div className="max-w-3xl w-full mx-auto px-6 sm:px-8 py-8 lg:py-10">
						<Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
					</div>
				</main>

				{/* Right Sidebar: Table of Contents */}
				<nav className="relative hidden xl:block px-4">
					<div className="sticky top-[calc(4rem+2.5rem)] h-[calc(100vh-4rem-2.5rem)] overflow-y-auto pt-10 pb-8">
						{" "}
						{/* Adjusted top for header + spacing */}
						<TableOfContents />
					</div>
				</nav>
			</div>
		</div>
	);
};

export default DocsLayout;
