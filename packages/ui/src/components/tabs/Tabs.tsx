import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Presence } from "@jsandy/ui/presence";
import { Primitive } from "@jsandy/ui/primitive";
import {
	RovingFocusGroup,
	RovingFocusGroupItem,
	createRovingFocusGroupScope,
} from "@jsandy/ui/roving-focus";
import { useControllableState } from "@jsandy/ui/use-controllable-state";
import { useDirection } from "@jsandy/ui/use-direction";
import { useId } from "@jsandy/ui/use-id";
import * as React from "react";

import { cn } from "@jsandy/ui/cn";

/* -------------------------------------------------------------------------------------------------
 * Tabs
 * -----------------------------------------------------------------------------------------------*/

const TABS_NAME = "Tabs";

type ScopedProps<P> = P & { __scopeTabs?: Scope };
const [createTabsContext, createTabsScope] = createContextScope(TABS_NAME, [
	createRovingFocusGroupScope,
]);
const useRovingFocusGroupScope = createRovingFocusGroupScope();

type TabsContextValue = {
	baseId: string;
	value?: string;
	onValueChange: (value: string) => void;
	orientation?: TabsProps["orientation"];
	dir?: TabsProps["dir"];
	activationMode?: TabsProps["activationMode"];
};

const [TabsProvider, useTabsContext] =
	createTabsContext<TabsContextValue>(TABS_NAME);

type TabsElement = React.ComponentRef<typeof Primitive.div>;
type RovingFocusGroupProps = React.ComponentPropsWithoutRef<
	typeof RovingFocusGroup
>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface TabsProps extends PrimitiveDivProps {
	/** The value for the selected tab, if controlled */
	value?: string;
	/** The value of the tab to select by default, if uncontrolled */
	defaultValue?: string;
	/** A function called when a new tab is selected */
	onValueChange?: (value: string) => void;
	/**
	 * The orientation the tabs are layed out.
	 * Mainly so arrow navigation is done accordingly (left & right vs. up & down)
	 * @defaultValue horizontal
	 */
	orientation?: RovingFocusGroupProps["orientation"];
	/**
	 * The direction of navigation between toolbar items.
	 */
	dir?: RovingFocusGroupProps["dir"];
	/**
	 * Whether a tab is activated automatically or manually.
	 * @defaultValue automatic
	 * */
	activationMode?: "automatic" | "manual";
}

/**
 * Tabs component for organizing content into multiple tabs
 *
 * The Tabs component provides a way to organize and display content in separate, selectable tabs. It's designed to be flexible and customizable, supporting various tab structures and styles.
 *
 * Key features:
 * - Accessible, using appropriate ARIA roles and attributes
 * - Customizable appearance through className props
 * - Support for keyboard navigation
 * - Active tab highlighting
 * - Flexible content organization
 *
 * Usage considerations:
 * - Use for grouping related content that can be viewed independently
 * - Ensure tab labels are clear and concise
 * - Consider the number of tabs and available space in your layout
 * - Provide clear visual indication of the active tab
 * - Use Tabs.List for the container of tab triggers and Tabs.Content for tab content
 */
const Tabs = React.forwardRef<TabsElement, TabsProps>(
	(props: ScopedProps<TabsProps>, forwardedRef) => {
		const {
			__scopeTabs,
			value: valueProp,
			onValueChange,
			defaultValue,
			orientation = "horizontal",
			dir,
			activationMode = "automatic",
			className,
			...tabsProps
		} = props;
		const direction = useDirection(dir);
		const [value, setValue] = useControllableState({
			prop: valueProp,
			onChange: onValueChange,
			defaultProp: defaultValue,
		});

		return (
			<TabsProvider
				scope={__scopeTabs}
				baseId={useId()}
				value={value}
				onValueChange={setValue}
				orientation={orientation}
				dir={direction}
				activationMode={activationMode}
			>
				<Primitive.div
					dir={direction}
					data-orientation={orientation}
					className={cn(
						"flex",
						orientation === "horizontal" ? "flex-col" : "flex-row",
						className,
					)}
					{...tabsProps}
					ref={forwardedRef}
				/>
			</TabsProvider>
		);
	},
);

Tabs.displayName = TABS_NAME;

/* -------------------------------------------------------------------------------------------------
 * TabsList
 * -----------------------------------------------------------------------------------------------*/

const TAB_LIST_NAME = "TabsList";

type TabsListElement = React.ComponentRef<typeof Primitive.div>;
interface TabsListProps extends PrimitiveDivProps {
	loop?: RovingFocusGroupProps["loop"];
}

const TabsListPrimitive = React.forwardRef<TabsListElement, TabsListProps>(
	(props: ScopedProps<TabsListProps>, forwardedRef) => {
		const { __scopeTabs, loop = true, ...listProps } = props;
		const context = useTabsContext(TAB_LIST_NAME, __scopeTabs);
		const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeTabs);
		return (
			<RovingFocusGroup
				asChild
				{...rovingFocusGroupScope}
				orientation={context.orientation}
				dir={context.dir}
				loop={loop}
			>
				<Primitive.div
					role="tablist"
					aria-orientation={context.orientation}
					{...listProps}
					ref={forwardedRef}
				/>
			</RovingFocusGroup>
		);
	},
);

TabsListPrimitive.displayName = TAB_LIST_NAME;

