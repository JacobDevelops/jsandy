"use client";

import { X } from "lucide-react";
import { cn } from "@jsandy/ui/cn";
import {
	Dialog,
	DialogClose,
	DialogContentPrimitive as DialogContent,
	DialogDescriptionPrimitive as DialogDescription,
	DialogOverlayPrimitive as DialogOverlay,
	DialogPortal,
	DialogTitlePrimitive as DialogTitle,
	DialogTrigger,
} from "@jsandy/ui/dialog";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

/**
 * Sheet component for displaying content in a slide-out panel
 *
 * The Sheet component provides a flexible way to display additional content or controls that can be revealed on demand. It's commonly used for navigation menus, settings panels, or detailed views in mobile-first designs.
 *
 * Key features:
 * - Customizable position (top, bottom, left, right)
 * - Smooth animation for opening and closing
 * - Overlay background for focus
 * - Accessible close button
 * - Customizable content, title, and description components
 *
 * Usage considerations:
 * - Use for secondary content that doesn't need to be always visible
 * - Ensure the sheet content is focused and easily dismissible
 * - Consider the impact on mobile devices and ensure responsive design
 * - Use appropriate positioning based on the context and content type
 * - Implement proper focus management for accessibility
 */
const Sheet = Dialog;

const SheetTrigger = DialogTrigger;

const SheetClose = DialogClose;

const SheetPortal = DialogPortal;

const SheetOverlay = React.forwardRef<
	React.ComponentRef<typeof DialogOverlay>,
	React.ComponentPropsWithoutRef<typeof DialogOverlay>
>(({ className, ...props }, ref) => (
	<DialogOverlay
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		{...props}
		ref={ref}
	/>
));
SheetOverlay.displayName = DialogOverlay.displayName;

const sheetVariants = cva(
	"fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
	{
		variants: {
			side: {
				top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
				bottom:
					"inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
				left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
				right:
					"inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
			},
		},
		defaultVariants: {
			side: "right",
		},
	},
);

interface SheetContentProps
	extends React.ComponentPropsWithoutRef<typeof DialogContent>,
		VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
	React.ComponentRef<typeof DialogContent>,
	SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
	<SheetPortal>
		<SheetOverlay />
		<DialogContent
			ref={ref}
			className={cn(sheetVariants({ side }), className)}
			{...props}
		>
			{children}
			<DialogClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
				<X className="size-4" />
				<span className="sr-only">Close</span>
			</DialogClose>
		</DialogContent>
	</SheetPortal>
));
SheetContent.displayName = DialogContent.displayName;

const SheetHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col space-y-2 text-center sm:text-left",
			className,
		)}
		{...props}
	/>
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
			className,
		)}
		{...props}
	/>
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
	React.ComponentRef<typeof DialogTitle>,
	React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => (
	<DialogTitle
		ref={ref}
		className={cn("font-semibold text-foreground text-lg", className)}
		{...props}
	/>
));
SheetTitle.displayName = DialogTitle.displayName;

const SheetDescription = React.forwardRef<
	React.ComponentRef<typeof DialogDescription>,
	React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => (
	<DialogDescription
		ref={ref}
		className={cn("text-muted-foreground text-sm", className)}
		{...props}
	/>
));
SheetDescription.displayName = DialogDescription.displayName;

export {
	Sheet,
	SheetPortal,
	SheetOverlay,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetFooter,
	SheetTitle,
	SheetDescription,
};
