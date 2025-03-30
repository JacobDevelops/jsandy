import { ChevronDown } from "lucide-react";
import { cn } from "@jsandy/ui/cn";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	createCollapsibleScope,
} from "@jsandy/ui/collapsible";
import { createCollection } from "@jsandy/ui/collection";
import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { useComposedRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Primitive } from "@jsandy/ui/primitive";
import { useControllableState } from "@jsandy/ui/use-controllable-state";
import { useDirection } from "@jsandy/ui/use-direction";
import { useId } from "@jsandy/ui/use-id";
import React from "react";

type Direction = "ltr" | "rtl";

/* -------------------------------------------------------------------------------------------------
 * Accordion
 * -----------------------------------------------------------------------------------------------*/

const ACCORDION_NAME = "Accordion";
const ACCORDION_KEYS = [
	"Home",
	"End",
	"ArrowDown",
	"ArrowUp",
	"ArrowLeft",
	"ArrowRight",
];

const [Collection, useCollection, createCollectionScope] =
	createCollection<AccordionTriggerElement>(ACCORDION_NAME);

type ScopedProps<P> = P & { __scopeAccordion?: Scope };
const [createAccordionContext, createAccordionScope] = createContextScope(
	ACCORDION_NAME,
	[createCollectionScope, createCollapsibleScope],
);
const useCollapsibleScope = createCollapsibleScope();

type AccordionElement =
	| AccordionImplMultipleElement
	| AccordionImplSingleElement;

/**
 * Properties for the single type Accordion component where only one item can be open at a time.
 * This is useful for content where one section should be focused at a time.
 */
interface AccordionSingleProps extends AccordionImplSingleProps {
	/**
	 * Specifies the accordion type as 'single', where only one item can be open at a time.
	 * When one item opens, any previously opened item will close automatically.
	 */
	type: "single";
}

/**
 * Properties for the multiple type Accordion component where multiple items can be open simultaneously.
 * This is useful when users need to compare information across multiple sections.
 */
interface AccordionMultipleProps extends AccordionImplMultipleProps {
	/**
	 * Specifies the accordion type as 'multiple', where multiple items can be open simultaneously.
	 * Each item can be opened or closed independently of other items.
	 */
	type: "multiple";
}

/**
 * Accordion component for displaying collapsible content panels.
 *
 * Accordions organize content into collapsible sections, allowing users to focus on relevant information.
 * They reduce cognitive load by hiding content until needed, and conserve screen space by showing only
 * active sections.
 *
 * The component supports two operational modes:
 * - 'single': Only one item can be expanded at a time (exclusive selection)
 * - 'multiple': Multiple items can be expanded simultaneously (independent selection)
 *
 * Accordions have robust keyboard navigation support and are accessible by default.
 */
const Accordion = React.forwardRef<
	AccordionElement,
	AccordionSingleProps | AccordionMultipleProps
>(
	(
		props: ScopedProps<AccordionSingleProps | AccordionMultipleProps>,
		forwardedRef,
	) => {
		const { type, ...accordionProps } = props;
		const singleProps = accordionProps as AccordionImplSingleProps;
		const multipleProps = accordionProps as AccordionImplMultipleProps;
		return (
			<Collection.Provider scope={props.__scopeAccordion}>
				{type === "multiple" ? (
					<AccordionImplMultiple {...multipleProps} ref={forwardedRef} />
				) : (
					<AccordionImplSingle {...singleProps} ref={forwardedRef} />
				)}
			</Collection.Provider>
		);
	},
);

Accordion.displayName = ACCORDION_NAME;

/* -----------------------------------------------------------------------------------------------*/

type AccordionValueContextValue = {
	value: string[];
	onItemOpen(value: string): void;
	onItemClose(value: string): void;
};

const [AccordionValueProvider, useAccordionValueContext] =
	createAccordionContext<AccordionValueContextValue>(ACCORDION_NAME);

const [AccordionCollapsibleProvider, useAccordionCollapsibleContext] =
	createAccordionContext(ACCORDION_NAME, { collapsible: false });

type AccordionImplSingleElement = AccordionImplElement;

/**
 * Implementation properties for a single-value accordion, where only one item can be open at a time.
 * This variant maintains a single active value and handles its state transitions.
 */
