import { LoaderCircle } from "lucide-react";
import { cn } from "@jsandy/ui/cn";
import React from "react";

interface SpinnerProps extends React.HTMLAttributes<HTMLOutputElement> {
	size?: "sm" | "md" | "lg" | "xl";
	color?: "primary" | "secondary" | "accent";
}

const Spinner = React.forwardRef<HTMLOutputElement, SpinnerProps>(
	({ size = "md", color = "primary", className, ...props }, ref) => {
		const sizeClasses = {
			sm: "w-4 h-4",
			md: "w-6 h-6",
			lg: "w-8 h-8",
			xl: "w-12 h-12",
		};

		const colorClasses = {
			primary: "text-primary",
			secondary: "text-secondary",
			accent: "text-accent",
		};

		return (
			<output
				ref={ref}
				className={cn("inline-flex items-center justify-center", className)}
				aria-label="Loading"
				{...props}
			>
				<LoaderCircle
					className={cn("animate-spin", sizeClasses[size], colorClasses[color])}
				/>
				<span className="sr-only">Loading...</span>
			</output>
		);
	},
);

Spinner.displayName = "Spinner";

export { Spinner };
