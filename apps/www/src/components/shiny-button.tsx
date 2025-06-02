import { cn } from "@/lib/utils";
import Link from "next/link";
import type React from "react";

export interface ShinyButtonProps
	extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string;
	loading?: boolean; // Prop exists but not used in current JSX
	loadingColor?: "sand-light" | "sand-dark"; // Example themed loading colors
}

export const ShinyButton = ({
	className,
	children,
	href,
	loading = false, // Not currently used in rendering
	loadingColor = "sand-light", // Not currently used in rendering
	...props
}: ShinyButtonProps) => {
	return (
		<Link
			href={href}
			className={cn(
				"group relative flex transform items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md border h-9 px-4 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
				// Base styles
				"border-sand-600 dark:border-sand-700", // Themed border
				"bg-sand-700 hover:bg-sand-800 dark:bg-sand-800 dark:hover:bg-sand-900", // Themed background and hover
				"text-sand-100 dark:text-sand-200", // Themed text
				// Ring styles
				"hover:ring-sand-500 dark:hover:ring-sand-400", // Themed hover ring
				"focus-visible:ring-sand-500 dark:focus-visible:ring-sand-400", // Themed focus ring
				"ring-offset-background", // Ring offset based on page background
				className,
			)}
			{...props}
		>
			{children}

			{/* Shine effect */}
			<div
				className={cn(
					"ease-[cubic-bezier(0.19,1,0.22,1)] absolute -left-[75px] -top-[50px] z-10 h-[155px] w-8 rotate-[35deg] opacity-20 transition-all duration-500 group-hover:left-[120%]",
					"bg-white", // Themed shine color
				)}
			/>
		</Link>
	);
};

ShinyButton.displayName = "ShinyButton";
