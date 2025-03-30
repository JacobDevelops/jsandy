import { buttonVariants } from "@jsandy/ui/button";
import { cn } from "@jsandy/ui/cn";
import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { useComposedRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import {
	Dialog,
	DialogClose,
	DialogContentPrimitive,
	DialogDescriptionPrimitive,
	DialogOverlayPrimitive,
	DialogPortal,
	DialogTitlePrimitive,
	DialogTrigger,
	WarningProvider,
	createDialogScope,
} from "@jsandy/ui/dialog";
import { Slottable } from "@jsandy/ui/slot";
import * as React from "react";

/* -------------------------------------------------------------------------------------------------
 * AlertDialog
 * -----------------------------------------------------------------------------------------------*/

const ROOT_NAME = "AlertDialog";

type ScopedProps<P> = P & { __scopeAlertDialog?: Scope };
const [createAlertDialogContext, createAlertDialogScope] = createContextScope(
	ROOT_NAME,
	[createDialogScope],
);
const useDialogScope = createDialogScope();

type DialogProps = React.ComponentPropsWithoutRef<typeof Dialog>;
type AlertDialogProps = Omit<DialogProps, "modal">;

/**
 * AlertDialog is a modal dialog that interrupts the user with important content and expects a response. This component is designed for critical interactions that require immediate user attention and action. It's more disruptive than a standard dialog and should be used sparingly for high-stakes decisions or important notifications that the user must acknowledge.
 *
 * Key features:
 * - Interrupts the user flow, ensuring important information is not missed
 * - Typically requires a user response before it can be dismissed
 * - Can be used for confirmations of destructive actions, important notifications, or critical choices
 * - Provides a structured way to present a title, description, and action buttons
 *
 * Use AlertDialog when you need to get the user's attention and confirmation for a critical action, such as deleting data, confirming a significant change, or acknowledging important information.
 */
const AlertDialog: React.FC<AlertDialogProps> = (
	props: ScopedProps<AlertDialogProps>,
) => {
	const { __scopeAlertDialog, ...alertDialogProps } = props;
	const dialogScope = useDialogScope(__scopeAlertDialog);
	return <Dialog {...dialogScope} {...alertDialogProps} modal={true} />;
};

AlertDialog.displayName = ROOT_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogTrigger
 * -----------------------------------------------------------------------------------------------*/
const TRIGGER_NAME = "AlertDialogTrigger";

type AlertDialogTriggerElement = React.ComponentRef<typeof DialogTrigger>;
type DialogTriggerProps = React.ComponentPropsWithoutRef<typeof DialogTrigger>;
type AlertDialogTriggerProps = DialogTriggerProps;

/**
 * AlertDialogTrigger is the button that opens the alert dialog when clicked. This component serves as the initiator for the alert dialog interaction. It should be placed in a location that makes sense within the user interface, typically near the action or information that the alert dialog is related to.
 *
 * Key points:
 * - Acts as the initiator for the alert dialog
 * - Should be clearly visible and understandable
 * - Often styled to stand out or match the importance of the action it represents
 * - Typically placed near the related action or information in the UI
 */
const AlertDialogTrigger = React.forwardRef<
	AlertDialogTriggerElement,
	AlertDialogTriggerProps
>((props: ScopedProps<AlertDialogTriggerProps>, forwardedRef) => {
	const { __scopeAlertDialog, ...triggerProps } = props;
	const dialogScope = useDialogScope(__scopeAlertDialog);
	return (
		<DialogTrigger {...dialogScope} {...triggerProps} ref={forwardedRef} />
	);
});

AlertDialogTrigger.displayName = TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogPortal
 * -----------------------------------------------------------------------------------------------*/

const PORTAL_NAME = "AlertDialogPortal";

type DialogPortalProps = React.ComponentPropsWithoutRef<typeof DialogPortal>;
type AlertDialogPortalProps = DialogPortalProps;

const AlertDialogPortal: React.FC<AlertDialogPortalProps> = (
	props: ScopedProps<AlertDialogPortalProps>,
) => {
	const { __scopeAlertDialog, ...portalProps } = props;
	const dialogScope = useDialogScope(__scopeAlertDialog);
	return <DialogPortal {...dialogScope} {...portalProps} />;
};

AlertDialogPortal.displayName = PORTAL_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogOverlay
 * -----------------------------------------------------------------------------------------------*/

const OVERLAY_NAME = "AlertDialogOverlay";

type AlertDialogOverlayElement = React.ComponentRef<
	typeof DialogOverlayPrimitive
>;
type DialogOverlayProps = React.ComponentPropsWithoutRef<
	typeof DialogOverlayPrimitive
>;
type AlertDialogOverlayProps = DialogOverlayProps;

const AlertDialogOverlayPrimitive = React.forwardRef<
	AlertDialogOverlayElement,
	AlertDialogOverlayProps
>((props: ScopedProps<AlertDialogOverlayProps>, forwardedRef) => {
	const { __scopeAlertDialog, ...overlayProps } = props;
	const dialogScope = useDialogScope(__scopeAlertDialog);
	return (
		<DialogOverlayPrimitive
			{...dialogScope}
			{...overlayProps}
			ref={forwardedRef}
		/>
	);
});

AlertDialogOverlayPrimitive.displayName = OVERLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "AlertDialogContent";

type AlertDialogContentContextValue = {
	cancelRef: React.RefObject<AlertDialogCancelElement | null>;
};

const [AlertDialogContentProvider, useAlertDialogContentContext] =
	createAlertDialogContext<AlertDialogContentContextValue>(CONTENT_NAME);

type AlertDialogContentElement = React.ComponentRef<
	typeof DialogContentPrimitive
>;
type DialogContentProps = React.ComponentPropsWithoutRef<
	typeof DialogContentPrimitive
>;
type AlertDialogContentProps = Omit<
	DialogContentProps,
	"onPointerDownOutside" | "onInteractOutside"
>;

const AlertDialogContentPrimitive = React.forwardRef<
	AlertDialogContentElement,
	AlertDialogContentProps
>((props: ScopedProps<AlertDialogContentProps>, forwardedRef) => {
	const { __scopeAlertDialog, children, ...contentProps } = props;
	const dialogScope = useDialogScope(__scopeAlertDialog);
	const contentRef = React.useRef<AlertDialogContentElement>(null);
	const composedRefs = useComposedRefs(forwardedRef, contentRef);
	const cancelRef = React.useRef<AlertDialogCancelElement | null>(null);

	return (
		<WarningProvider
			contentName={CONTENT_NAME}
			titleName={TITLE_NAME}
			docsSlug="alert-dialog"
		>
			<AlertDialogContentProvider
				scope={__scopeAlertDialog}
				cancelRef={cancelRef}
			>
				<DialogContentPrimitive
					role="alertdialog"
					{...dialogScope}
					{...contentProps}
					ref={composedRefs}
					onOpenAutoFocus={composeEventHandlers(
						contentProps.onOpenAutoFocus,
						(event) => {
							event.preventDefault();
							cancelRef.current?.focus({ preventScroll: true });
						},
					)}
					onPointerDownOutside={(event) => event.preventDefault()}
					onInteractOutside={(event) => event.preventDefault()}
				>
					{/**
					 * We have to use `Slottable` here as we cannot wrap the `AlertDialogContentProvider`
					 * around everything, otherwise the `DescriptionWarning` would be rendered straight away.
					 * This is because we want the accessibility checks to run only once the content is actually
					 * open and that behaviour is already encapsulated in `DialogContent`.
					 */}
					<Slottable>{children}</Slottable>
					{process.env.NODE_ENV === "development" && (
						<DescriptionWarning contentRef={contentRef} />
					)}
				</DialogContentPrimitive>
			</AlertDialogContentProvider>
		</WarningProvider>
	);
});

AlertDialogContentPrimitive.displayName = CONTENT_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogTitle
 * -----------------------------------------------------------------------------------------------*/

const TITLE_NAME = "AlertDialogTitle";

type AlertDialogTitleElement = React.ComponentRef<typeof DialogTitlePrimitive>;
type DialogTitleProps = React.ComponentPropsWithoutRef<
	typeof DialogTitlePrimitive
>;
type AlertDialogTitleProps = DialogTitleProps;

const AlertDialogTitlePrimitive = React.forwardRef<
	AlertDialogTitleElement,
	AlertDialogTitleProps
>((props: ScopedProps<AlertDialogTitleProps>, forwardedRef) => {
	const { __scopeAlertDialog, ...titleProps } = props;
	const dialogScope = useDialogScope(__scopeAlertDialog);
	return (
		<DialogTitlePrimitive {...dialogScope} {...titleProps} ref={forwardedRef} />
	);
});

AlertDialogTitlePrimitive.displayName = TITLE_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogDescription
 * -----------------------------------------------------------------------------------------------*/

const DESCRIPTION_NAME = "AlertDialogDescription";

type AlertDialogDescriptionElement = React.ComponentRef<
	typeof DialogDescriptionPrimitive
>;
type DialogDescriptionProps = React.ComponentPropsWithoutRef<
	typeof DialogDescriptionPrimitive
>;
type AlertDialogDescriptionProps = DialogDescriptionProps;

const AlertDialogDescriptionPrimitive = React.forwardRef<
	AlertDialogDescriptionElement,
	AlertDialogDescriptionProps
>((props: ScopedProps<AlertDialogDescriptionProps>, forwardedRef) => {
	const { __scopeAlertDialog, ...descriptionProps } = props;
	const dialogScope = useDialogScope(__scopeAlertDialog);
	return (
		<DialogDescriptionPrimitive
			{...dialogScope}
			{...descriptionProps}
			ref={forwardedRef}
		/>
	);
});

AlertDialogDescriptionPrimitive.displayName = DESCRIPTION_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogAction
 * -----------------------------------------------------------------------------------------------*/

const ACTION_NAME = "AlertDialogAction";

type AlertDialogActionElement = React.ComponentRef<typeof DialogClose>;
type DialogCloseProps = React.ComponentPropsWithoutRef<typeof DialogClose>;
type AlertDialogActionProps = DialogCloseProps;

const AlertDialogActionPrimitive = React.forwardRef<
	AlertDialogActionElement,
	AlertDialogActionProps
>((props: ScopedProps<AlertDialogActionProps>, forwardedRef) => {
	const { __scopeAlertDialog, ...actionProps } = props;
	const dialogScope = useDialogScope(__scopeAlertDialog);
	return <DialogClose {...dialogScope} {...actionProps} ref={forwardedRef} />;
});

AlertDialogActionPrimitive.displayName = ACTION_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogCancel
 * -----------------------------------------------------------------------------------------------*/

const CANCEL_NAME = "AlertDialogCancel";

type AlertDialogCancelElement = React.ComponentRef<typeof DialogClose>;
type AlertDialogCancelProps = DialogCloseProps;

const AlertDialogCancelPrimitive = React.forwardRef<
	AlertDialogCancelElement,
	AlertDialogCancelProps
>((props: ScopedProps<AlertDialogCancelProps>, forwardedRef) => {
	const { __scopeAlertDialog, ...cancelProps } = props;
	const { cancelRef } = useAlertDialogContentContext(
		CANCEL_NAME,
		__scopeAlertDialog,
	);
	const dialogScope = useDialogScope(__scopeAlertDialog);
	const ref = useComposedRefs(forwardedRef, cancelRef);
	return <DialogClose {...dialogScope} {...cancelProps} ref={ref} />;
});

AlertDialogCancelPrimitive.displayName = CANCEL_NAME;

/* ---------------------------------------------------------------------------------------------- */

type DescriptionWarningProps = {
	contentRef: React.RefObject<AlertDialogContentElement | null>;
};

const DescriptionWarning: React.FC<DescriptionWarningProps> = ({
	contentRef,
}) => {
	const MESSAGE = `\`${CONTENT_NAME}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${CONTENT_NAME}\` by passing a \`${DESCRIPTION_NAME}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${CONTENT_NAME}\`. If the description is confusing or duplicative for sighted users, you can use the \`@jsandy/ui/visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://jsandy-docs-link.com/components/alert-dialog`;

	React.useEffect(() => {
		const hasDescription = document.getElementById(
			contentRef.current?.getAttribute("aria-describedby") ?? "",
		);
		if (!hasDescription) {
			console.warn(MESSAGE);
		}
	}, [MESSAGE, contentRef]);

	return null;
};

/**
 * AlertDialogOverlay is a semi-transparent background that covers the entire screen when the dialog is open. This component creates a visual separation between the alert dialog and the rest of the application.
 *
 * Key features:
 * - Covers the entire viewport
 * - Creates visual separation for the dialog
 * - Typically semi-transparent to dim the background
 * - Sits behind the main dialog content but in front of other UI elements
 * - May have a click handler to dismiss the dialog (behavior can vary)
 *
 * The overlay helps focus the user's attention on the dialog content by dimming or obscuring the background.
 */
const AlertDialogOverlay = React.forwardRef<
	React.ComponentRef<typeof AlertDialogOverlayPrimitive>,
	React.ComponentPropsWithoutRef<typeof AlertDialogOverlayPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogOverlayPrimitive
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		{...props}
		ref={ref}
	/>
));
AlertDialogOverlay.displayName = AlertDialogOverlayPrimitive.displayName;

