"use client";

import { DOCS_CONFIG } from "@/config";
import { allDocs } from "content-collections";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function useDocNavigation() {
	const pathname = usePathname();

	const docsByCategory = Object.entries(DOCS_CONFIG.categories).reduce(
		(acc, [category, config]) => {
			const categoryDocs = allDocs.filter(
				(doc) => doc._meta.path.split("/")[0] === category,
			);
			const sortedDocs = categoryDocs.sort((a, b) => {
				const aIndex = config.items.indexOf(
					a._meta.path.split("/")[1] as string,
				);
				const bIndex = config.items.indexOf(
					b._meta.path.split("/")[1] as string,
				);
				return aIndex - bIndex;
			});
			acc[category] = sortedDocs;
			return acc;
		},
		{} as Record<string, typeof allDocs>,
	);

	const sortedCategories = Object.entries(docsByCategory).sort(([a], [b]) => {
		const aOrder =
			DOCS_CONFIG.categories[a as keyof typeof DOCS_CONFIG.categories]?.order ??
			Number.POSITIVE_INFINITY;
		const bOrder =
			DOCS_CONFIG.categories[b as keyof typeof DOCS_CONFIG.categories]?.order ??
			Number.POSITIVE_INFINITY;
		return aOrder - bOrder;
	});

	const isActiveLink = (path: string) => pathname === `/docs/${path}`;

	return {
		sortedCategories,
		isActiveLink,
	};
}

interface DocNavigationProps {
	onLinkClick?: () => void;
	className?: string;
}

export function DocNavigation({ onLinkClick, className }: DocNavigationProps) {
	const { sortedCategories, isActiveLink } = useDocNavigation();

	return (
		<nav className={cn("space-y-6", className)}>
			{sortedCategories.map(([category, docs], index) => (
				<div key={category}>
					{index > 0 && <div className="h-px bg-border my-6" />}
					<h2 className="px-4 text-sm font-semibold tracking-tight text-sand-600 dark:text-sand-400 uppercase mb-3">
						{DOCS_CONFIG.categories[
							category as keyof typeof DOCS_CONFIG.categories
						]?.title || category.replace(/-/g, " ")}
					</h2>
					<ul className="space-y-1">
						{docs.map((doc) => (
							<li key={doc._meta.path}>
								<Link
									href={`/docs/${doc._meta.path}`}
									onClick={onLinkClick}
									className={cn(
										"block px-4 py-1.5 rounded-md text-sm transition-colors",
										isActiveLink(doc._meta.path)
											? "font-medium bg-sand-100 dark:bg-sand-800 text-sand-700 dark:text-sand-200"
											: "text-muted-foreground hover:text-foreground hover:bg-sand-50 dark:hover:bg-sand-800/50",
									)}
								>
									{doc.title}
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}
