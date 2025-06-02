"use client";

import type React from "react";

import {
	Dialog,
	DialogContent,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this hook exists
// import { client } from "@/lib/client"; // Assuming this RPC client exists
// import type { InferOutput } from "@/server"; // Assuming this type exists
import { cn } from "@/lib/utils";
import type { SearchMetadata } from "@/types"; // Assuming this type exists
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	useEffect,
	useRef,
	useState,
	type KeyboardEvent,
	Fragment,
} from "react";

// Mock client and types for demonstration as they are project-specific
const client = {
	search: {
		byQuery: {
			$get: async ({ query }: { query: string }) => {
				console.log("Searching for:", query);
				// Simulate API call
				await new Promise((resolve) => setTimeout(resolve, 300));
				const mockResults = [
					{
						id: "getting-started/introduction",
						metadata: {
							title: "Introduction",
							path: "getting-started/introduction",
							level: 1,
							type: "doc",
							content:
								"Welcome to JSandy! This document provides a brief overview...",
							documentTitle: "Introduction to JSandy",
						},
					},
					{
						id: "getting-started/installation",
						metadata: {
							title: "Installation Guide",
							path: "getting-started/installation",
							level: 1,
							type: "doc",
							content: "Getting JSandy up and running is straightforward...",
							documentTitle: "Installation",
						},
					},
					{
						id: "core-concepts/routing",
						metadata: {
							title: "Routing Details",
							path: "core-concepts/routing",
							level: 2,
							type: "doc",
							content: "JSandy provides a flexible routing system...",
							documentTitle: "Routing in JSandy",
						},
					},
				].filter(
					(doc) =>
						doc.metadata.title.toLowerCase().includes(query.toLowerCase()) ||
						doc.metadata.content.toLowerCase().includes(query.toLowerCase()) ||
						doc.metadata.documentTitle
							.toLowerCase()
							.includes(query.toLowerCase()),
				);
				return {
					json: async () => mockResults,
				};
			},
		},
	},
};
type SearchOutput = Awaited<
	ReturnType<typeof client.search.byQuery.$get>
>["json"] extends () => Promise<infer T>
	? T
	: never;
// End mock

