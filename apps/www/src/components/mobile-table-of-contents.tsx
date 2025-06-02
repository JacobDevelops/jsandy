"use client";

import { useState } from "react";
import { AlignLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { TableOfContents } from "./table-of-contents";
import { cn } from "@/lib/utils";

export function MobileTableOfContents() {
	const [isOpen, setIsOpen] = useState(false);

	const handleLinkClick = () => {
		setIsOpen(false); // Close popover when a link is clicked
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="flex text-muted-foreground hover:text-foreground p-2"
					aria-label="Open table of contents"
				>
					<AlignLeft className="size-4" />
					<span>On this page</span>
					<ChevronDown className="size-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				side="bottom"
				className={cn(
					"max-w-xs p-0 mt-2", // Full width on small screens, constrained on sm+
					"bg-background border-border shadow-md rounded-lg", // Themed background and border
				)}
			>
				<div className="p-4 border-b border-border">
					<h3 className="text-sm font-semibold text-foreground">
						On this page
					</h3>
				</div>
				<div className="max-h-[calc(100vh-12rem)] overflow-y-auto py-2 pr-1 scrollbar-thin scrollbar-thumb-sand-300 dark:scrollbar-thumb-sand-600 scrollbar-track-transparent hover:scrollbar-thumb-sand-400 dark:hover:scrollbar-thumb-sand-500">
					<TableOfContents
						onClick={handleLinkClick}
						className="p-2 pl-4" // Add padding for items within the popover content area
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}
