"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { DocNavigation } from "./doc-navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/search-bar";

export function MobileNavigation() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}

		return () => {
			document.body.style.overflow = "auto";
		};
	}, [isOpen]);

	return (
		<>
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setIsOpen(true)}
				className="text-muted-foreground hover:text-foreground"
				type="button"
				aria-label="Open navigation menu"
			>
				<Menu className="size-5" />
			</Button>

			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
					onClick={() => setIsOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							setIsOpen(false);
						}
					}}
				/>
			)}

			<div
				className={cn(
					"fixed bg-background border-r border-border flex w-4/5 max-w-xs flex-col gap-4 inset-y-0 left-0 z-50 overflow-y-auto p-4 transition-transform duration-300 ease-in-out lg:hidden",
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				<div className="flex items-center justify-between pb-2 border-b border-border">
					<Link
						onClick={() => setIsOpen(false)}
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
					<Button
						variant="ghost"
						size="icon"
						type="button"
						onClick={() => setIsOpen(false)}
						className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-sand-100 dark:hover:bg-sand-800"
						aria-label="Close navigation menu"
					>
						<X className="h-5 w-5" />
					</Button>
				</div>

				<div className="mb-4">
					<SearchBar /> {/* Add SearchBar here for mobile */}
				</div>

				<DocNavigation
					onLinkClick={() => setIsOpen(false)}
					className="mt-2 flex-grow"
				/>
			</div>
		</>
	);
}
