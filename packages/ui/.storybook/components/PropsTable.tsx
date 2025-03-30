import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@jsandy/ui/table";
import type React from "react";

/**
 * Represents a single property in the props table
 */
export interface PropDefinition {
	/**
	 * The name of the prop
	 */
	name: string;

	/**
	 * The type of the prop (can include JSX for complex types)
	 */
	type: React.ReactNode;

	/**
	 * The default value of the prop
	 */
	defaultValue?: React.ReactNode;

	/**
	 * Description of what the prop does
	 */
	description: React.ReactNode;

	/**
	 * Whether the prop is required
	 */
	required?: boolean;
}

interface PropsTableProps {
	/**
	 * The properties to display in the table
	 */
	props: PropDefinition[];

	/**
	 * Optional caption for the table
	 */
	caption?: string;

	/**
	 * Optional class name to apply to the table
	 */
	className?: string;
}

/**
 * Component for displaying component properties in a standardized table format.
 * Designed to replace markdown tables in Storybook MDX files.
 */
export function PropsTable({ props, caption, className }: PropsTableProps) {
	return (
		<Table className={className}>
			<TableHeader>
				<TableRow>
					<TableHead>Prop</TableHead>
					<TableHead>Type</TableHead>
					<TableHead>Default</TableHead>
					<TableHead>Description</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{props.map((prop) => (
					<TableRow key={prop.name}>
						<TableCell className="font-mono font-semibold text-xs">
							{prop.name}
							{prop.required && <span className="ml-1 text-red-500">*</span>}
						</TableCell>
						<TableCell className="font-mono text-xs">{prop.type}</TableCell>
						<TableCell className="font-mono text-xs">
							{prop.defaultValue || <span className="text-gray-400">—</span>}
						</TableCell>
						<TableCell>{prop.description}</TableCell>
					</TableRow>
				))}
			</TableBody>
			{caption && (
				<caption className="mt-4 text-gray-500 text-sm">{caption}</caption>
			)}
		</Table>
	);
}
