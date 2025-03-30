import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names or class objects, then merges Tailwind CSS classes.
 * This function uses clsx to combine classes and twMerge to handle Tailwind-specific class merging.
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
