import { cn } from "@jsandy/ui/cn";
import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { useComposedRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { DismissableLayer } from "@jsandy/ui/dismissable-layer";
import { useFocusGuards } from "@jsandy/ui/focus-guards";
import { FocusScope } from "@jsandy/ui/focus-scope";
import {
	Popper,
	PopperAnchor,
	PopperArrow,
	PopperContent,
	createPopperScope,
} from "@jsandy/ui/popper";
import { Portal as PortalPrimitive } from "@jsandy/ui/portal";
import { Presence } from "@jsandy/ui/presence";
import { Primitive } from "@jsandy/ui/primitive";
import { Slot } from "@jsandy/ui/slot";
import { useControllableState } from "@jsandy/ui/use-controllable-state";
import { useId } from "@jsandy/ui/use-id";
import { hideOthers } from "aria-hidden";
import * as React from "react";
import { RemoveScroll } from "react-remove-scroll";

/* -------------------------------------------------------------------------------------------------
 * Popover
 * -----------------------------------------------------------------------------------------------*/

const POPOVER_NAME = "Popover";

type ScopedProps<P> = P & { __scopePopover?: Scope };
const [createPopoverContext, createPopoverScope] = createContextScope(
	POPOVER_NAME,
	[createPopperScope],
);
const usePopperScope = createPopperScope();

type PopoverContextValue = {
	triggerRef: React.RefObject<HTMLButtonElement | null>;
	contentId: string;
	open: boolean;
	onOpenChange(open: boolean): void;
	onOpenToggle(): void;
	hasCustomAnchor: boolean;
	onCustomAnchorAdd(): void;
	onCustomAnchorRemove(): void;
	modal: boolean;
};

const [PopoverProvider, usePopoverContext] =
	createPopoverContext<PopoverContextValue>(POPOVER_NAME);

interface PopoverProps {
	/**
	 * The content to be rendered within the popover, typically including PopoverTrigger and PopoverContent.
	 */
	children?: React.ReactNode;

	/**
	 * Whether the popover is open. Use this prop to control the popover's state.
	 */
	open?: boolean;

	/**
	 * The initial open state of the popover when it is first rendered. Use this prop when not controlling the open state.
	 */
	defaultOpen?: boolean;

	/**
	 * Event handler called when the open state changes.
	 */
	onOpenChange?: (open: boolean) => void;

	/**
	 * When true, the popover behaves as a modal, blocking interactions with elements outside it.
	 * @default false
	 */
	modal?: boolean;
}

/**
 * Popover component for displaying floating content
 *
 * The Popover component provides a way to show additional content in a floating panel when a user interacts
 * with a trigger element. It's commonly used for secondary information, forms, or temporary actions that
 * don't require a full page or modal.
 *
 * Key features:
 * - Triggerable content panel that appears over other content
 * - Optional modal mode to focus user attention
 * - Focus management for accessibility
 * - Controlled or uncontrolled state management
 * - Flexible positioning options
 * - Built-in keyboard navigation and dismissal
 *
 * Usage considerations:
 * - Use for secondary content that shouldn't interrupt the main workflow
 * - Consider whether the content should block other interactions (modal) or not
 * - Ensure the trigger clearly indicates its action
 * - Keep content concise and focused on a single task
 * - Consider mobile viewports when designing the content
 */
const Popover: React.FC<PopoverProps> = (props: ScopedProps<PopoverProps>) => {
	const {
		__scopePopover,
		children,
		open: openProp,
		defaultOpen,
		onOpenChange,
		modal = false,
	} = props;
	const popperScope = usePopperScope(__scopePopover);
	const triggerRef = React.useRef<HTMLButtonElement>(null);
	const [hasCustomAnchor, setHasCustomAnchor] = React.useState(false);
	const [open = false, setOpen] = useControllableState({
		prop: openProp,
		defaultProp: defaultOpen,
		onChange: onOpenChange,
	});

	return (
		<Popper {...popperScope}>
			<PopoverProvider
				scope={__scopePopover}
				contentId={useId()}
				triggerRef={triggerRef}
				open={open}
				onOpenChange={setOpen}
				onOpenToggle={React.useCallback(
					() => setOpen((prevOpen) => !prevOpen),
					[setOpen],
				)}
				hasCustomAnchor={hasCustomAnchor}
				onCustomAnchorAdd={React.useCallback(
					() => setHasCustomAnchor(true),
					[],
				)}
				onCustomAnchorRemove={React.useCallback(
					() => setHasCustomAnchor(false),
					[],
				)}
				modal={modal}
			>
				{children}
			</PopoverProvider>
		</Popper>
	);
};

Popover.displayName = POPOVER_NAME;

/* -------------------------------------------------------------------------------------------------
 * PopoverAnchor
 * -----------------------------------------------------------------------------------------------*/

const ANCHOR_NAME = "PopoverAnchor";

type PopoverAnchorElement = React.ComponentRef<typeof PopperAnchor>;
type PopperAnchorProps = React.ComponentPropsWithoutRef<typeof PopperAnchor>;
type PopoverAnchorProps = PopperAnchorProps;

/**
 * PopoverAnchor component for custom anchor positioning
 *
 * This component is used to create a custom anchor point for the popover content.
 * It allows you to position the popover relative to any element, not just the trigger.
 */
const PopoverAnchor = React.forwardRef<
	PopoverAnchorElement,
	PopoverAnchorProps
>((props: ScopedProps<PopoverAnchorProps>, forwardedRef) => {
	const { __scopePopover, ...anchorProps } = props;
	const context = usePopoverContext(ANCHOR_NAME, __scopePopover);
	const popperScope = usePopperScope(__scopePopover);
	const { onCustomAnchorAdd, onCustomAnchorRemove } = context;

	React.useEffect(() => {
		onCustomAnchorAdd();
		return () => onCustomAnchorRemove();
	}, [onCustomAnchorAdd, onCustomAnchorRemove]);

	return <PopperAnchor {...popperScope} {...anchorProps} ref={forwardedRef} />;
});

PopoverAnchor.displayName = ANCHOR_NAME;

/* -------------------------------------------------------------------------------------------------
 * PopoverTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = "PopoverTrigger";

type PopoverTriggerElement = React.ComponentRef<typeof Primitive.button>;
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<
	typeof Primitive.button
>;
type PopoverTriggerProps = PrimitiveButtonProps;

/**
 * PopoverTrigger component for opening the popover
 *
 * This component renders a button that toggles the popover's open state when clicked.
 * It automatically handles the aria attributes required for accessibility.
 */
const PopoverTrigger = React.forwardRef<
	PopoverTriggerElement,
	PopoverTriggerProps
>((props: ScopedProps<PopoverTriggerProps>, forwardedRef) => {
	const { __scopePopover, ...triggerProps } = props;
	const context = usePopoverContext(TRIGGER_NAME, __scopePopover);
	const popperScope = usePopperScope(__scopePopover);
	const composedTriggerRef = useComposedRefs(forwardedRef, context.triggerRef);

	const trigger = (
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

	return context.hasCustomAnchor ? (
		trigger
	) : (
		<PopperAnchor asChild {...popperScope}>
			{trigger}
		</PopperAnchor>
	);
});

PopoverTrigger.displayName = TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * PopoverPortal
 * -----------------------------------------------------------------------------------------------*/

const PORTAL_NAME = "PopoverPortal";

type PortalContextValue = { forceMount?: true };
const [PortalProvider, usePortalContext] =
	createPopoverContext<PortalContextValue>(PORTAL_NAME, {
		forceMount: undefined,
	});

type PortalProps = React.ComponentPropsWithoutRef<typeof PortalPrimitive>;
interface PopoverPortalProps {
	/**
	 * The content to be rendered within the portal.
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

/**
 * PopoverPortal component for rendering content in a portal
 *
 * This component renders its children in a portal, which appends the content to the end of the document body
 * (or a specified container) to avoid layout issues that might occur when the content is rendered within its
 * parent component's DOM hierarchy.
 */
const PopoverPortal: React.FC<PopoverPortalProps> = (
	props: ScopedProps<PopoverPortalProps>,
) => {
	const { __scopePopover, forceMount, children, container } = props;
	const context = usePopoverContext(PORTAL_NAME, __scopePopover);
	return (
		<PortalProvider scope={__scopePopover} forceMount={forceMount}>
			<Presence present={forceMount || context.open}>
				<PortalPrimitive asChild container={container}>
					{children}
				</PortalPrimitive>
			</Presence>
		</PortalProvider>
	);
};

PopoverPortal.displayName = PORTAL_NAME;

/* -------------------------------------------------------------------------------------------------
 * PopoverContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "PopoverContent";

interface PopoverContentProps extends PopoverContentTypeProps {
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

/**
 * PopoverContentPrimitive component for rendering popover content
 *
 * This component renders the content of the popover. It handles focus management,
 * click outside behavior, and keyboard navigation based on whether the popover is modal or not.
 */
const PopoverContentPrimitive = React.forwardRef<
	PopoverContentTypeElement,
	PopoverContentProps
>((props: ScopedProps<PopoverContentProps>, forwardedRef) => {
	const portalContext = usePortalContext(CONTENT_NAME, props.__scopePopover);
	const { forceMount = portalContext.forceMount, ...contentProps } = props;
	const context = usePopoverContext(CONTENT_NAME, props.__scopePopover);
	return (
		<Presence present={forceMount || context.open}>
			{context.modal ? (
				<PopoverContentModal {...contentProps} ref={forwardedRef} />
			) : (
				<PopoverContentNonModal {...contentProps} ref={forwardedRef} />
			)}
		</Presence>
	);
});

PopoverContentPrimitive.displayName = CONTENT_NAME;

/* -----------------------------------------------------------------------------------------------*/

type PopoverContentTypeElement = PopoverContentImplElement;
type PopoverContentTypeProps = Omit<
	PopoverContentImplProps,
	"trapFocus" | "disableOutsidePointerEvents"
>;

const PopoverContentModal = React.forwardRef<
	PopoverContentTypeElement,
	PopoverContentTypeProps
>((props: ScopedProps<PopoverContentTypeProps>, forwardedRef) => {
	const context = usePopoverContext(CONTENT_NAME, props.__scopePopover);
	const contentRef = React.useRef<HTMLDivElement>(null);
	const composedRefs = useComposedRefs(forwardedRef, contentRef);
	const isRightClickOutsideRef = React.useRef(false);

	// aria-hide everything except the content (better supported equivalent to setting aria-modal)
	React.useEffect(() => {
		const content = contentRef.current;
		if (content) return hideOthers(content);
	}, []);

	return (
		<RemoveScroll as={Slot} allowPinchZoom>
			<PopoverContentImpl
				{...props}
				ref={composedRefs}
				// we make sure we're not trapping once it's been closed
				// (closed !== unmounted when animating out)
				trapFocus={context.open}
				disableOutsidePointerEvents
				onCloseAutoFocus={composeEventHandlers(
					props.onCloseAutoFocus,
					(event) => {
						event.preventDefault();
						if (!isRightClickOutsideRef.current)
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

						isRightClickOutsideRef.current = isRightClick;
					},
					{ checkForDefaultPrevented: false },
				)}
				// When focus is trapped, a `focusout` event may still happen.
				// We make sure we don't trigger our `onDismiss` in such case.
				onFocusOutside={composeEventHandlers(
					props.onFocusOutside,
					(event) => event.preventDefault(),
					{ checkForDefaultPrevented: false },
				)}
			/>
		</RemoveScroll>
	);
});

const PopoverContentNonModal = React.forwardRef<
	PopoverContentTypeElement,
	PopoverContentTypeProps
>((props: ScopedProps<PopoverContentTypeProps>, forwardedRef) => {
	const context = usePopoverContext(CONTENT_NAME, props.__scopePopover);
	const hasInteractedOutsideRef = React.useRef(false);
	const hasPointerDownOutsideRef = React.useRef(false);

	return (
		<PopoverContentImpl
			{...props}
			ref={forwardedRef}
			trapFocus={false}
			disableOutsidePointerEvents={false}
			onCloseAutoFocus={(event) => {
				props.onCloseAutoFocus?.(event);

				if (!event.defaultPrevented) {
					if (!hasInteractedOutsideRef.current)
						context.triggerRef.current?.focus();
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
				if (targetIsTrigger) event.preventDefault();

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

type PopoverContentImplElement = React.ComponentRef<typeof PopperContent>;
type FocusScopeProps = React.ComponentPropsWithoutRef<typeof FocusScope>;
type DismissableLayerProps = React.ComponentPropsWithoutRef<
	typeof DismissableLayer
>;
type PopperContentProps = React.ComponentPropsWithoutRef<typeof PopperContent>;
interface PopoverContentImplProps
	extends Omit<PopperContentProps, "onPlaced">,
		Omit<DismissableLayerProps, "onDismiss"> {
	/**
	 * Whether focus should be trapped within the `Popover`
	 * (default: false)
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

const PopoverContentImpl = React.forwardRef<
	PopoverContentImplElement,
	PopoverContentImplProps
>((props: ScopedProps<PopoverContentImplProps>, forwardedRef) => {
	const {
		__scopePopover,
		trapFocus,
		onOpenAutoFocus,
		onCloseAutoFocus,
		disableOutsidePointerEvents,
		onEscapeKeyDown,
		onPointerDownOutside,
		onFocusOutside,
		onInteractOutside,
		...contentProps
	} = props;
	const context = usePopoverContext(CONTENT_NAME, __scopePopover);
	const popperScope = usePopperScope(__scopePopover);

	// Make sure the whole tree has focus guards as our `Popover` may be
	// the last element in the DOM (because of the `Portal`)
	useFocusGuards();

	return (
		<FocusScope
			asChild
			loop
			trapped={trapFocus}
			onMountAutoFocus={onOpenAutoFocus}
			onUnmountAutoFocus={onCloseAutoFocus}
		>
			<DismissableLayer
				asChild
				disableOutsidePointerEvents={disableOutsidePointerEvents}
				onInteractOutside={onInteractOutside}
				onEscapeKeyDown={onEscapeKeyDown}
				onPointerDownOutside={onPointerDownOutside}
				onFocusOutside={onFocusOutside}
				onDismiss={() => context.onOpenChange(false)}
			>
				<PopperContent
					data-state={getState(context.open)}
					role="dialog"
					id={context.contentId}
					{...popperScope}
					{...contentProps}
					ref={forwardedRef}
					style={{
						...contentProps.style,
						// re-namespace exposed content custom properties
						...{
							"--jsandy-popover-content-transform-origin":
								"var(--jsandy-popper-transform-origin)",
							"--jsandy-popover-content-available-width":
								"var(--jsandy-popper-available-width)",
							"--jsandy-popover-content-available-height":
								"var(--jsandy-popper-available-height)",
							"--jsandy-popover-trigger-width":
								"var(--jsandy-popper-anchor-width)",
							"--jsandy-popover-trigger-height":
								"var(--jsandy-popper-anchor-height)",
						},
					}}
				/>
			</DismissableLayer>
		</FocusScope>
	);
});

/* -------------------------------------------------------------------------------------------------
 * PopoverClose
 * -----------------------------------------------------------------------------------------------*/

const CLOSE_NAME = "PopoverClose";

type PopoverCloseElement = React.ComponentRef<typeof Primitive.button>;
type PopoverCloseProps = PrimitiveButtonProps;

/**
 * PopoverClose component for closing the popover
 *
 * This component renders a button that closes the popover when clicked.
 * It's typically used inside the PopoverContent to provide an explicit close button.
 */
const PopoverClose = React.forwardRef<PopoverCloseElement, PopoverCloseProps>(
	(props: ScopedProps<PopoverCloseProps>, forwardedRef) => {
		const { __scopePopover, ...closeProps } = props;
		const context = usePopoverContext(CLOSE_NAME, __scopePopover);
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

PopoverClose.displayName = CLOSE_NAME;

/* -------------------------------------------------------------------------------------------------
 * PopoverArrow
 * -----------------------------------------------------------------------------------------------*/

const ARROW_NAME = "PopoverArrow";

type PopoverArrowElement = React.ComponentRef<typeof PopperArrow>;
type PopperArrowProps = React.ComponentPropsWithoutRef<typeof PopperArrow>;
type PopoverArrowProps = PopperArrowProps;

/**
 * PopoverArrow component for showing a directional pointer
 *
 * This component renders an arrow that points from the popover content to its anchor.
 * It helps users understand the relationship between the popover and its trigger.
 */
const PopoverArrow = React.forwardRef<PopoverArrowElement, PopoverArrowProps>(
	(props: ScopedProps<PopoverArrowProps>, forwardedRef) => {
		const { __scopePopover, ...arrowProps } = props;
		const popperScope = usePopperScope(__scopePopover);
		return <PopperArrow {...popperScope} {...arrowProps} ref={forwardedRef} />;
	},
);

PopoverArrow.displayName = ARROW_NAME;

/* -----------------------------------------------------------------------------------------------*/

function getState(open: boolean) {
	return open ? "open" : "closed";
}

/**
 * PopoverContent component with default styling
 *
 * This is the styled version of PopoverContentPrimitive with animations and theme-consistent design.
 * It's the recommended component to use for standard popover content.
 */
const PopoverContent = React.forwardRef<
	React.ComponentRef<typeof PopoverContentPrimitive>,
	React.ComponentPropsWithoutRef<typeof PopoverContentPrimitive>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
	<PopoverPortal>
		<PopoverContentPrimitive
			ref={ref}
			align={align}
			sideOffset={sideOffset}
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			{...props}
		/>
	</PopoverPortal>
));
PopoverContent.displayName = PopoverContentPrimitive.displayName;

export {
	Popover,
	PopoverAnchor,
	PopoverArrow,
	PopoverClose,
	PopoverContent,
	PopoverTrigger,
	createPopoverScope,
};