interface AccordionImplSingleProps extends AccordionImplProps {
	/**
	 * The controlled value of the accordion item that is currently expanded.
	 * Use this prop when you need to control the accordion's state from a parent component.
	 */
	value?: string;
	/**
	 * The initially expanded accordion item when first rendered.
	 * Use this prop for uncontrolled behavior when you don't need to manage the state externally.
	 */
	defaultValue?: string;
	/**
	 * Callback function invoked when the expanded state changes.
	 * Receives the newly expanded item's value as an argument.
	 */
	onValueChange?(value: string): void;
	/**
	 * Controls whether an accordion item can be collapsed after being opened.
	 * When false, once an item is opened it cannot be closed until another item is opened.
	 */
	collapsible?: boolean;
}

const AccordionImplSingle = React.forwardRef<
	AccordionImplSingleElement,
	AccordionImplSingleProps
>((props: ScopedProps<AccordionImplSingleProps>, forwardedRef) => {
	const {
		value: valueProp,
		defaultValue,
		onValueChange = () => {},
		collapsible = false,
		...accordionSingleProps
	} = props;

	const [value, setValue] = useControllableState({
		prop: valueProp,
		defaultProp: defaultValue,
		onChange: onValueChange,
	});

	return (
		<AccordionValueProvider
			scope={props.__scopeAccordion}
			value={value ? [value] : []}
			onItemOpen={setValue}
			onItemClose={React.useCallback(
				() => collapsible && setValue(""),
				[collapsible, setValue],
			)}
		>
			<AccordionCollapsibleProvider
				scope={props.__scopeAccordion}
				collapsible={collapsible}
			>
				<AccordionImpl {...accordionSingleProps} ref={forwardedRef} />
			</AccordionCollapsibleProvider>
		</AccordionValueProvider>
	);
});

/* -----------------------------------------------------------------------------------------------*/

type AccordionImplMultipleElement = AccordionImplElement;

/**
 * Implementation properties for a multiple-value accordion, where multiple items can be open simultaneously.
 * This variant maintains an array of active values and manages their additions and removals.
 */
interface AccordionImplMultipleProps extends AccordionImplProps {
	/**
	 * The controlled array of accordion item values that are currently expanded.
	 * Use this prop when you need to control the accordion's state from a parent component.
	 */
	value?: string[];
	/**
	 * The initially expanded accordion items when first rendered.
	 * Use this prop for uncontrolled behavior when you don't need to manage the state externally.
	 */
	defaultValue?: string[];
	/**
	 * Callback function invoked when the expanded state changes.
	 * Receives an array of all currently expanded item values.
	 */
	onValueChange?(value: string[]): void;
}

const AccordionImplMultiple = React.forwardRef<
	AccordionImplMultipleElement,
	AccordionImplMultipleProps
>((props: ScopedProps<AccordionImplMultipleProps>, forwardedRef) => {
	const {
		value: valueProp,
		defaultValue,
		onValueChange = () => {},
		...accordionMultipleProps
	} = props;

	const [value = [], setValue] = useControllableState({
		prop: valueProp,
		defaultProp: defaultValue,
		onChange: onValueChange,
	});

	const handleItemOpen = React.useCallback(
		(itemValue: string) =>
			setValue((prevValue = []) => [...prevValue, itemValue]),
		[setValue],
	);

	const handleItemClose = React.useCallback(
		(itemValue: string) =>
			setValue((prevValue = []) =>
				prevValue.filter((value) => value !== itemValue),
			),
		[setValue],
	);

	return (
		<AccordionValueProvider
			scope={props.__scopeAccordion}
			value={value}
			onItemOpen={handleItemOpen}
			onItemClose={handleItemClose}
		>
			<AccordionCollapsibleProvider
				scope={props.__scopeAccordion}
				collapsible={true}
			>
				<AccordionImpl {...accordionMultipleProps} ref={forwardedRef} />
			</AccordionCollapsibleProvider>
		</AccordionValueProvider>
	);
});

/* -----------------------------------------------------------------------------------------------*/

type AccordionImplContextValue = {
	disabled?: boolean;
	direction: AccordionImplProps["dir"];
	orientation: AccordionImplProps["orientation"];
};

const [AccordionImplProvider, useAccordionContext] =
	createAccordionContext<AccordionImplContextValue>(ACCORDION_NAME);

type AccordionImplElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;

/**
 * Base implementation properties for all accordion types.
 * These properties apply to both single and multiple accordion variants.
 */
