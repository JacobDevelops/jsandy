"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useState } from "react"; // Keep for controlling Sheet open state if needed for onLinkClick

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"; // [^1]
import { DocNavigation } from "./doc-navigation";

export function MobileNavigation() {
	const [open, setOpen] = useState(false); // State to control Sheet programmatically

	const handleLinkClick = () => {
		setOpen(false); // Close sheet when a link is clicked
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="text-muted-foreground hover:text-foreground lg:hidden" // Ensure it's hidden on lg screens
					aria-label="Open navigation menu"
				>
					<Menu className="size-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className=" bg-background p-0 flex flex-col">
				<SheetHeader className="p-4 border-b border-border">
					<SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
					<div className="flex items-center justify-between">
						<Link
							href="/"
							onClick={handleLinkClick} // Close sheet on logo click
							aria-label="Home"
							className="flex items-center gap-2"
						>
							<Image
								src="/logo.png" // Ensure this path is correct
								height={24} // Adjusted size for mobile nav header
								width={24}
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
					</div>
				</SheetHeader>

				<div className="flex-grow overflow-y-auto py-4 pr-1 scrollbar-thin scrollbar-thumb-sand-300 dark:scrollbar-thumb-sand-600 scrollbar-track-transparent hover:scrollbar-thumb-sand-400 dark:hover:scrollbar-thumb-sand-500">
					<DocNavigation
						onLinkClick={handleLinkClick} // Pass handler to DocNavigation
						className="pl-4" // Keep consistent padding
					/>
				</div>
			</SheetContent>
		</Sheet>
	);
}
