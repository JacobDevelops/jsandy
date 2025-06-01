import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

export interface ShinyButtonProps
	extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	href: string;
	// Loading state is not visually implemented in this version but props are kept for potential future use
	loading?: boolean;
	loadingColor?: "sand" | "foreground"; // Adapted to theme
}

export const ShinyButton = React.forwardRef<
	HTMLAnchorElement,
	ShinyButtonProps
>(
	(
		{
			className,
			children,
			href,
			loading = false,
			loadingColor = "sand",
			...props
		},
		ref,
	) => {
		return (
			<Link
				href={href}
				ref={ref}
				className={cn(
					"group relative inline-flex transform items-center justify-center gap-2 overflow-hidden whitespace-nowrap",
					"rounded-md border h-9 px-4 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
					// Sand theme specific styles
					"border-sand-300 dark:border-sand-700",
					"bg-sand-100 hover:bg-sand-200 dark:bg-sand-800 dark:hover:bg-sand-700", // A slightly lighter, interactive feel
					"text-sand-700 dark:text-sand-200",
					"hover:shadow-md hover:border-sand-400 dark:hover:border-sand-600",
					className,
				)}
				{...props}
			>
				{/* Shine element */}
				<div
					className={cn(
						"ease-[cubic-bezier(0.19,1,0.22,1)] absolute -left-[75px] -top-[50px] -z-10 h-[155px] w-8 rotate-[35deg] transition-all duration-500 group-hover:left-[120%]",
						"bg-white/30 dark:bg-white/10", // Shine color, subtle for both themes
					)}
				/>
				{/* Loading spinner placeholder (visuals not implemented) */}
				{loading && (
					<svg
						className={cn(
							"animate-spin -ml-1 mr-2 h-4 w-4",
							loadingColor === "sand" ? "text-sand-500" : "text-foreground",
						)}
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<title>Loading</title>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				)}
				<span className="relative z-10">{children}</span>
			</Link>
		);
	},
);

ShinyButton.displayName = "ShinyButton";