interface AccordionImplProps extends PrimitiveDivProps {
	/**
	 * When true, prevents user interaction with the entire accordion.
	 * All items will be locked in their current state and won't respond to clicks or keyboard interactions.
	 */
	disabled?: boolean;
	/**
	 * Controls the directional flow of the accordion items.
	 * Vertical orientation stacks items, while horizontal places them side by side.
	 * This affects keyboard navigation behavior as well.
	 */
	orientation?: React.AriaAttributes["aria-orientation"];
	/**
	 * Controls the text and navigation direction.
	 * Affects keyboard navigation and visual presentation for right-to-left languages.
	 */
	dir?: Direction;
}

const AccordionImpl = React.forwardRef<
	AccordionImplElement,
	AccordionImplProps
>((props: ScopedProps<AccordionImplProps>, forwardedRef) => {
	const {
		__scopeAccordion,
		disabled,
		dir,
		orientation = "vertical",
		...accordionProps
	} = props;
	const accordionRef = React.useRef<AccordionImplElement>(null);
	const composedRefs = useComposedRefs(accordionRef, forwardedRef);
	const getItems = useCollection(__scopeAccordion);
	const direction = useDirection(dir);
	const isDirectionLTR = direction === "ltr";

	const handleKeyDown = composeEventHandlers(props.onKeyDown, (event) => {
		if (!ACCORDION_KEYS.includes(event.key)) return;
		const target = event.target as HTMLElement;
		const triggerCollection = getItems().filter(
			(item) => !item.ref.current?.disabled,
		);
		const triggerIndex = triggerCollection.findIndex(
			(item) => item.ref.current === target,
		);
		const triggerCount = triggerCollection.length;

		if (triggerIndex === -1) return;

		// Prevents page scroll while user is navigating
		event.preventDefault();

		let nextIndex = triggerIndex;
		const homeIndex = 0;
		const endIndex = triggerCount - 1;

		const moveNext = () => {
			nextIndex = triggerIndex + 1;
			if (nextIndex > endIndex) {
				nextIndex = homeIndex;
			}
		};

		const movePrev = () => {
			nextIndex = triggerIndex - 1;
			if (nextIndex < homeIndex) {
				nextIndex = endIndex;
			}
		};

		switch (event.key) {
			case "Home":
				nextIndex = homeIndex;
				break;
			case "End":
				nextIndex = endIndex;
				break;
			case "ArrowRight":
				if (orientation === "horizontal") {
					if (isDirectionLTR) {
						moveNext();
					} else {
						movePrev();
					}
				}
				break;
			case "ArrowDown":
				if (orientation === "vertical") {
					moveNext();
				}
				break;
			case "ArrowLeft":
				if (orientation === "horizontal") {
					if (isDirectionLTR) {
						movePrev();
					} else {
						moveNext();
					}
				}
				break;
			case "ArrowUp":
				if (orientation === "vertical") {
					movePrev();
				}
				break;
		}

		const clampedIndex = nextIndex % triggerCount;
		triggerCollection[clampedIndex].ref.current?.focus();
	});

	return (
		<AccordionImplProvider
			scope={__scopeAccordion}
			disabled={disabled}
			direction={dir}
			orientation={orientation}
		>
			<Collection.Slot scope={__scopeAccordion}>
				<Primitive.div
					{...accordionProps}
					data-orientation={orientation}
					ref={composedRefs}
					onKeyDown={disabled ? undefined : handleKeyDown}
				/>
			</Collection.Slot>
		</AccordionImplProvider>
	);
});

/* -------------------------------------------------------------------------------------------------
 * AccordionItem
 * -----------------------------------------------------------------------------------------------*/

const ITEM_NAME = "AccordionItem";

type AccordionItemContextValue = {
	open?: boolean;
	disabled?: boolean;
	triggerId: string;
};
const [AccordionItemProvider, useAccordionItemContext] =
	createAccordionContext<AccordionItemContextValue>(ITEM_NAME);

type AccordionItemElement = React.ComponentRef<typeof Collapsible>;
type CollapsibleProps = React.ComponentPropsWithoutRef<typeof Collapsible>;

/**
 * Properties for the AccordionItem component which represents a single collapsible section.
 * Each item must have a unique value within its parent Accordion.
 */
interface AccordionItemProps
	extends Omit<CollapsibleProps, "open" | "defaultOpen" | "onOpenChange"> {
	/**
	 * When true, prevents user interaction with this specific accordion item.
	 * The item will be locked in its current state and won't respond to interactions.
	 * Other accordion items remain interactive unless individually disabled.
	 */
	disabled?: boolean;
	/**
	 * A unique identifier for this accordion item within its parent accordion.
	 * This value is required and used to track the item's expanded state.
	 * All items within an accordion must have distinct values.
	 */
	value: string;
}

