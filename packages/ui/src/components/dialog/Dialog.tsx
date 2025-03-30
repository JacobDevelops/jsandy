import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { useComposedRefs } from "@jsandy/ui/compose-refs";
import {
	type Scope,
	createContext,
	createContextScope,
} from "@jsandy/ui/context";
import { useFocusGuards } from "@jsandy/ui/focus-guards";
import { FocusScope } from "@jsandy/ui/focus-scope";
import { Portal as PortalPrimitive } from "@jsandy/ui/portal";
import { Presence } from "@jsandy/ui/presence";
import { Primitive } from "@jsandy/ui/primitive";
import { Slot } from "@jsandy/ui/slot";
import { useControllableState } from "@jsandy/ui/use-controllable-state";
import { useId } from "@jsandy/ui/use-id";
import { hideOthers } from "aria-hidden";
import * as React from "react";
import { RemoveScroll } from "react-remove-scroll";
import { DismissableLayer } from "src/lib/dismissable-layer";

import { X } from "lucide-react";
import { cn } from "@jsandy/ui/cn";

/* -------------------------------------------------------------------------------------------------
 * Dialog
 * -----------------------------------------------------------------------------------------------*/

const DIALOG_NAME = "Dialog";

type ScopedProps<P> = P & { __scopeDialog?: Scope };
const [createDialogContext, createDialogScope] =
	createContextScope(DIALOG_NAME);

type DialogContextValue = {
	triggerRef: React.RefObject<HTMLButtonElement | null>;
	contentRef: React.RefObject<DialogContentElement | null>;
	contentId: string;
	titleId: string;
	descriptionId: string;
	open: boolean;
	onOpenChange(open: boolean): void;
	onOpenToggle(): void;
	modal: boolean;
};

const [DialogProvider, useDialogContext] =
	createDialogContext<DialogContextValue>(DIALOG_NAME);

interface DialogProps {
	/** The content of the dialog. This should include DialogTrigger, DialogContent, and other dialog subcomponents. */
	children?: React.ReactNode;
	/** Whether the dialog is currently open. */
	open?: boolean;
	/** Whether the dialog should be open by default. */
	defaultOpen?: boolean;
	/** Event handler called when the open state of the dialog changes. */
	onOpenChange?(open: boolean): void;
	/** Whether the dialog should trap focus. */
	modal?: boolean;
}

/**
 * Dialog component for displaying modal content
 *
 * The Dialog component provides a way to show content in a modal overlay, interrupting the user's current task to focus on important information or actions.
 *
 * Key features:
 * - Controlled visibility of modal content
 * - Customizable trigger element
 * - Overlay background for focus
 * - Accessible keyboard navigation and focus management
 * - Customizable content, title, and description components
 *
 * Usage considerations:
 * - Use for important interactions that require user attention
 * - Ensure the dialog content is concise and focused
 * - Provide clear actions for the user to proceed or dismiss the dialog
 * - Consider the impact on mobile devices and ensure responsive design
 */
const Dialog: React.FC<DialogProps> = (props: ScopedProps<DialogProps>) => {
	const {
		__scopeDialog,
		children,
		open: openProp,
		defaultOpen,
		onOpenChange,
		modal = true,
	} = props;
	const triggerRef = React.useRef<HTMLButtonElement>(null);
	const contentRef = React.useRef<DialogContentElement>(null);
	const [open = false, setOpen] = useControllableState({
		prop: openProp,
		defaultProp: defaultOpen,
		onChange: onOpenChange,
	});

	return (
		<DialogProvider
			scope={__scopeDialog}
			triggerRef={triggerRef}
			contentRef={contentRef}
			contentId={useId()}
			titleId={useId()}
			descriptionId={useId()}
			open={open}
			onOpenChange={setOpen}
			onOpenToggle={React.useCallback(
				() => setOpen((prevOpen) => !prevOpen),
				[setOpen],
			)}
			modal={modal}
		>
			{children}
		</DialogProvider>
	);
};

Dialog.displayName = DIALOG_NAME;

