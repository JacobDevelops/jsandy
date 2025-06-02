"use client";

import { useTableOfContents } from "@/hooks/use-table-of-contents"; // Assuming this hook exists
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slugify";
import Link from "next/link";
import { type HTMLAttributes, useCallback, useEffect } from "react";

interface TableOfContentsProps extends HTMLAttributes<HTMLDivElement> {
	onLinkClick?: () => void;
}

export const TableOfContents = ({
	className,
	onLinkClick,
	...props
}: TableOfContentsProps) => {
	const visibleSections = useTableOfContents((state) => state.visibleSections);
	const allHeadings = useTableOfContents((state) => state.allHeadings);
	const setVisibleSections = useTableOfContents(
		(state) => state.setVisibleSections,
	);

	useEffect(() => {
		if (!allHeadings || allHeadings.length === 0) return;

		if (allHeadings.length > 0 && visibleSections.length === 0) {
			const firstHeadingSlug = slugify(allHeadings[0].text);
			if (firstHeadingSlug) {
				setVisibleSections([firstHeadingSlug]);
			}
		}
	}, [allHeadings, visibleSections, setVisibleSections]);

	const handleClick = useCallback(
		(headingText: string) => {
			const slug = slugify(headingText);
			if (slug) {
				setVisibleSections([slug]);
			}
		},
		[setVisibleSections],
	);

	if (!allHeadings || allHeadings.length === 0) {
		return (
			<div className={cn("text-sm", className)} {...props}>
				<p className="font-medium text-muted-foreground pl-1">
					No sections on this page.
				</p>
			</div>
		);
	}

	return (
		<div className={cn("text-sm", className)} {...props}>
			<p className="font-semibold text-sand-700 dark:text-sand-300 mb-3">
				On this page
			</p>
			<ul className="space-y-2">
				{allHeadings.map((heading) => {
					const slug = slugify(heading.text);
					if (!slug) return null;
					const isVisible = visibleSections.includes(slug);

					return (
						<li
							key={slug}
							className={cn("leading-relaxed", `ml-${(heading.level - 2) * 3}`)}
						>
							{" "}
							{/* Indent based on heading level */}
							<Link
								href={`#${slug}`}
								onClick={() => {
									handleClick(heading.text);
									onLinkClick?.();
								}}
								className={cn(
									"block border-l-2 pl-3 py-0.5 transition-colors",
									isVisible
										? "border-sand-500 dark:border-sand-400 text-sand-700 dark:text-sand-300 font-medium"
										: "border-transparent text-muted-foreground hover:text-foreground hover:border-sand-300 dark:hover:border-sand-600",
								)}
							>
								{heading.text}
							</Link>
						</li>
					);
				})}
			</ul>
		</div>
	);
};
