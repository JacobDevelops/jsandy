import { CircleX, Info } from "lucide-react";
import { cn } from "@jsandy/ui/cn";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type React from "react";

type CalloutType = "default" | "info" | "warning" | "success" | "error";

interface CalloutProps extends React.HTMLAttributes<HTMLDivElement> {
	/**
	 * The type of callout which determines its styling and icon
	 * @default 'default'
	 */
	type?: CalloutType;
	/**
	 * Custom icon to display in the callout
	 */
	icon?: React.ReactNode;
	/**
	 * The content of the callout
	 */
	children: React.ReactNode;
}

/**
 * Callout component for highlighting important information with different visual styles.
 */
export function Callout({
	children,
	type = "default",
	icon,
	className,
	...props
}: CalloutProps) {
	// Different styles based on callout type
	const styles = {
		default: "bg-gray-100 border-gray-200 text-gray-800",
		info: "bg-blue-50 border-blue-200 text-blue-800",
		warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
		success: "bg-green-50 border-green-200 text-green-800",
		error: "bg-red-50 border-red-200 text-red-800",
	};

	// Default icons for each type if no custom icon is provided
	const icons = {
		default: <Info className="h-5 w-5" />,
		info: <Info className="h-5 w-5" />,
		warning: <AlertTriangle className="h-5 w-5" />,
		success: <CheckCircle className="h-5 w-5" />,
		error: <CircleX className="h-5 w-5" />,
	};

	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-r-md border-l-4 p-4",
				styles[type],
				className,
			)}
			{...props}
		>
			<div className="mt-0.5 flex-shrink-0">{icon || icons[type]}</div>
			<div>{children}</div>
		</div>
	);
}
