"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Icons } from "./icons";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
	{ name: "Home", href: "/" },
	{ name: "Docs", href: "/docs" },
	// { name: "API", href: "/docs/api" },
	// { name: "Examples", href: "/examples" },
	// { name: "Blog", href: "/blog" },
];

const socialLinks = [
	{
		name: "GitHub",
		href: "https://github.com/JacobDevelops/jsandy",
		icon: Icons.github,
	},
	{
		name: "Discord",
		href: "https://discord.gg/X9nhTvpYgU",
		icon: Icons.discord,
	},
];

export function Navigation() {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setMobileMenuOpen(false);
		};

		if (mobileMenuOpen) {
			document.addEventListener("keydown", handleEscape);
			return () => document.removeEventListener("keydown", handleEscape);
		}
	}, [mobileMenuOpen]);

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
					{/* Mobile menu */}
					<Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setMobileMenuOpen(true)}
								className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
							>
								<span className="sr-only">Open main menu</span>
								<Menu className="h-6 w-6" aria-hidden="true" />
							</Button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="bg-background p-0 flex flex-col"
						>
							<SheetHeader className="p-4 border-b border-border">
								<Link
									href="/"
									className="-m-1.5 p-1.5 flex items-center gap-3 w-fit"
								>
									<Image
										src="/logo.png"
										alt="JSandy Logo"
										width={24}
										height={24}
										className="h-6 w-6"
									/>
									<SheetTitle className="sr-only">
										Mobile Navigation Menu
									</SheetTitle>
									<span className="text-xl font-bold text-foreground">
										JSandy
									</span>
								</Link>
							</SheetHeader>
							<div className="mt-6 flow-root mx-6">
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
									<div className="py-6 flex gap-4 border-t border-border">
										{socialLinks.map((link) => (
											<Button
												variant="ghost"
												size="icon"
												asChild
												key={link.name}
											>
												<Link href={link.href}>
													<link.icon className="h-4 w-4" />
													<span className="sr-only">{link.name}</span>
												</Link>
											</Button>
										))}
										<ThemeToggle />
									</div>
								</div>
							</div>
						</SheetContent>
					</Sheet>
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
					{socialLinks.map((link) => (
						<Button variant="ghost" size="icon" key={link.name} asChild>
							<Link href={link.href}>
								<link.icon className="h-4 w-4" />
								<span className="sr-only">{link.name}</span>
							</Link>
						</Button>
					))}
					<ThemeToggle />
				</div>
			</nav>
		</header>
	);
}
