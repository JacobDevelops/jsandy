"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Github, Menu, X } from "lucide-react";
import { useState } from "react";

const navigation = [
	{ name: "Home", href: "/" },
	{ name: "Docs", href: "/docs" },
	// { name: "API", href: "/docs/api" },
	// { name: "Examples", href: "/examples" },
	// { name: "Blog", href: "/blog" },
];

export function Navigation() {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	if (pathname.includes("/docs")) {
		return null;
	}

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<nav
				className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
				aria-label="Global"
			>
				<div className="flex lg:flex-1">
					<Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3">
						<Image
							src="/logo.png"
							alt="JSandy Logo"
							width={32}
							height={32}
							className="h-8 w-8"
						/>
						<span className="text-2xl font-bold text-foreground">JSandy</span>
					</Link>
				</div>
				<div className="flex lg:hidden">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setMobileMenuOpen(true)}
						className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
					>
						<span className="sr-only">Open main menu</span>
						<Menu className="h-6 w-6" aria-hidden="true" />
					</Button>
				</div>
				<div className="hidden lg:flex lg:gap-x-12">
					{navigation.map((item) => (
						<Link
							key={item.name}
							href={item.href}
							className={cn(
								"text-sm font-semibold leading-6 transition-colors hover:text-sand-600 dark:hover:text-sand-400",
								pathname === item.href
									? "text-sand-600 dark:text-sand-400"
									: "text-muted-foreground",
							)}
						>
							{item.name}
						</Link>
					))}
				</div>
				<div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
					<Button variant="ghost" size="icon" asChild>
						<Link href="https://github.com/yourusername/jsandy">
							<Github className="h-4 w-4" />
							<span className="sr-only">GitHub</span>
						</Link>
					</Button>
					<ThemeToggle />
				</div>
			</nav>

			{/* Mobile menu */}
			{mobileMenuOpen && (
				<div className="lg:hidden">
					<div className="fixed inset-0 z-50" />
					<div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-border/10">
						<div className="flex items-center justify-between">
							<Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3">
								<Image
									src="/logo.png"
									alt="JSandy Logo"
									width={24}
									height={24}
									className="h-6 w-6"
								/>
								<span className="text-xl font-bold text-foreground">
									JSandy
								</span>
							</Link>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setMobileMenuOpen(false)}
								className="-m-2.5 rounded-md p-2.5"
							>
								<span className="sr-only">Close menu</span>
								<X className="h-6 w-6" aria-hidden="true" />
							</Button>
						</div>
						<div className="mt-6 flow-root">
							<div className="-my-6 divide-y divide-border/10">
								<div className="space-y-2 py-6">
									{navigation.map((item) => (
										<Link
											key={item.name}
											href={item.href}
											className={cn(
												"-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 transition-colors hover:bg-muted",
												pathname === item.href
													? "text-sand-600 dark:text-sand-400"
													: "text-foreground",
											)}
											onClick={() => setMobileMenuOpen(false)}
										>
											{item.name}
										</Link>
									))}
								</div>
								<div className="py-6 flex gap-4">
									<Button variant="ghost" size="icon" asChild>
										<Link href="https://github.com/yourusername/jsandy">
											<Github className="h-4 w-4" />
											<span className="sr-only">GitHub</span>
										</Link>
									</Button>
									<ThemeToggle />
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</header>
	);
}