/**
 * AlertDialogContent is the container for the main content of the alert dialog. This component serves as the primary container for the alert dialog's content.
 *
 * Typical contents:
 * - Title component
 * - Description component
 * - Action component
 * - Cancel component
 *
 * Key characteristics:
 * - Usually centered on the screen
 * - Styled to stand out from the dimmed background
 * - Often includes visual cues like distinct background color, drop shadow, or border
 * - Arranged in a logical and visually appealing manner
 *
 * The content should be structured to clearly separate it from the underlying page content and focus the user's attention on the important information or decision at hand.
 */
const AlertDialogContent = React.forwardRef<
	React.ComponentRef<typeof AlertDialogContentPrimitive>,
	React.ComponentPropsWithoutRef<typeof AlertDialogContentPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogPortal>
		<AlertDialogOverlay />
		<AlertDialogContentPrimitive
			ref={ref}
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg",
				className,
			)}
			{...props}
		/>
	</AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogContentPrimitive.displayName;

const AlertDialogHeader = ({
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
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({
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
AlertDialogFooter.displayName = "AlertDialogFooter";

/**
 * AlertDialogTitle is the main heading of the alert dialog. This component displays the primary message or question of the alert dialog. It should clearly state the purpose or main point of the dialog in a concise manner.
 *
 * Key points:
 * - Displays the primary message or question
 * - Should be clear and concise
 * - Crucial for quickly informing the user about the nature of the alert or decision
 * - Typically styled to be prominent and easily readable
 * - Often uses larger font size or bold weight to distinguish from other content
 */
const AlertDialogTitle = React.forwardRef<
	React.ComponentRef<typeof AlertDialogTitlePrimitive>,
	React.ComponentPropsWithoutRef<typeof AlertDialogTitlePrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogTitlePrimitive
		ref={ref}
		className={cn("font-semibold text-lg", className)}
		{...props}
	/>
));
AlertDialogTitle.displayName = AlertDialogTitlePrimitive.displayName;

/**
 * AlertDialogDescription provides additional context or details about the alert dialog's purpose. This component is used to give more information about the alert or decision presented to the user.
 *
 * Key aspects:
 * - Expands on the title with necessary details
 * - Offers explanations of consequences or instructions
 * - Should be clear and concise, but comprehensive
 * - Typically styled for easy readability
 * - Often uses appropriate spacing and possibly a slightly smaller font size than the title
 *
 * The description should provide all the information a user needs to understand the situation and make an informed decision.
 */
const AlertDialogDescription = React.forwardRef<
	React.ComponentRef<typeof AlertDialogDescriptionPrimitive>,
	React.ComponentPropsWithoutRef<typeof AlertDialogDescriptionPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogDescriptionPrimitive
		ref={ref}
		className={cn("text-muted-foreground text-sm", className)}
		{...props}
	/>
));
AlertDialogDescription.displayName =
	AlertDialogDescriptionPrimitive.displayName;