/* -------------------------------------------------------------------------------------------------
 * DialogTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = "DialogTrigger";

type DialogTriggerElement = React.ComponentRef<typeof Primitive.button>;
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<
	typeof Primitive.button
>;
type DialogTriggerProps = PrimitiveButtonProps;

/**
 * DialogTrigger component for opening the dialog
 *
 * This component renders a button that opens the associated Dialog when clicked. It automatically handles the open state of the dialog.
 */
const DialogTrigger = React.forwardRef<
	DialogTriggerElement,
	DialogTriggerProps
>((props: ScopedProps<DialogTriggerProps>, forwardedRef) => {
	const { __scopeDialog, ...triggerProps } = props;
	const context = useDialogContext(TRIGGER_NAME, __scopeDialog);
	const composedTriggerRef = useComposedRefs(forwardedRef, context.triggerRef);
	return (
		<Primitive.button
			type="button"
			aria-haspopup="dialog"
			aria-expanded={context.open}
			aria-controls={context.contentId}
			data-state={getState(context.open)}
			{...triggerProps}
			ref={composedTriggerRef}
			onClick={composeEventHandlers(props.onClick, context.onOpenToggle)}
		/>
	);
});

DialogTrigger.displayName = TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * DialogPortal
 * -----------------------------------------------------------------------------------------------*/

const PORTAL_NAME = "DialogPortal";

type PortalContextValue = { forceMount?: true };
const [PortalProvider, usePortalContext] =
	createDialogContext<PortalContextValue>(PORTAL_NAME, {
		forceMount: undefined,
	});

