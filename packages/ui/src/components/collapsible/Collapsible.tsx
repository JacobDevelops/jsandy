import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { useComposedRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Presence } from "@jsandy/ui/presence";
import { Primitive } from "@jsandy/ui/primitive";
import { useControllableState } from "@jsandy/ui/use-controllable-state";
import { useId } from "@jsandy/ui/use-id";
import { useLayoutEffect } from "@jsandy/ui/use-layout-effect";
import * as React from "react";

/* -------------------------------------------------------------------------------------------------
 * Collapsible
 * -----------------------------------------------------------------------------------------------*/

const COLLAPSIBLE_NAME = "Collapsible";

type ScopedProps<P> = P & { __scopeCollapsible?: Scope };
const [createCollapsibleContext, createCollapsibleScope] =
	createContextScope(COLLAPSIBLE_NAME);

type CollapsibleContextValue = {
	contentId: string;
	disabled?: boolean;
	open: boolean;
	onOpenToggle(): void;
};

const [CollapsibleProvider, useCollapsibleContext] =
	createCollapsibleContext<CollapsibleContextValue>(COLLAPSIBLE_NAME);

type CollapsibleElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface CollapsibleProps extends PrimitiveDivProps {
	/** Whether the collapsible is open by default. */
	defaultOpen?: boolean;
	/** Whether the collapsible is open or closed. */
	open?: boolean;
	/** Whether the collapsible is disabled. */
	disabled?: boolean;
	/** Callback when the open state changes. */
	onOpenChange?(open: boolean): void;
}

/**
 * Collapsible component for hiding and showing content
 *
 * The Collapsible component provides a way to toggle the visibility of content, allowing for a more compact UI that can expand to show additional information when needed.
 *
 * Key features:
 * - Controlled visibility of content
 * - Customizable trigger element
 * - Smooth transition effects
 * - Accessible keyboard navigation
 *
 * Usage considerations:
 * - Use for secondary or supplementary information that doesn't need to be always visible
 * - Ensure the trigger clearly indicates that there's hidden content
 * - Consider the impact on page layout when content expands
 * - Use in conjunction with icons or chevrons to indicate expandability
 */
const Collapsible = React.forwardRef<CollapsibleElement, CollapsibleProps>(
	(props: ScopedProps<CollapsibleProps>, forwardedRef) => {
		const {
			__scopeCollapsible,
			open: openProp,
			defaultOpen,
			disabled,
			onOpenChange,
			...collapsibleProps
		} = props;

		const [open = false, setOpen] = useControllableState({
			prop: openProp,
			defaultProp: defaultOpen,
			onChange: onOpenChange,
		});

		return (
			<CollapsibleProvider
				scope={__scopeCollapsible}
				disabled={disabled}
				contentId={useId()}
				open={open}
				onOpenToggle={React.useCallback(
					() => setOpen((prevOpen) => !prevOpen),
					[setOpen],
				)}
			>
				<Primitive.div
					data-state={getState(open)}
					data-disabled={disabled ? "" : undefined}
					{...collapsibleProps}
					ref={forwardedRef}
				/>
			</CollapsibleProvider>
		);
	},
);

Collapsible.displayName = COLLAPSIBLE_NAME;

/* -------------------------------------------------------------------------------------------------
 * CollapsibleTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = "CollapsibleTrigger";

type CollapsibleTriggerElement = React.ComponentRef<typeof Primitive.button>;
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<
	typeof Primitive.button
>;
type CollapsibleTriggerProps = PrimitiveButtonProps;

/**
 * CollapsibleTrigger component for toggling the collapsible content
 *
 * This component renders a button that toggles the visibility of the associated CollapsibleContent. It automatically handles the open/close state and provides visual feedback.
 */
const CollapsibleTrigger = React.forwardRef<
	CollapsibleTriggerElement,
	CollapsibleTriggerProps
>((props: ScopedProps<CollapsibleTriggerProps>, forwardedRef) => {
	const { __scopeCollapsible, ...triggerProps } = props;
	const context = useCollapsibleContext(TRIGGER_NAME, __scopeCollapsible);
	return (
		<Primitive.button
			type="button"
			aria-controls={context.contentId}
			aria-expanded={context.open || false}
			data-state={getState(context.open)}
			data-disabled={context.disabled ? "" : undefined}
			disabled={context.disabled}
			{...triggerProps}
			ref={forwardedRef}
			onClick={composeEventHandlers(props.onClick, context.onOpenToggle)}
		/>
	);
});

CollapsibleTrigger.displayName = TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * CollapsibleContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "CollapsibleContent";