/* -------------------------------------------------------------------------------------------------
 * TabsTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = "TabsTrigger";

type TabsTriggerElement = React.ComponentRef<typeof Primitive.button>;
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<
	typeof Primitive.button
>;
interface TabsTriggerProps extends PrimitiveButtonProps {
	value: string;
}

const TabsTriggerPrimitive = React.forwardRef<
	TabsTriggerElement,
	TabsTriggerProps
>((props: ScopedProps<TabsTriggerProps>, forwardedRef) => {
	const { __scopeTabs, value, disabled = false, ...triggerProps } = props;
	const context = useTabsContext(TRIGGER_NAME, __scopeTabs);
	const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeTabs);
	const triggerId = makeTriggerId(context.baseId, value);
	const contentId = makeContentId(context.baseId, value);
	const isSelected = value === context.value;
	return (
		<RovingFocusGroupItem
			asChild
			{...rovingFocusGroupScope}
			focusable={!disabled}
			active={isSelected}
		>
			<Primitive.button
				type="button"
				role="tab"
				aria-selected={isSelected}
				aria-controls={contentId}
				data-state={isSelected ? "active" : "inactive"}
				data-disabled={disabled ? "" : undefined}
				disabled={disabled}
				id={triggerId}
				{...triggerProps}
				ref={forwardedRef}
				onMouseDown={composeEventHandlers(props.onMouseDown, (event) => {
					// only call handler if it's the left button (mousedown gets triggered by all mouse buttons)
					// but not when the control key is pressed (avoiding MacOS right click)
					if (!disabled && event.button === 0 && event.ctrlKey === false) {
						context.onValueChange(value);
					} else {
						// prevent focus to avoid accidental activation
						event.preventDefault();
					}
				})}
				onKeyDown={composeEventHandlers(props.onKeyDown, (event) => {
					if ([" ", "Enter"].includes(event.key)) {
						context.onValueChange(value);
					}
				})}
				onFocus={composeEventHandlers(props.onFocus, () => {
					// handle "automatic" activation if necessary
					// ie. activate tab following focus
					const isAutomaticActivation = context.activationMode !== "manual";
					if (!isSelected && !disabled && isAutomaticActivation) {
						context.onValueChange(value);
					}
				})}
			/>
		</RovingFocusGroupItem>
	);
});

TabsTriggerPrimitive.displayName = TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * TabsContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "TabsContent";

type TabsContentElement = React.ComponentRef<typeof Primitive.div>;
interface TabsContentProps extends PrimitiveDivProps {
	value: string;

	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

const TabsContentPrimitive = React.forwardRef<
	TabsContentElement,
	TabsContentProps
>((props: ScopedProps<TabsContentProps>, forwardedRef) => {
	const { __scopeTabs, value, forceMount, children, ...contentProps } = props;
	const context = useTabsContext(CONTENT_NAME, __scopeTabs);
	const triggerId = makeTriggerId(context.baseId, value);
	const contentId = makeContentId(context.baseId, value);
	const isSelected = value === context.value;
	const isMountAnimationPreventedRef = React.useRef(isSelected);

	React.useEffect(() => {
		const rAF = requestAnimationFrame(
			// biome-ignore lint/suspicious/noAssignInExpressions: This is a valid use case
			() => (isMountAnimationPreventedRef.current = false),
		);
		return () => cancelAnimationFrame(rAF);
	}, []);

	return (
		<Presence present={forceMount || isSelected}>
			{({ present }) => (
				<Primitive.div
					data-state={isSelected ? "active" : "inactive"}
					data-orientation={context.orientation}
					role="tabpanel"
					aria-labelledby={triggerId}
					hidden={!present}
					id={contentId}
					tabIndex={0}
					{...contentProps}
					ref={forwardedRef}
					style={{
						...props.style,
						animationDuration: isMountAnimationPreventedRef.current
							? "0s"
							: undefined,
					}}
				>
					{present && children}
				</Primitive.div>
			)}
		</Presence>
	);
});

TabsContentPrimitive.displayName = CONTENT_NAME;

/* ---------------------------------------------------------------------------------------------- */

function makeTriggerId(baseId: string, value: string) {
	return `${baseId}-trigger-${value}`;
}

function makeContentId(baseId: string, value: string) {
	return `${baseId}-content-${value}`;
}

/**
 * TabsList component for the list of tab triggers
 *
 * This component serves as a container for the tab triggers, providing a consistent layout and styling for the tab headers.
 */
const TabsList = React.forwardRef<
	React.ComponentRef<typeof TabsListPrimitive>,
	React.ComponentPropsWithoutRef<typeof TabsListPrimitive>
>(({ className, ...props }, ref) => (
	<TabsListPrimitive
		ref={ref}
		className={cn(
			"inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
			className,
		)}
		{...props}
	/>
));
TabsList.displayName = TabsListPrimitive.displayName;

/**
 * TabsTrigger component for individual tab triggers
 *
 * This component represents a single tab header. It handles the selection state and provides visual feedback for the active tab.
 */
const TabsTrigger = React.forwardRef<
	React.ComponentRef<typeof TabsTriggerPrimitive>,
	React.ComponentPropsWithoutRef<typeof TabsTriggerPrimitive>
>(({ className, ...props }, ref) => (
	<TabsTriggerPrimitive
		ref={ref}
		className={cn(
			"inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-sm ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs",
			className,
		)}
		{...props}
	/>
));
TabsTrigger.displayName = TabsTriggerPrimitive.displayName;

/**
 * TabsContent component for the content of individual tabs
 *
 * This component contains the content for a specific tab. It's displayed when its corresponding Tabs.Trigger is selected.
 */
const TabsContent = React.forwardRef<
	React.ComponentRef<typeof TabsContentPrimitive>,
	React.ComponentPropsWithoutRef<typeof TabsContentPrimitive>
>(({ className, ...props }, ref) => (
	<TabsContentPrimitive
		ref={ref}
		className={cn(
			"mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
			className,
		)}
		{...props}
	/>
));
TabsContent.displayName = TabsContentPrimitive.displayName;

export {
	createTabsScope,
	//
	Tabs,
	TabsList,
	TabsTrigger,
	TabsContent,
};
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps };
