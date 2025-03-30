import { cn } from "@jsandy/ui/cn";
import type React from "react";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
	/**
	 * The keyboard key or shortcut to display
	 */
	children: React.ReactNode;
	/**
	 * Optional variant for styling
	 * @default 'default'
	 */
	variant?: "default" | "small" | "large" | "outline";
}

/**
 * Kbd component for displaying keyboard keys and shortcuts in documentation.
 * Renders with a keyboard-key-like appearance.
 */
export function Kbd({
	children,
	variant = "default",
	className,
	...props
}: KbdProps) {
	const variantClasses = {
		default: "px-2 py-1 text-xs bg-gray-100 border-gray-200 border-b-2",
		small: "px-1.5 py-0.5 text-xs bg-gray-100 border-gray-200 border-b-1",
		large: "px-2.5 py-1.5 text-sm bg-gray-100 border-gray-200 border-b-2",
		outline: "px-2 py-1 text-xs bg-white border-gray-300 border",
	};

	return (
		<kbd
			className={cn(
				"inline-flex select-none items-center justify-center rounded-md border font-medium font-sans shadow-sm",
				variantClasses[variant],
				className,
			)}
			{...props}
		>
			{children}
		</kbd>
	);
}
