import { cn } from "@jsandy/ui/cn";
import * as React from "react";

/**
 * Table component for displaying tabular data
 *
 * The Table component provides a structured way to present data in rows and columns. It's designed to be flexible and customizable, supporting various table structures and styles.
 *
 * Key features:
 * - Responsive design with horizontal scrolling for small screens
 * - Customizable appearance through className props
 * - Support for complex table structures with header, body, and footer
 * - Hover and selected states for rows
 * - Accessible, using semantic HTML table elements
 *
 * Usage considerations:
 * - Use for presenting structured data that benefits from a tabular format
 * - Consider the amount of data and screen sizes when deciding to use a table
 * - Use TableHeader, TableBody, and TableFooter for proper table structure
 * - Provide clear column headers using TableHead components
 * - Use TableCaption to give context or summary of the table contents
 */
const Table = React.forwardRef<
	HTMLTableElement,
	React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
	<div className="relative w-full overflow-auto">
		<table
			ref={ref}
			className={cn("w-full caption-bottom text-sm", className)}
			{...props}
		/>
	</div>
));
Table.displayName = "Table";

/**
 * TableHeader component for the header section of a table
 *
 * This component is used to group the header content of a table. It typically contains a row of TableHead components.
 */
const TableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

/**
 * TableBody component for the main content of a table
 *
 * This component contains the main data rows of the table. It typically consists of multiple TableRow components.
 */
const TableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody
		ref={ref}
		className={cn("[&_tr:last-child]:border-0", className)}
		{...props}
	/>
));
TableBody.displayName = "TableBody";

/**
 * TableFooter component for the footer section of a table
 *
 * This component is used for the footer of a table, typically containing summary information or totals.
 */
const TableFooter = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tfoot
		ref={ref}
		className={cn(
			"border-t bg-muted/50 font-medium last:[&>tr]:border-b-0",
			className,
		)}
		{...props}
	/>
));
TableFooter.displayName = "TableFooter";

/**
 * TableRow component for a row in a table
 *
 * This component represents a single row of data in the table. It can be used in TableHeader, TableBody, or TableFooter.
 */
const TableRow = React.forwardRef<
	HTMLTableRowElement,
	React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
	<tr
		ref={ref}
		className={cn(
			"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
			className,
		)}
		{...props}
	/>
));
TableRow.displayName = "TableRow";

/**
 * TableHead component for a header cell in a table
 *
 * This component is used for column headers in a table. It should be placed within a TableRow in the TableHeader.
 */
const TableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<th
		ref={ref}
		className={cn(
			"h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
			className,
		)}
		{...props}
	/>
));
TableHead.displayName = "TableHead";

/**
 * TableCell component for a cell in a table
 *
 * This component represents an individual data cell in the table. It should be used within TableRow components in the TableBody.
 */
const TableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<td
		ref={ref}
		className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
		{...props}
	/>
));
TableCell.displayName = "TableCell";

/**
 * TableCaption component for a caption for a table
 *
 * This component provides a caption or summary for the entire table. It should be used as a direct child of the Table component.
 */
const TableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		ref={ref}
		className={cn("mt-4 text-muted-foreground text-sm", className)}
		{...props}
	/>
));
TableCaption.displayName = "TableCaption";

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
};