/**
 * AccordionItem represents a collapsible section within an Accordion.
 * It contains a header, trigger, and content that can be expanded or collapsed.
 *
 * Each item maintains its own expanded state and can be independently controlled
 * based on the parent Accordion's configuration.
 */
const AccordionItemPrimitive = React.forwardRef<
	AccordionItemElement,
	AccordionItemProps
>((props: ScopedProps<AccordionItemProps>, forwardedRef) => {
	const { __scopeAccordion, value, ...accordionItemProps } = props;
	const accordionContext = useAccordionContext(ITEM_NAME, __scopeAccordion);
	const valueContext = useAccordionValueContext(ITEM_NAME, __scopeAccordion);
	const collapsibleScope = useCollapsibleScope(__scopeAccordion);
	const triggerId = useId();
	const open = (value && valueContext.value.includes(value)) || false;
	const disabled = accordionContext.disabled || props.disabled;

	return (
		<AccordionItemProvider
			scope={__scopeAccordion}
			open={open}
			disabled={disabled}
			triggerId={triggerId}
		>
			<Collapsible
				data-orientation={accordionContext.orientation}
				data-state={getState(open)}
				{...collapsibleScope}
				{...accordionItemProps}
				ref={forwardedRef}
				disabled={disabled}
				open={open}
				onOpenChange={(open) => {
					if (open) {
						valueContext.onItemOpen(value);
					} else {
						valueContext.onItemClose(value);
					}
				}}
			/>
		</AccordionItemProvider>
	);
});

AccordionItemPrimitive.displayName = ITEM_NAME;

/* -------------------------------------------------------------------------------------------------
 * AccordionHeader
 * -----------------------------------------------------------------------------------------------*/

const HEADER_NAME = "AccordionHeader";

type AccordionHeaderElement = React.ComponentRef<typeof Primitive.h3>;
type PrimitiveHeading3Props = React.ComponentPropsWithoutRef<
	typeof Primitive.h3
>;
type AccordionHeaderProps = PrimitiveHeading3Props;

/**
 * AccordionHeader contains the content for the visible part of an AccordionItem.
 * This section is always visible regardless of whether the content is expanded or collapsed.
 *
 * It typically contains the AccordionTrigger component and serves as the accessible label
 * for the expandable region.
 */
const AccordionHeader = React.forwardRef<
	AccordionHeaderElement,
	AccordionHeaderProps
>((props: ScopedProps<AccordionHeaderProps>, forwardedRef) => {
	const { __scopeAccordion, ...headerProps } = props;
	const accordionContext = useAccordionContext(
		ACCORDION_NAME,
		__scopeAccordion,
	);
	const itemContext = useAccordionItemContext(HEADER_NAME, __scopeAccordion);
	return (
		<Primitive.h3
			data-orientation={accordionContext.orientation}
			data-state={getState(itemContext.open)}
			data-disabled={itemContext.disabled ? "" : undefined}
			{...headerProps}
			ref={forwardedRef}
		/>
	);
});

AccordionHeader.displayName = HEADER_NAME;

/* -------------------------------------------------------------------------------------------------
 * AccordionTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = "AccordionTrigger";

type AccordionTriggerElement = React.ComponentRef<typeof CollapsibleTrigger>;
type CollapsibleTriggerProps = React.ComponentPropsWithoutRef<
	typeof CollapsibleTrigger
>;
type AccordionTriggerProps = CollapsibleTriggerProps;

/**
 * AccordionTrigger is the interactive element that toggles the expanded state of an AccordionItem.
 *
 * It must be nested inside an AccordionHeader and acts as the control that users
 * interact with to expand or collapse the associated content.
 *
 * This component includes accessibility attributes and keyboard handling for proper
 * navigation and interaction.
 */
const AccordionTriggerPrimitive = React.forwardRef<
	AccordionTriggerElement,
	AccordionTriggerProps
>((props: ScopedProps<AccordionTriggerProps>, forwardedRef) => {
	const { __scopeAccordion, ...triggerProps } = props;
	const accordionContext = useAccordionContext(
		ACCORDION_NAME,
		__scopeAccordion,
	);
	const itemContext = useAccordionItemContext(TRIGGER_NAME, __scopeAccordion);
	const collapsibleContext = useAccordionCollapsibleContext(
		TRIGGER_NAME,
		__scopeAccordion,
	);
	const collapsibleScope = useCollapsibleScope(__scopeAccordion);
	return (
		<Collection.ItemSlot scope={__scopeAccordion}>
			<CollapsibleTrigger
				aria-disabled={
					(itemContext.open && !collapsibleContext.collapsible) || undefined
				}
				data-orientation={accordionContext.orientation}
				id={itemContext.triggerId}
				{...collapsibleScope}
				{...triggerProps}
				ref={forwardedRef}
			/>
		</Collection.ItemSlot>
	);
});