type CollapsibleContentElement = CollapsibleContentImplElement;
interface CollapsibleContentProps
	extends Omit<CollapsibleContentImplProps, "present"> {
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

/**
 * CollapsibleContent component for the hideable content
 *
 * This component wraps the content that can be shown or hidden. It automatically handles the visibility based on the Collapsible's state and provides smooth transition effects.
 */
const CollapsibleContent = React.forwardRef<
	CollapsibleContentElement,
	CollapsibleContentProps
>((props: ScopedProps<CollapsibleContentProps>, forwardedRef) => {
	const { forceMount, ...contentProps } = props;
	const context = useCollapsibleContext(CONTENT_NAME, props.__scopeCollapsible);
	return (
		<Presence present={forceMount || context.open}>
			{({ present }) => (
				<CollapsibleContentImpl
					{...contentProps}
					ref={forwardedRef}
					present={present}
				/>
			)}
		</Presence>
	);
});

CollapsibleContent.displayName = CONTENT_NAME;

/* -----------------------------------------------------------------------------------------------*/

type CollapsibleContentImplElement = React.ComponentRef<typeof Primitive.div>;
interface CollapsibleContentImplProps extends PrimitiveDivProps {
	present: boolean;
}

const CollapsibleContentImpl = React.forwardRef<
	CollapsibleContentImplElement,
	CollapsibleContentImplProps
>((props: ScopedProps<CollapsibleContentImplProps>, forwardedRef) => {
	const { __scopeCollapsible, present, children, ...contentProps } = props;
	const context = useCollapsibleContext(CONTENT_NAME, __scopeCollapsible);
	const [isPresent, setIsPresent] = React.useState(present);
	const ref = React.useRef<CollapsibleContentImplElement>(null);
	const composedRefs = useComposedRefs(forwardedRef, ref);
	const heightRef = React.useRef<number | undefined>(0);
	const height = heightRef.current;
	const widthRef = React.useRef<number | undefined>(0);
	const width = widthRef.current;
	// when opening we want it to immediately open to retrieve dimensions
	// when closing we delay `present` to retrieve dimensions before closing
	const isOpen = context.open || isPresent;
	const isMountAnimationPreventedRef = React.useRef(isOpen);
	const originalStylesRef = React.useRef<Record<string, string>>(undefined);

	React.useEffect(() => {
		const rAF = requestAnimationFrame(
			// biome-ignore lint/suspicious/noAssignInExpressions: This is a valid use case
			() => (isMountAnimationPreventedRef.current = false),
		);
		return () => cancelAnimationFrame(rAF);
	}, []);

	useLayoutEffect(() => {
		const node = ref.current;
		if (node) {
			originalStylesRef.current = originalStylesRef.current || {
				transitionDuration: node.style.transitionDuration,
				animationName: node.style.animationName,
			};
			// block any animations/transitions so the element renders at its full dimensions
			node.style.transitionDuration = "0s";
			node.style.animationName = "none";

			// get width and height from full dimensions
			const rect = node.getBoundingClientRect();
			heightRef.current = rect.height;
			widthRef.current = rect.width;

			// kick off any animations/transitions that were originally set up if it isn't the initial mount
			if (!isMountAnimationPreventedRef.current) {
				node.style.transitionDuration =
					originalStylesRef.current.transitionDuration;
				node.style.animationName = originalStylesRef.current.animationName;
			}

			setIsPresent(present);
		}
		/**
		 * depends on `context.open` because it will change to `false`
		 * when a close is triggered but `present` will be `false` on
		 * animation end (so when close finishes). This allows us to
		 * retrieve the dimensions *before* closing.
		 */
	}, [context.open, present]);

	return (
		<Primitive.div
			data-state={getState(context.open)}
			data-disabled={context.disabled ? "" : undefined}
			id={context.contentId}
			hidden={!isOpen}
			{...contentProps}
			ref={composedRefs}
			style={
				{
					"--jsandy-collapsible-content-height": height
						? `${height}px`
						: undefined,
					"--jsandy-collapsible-content-width": width
						? `${width}px`
						: undefined,
					...props.style,
				} as React.CSSProperties
			}
		>
			{isOpen && children}
		</Primitive.div>
	);
});

/* -----------------------------------------------------------------------------------------------*/

function getState(open?: boolean) {
	return open ? "open" : "closed";
}

export {
	createCollapsibleScope,
	//
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
};
export type {
	CollapsibleProps,
	CollapsibleTriggerProps,
	CollapsibleContentProps,
};
