"use client";

import type { Doc } from "content-collections";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useDocNavigation } from "../doc-navigation";
import { cn } from "@/lib/utils";

export function flattenNestedDocs<T extends DocNav>(nestedArray: T[][]): T[] {
	return nestedArray.reduce((acc, curr) => acc.concat(curr), []);
}

type DocNav = {
	title: string;
	_meta: {
		filePath: string;
		fileName: string;
		directory: string;
		path: string;
		extension: string;
	};
};

export function DocsPager({ page }: { page: Doc }) {
	const { sortedCategories } = useDocNavigation();

	const categorizedDocs: DocNav[][] = sortedCategories.map(([_, docs]) =>
		docs.map((doc) => ({
			title: doc.title,
			_meta: doc._meta,
		})),
	);

	const flatDocsList = flattenNestedDocs(categorizedDocs);

	const currentPageIndex = flatDocsList.findIndex(
		(item) => item._meta.path === page._meta.path,
	);

	const prevPage =
		currentPageIndex > 0 ? flatDocsList[currentPageIndex - 1] : null;
	const nextPage =
		currentPageIndex !== -1 && currentPageIndex < flatDocsList.length - 1
			? flatDocsList[currentPageIndex + 1]
			: null;

	return (
		<nav className="grid grid-cols-1 sm:grid-cols-2 gap-4 !mt-10">
			<NavigationButton type="prev" item={prevPage} />
			<NavigationButton type="next" item={nextPage} />
		</nav>
	);
}

type NavigationButtonProps = {
	item: DocNav | null;
	type: "prev" | "next";
};

const NavigationButton = ({ item, type }: NavigationButtonProps) => {
	if (!item) {
		return <div className="hidden sm:block" />;
	}
	const Icon = type === "next" ? ArrowRight : ArrowLeft;
	return (
		<Link
			href={`/docs/${item._meta.path}`}
			className={cn(
				"flex w-full flex-col gap-2 rounded-lg p-4 text-sm transition-all duration-200 ease-in-out",
				"border border-border",
				"bg-card",
				"hover:bg-muted hover:shadow-md",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
				type === "next" ? "sm:col-start-2" : "sm:col-start-1",
			)}
		>
			<span
				className={cn("flex items-center gap-2 text-primary font-medium", {
					"flex-row-reverse self-end": type === "next",
					"self-start": type === "prev",
				})}
			>
				<Icon className="size-4" />
				<span className="capitalize">{type}</span>
			</span>
			<span
				className={cn("text-card-foreground font-semibold", {
					"text-right": type === "next",
					"text-left": type === "prev",
				})}
			>
				{item.title}
			</span>
		</Link>
	);
};