type PortalProps = React.ComponentPropsWithoutRef<typeof PortalPrimitive>;
interface DialogPortalProps {
	/**
	 * The content of the portal.
	 */
	children?: React.ReactNode;
	/**
	 * Specify a container element to portal the content into.
	 */
	container?: PortalProps["container"];
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

const DialogPortal: React.FC<DialogPortalProps> = (
	props: ScopedProps<DialogPortalProps>,
) => {
	const { __scopeDialog, forceMount, children, container } = props;
	const context = useDialogContext(PORTAL_NAME, __scopeDialog);
	return (
		<PortalProvider scope={__scopeDialog} forceMount={forceMount}>
			{React.Children.map(children, (child) => (
				<Presence present={forceMount || context.open}>
					<PortalPrimitive asChild container={container}>
						{child}
					</PortalPrimitive>
				</Presence>
			))}
		</PortalProvider>
	);
};

DialogPortal.displayName = PORTAL_NAME;

/* -------------------------------------------------------------------------------------------------
 * DialogOverlay
 * -----------------------------------------------------------------------------------------------*/

const OVERLAY_NAME = "DialogOverlay";

type DialogOverlayElement = DialogOverlayImplElement;
interface DialogOverlayProps extends DialogOverlayImplProps {
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

const DialogOverlayPrimitive = React.forwardRef<
	DialogOverlayElement,
	DialogOverlayProps
>((props: ScopedProps<DialogOverlayProps>, forwardedRef) => {
	const portalContext = usePortalContext(OVERLAY_NAME, props.__scopeDialog);
	const { forceMount = portalContext.forceMount, ...overlayProps } = props;
	const context = useDialogContext(OVERLAY_NAME, props.__scopeDialog);
	return context.modal ? (
		<Presence present={forceMount || context.open}>
			<DialogOverlayImpl {...overlayProps} ref={forwardedRef} />
		</Presence>
	) : null;
});

DialogOverlayPrimitive.displayName = OVERLAY_NAME;

type DialogOverlayImplElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
type DialogOverlayImplProps = PrimitiveDivProps;

const DialogOverlayImpl = React.forwardRef<
	DialogOverlayImplElement,
	DialogOverlayImplProps
>((props: ScopedProps<DialogOverlayImplProps>, forwardedRef) => {
	const { __scopeDialog, ...overlayProps } = props;
	const context = useDialogContext(OVERLAY_NAME, __scopeDialog);
	return (
		// Make sure `Content` is scrollable even when it doesn't live inside `RemoveScroll`
		// ie. when `Overlay` and `Content` are siblings
		<RemoveScroll as={Slot} allowPinchZoom shards={[context.contentRef]}>
			<Primitive.div
				data-state={getState(context.open)}
				{...overlayProps}
				ref={forwardedRef}
				// We re-enable pointer-events prevented by `Dialog.Content` to allow scrolling the overlay.
				style={{ pointerEvents: "auto", ...overlayProps.style }}
			/>
		</RemoveScroll>
	);
});

/* -------------------------------------------------------------------------------------------------
 * DialogContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "DialogContent";

type DialogContentElement = DialogContentTypeElement;
interface DialogContentProps extends DialogContentTypeProps {
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

const DialogContentPrimitive = React.forwardRef<
	DialogContentElement,
	DialogContentProps
>((props: ScopedProps<DialogContentProps>, forwardedRef) => {
	const portalContext = usePortalContext(CONTENT_NAME, props.__scopeDialog);
	const { forceMount = portalContext.forceMount, ...contentProps } = props;
	const context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
	return (
		<Presence present={forceMount || context.open}>
			{context.modal ? (
				<DialogContentModal {...contentProps} ref={forwardedRef} />
			) : (
				<DialogContentNonModal {...contentProps} ref={forwardedRef} />
			)}
		</Presence>
	);
});

DialogContentPrimitive.displayName = CONTENT_NAME;

/* -----------------------------------------------------------------------------------------------*/

type DialogContentTypeElement = DialogContentImplElement;
type DialogContentTypeProps = Omit<
	DialogContentImplProps,
	"trapFocus" | "disableOutsidePointerEvents"
>;

const DialogContentModal = React.forwardRef<
	DialogContentTypeElement,
	DialogContentTypeProps
>((props: ScopedProps<DialogContentTypeProps>, forwardedRef) => {
	const context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
	const contentRef = React.useRef<HTMLDivElement>(null);
	const composedRefs = useComposedRefs(
		forwardedRef,
		context.contentRef,
		contentRef,
	);

	// aria-hide everything except the content (better supported equivalent to setting aria-modal)
	React.useEffect(() => {
		const content = contentRef.current;
		if (content) {
			return hideOthers(content);
		}
	}, []);

	return (
		<DialogContentImpl
			{...props}
			ref={composedRefs}
			// we make sure focus isn't trapped once `DialogContent` has been closed
			// (closed !== unmounted when animating out)
			trapFocus={context.open}
			disableOutsidePointerEvents
			onCloseAutoFocus={composeEventHandlers(
				props.onCloseAutoFocus,
				(event) => {
					event.preventDefault();
					context.triggerRef.current?.focus();
				},
			)}
			onPointerDownOutside={composeEventHandlers(
				props.onPointerDownOutside,
				(event) => {
					const { originalEvent } = event.detail;
					const ctrlLeftClick =
						originalEvent.button === 0 && originalEvent.ctrlKey === true;
					const isRightClick = originalEvent.button === 2 || ctrlLeftClick;

					// If the event is a right-click, we shouldn't close because
					// it is effectively as if we right-clicked the `Overlay`.
					if (isRightClick) {
						event.preventDefault();
					}
				},
			)}
			onOpenAutoFocus={composeEventHandlers(props.onOpenAutoFocus, (event) =>
				event.preventDefault(),
			)}
			// When focus is trapped, a `focusout` event may still happen.
			// We make sure we don't trigger our `onDismiss` in such case.
			onFocusOutside={composeEventHandlers(props.onFocusOutside, (event) =>
				event.preventDefault(),
			)}
		/>
	);
});

/* -----------------------------------------------------------------------------------------------*/

const DialogContentNonModal = React.forwardRef<
	DialogContentTypeElement,
	DialogContentTypeProps
>((props: ScopedProps<DialogContentTypeProps>, forwardedRef) => {
	const context = useDialogContext(CONTENT_NAME, props.__scopeDialog);
	const hasInteractedOutsideRef = React.useRef(false);
	const hasPointerDownOutsideRef = React.useRef(false);

	return (
		<DialogContentImpl
			{...props}
			ref={forwardedRef}
			trapFocus={false}
			disableOutsidePointerEvents={false}
			onCloseAutoFocus={(event) => {
				props.onCloseAutoFocus?.(event);

				if (!event.defaultPrevented) {
					if (!hasInteractedOutsideRef.current) {
						context.triggerRef.current?.focus();
					}
					// Always prevent auto focus because we either focus manually or want user agent focus
					event.preventDefault();
				}

				hasInteractedOutsideRef.current = false;
				hasPointerDownOutsideRef.current = false;
			}}
			onInteractOutside={(event) => {
				props.onInteractOutside?.(event);

				if (!event.defaultPrevented) {
					hasInteractedOutsideRef.current = true;
					if (event.detail.originalEvent.type === "pointerdown") {
						hasPointerDownOutsideRef.current = true;
					}
				}

				// Prevent dismissing when clicking the trigger.
				// As the trigger is already setup to close, without doing so would
				// cause it to close and immediately open.
				const target = event.target as HTMLElement;
				const targetIsTrigger = context.triggerRef.current?.contains(target);
				if (targetIsTrigger) {
					event.preventDefault();
				}

				// On Safari if the trigger is inside a container with tabIndex={0}, when clicked
				// we will get the pointer down outside event on the trigger, but then a subsequent
				// focus outside event on the container, we ignore any focus outside event when we've
				// already had a pointer down outside event.
				if (
					event.detail.originalEvent.type === "focusin" &&
					hasPointerDownOutsideRef.current
				) {
					event.preventDefault();
				}
			}}
		/>
	);
});

/* -----------------------------------------------------------------------------------------------*/

type DialogContentImplElement = React.ComponentRef<typeof DismissableLayer>;
type DismissableLayerProps = React.ComponentPropsWithoutRef<
	typeof DismissableLayer
>;
type FocusScopeProps = React.ComponentPropsWithoutRef<typeof FocusScope>;
interface DialogContentImplProps
	extends Omit<DismissableLayerProps, "onDismiss"> {
	/**
	 * When `true`, focus cannot escape the `Content` via keyboard,
	 * pointer, or a programmatic focus.
	 * @defaultValue false
	 */
	trapFocus?: FocusScopeProps["trapped"];

	/**
	 * Event handler called when auto-focusing on open.
	 * Can be prevented.
	 */
	onOpenAutoFocus?: FocusScopeProps["onMountAutoFocus"];

	/**
	 * Event handler called when auto-focusing on close.
	 * Can be prevented.
	 */
	onCloseAutoFocus?: FocusScopeProps["onUnmountAutoFocus"];
}

const DialogContentImpl = React.forwardRef<
	DialogContentImplElement,
	DialogContentImplProps
>((props: ScopedProps<DialogContentImplProps>, forwardedRef) => {
	const {
		__scopeDialog,
		trapFocus,
		onOpenAutoFocus,
		onCloseAutoFocus,
		...contentProps
	} = props;
	const context = useDialogContext(CONTENT_NAME, __scopeDialog);
	const contentRef = React.useRef<HTMLDivElement>(null);
	const composedRefs = useComposedRefs(forwardedRef, contentRef);

	// Make sure the whole tree has focus guards as our `Dialog` will be
	// the last element in the DOM (because of the `Portal`)
	useFocusGuards();

	return (
		<>
			<FocusScope
				asChild
				loop
				trapped={trapFocus}
				onMountAutoFocus={onOpenAutoFocus}
				onUnmountAutoFocus={onCloseAutoFocus}
			>
				<DismissableLayer
					role="dialog"
					id={context.contentId}
					aria-describedby={context.descriptionId}
					aria-labelledby={context.titleId}
					data-state={getState(context.open)}
					{...contentProps}
					ref={composedRefs}
					onDismiss={() => context.onOpenChange(false)}
				/>
			</FocusScope>
			{process.env.NODE_ENV !== "production" && (
				<>
					<TitleWarning titleId={context.titleId} />
					<DescriptionWarning
						contentRef={contentRef}
						descriptionId={context.descriptionId}
					/>
				</>
			)}
		</>
	);
});

/* -------------------------------------------------------------------------------------------------
 * DialogTitle
 * -----------------------------------------------------------------------------------------------*/

const TITLE_NAME = "DialogTitle";

type DialogTitleElement = React.ComponentRef<typeof Primitive.h2>;
type PrimitiveHeading2Props = React.ComponentPropsWithoutRef<
	typeof Primitive.h2
>;
type DialogTitleProps = PrimitiveHeading2Props;

const DialogTitlePrimitive = React.forwardRef<
	DialogTitleElement,
	DialogTitleProps
>((props: ScopedProps<DialogTitleProps>, forwardedRef) => {
	const { __scopeDialog, ...titleProps } = props;
	const context = useDialogContext(TITLE_NAME, __scopeDialog);
	return (
		<Primitive.h2 id={context.titleId} {...titleProps} ref={forwardedRef} />
	);
});

DialogTitlePrimitive.displayName = TITLE_NAME;

/* -------------------------------------------------------------------------------------------------
 * DialogDescription
 * -----------------------------------------------------------------------------------------------*/

const DESCRIPTION_NAME = "DialogDescription";

type DialogDescriptionElement = React.ComponentRef<typeof Primitive.p>;
type PrimitiveParagraphProps = React.ComponentPropsWithoutRef<
	typeof Primitive.p
>;
type DialogDescriptionProps = PrimitiveParagraphProps;

const DialogDescriptionPrimitive = React.forwardRef<
	DialogDescriptionElement,
	DialogDescriptionProps
>((props: ScopedProps<DialogDescriptionProps>, forwardedRef) => {
	const { __scopeDialog, ...descriptionProps } = props;
	const context = useDialogContext(DESCRIPTION_NAME, __scopeDialog);
	return (
		<Primitive.p
			id={context.descriptionId}
			{...descriptionProps}
			ref={forwardedRef}
		/>
	);
});

DialogDescriptionPrimitive.displayName = DESCRIPTION_NAME;

/* -------------------------------------------------------------------------------------------------
 * DialogClose
 * -----------------------------------------------------------------------------------------------*/

const CLOSE_NAME = "DialogClose";

type DialogCloseElement = React.ComponentRef<typeof Primitive.button>;
type DialogCloseProps = PrimitiveButtonProps;

/**
 * DialogClose component for closing the dialog
 *
 * This component renders a button that closes the dialog when clicked. It's typically used for secondary dismissal actions, as the main close button is already included in the DialogContent.
 */
const DialogClose = React.forwardRef<DialogCloseElement, DialogCloseProps>(
	(props: ScopedProps<DialogCloseProps>, forwardedRef) => {
		const { __scopeDialog, ...closeProps } = props;
		const context = useDialogContext(CLOSE_NAME, __scopeDialog);
		return (
			<Primitive.button
				type="button"
				{...closeProps}
				ref={forwardedRef}
				onClick={composeEventHandlers(props.onClick, () =>
					context.onOpenChange(false),
				)}
			/>
		);
	},
);

DialogClose.displayName = CLOSE_NAME;

/* -----------------------------------------------------------------------------------------------*/

function getState(open: boolean) {
	return open ? "open" : "closed";
}

const TITLE_WARNING_NAME = "DialogTitleWarning";

const [WarningProvider, useWarningContext] = createContext(TITLE_WARNING_NAME, {
	contentName: CONTENT_NAME,
	titleName: TITLE_NAME,
	docsSlug: "dialog",
});

type TitleWarningProps = { titleId?: string };

const TitleWarning: React.FC<TitleWarningProps> = ({ titleId }) => {
	const titleWarningContext = useWarningContext(TITLE_WARNING_NAME);

	const MESSAGE = `\`${titleWarningContext.contentName}\` requires a \`${titleWarningContext.titleName}\` for the component to be accessible for screen reader users.

If you want to hide the \`${titleWarningContext.titleName}\`, you can wrap it with our VisuallyHidden component.

For more information, see https://jsandy-ds-url.com/components/${titleWarningContext.docsSlug}`;

	React.useEffect(() => {
		if (titleId) {
			const hasTitle = document.getElementById(titleId);
			if (!hasTitle) {
				console.error(MESSAGE);
			}
		}
	}, [MESSAGE, titleId]);

	return null;
};

const DESCRIPTION_WARNING_NAME = "DialogDescriptionWarning";

type DescriptionWarningProps = {
	contentRef: React.RefObject<DialogContentElement | null>;
	descriptionId?: string;
};

const DescriptionWarning: React.FC<DescriptionWarningProps> = ({
	contentRef,
	descriptionId,
}) => {
	const descriptionWarningContext = useWarningContext(DESCRIPTION_WARNING_NAME);
	const MESSAGE = `Warning: Missing \`Description\` or \`aria-describedby={undefined}\` for {${descriptionWarningContext.contentName}}.`;

	React.useEffect(() => {
		const describedById = contentRef.current?.getAttribute("aria-describedby");
		// if we have an id and the user hasn't set aria-describedby={undefined}
		if (descriptionId && describedById) {
			const hasDescription = document.getElementById(descriptionId);
			if (!hasDescription) {
				console.warn(MESSAGE);
			}
		}
	}, [MESSAGE, contentRef, descriptionId]);

	return null;
};

/**
 * DialogOverlay component for the background overlay of the dialog
 *
 * This component renders a semi-transparent overlay that covers the entire screen when the dialog is open, helping to focus attention on the dialog content.
 */
const DialogOverlay = React.forwardRef<
	React.ComponentRef<typeof DialogOverlayPrimitive>,
	React.ComponentPropsWithoutRef<typeof DialogOverlayPrimitive>
>(({ className, ...props }, ref) => (
	<DialogOverlayPrimitive
		ref={ref}
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		{...props}
	/>
));
DialogOverlay.displayName = DialogOverlayPrimitive.displayName;

/**
 * DialogContent component for the main content of the dialog
 *
 * This component renders the main content area of the dialog, including a close button. It's typically used to wrap DialogTitle, DialogDescription, and any other content or actions needed in the dialog.
 */
const DialogContent = React.forwardRef<
	React.ComponentRef<typeof DialogContentPrimitive>,
	React.ComponentPropsWithoutRef<typeof DialogContentPrimitive>
>(({ className, children, ...props }, ref) => (
	<DialogPortal>
		<DialogOverlay />
		<DialogContentPrimitive
			ref={ref}
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg",
				className,
			)}
			{...props}
		>
			{children}
			<DialogClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
				<X className="h-4 w-4" />
				<span className="sr-only">Close</span>
			</DialogClose>
		</DialogContentPrimitive>
	</DialogPortal>
));
DialogContent.displayName = DialogContentPrimitive.displayName;

const DialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			"flex flex-col space-y-1.5 text-center sm:text-left",
			className,
		)}
		{...props}
	/>
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
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
DialogFooter.displayName = "DialogFooter";

/**
 * DialogTitle component for the title of the dialog
 *
 * This component renders the main heading of the dialog. It should clearly communicate the purpose or subject of the dialog to the user.
 */
const DialogTitle = React.forwardRef<
	React.ComponentRef<typeof DialogTitlePrimitive>,
	React.ComponentPropsWithoutRef<typeof DialogTitlePrimitive>
>(({ className, ...props }, ref) => (
	<DialogTitlePrimitive
		ref={ref}
		className={cn(
			"font-semibold text-lg leading-none tracking-tight",
			className,
		)}
		{...props}
	/>
));
DialogTitle.displayName = DialogTitlePrimitive.displayName;

/**
 * DialogDescription component for the description of the dialog
 *
 * This component renders additional explanatory text for the dialog. It's used to provide more context or instructions to the user about the dialog's purpose or required actions.
 */
const DialogDescription = React.forwardRef<
	React.ComponentRef<typeof DialogDescriptionPrimitive>,
	React.ComponentPropsWithoutRef<typeof DialogDescriptionPrimitive>
>(({ className, ...props }, ref) => (
	<DialogDescriptionPrimitive
		ref={ref}
		className={cn("text-muted-foreground text-sm", className)}
		{...props}
	/>
));
DialogDescription.displayName = DialogDescriptionPrimitive.displayName;

export {
	createDialogScope,
	//
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogClose,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
	//
	DialogContentPrimitive,
	DialogDescriptionPrimitive,
	DialogOverlayPrimitive,
	DialogTitlePrimitive,
	//
	WarningProvider,
};

export type {
	DialogProps,
	DialogTriggerProps,
	DialogPortalProps,
	DialogOverlayProps,
	DialogContentProps,
	DialogTitleProps,
	DialogDescriptionProps,
	DialogCloseProps,
};