const SearchBar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const resultsRef = useRef<HTMLUListElement>(null);
	const queryClient = useQueryClient();
	const router = useRouter();

	const debouncedSearchTerm = useDebounce(searchTerm, 150);
	const prevResultsRef = useRef<SearchOutput>([]);

	const { data: results, isRefetching } = useQuery({
		queryKey: ["search", debouncedSearchTerm],
		queryFn: async () => {
			if (!debouncedSearchTerm) return [];
			const res = await client.search.byQuery.$get({
				query: debouncedSearchTerm,
			});
			const newResults = await res.json();
			prevResultsRef.current = newResults;
			return newResults;
		},
		initialData: [],
		enabled: debouncedSearchTerm.length > 0,
		placeholderData: () => prevResultsRef.current,
	});

	const displayedResults = isRefetching ? prevResultsRef.current : results;

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prevIndex) =>
					prevIndex < (displayedResults?.length ?? 0) - 1
						? prevIndex + 1
						: prevIndex,
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : -1));
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0 && displayedResults?.[selectedIndex]?.metadata) {
					const selectedResult = displayedResults[selectedIndex];
					// Ensure metadata and id are present before calling handleResultClick
					if (selectedResult.metadata && selectedResult.id) {
						handleResultClick({
							id: selectedResult.id.toString(),
							title: selectedResult.metadata.title,
							path: selectedResult.metadata.path,
							level: selectedResult.metadata.level,
							type: selectedResult.metadata.type,
							content: selectedResult.metadata.content,
							documentTitle: selectedResult.metadata.documentTitle,
						});
					}
				}
				break;
			case "Escape":
				e.preventDefault();
				closeSearch();
				break;
		}
	};

	const handleResultClick = (result: SearchMetadata & { id: string }) => {
		router.push(`/docs/${result.path}`); // Use path for navigation
		closeSearch();
	};

	const closeSearch = () => {
		setSearchTerm("");
		setIsOpen(false);
		setSelectedIndex(-1);
	};

	useEffect(() => {
		if (isOpen && resultsRef.current) {
			const selectedElement = resultsRef.current.children[
				selectedIndex
			] as HTMLElement;
			if (selectedElement) {
				selectedElement.scrollIntoView({ block: "nearest" });
			}
		}
	}, [selectedIndex, isOpen]);

	const highlightMatches = (text: string, query: string): React.ReactNode[] => {
		if (!query.trim() || !text) return [text];

		const searchWords = query
			.trim()
			.toLowerCase()
			.split(/\s+/)
			.filter((word) => word.length >= 2); // Allow shorter words for highlighting
		if (searchWords.length === 0) return [text];

		// Create a regex that matches any of the search words, case-insensitive
		// Also capture delimiters to preserve them
		const regex = new RegExp(
			`(${searchWords.join("|")})|([\\s.,!?;():"'])`,
			"gi",
		);
		const parts = text.split(regex).filter(Boolean); // Split and remove empty strings

		return parts.map((part, index) => {
			const partLower = part.toLowerCase();
			let isMatch = false;
			for (const searchWord of searchWords) {
				if (partLower === searchWord) {
					// Exact word match
					isMatch = true;
					break;
				}
				// Check for substring match if Levenshtein is not used or as a fallback
				if (
					partLower.includes(searchWord) &&
					part.length > searchWord.length &&
					searchWord.length > 1
				) {
					isMatch = true; // Consider it a potential match for highlighting
					break;
				}
			}

			if (isMatch) {
				return (
					<mark
						key={index}
						className="bg-sand-500/30 dark:bg-sand-400/30 text-sand-700 dark:text-sand-300 px-0.5 rounded-sm"
					>
						{part}
					</mark>
				);
			}
			// Levenshtein check for close matches (can be computationally intensive for many parts)
			// For simplicity, we'll stick to exact/substring matches for now in this direct mapping.
			// A more advanced approach would tokenize words first.
			return <Fragment key={index}>{part}</Fragment>;
		});
	};

	const getContextAroundMatch = (content: string, query: string) => {
		if (!content || !query.trim())
			return content.slice(0, 200) + (content.length > 200 ? "..." : "");

		const searchWords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
		if (searchWords.length === 0)
			return content.slice(0, 200) + (content.length > 200 ? "..." : "");

		const windowSize = 150;
		const bestScore = -1; // Initialize to -1 to ensure any match is better
		let bestMatchIndex = -1;

		// Find the first occurrence of any search word
		for (const word of searchWords) {
			const index = content.toLowerCase().indexOf(word);
			if (index !== -1) {
				if (bestMatchIndex === -1 || index < bestMatchIndex) {
					bestMatchIndex = index;
				}
			}
		}

		if (bestMatchIndex === -1) {
			// No match found
			return (
				content.slice(0, windowSize) +
				(content.length > windowSize ? "..." : "")
			);
		}

		const start = Math.max(0, bestMatchIndex - Math.floor(windowSize / 3));
		const end = Math.min(
			content.length,
			bestMatchIndex + Math.floor((2 * windowSize) / 3),
		);

		let excerpt = content.slice(start, end).trim();

		if (start > 0) excerpt = `...${excerpt}`;
		if (end < content.length) excerpt = `${excerpt}...`;

		return excerpt;
	};

	const renderMarkdownContent = (content: string): React.ReactNode[] => {
		const patterns = [
			{
				// Code blocks (simplified)
				regex: /```(?:.*\n)?([\s\S]*?)```/g,
				render: (_: string, code: string) => (
					<code
						key={`cb-${code.slice(0, 10)}`}
						className="font-mono text-xs p-1 bg-sand-100 dark:bg-sand-800 text-sand-700 dark:text-sand-300 rounded whitespace-pre-wrap block my-1"
					>
						{code.trim()}
					</code>
				),
			},
			{
				// Inline code
				regex: /`([^`]+)`/g,
				render: (_: string, code: string) => (
					<code
						key={`ic-${code}`}
						className="font-mono text-xs px-1 py-0.5 bg-sand-100 dark:bg-sand-800 text-sand-700 dark:text-sand-300 rounded"
					>
						{code}
					</code>
				),
			},
			{
				// Links (text only)
				regex: /\[([^\]]+)\]$$(?:[^)]+)$$/g,
				render: (_: string, text: string) => (
					<span
						key={`link-${text}`}
						className="text-sand-600 dark:text-sand-400 underline underline-offset-2"
					>
						{text}
					</span>
				),
			},
			{
				// Bold
				regex: /\*\*([^*]+)\*\*/g,
				render: (_: string, text: string) => (
					<strong
						key={`bold-${text}`}
						className="font-semibold text-foreground"
					>
						{text}
					</strong>
				),
			},
			{
				// Italics
				regex: /_([^_]+)_/g, // Simpler italic regex
				render: (_: string, text: string) => (
					<em key={`italic-${text}`} className="italic">
						{text}
					</em>
				),
			},
		];

		let elements: (string | React.ReactNode)[] = [content];

		for (const { regex, render } of patterns) {
			elements = elements.flatMap((element, i) => {
				if (typeof element !== "string")
					return <Fragment key={i}>{element}</Fragment>;

				const parts: (string | React.ReactNode)[] = [];
				let lastIndex = 0;
				let match;

				// Reset lastIndex for global regex on each new element part
				regex.lastIndex = 0;

				while ((match = regex.exec(element)) !== null) {
					if (match.index > lastIndex) {
						parts.push(element.slice(lastIndex, match.index));
					}
					// @ts-expect-error tuple error for render arguments
					parts.push(render(...match));
					lastIndex = regex.lastIndex;
				}

				if (lastIndex < element.length) {
					parts.push(element.slice(lastIndex));
				}
				return parts.map((p, idx) => (
					<Fragment key={`${i}-${idx}`}>{p}</Fragment>
				));
			});
		}
		return elements.map((el, i) => (
			<Fragment key={`final-${i}`}>{el}</Fragment>
		));
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				setIsOpen(open);
				if (!open) {
					queryClient.removeQueries({
						queryKey: ["search", debouncedSearchTerm],
					});
					setSearchTerm("");
					setSelectedIndex(-1);
				}
			}}
		>
			<DialogTrigger asChild>
				<div>
					{/* Desktop Trigger Input */}
					<div className="relative hidden sm:flex items-center group">
						<Input
							readOnly
							className="pl-10 pr-16 py-2 w-64 rounded-md cursor-pointer select-none focus-visible:ring-0 bg-sand-100 dark:bg-sand-800 border-sand-200 dark:border-sand-700 text-sand-700 dark:text-sand-300 placeholder:text-sand-400 dark:placeholder:text-sand-500 group-hover:border-sand-300 dark:group-hover:border-sand-600"
							placeholder="Search docs..."
						/>
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-400 dark:text-sand-500 group-hover:text-sand-500 dark:group-hover:text-sand-400" />
						<kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex h-5 select-none items-center gap-1 rounded border bg-sand-50 dark:bg-sand-800 border-sand-200 dark:border-sand-700 px-1.5 font-mono text-[10px] font-medium text-sand-500 dark:text-sand-400 opacity-100 group-hover:opacity-80">
							<span className="text-xs">⌘</span>K
						</kbd>
					</div>
					{/* Mobile Trigger Button */}
					<button
						className="sm:hidden group p-2 hover:bg-sand-100 dark:hover:bg-sand-800 transition-colors rounded-full"
						type="button"
						aria-label="Search documentation"
					>
						<Search className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
					</button>
				</div>
			</DialogTrigger>
			<DialogContent
				className={cn(
					"fixed left-[50%] sm:max-h-[calc(36rem+3.5rem)] sm:h-fit top-0 flex flex-col bottom-0 sm:top-24 -translate-x-1/2 sm:max-w-2xl w-full sm:w-[calc(100%-2rem)] p-0 overflow-hidden border shadow-2xl",
					"bg-background/80 dark:bg-background/70 backdrop-blur-lg border-border glass", // Using our glass effect
					"sm:rounded-lg", // Rounded corners on desktop
				)}
				onOpenAutoFocus={(e) => {
					e.preventDefault(); // Prevent default focus behavior
					inputRef.current?.focus(); // Manually focus our input
				}}
			>
				<DialogTitle className="sr-only">Search docs</DialogTitle>

				<div className="flex items-center border-b border-border px-4 sm:px-6">
					<Search
						className="h-5 w-5 text-muted-foreground mr-3"
						aria-hidden="true"
					/>
					<Input
						ref={inputRef}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						onKeyDown={handleKeyDown}
						className="h-14 w-full bg-transparent border-none text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 pl-0"
						placeholder="Search docs..."
					/>
					{searchTerm && (
						<button
							onClick={() => setSearchTerm("")}
							className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-sand-100 dark:hover:bg-sand-800"
							aria-label="Clear search"
							type="button"
						>
							<X className="h-4 w-4" />
						</button>
					)}
					<button
						onClick={closeSearch}
						className="hidden sm:block ml-2 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-sand-100 dark:hover:bg-sand-800"
						aria-label="Close search"
						type="button"
					>
						<span className="text-xs">ESC</span>
					</button>
				</div>

				{displayedResults && displayedResults.length > 0 && (
					<div className="relative flex-1 min-h-0 sm:min-h-fit">
						{/* Removed top fade as results list has padding */}
						<ul
							id="search-results"
							ref={resultsRef}
							className="h-full sm:h-auto overflow-y-auto overflow-x-hidden p-3 sm:p-4 sm:max-h-[32rem] scrollbar-thin scrollbar-thumb-sand-300 dark:scrollbar-thumb-sand-700 scrollbar-track-transparent hover:scrollbar-thumb-sand-400 dark:hover:scrollbar-thumb-sand-600"
						>
							{displayedResults.map((result, index) => (
								<li
									key={result.id}
									id={`result-${index}`}
									aria-selected={index === selectedIndex}
									className={cn(
										"px-3 py-3 sm:px-4 sm:py-4 rounded-md cursor-pointer",
										index === selectedIndex && "bg-sand-100 dark:bg-sand-800",
										index !== selectedIndex &&
											"hover:bg-sand-50 dark:hover:bg-sand-800/50",
									)}
									onClick={() =>
										result.metadata &&
										result.id &&
										handleResultClick({
											id: result.id.toString(),
											title: result.metadata.title,
											path: result.metadata.path,
											level: result.metadata.level,
											type: result.metadata.type,
											content: result.metadata.content,
											documentTitle: result.metadata.documentTitle,
										})
									}
									// onKeyDown is not typically needed on <li> if parent handles it, but kept for consistency if desired
								>
									<h3
										className={cn(
											"text-base font-semibold text-foreground",
											index === selectedIndex &&
												"text-sand-700 dark:text-sand-300",
										)}
									>
										{highlightMatches(
											result.metadata?.documentTitle || "Untitled Document",
											searchTerm,
										)}
									</h3>
									{result.metadata?.title &&
										result.metadata.title !== result.metadata.documentTitle && (
											<p className="text-sm text-muted-foreground mt-0.5">
												{highlightMatches(result.metadata.title, searchTerm)}
											</p>
										)}
									{result.metadata?.content && (
										<p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
											{renderMarkdownContent(
												getContextAroundMatch(
													result.metadata.content,
													searchTerm,
												),
											).map((element, elIndex) => (
												<Fragment key={elIndex}>
													{typeof element === "string"
														? highlightMatches(element, searchTerm)
														: element}
												</Fragment>
											))}
										</p>
									)}
								</li>
							))}
						</ul>
						{/* Removed bottom fade as results list has padding */}
					</div>
				)}
				{searchTerm &&
					(!displayedResults || displayedResults.length === 0) &&
					!isRefetching && (
						<div className="p-6 text-center text-muted-foreground">
							<p>No results found for &quot;{searchTerm}&quot;.</p>
						</div>
					)}
			</DialogContent>
		</Dialog>
	);
};

export default SearchBar;