/**
 * AlertDialogAction is the primary action button in the alert dialog. This component represents the main action that the alert dialog is prompting the user to take.
 *
 * Use cases:
 * - Confirming a critical action
 * - Acknowledging an important message
 * - Proceeding with a significant operation
 *
 * Key characteristics:
 * - Should be visually distinct
 * - Purpose should be immediately clear from its label
 * - Often styled with a prominent color or bold text
 * - Designed to stand out from the cancel option
 *
 * The action button is a crucial element in guiding the user's response to the alert dialog.
 */
const AlertDialogAction = React.forwardRef<
	React.ComponentRef<typeof AlertDialogActionPrimitive>,
	React.ComponentPropsWithoutRef<typeof AlertDialogActionPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogActionPrimitive
		ref={ref}
		className={cn(buttonVariants(), className)}
		{...props}
	/>
));
AlertDialogAction.displayName = AlertDialogActionPrimitive.displayName;

/**
 * AlertDialogCancel is the secondary action button in the alert dialog. This component provides a way for users to dismiss the dialog without taking the primary action.
 *
 * Key points:
 * - Offers a way to dismiss the dialog without taking the primary action
 * - Important for user control and preventing accidental actions
 * - Especially crucial for destructive or irreversible operations
 * - Should be clearly visible but typically less prominent than the primary action
 * - Often uses labels like "Cancel", "Close", or "No"
 *
 * The cancel button ensures that users have a clear way to back out of the action proposed by the alert dialog, enhancing usability and preventing unintended consequences.
 */
const AlertDialogCancel = React.forwardRef<
	React.ComponentRef<typeof AlertDialogCancelPrimitive>,
	React.ComponentPropsWithoutRef<typeof AlertDialogCancelPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogCancelPrimitive
		ref={ref}
		className={cn(
			buttonVariants({ variant: "outline" }),
			"mt-2 sm:mt-0",
			className,
		)}
		{...props}
	/>
));
AlertDialogCancel.displayName = AlertDialogCancelPrimitive.displayName;

export {
	createAlertDialogScope,
	//
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogPortal,
	AlertDialogOverlay,
	AlertDialogContent,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogFooter,
};
export type {
	AlertDialogProps,
	AlertDialogTriggerProps,
	AlertDialogPortalProps,
	AlertDialogOverlayProps,
	AlertDialogContentProps,
	AlertDialogActionProps,
	AlertDialogCancelProps,
	AlertDialogTitleProps,
	AlertDialogDescriptionProps,
};