AccordionTriggerPrimitive.displayName = TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * AccordionContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "AccordionContent";

type AccordionContentElement = React.ComponentRef<typeof CollapsibleContent>;
type CollapsibleContentProps = React.ComponentPropsWithoutRef<
	typeof CollapsibleContent
>;
type AccordionContentProps = CollapsibleContentProps;

/**
 * AccordionContent contains the expandable and collapsible content of an AccordionItem.
 *
 * This component is hidden when the accordion item is collapsed and visible when expanded.
 * It includes transition animations and appropriate accessibility attributes to ensure
 * proper behavior and user experience.
 */
const AccordionContentPrimitive = React.forwardRef<
	AccordionContentElement,
	AccordionContentProps
>((props: ScopedProps<AccordionContentProps>, forwardedRef) => {
	const { __scopeAccordion, ...contentProps } = props;
	const accordionContext = useAccordionContext(
		ACCORDION_NAME,
		__scopeAccordion,
	);
	const itemContext = useAccordionItemContext(CONTENT_NAME, __scopeAccordion);
	const collapsibleScope = useCollapsibleScope(__scopeAccordion);
	return (
		<CollapsibleContent
			role="region"
			aria-labelledby={itemContext.triggerId}
			data-orientation={accordionContext.orientation}
			{...collapsibleScope}
			{...contentProps}
			ref={forwardedRef}
			style={
				{
					"--jsandy-accordion-content-height":
						"var(--jsandy-collapsible-content-height)",
					"--jsandy-accordion-content-width":
						"var(--jsandy-collapsible-content-width)",
					...props.style,
				} as React.CSSProperties
			}
		/>
	);
});

AccordionContentPrimitive.displayName = CONTENT_NAME;

/* -----------------------------------------------------------------------------------------------*/

function getState(open?: boolean) {
	return open ? "open" : "closed";
}

/**
 * Styled AccordionItem component with default border styling.
 * This is a pre-styled version of AccordionItemPrimitive with visual enhancements.
 */
const AccordionItem = React.forwardRef<
	React.ComponentRef<typeof AccordionItemPrimitive>,
	React.ComponentPropsWithoutRef<typeof AccordionItemPrimitive>
>(({ className, ...props }, ref) => (
	<AccordionItemPrimitive
		ref={ref}
		className={cn("border-b", className)}
		{...props}
	/>
));
AccordionItem.displayName = "AccordionItem";

/**
 * Styled AccordionTrigger component with enhanced visual presentation.
 * Includes a rotating chevron icon that indicates the expanded state,
 * hover effects, and appropriate spacing.
 */
const AccordionTrigger = React.forwardRef<
	React.ComponentRef<typeof AccordionTriggerPrimitive>,
	React.ComponentPropsWithoutRef<typeof AccordionTriggerPrimitive>
>(({ className, children, ...props }, ref) => (
	<AccordionHeader className="flex">
		<AccordionTriggerPrimitive
			ref={ref}
			className={cn(
				"flex flex-1 items-center justify-between py-4 text-left font-medium text-sm transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
				className,
			)}
			{...props}
		>
			{children}
			<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
		</AccordionTriggerPrimitive>
	</AccordionHeader>
));
AccordionTrigger.displayName = AccordionTriggerPrimitive.displayName;

/**
 * Styled AccordionContent component with animations and proper spacing.
 * Includes smooth collapse/expand animations and consistent padding.
 */
const AccordionContent = React.forwardRef<
	React.ComponentRef<typeof AccordionContentPrimitive>,
	React.ComponentPropsWithoutRef<typeof AccordionContentPrimitive>
>(({ className, children, ...props }, ref) => (
	<AccordionContentPrimitive
		ref={ref}
		className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
		{...props}
	>
		<div className={cn("pt-0 pb-4", className)}>{children}</div>
	</AccordionContentPrimitive>
));
AccordionContent.displayName = AccordionContentPrimitive.displayName;

export {
	Accordion,
	AccordionContent,
	AccordionHeader,
	AccordionItem,
	AccordionTrigger,
	createAccordionScope,
};
export type {
	AccordionContentProps,
	AccordionItemProps,
	AccordionTriggerProps,
};
