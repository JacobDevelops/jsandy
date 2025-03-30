import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { composeRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import {
	Menu,
	MenuAnchor,
	MenuArrow,
	MenuCheckboxItemPrimitive,
	MenuContentPrimitive,
	MenuGroup,
	MenuItemIndicator,
	MenuItemPrimitive,
	MenuLabelPrimitive,
	MenuPortal,
	MenuRadioGroup,
	MenuRadioItemPrimitive,
	MenuSeparatorPrimitive,
	MenuSub,
	MenuSubContentPrimitive,
	MenuSubTriggerPrimitive,
	createMenuScope,
} from "@jsandy/ui/menu";
import { Primitive } from "@jsandy/ui/primitive";
import { useControllableState } from "@jsandy/ui/use-controllable-state";
import { useId } from "@jsandy/ui/use-id";
import * as React from "react";

import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@jsandy/ui/cn";

type Direction = "ltr" | "rtl";

/* -------------------------------------------------------------------------------------------------
 * DropdownMenu
 * -----------------------------------------------------------------------------------------------*/

const DROPDOWN_MENU_NAME = "DropdownMenu";

type ScopedProps<P> = P & { __scopeDropdownMenu?: Scope };
const [createDropdownMenuContext, createDropdownMenuScope] = createContextScope(
	DROPDOWN_MENU_NAME,
	[createMenuScope],
);
const useMenuScope = createMenuScope();

type DropdownMenuContextValue = {
	/** The unique identifier for the dropdown trigger element. */
	triggerId: string;

	/** A reference to the dropdown trigger button element. */
	triggerRef: React.RefObject<HTMLButtonElement | null>;

	/** The unique identifier for the dropdown content element. */
	contentId: string;

	/** Indicates whether the dropdown menu is currently open. */
	open: boolean;

	/** Callback function that is triggered when the open state of the dropdown menu changes. */
	onOpenChange(open: boolean): void;

	/** Toggles the open state of the dropdown menu. */
	onOpenToggle(): void;

	/** When true, the dropdown menu behaves as a modal, blocking interaction with other elements on the page. */
	modal: boolean;
};

const [DropdownMenuProvider, useDropdownMenuContext] =
	createDropdownMenuContext<DropdownMenuContextValue>(DROPDOWN_MENU_NAME);

interface DropdownMenuProps {
	/** The content of the dropdown menu. */
	children?: React.ReactNode;

	/** The text direction of the dropdown menu ('ltr' for left-to-right or 'rtl' for right-to-left). */
	dir?: Direction;

	/** Controls whether the dropdown menu is open. */
	open?: boolean;

	/** The default open state of the dropdown menu. Used when the open state is uncontrolled. */
	defaultOpen?: boolean;

	/** Callback triggered when the open state of the dropdown menu changes. */
	onOpenChange?(open: boolean): void;

	/** When true, the dropdown menu behaves as a modal, blocking interaction with other elements on the page. Defaults to true. */
	modal?: boolean;
}

/**
 * DropdownMenu component for displaying a menu of options
 *
 * The DropdownMenu component provides a way to show a list of options or actions in a compact, expandable format. It's typically triggered by a button and can contain various types of menu items, including nested submenus.
 *
 * Key features:
 * - Customizable trigger element
 * - Support for standard menu items, checkboxes, and radio buttons
 * - Nested submenus for hierarchical options
 * - Keyboard navigation support
 * - Customizable styling through className props
 *
 * Usage considerations:
 * - Use for presenting a list of actions or options related to a specific context
 * - Ensure menu items are clearly labeled and logically grouped
 * - Consider the number of items and use separators or groups to improve readability
 * - Implement keyboard navigation for accessibility
 */
const DropdownMenu: React.FC<DropdownMenuProps> = (
	props: ScopedProps<DropdownMenuProps>,
) => {
	const {
		__scopeDropdownMenu,
		children,
		dir,
		open: openProp,
		defaultOpen,
		onOpenChange,
		modal = true,
	} = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	const triggerRef = React.useRef<HTMLButtonElement>(null);
	const [open = false, setOpen] = useControllableState({
		prop: openProp,
		defaultProp: defaultOpen,
		onChange: onOpenChange,
	});

	return (
		<DropdownMenuProvider
			scope={__scopeDropdownMenu}
			triggerId={useId()}
			triggerRef={triggerRef}
			contentId={useId()}
			open={open}
			onOpenChange={setOpen}
			onOpenToggle={React.useCallback(
				() => setOpen((prevOpen) => !prevOpen),
				[setOpen],
			)}
			modal={modal}
		>
			<Menu
				{...menuScope}
				open={open}
				onOpenChange={setOpen}
				dir={dir}
				modal={modal}
			>
				{children}
			</Menu>
		</DropdownMenuProvider>
	);
};

DropdownMenu.displayName = DROPDOWN_MENU_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = "DropdownMenuTrigger";

type DropdownMenuTriggerElement = React.ComponentRef<typeof Primitive.button>;
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<
	typeof Primitive.button
>;
type DropdownMenuTriggerProps = PrimitiveButtonProps;

/**
 * DropdownMenuTrigger component for opening the dropdown menu
 *
 * This component renders a button that toggles the visibility of the associated DropdownMenuContent when clicked. It automatically handles the open/close state of the dropdown menu.
 */
const DropdownMenuTrigger = React.forwardRef<
	DropdownMenuTriggerElement,
	DropdownMenuTriggerProps
>((props: ScopedProps<DropdownMenuTriggerProps>, forwardedRef) => {
	const { __scopeDropdownMenu, disabled = false, ...triggerProps } = props;
	const context = useDropdownMenuContext(TRIGGER_NAME, __scopeDropdownMenu);
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return (
		<MenuAnchor asChild {...menuScope}>
			<Primitive.button
				type="button"
				id={context.triggerId}
				aria-haspopup="menu"
				aria-expanded={context.open}
				aria-controls={context.open ? context.contentId : undefined}
				data-state={context.open ? "open" : "closed"}
				data-disabled={disabled ? "" : undefined}
				disabled={disabled}
				{...triggerProps}
				ref={composeRefs(forwardedRef, context.triggerRef)}
				onPointerDown={composeEventHandlers(props.onPointerDown, (event) => {
					// only call handler if it's the left button (mousedown gets triggered by all mouse buttons)
					// but not when the control key is pressed (avoiding MacOS right click)
					if (!disabled && event.button === 0 && event.ctrlKey === false) {
						context.onOpenToggle();
						// prevent trigger focusing when opening
						// this allows the content to be given focus without competition
						if (!context.open) {
							event.preventDefault();
						}
					}
				})}
				onKeyDown={composeEventHandlers(props.onKeyDown, (event) => {
					if (disabled) {
						return;
					}
					if (["Enter", " "].includes(event.key)) {
						context.onOpenToggle();
					}
					if (event.key === "ArrowDown") {
						context.onOpenChange(true);
					}
					// prevent keydown from scrolling window / first focused item to execute
					// that keydown (inadvertently closing the menu)
					if (["Enter", " ", "ArrowDown"].includes(event.key)) {
						event.preventDefault();
					}
				})}
			/>
		</MenuAnchor>
	);
});

DropdownMenuTrigger.displayName = TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuPortal
 * -----------------------------------------------------------------------------------------------*/

const PORTAL_NAME = "DropdownMenuPortal";

type MenuPortalProps = React.ComponentPropsWithoutRef<typeof MenuPortal>;
type DropdownMenuPortalProps = MenuPortalProps;

const DropdownMenuPortal: React.FC<DropdownMenuPortalProps> = (
	props: ScopedProps<DropdownMenuPortalProps>,
) => {
	const { __scopeDropdownMenu, ...portalProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return <MenuPortal {...menuScope} {...portalProps} />;
};

DropdownMenuPortal.displayName = PORTAL_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "DropdownMenuContent";

type DropdownMenuContentElement = React.ComponentRef<
	typeof MenuContentPrimitive
>;
type MenuContentProps = React.ComponentPropsWithoutRef<
	typeof MenuContentPrimitive
>;
type DropdownMenuContentProps = Omit<MenuContentProps, "onEntryFocus">;

const DropdownMenuContentPrimitive = React.forwardRef<
	DropdownMenuContentElement,
	DropdownMenuContentProps
>((props: ScopedProps<DropdownMenuContentProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...contentProps } = props;
	const context = useDropdownMenuContext(CONTENT_NAME, __scopeDropdownMenu);
	const menuScope = useMenuScope(__scopeDropdownMenu);
	const hasInteractedOutsideRef = React.useRef(false);

	return (
		<MenuContentPrimitive
			id={context.contentId}
			aria-labelledby={context.triggerId}
			{...menuScope}
			{...contentProps}
			ref={forwardedRef}
			onCloseAutoFocus={composeEventHandlers(
				props.onCloseAutoFocus,
				(event) => {
					if (!hasInteractedOutsideRef.current) {
						context.triggerRef.current?.focus();
					}
					hasInteractedOutsideRef.current = false;
					// Always prevent auto focus because we either focus manually or want user agent focus
					event.preventDefault();
				},
			)}
			onInteractOutside={composeEventHandlers(
				props.onInteractOutside,
				(event) => {
					const originalEvent = event.detail.originalEvent as PointerEvent;
					const ctrlLeftClick =
						originalEvent.button === 0 && originalEvent.ctrlKey === true;
					const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
					if (!context.modal || isRightClick) {
						hasInteractedOutsideRef.current = true;
					}
				},
			)}
			style={{
				...props.style,
				// re-namespace exposed content custom properties
				...{
					"--jsandy-dropdown-menu-content-transform-origin":
						"var(--jsandy-popper-transform-origin)",
					"--jsandy-dropdown-menu-content-available-width":
						"var(--jsandy-popper-available-width)",
					"--jsandy-dropdown-menu-content-available-height":
						"var(--jsandy-popper-available-height)",
					"--jsandy-dropdown-menu-trigger-width":
						"var(--jsandy-popper-anchor-width)",
					"--jsandy-dropdown-menu-trigger-height":
						"var(--jsandy-popper-anchor-height)",
				},
			}}
		/>
	);
});

DropdownMenuContentPrimitive.displayName = CONTENT_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuGroup
 * -----------------------------------------------------------------------------------------------*/

const GROUP_NAME = "DropdownMenuGroup";

type DropdownMenuGroupElement = React.ComponentRef<typeof MenuGroup>;
type MenuGroupProps = React.ComponentPropsWithoutRef<typeof MenuGroup>;
type DropdownMenuGroupProps = MenuGroupProps;

const DropdownMenuGroup = React.forwardRef<
	DropdownMenuGroupElement,
	DropdownMenuGroupProps
>((props: ScopedProps<DropdownMenuGroupProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...groupProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return <MenuGroup {...menuScope} {...groupProps} ref={forwardedRef} />;
});

DropdownMenuGroup.displayName = GROUP_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuLabel
 * -----------------------------------------------------------------------------------------------*/

const LABEL_NAME = "DropdownMenuLabel";

type DropdownMenuLabelElement = React.ComponentRef<typeof MenuLabelPrimitive>;
type MenuLabelProps = React.ComponentPropsWithoutRef<typeof MenuLabelPrimitive>;
type DropdownMenuLabelProps = MenuLabelProps;

const DropdownMenuLabelPrimitive = React.forwardRef<
	DropdownMenuLabelElement,
	DropdownMenuLabelProps
>((props: ScopedProps<DropdownMenuLabelProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...labelProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return (
		<MenuLabelPrimitive {...menuScope} {...labelProps} ref={forwardedRef} />
	);
});

DropdownMenuLabelPrimitive.displayName = LABEL_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuItem
 * -----------------------------------------------------------------------------------------------*/

const ITEM_NAME = "DropdownMenuItem";

type DropdownMenuItemElement = React.ComponentRef<typeof MenuItemPrimitive>;
type MenuItemProps = React.ComponentPropsWithoutRef<typeof MenuItemPrimitive>;
type DropdownMenuItemProps = MenuItemProps;

const DropdownMenuItemPrimitive = React.forwardRef<
	DropdownMenuItemElement,
	DropdownMenuItemProps
>((props: ScopedProps<DropdownMenuItemProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...itemProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return <MenuItemPrimitive {...menuScope} {...itemProps} ref={forwardedRef} />;
});

DropdownMenuItemPrimitive.displayName = ITEM_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuCheckboxItem
 * -----------------------------------------------------------------------------------------------*/

const CHECKBOX_ITEM_NAME = "DropdownMenuCheckboxItem";

type DropdownMenuCheckboxItemElement = React.ComponentRef<
	typeof MenuCheckboxItemPrimitive
>;
type MenuCheckboxItemProps = React.ComponentPropsWithoutRef<
	typeof MenuCheckboxItemPrimitive
>;
type DropdownMenuCheckboxItemProps = MenuCheckboxItemProps;

const DropdownMenuCheckboxItemPrimitive = React.forwardRef<
	DropdownMenuCheckboxItemElement,
	DropdownMenuCheckboxItemProps
>((props: ScopedProps<DropdownMenuCheckboxItemProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...checkboxItemProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return (
		<MenuCheckboxItemPrimitive
			{...menuScope}
			{...checkboxItemProps}
			onSelect={composeEventHandlers(props.onSelect, (event) =>
				event.preventDefault(),
			)}
			ref={forwardedRef}
		/>
	);
});

DropdownMenuCheckboxItemPrimitive.displayName = CHECKBOX_ITEM_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuRadioGroup
 * -----------------------------------------------------------------------------------------------*/

const RADIO_GROUP_NAME = "DropdownMenuRadioGroup";

type DropdownMenuRadioGroupElement = React.ComponentRef<typeof MenuRadioGroup>;
type MenuRadioGroupProps = React.ComponentPropsWithoutRef<
	typeof MenuRadioGroup
>;
type DropdownMenuRadioGroupProps = MenuRadioGroupProps;

/**
 * DropdownMenuRadioGroup component for grouping radio items in the dropdown menu.
 *
 * This component renders a group of radio buttons within the dropdown menu, allowing users to select one option from a set.
 * It automatically manages the selection state of the radio buttons and ensures only one option can be selected at a time.
 */
const DropdownMenuRadioGroup = React.forwardRef<
	DropdownMenuRadioGroupElement,
	DropdownMenuRadioGroupProps
>((props: ScopedProps<DropdownMenuRadioGroupProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...radioGroupProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return (
		<MenuRadioGroup {...menuScope} {...radioGroupProps} ref={forwardedRef} />
	);
});

DropdownMenuRadioGroup.displayName = RADIO_GROUP_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuRadioItem
 * -----------------------------------------------------------------------------------------------*/

const RADIO_ITEM_NAME = "DropdownMenuRadioItem";

type DropdownMenuRadioItemElement = React.ComponentRef<
	typeof MenuRadioItemPrimitive
>;
type MenuRadioItemProps = React.ComponentPropsWithoutRef<
	typeof MenuRadioItemPrimitive
>;
type DropdownMenuRadioItemProps = MenuRadioItemProps;

const DropdownMenuRadioItemPrimitive = React.forwardRef<
	DropdownMenuRadioItemElement,
	DropdownMenuRadioItemProps
>((props: ScopedProps<DropdownMenuRadioItemProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...radioItemProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return (
		<MenuRadioItemPrimitive
			{...menuScope}
			{...radioItemProps}
			onSelect={composeEventHandlers(props.onSelect, (event) =>
				event.preventDefault(),
			)}
			ref={forwardedRef}
		/>
	);
});

DropdownMenuRadioItemPrimitive.displayName = RADIO_ITEM_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuItemIndicator
 * -----------------------------------------------------------------------------------------------*/

const INDICATOR_NAME = "DropdownMenuItemIndicator";

type DropdownMenuItemIndicatorElement = React.ComponentRef<
	typeof MenuItemIndicator
>;
type MenuItemIndicatorProps = React.ComponentPropsWithoutRef<
	typeof MenuItemIndicator
>;
type DropdownMenuItemIndicatorProps = MenuItemIndicatorProps;

/**
 * DropdownMenuItemIndicator component for displaying an indicator in the dropdown menu item.
 *
 * This component renders an indicator (such as a checkmark or dot) next to the selected or active item within the dropdown menu.
 * It helps to visually signify which item is currently selected or activated, providing better feedback to the user.
 */
const DropdownMenuItemIndicator = React.forwardRef<
	DropdownMenuItemIndicatorElement,
	DropdownMenuItemIndicatorProps
>((props: ScopedProps<DropdownMenuItemIndicatorProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...itemIndicatorProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return (
		<MenuItemIndicator
			{...menuScope}
			{...itemIndicatorProps}
			ref={forwardedRef}
		/>
	);
});

DropdownMenuItemIndicator.displayName = INDICATOR_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSeparator
 * -----------------------------------------------------------------------------------------------*/

const SEPARATOR_NAME = "DropdownMenuSeparator";

type DropdownMenuSeparatorElement = React.ComponentRef<
	typeof MenuSeparatorPrimitive
>;
type MenuSeparatorProps = React.ComponentPropsWithoutRef<
	typeof MenuSeparatorPrimitive
>;
type DropdownMenuSeparatorProps = MenuSeparatorProps;

const DropdownMenuSeparatorPrimitive = React.forwardRef<
	DropdownMenuSeparatorElement,
	DropdownMenuSeparatorProps
>((props: ScopedProps<DropdownMenuSeparatorProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...separatorProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return (
		<MenuSeparatorPrimitive
			{...menuScope}
			{...separatorProps}
			ref={forwardedRef}
		/>
	);
});

DropdownMenuSeparatorPrimitive.displayName = SEPARATOR_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuArrow
 * -----------------------------------------------------------------------------------------------*/

const ARROW_NAME = "DropdownMenuArrow";

type DropdownMenuArrowElement = React.ComponentRef<typeof MenuArrow>;
type MenuArrowProps = React.ComponentPropsWithoutRef<typeof MenuArrow>;
type DropdownMenuArrowProps = MenuArrowProps;

/**
 * DropdownMenuArrow component for rendering an arrow pointing to the trigger element.
 *
 * This component displays an arrow that visually connects the dropdown menu content to its trigger element.
 * It enhances the user interface by indicating the origin of the dropdown menu and is typically positioned at the edge of the dropdown content.
 */
const DropdownMenuArrow = React.forwardRef<
	DropdownMenuArrowElement,
	DropdownMenuArrowProps
>((props: ScopedProps<DropdownMenuArrowProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...arrowProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return <MenuArrow {...menuScope} {...arrowProps} ref={forwardedRef} />;
});

DropdownMenuArrow.displayName = ARROW_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSub
 * -----------------------------------------------------------------------------------------------*/

interface DropdownMenuSubProps {
	/** The content to be rendered inside the dropdown menu subcomponent. */
	children?: React.ReactNode;

	/** Controls whether the dropdown submenu is open. */
	open?: boolean;

	/** The default open state of the dropdown submenu. Used when the open state is uncontrolled. */
	defaultOpen?: boolean;

	/** Callback triggered when the open state of the dropdown submenu changes. */
	onOpenChange?(open: boolean): void;
}

/**
 * DropdownMenuSub component for rendering a nested dropdown menu.
 *
 * This component provides functionality for creating a nested dropdown menu within a parent dropdown. It manages the open and close states of the submenu, allowing users to navigate through multiple levels of dropdown options.
 */
const DropdownMenuSub: React.FC<DropdownMenuSubProps> = (
	props: ScopedProps<DropdownMenuSubProps>,
) => {
	const {
		__scopeDropdownMenu,
		children,
		open: openProp,
		onOpenChange,
		defaultOpen,
	} = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	const [open = false, setOpen] = useControllableState({
		prop: openProp,
		defaultProp: defaultOpen,
		onChange: onOpenChange,
	});

	return (
		<MenuSub {...menuScope} open={open} onOpenChange={setOpen}>
			{children}
		</MenuSub>
	);
};

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubTrigger
 * -----------------------------------------------------------------------------------------------*/

const SUB_TRIGGER_NAME = "DropdownMenuSubTrigger";

type DropdownMenuSubTriggerElement = React.ComponentRef<
	typeof MenuSubTriggerPrimitive
>;
type MenuSubTriggerProps = React.ComponentPropsWithoutRef<
	typeof MenuSubTriggerPrimitive
>;
type DropdownMenuSubTriggerProps = MenuSubTriggerProps;

const DropdownMenuSubTriggerPrimitive = React.forwardRef<
	DropdownMenuSubTriggerElement,
	DropdownMenuSubTriggerProps
>((props: ScopedProps<DropdownMenuSubTriggerProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...subTriggerProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);
	return (
		<MenuSubTriggerPrimitive
			{...menuScope}
			{...subTriggerProps}
			ref={forwardedRef}
		/>
	);
});

DropdownMenuSubTriggerPrimitive.displayName = SUB_TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubContent
 * -----------------------------------------------------------------------------------------------*/

const SUB_CONTENT_NAME = "DropdownMenuSubContent";

type DropdownMenuSubContentElement = React.ComponentRef<
	typeof MenuContentPrimitive
>;
type MenuSubContentProps = React.ComponentPropsWithoutRef<
	typeof MenuSubContentPrimitive
>;
type DropdownMenuSubContentProps = MenuSubContentProps;

const DropdownMenuSubContentPrimitive = React.forwardRef<
	DropdownMenuSubContentElement,
	DropdownMenuSubContentProps
>((props: ScopedProps<DropdownMenuSubContentProps>, forwardedRef) => {
	const { __scopeDropdownMenu, ...subContentProps } = props;
	const menuScope = useMenuScope(__scopeDropdownMenu);

	return (
		<MenuSubContentPrimitive
			{...menuScope}
			{...subContentProps}
			ref={forwardedRef}
			style={{
				...props.style,
				// re-namespace exposed content custom properties
				...{
					"--jsandy-dropdown-menu-content-transform-origin":
						"var(--jsandy-popper-transform-origin)",
					"--jsandy-dropdown-menu-content-available-width":
						"var(--jsandy-popper-available-width)",
					"--jsandy-dropdown-menu-content-available-height":
						"var(--jsandy-popper-available-height)",
					"--jsandy-dropdown-menu-trigger-width":
						"var(--jsandy-popper-anchor-width)",
					"--jsandy-dropdown-menu-trigger-height":
						"var(--jsandy-popper-anchor-height)",
				},
			}}
		/>
	);
});

DropdownMenuSubContentPrimitive.displayName = SUB_CONTENT_NAME;

/* -----------------------------------------------------------------------------------------------*/

/**
 * DropdownMenuSubTrigger component for opening a nested dropdown menu.
 *
 * This component renders an interactive element that triggers the display of a nested submenu when clicked or hovered over.
 * It is used in conjunction with `DropdownMenuSub` to allow for hierarchical dropdown navigation.
 */

const DropdownMenuSubTrigger = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuSubTriggerPrimitive>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuSubTriggerPrimitive> & {
		inset?: boolean;
	}
>(({ className, inset, children, ...props }, ref) => (
	<DropdownMenuSubTriggerPrimitive
		ref={ref}
		className={cn(
			"flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent data-[state=open]:bg-accent",
			inset && "pl-8",
			className,
		)}
		{...props}
	>
		{children}
		<ChevronRight className="ml-auto h-4 w-4" />
	</DropdownMenuSubTriggerPrimitive>
));
DropdownMenuSubTrigger.displayName =
	DropdownMenuSubTriggerPrimitive.displayName;

/**
 * DropdownMenuSubContent component for displaying the content of a nested dropdown menu.
 *
 * This component renders the content of a nested dropdown submenu. It appears when the `DropdownMenuSubTrigger` is activated and allows users to interact with deeper menu options.
 */
const DropdownMenuSubContent = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuSubContentPrimitive>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuSubContentPrimitive>
>(({ className, ...props }, ref) => (
	<DropdownMenuSubContentPrimitive
		ref={ref}
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		{...props}
	/>
));
DropdownMenuSubContent.displayName =
	DropdownMenuSubContentPrimitive.displayName;

/**
 * DropdownMenuContent component for rendering the main dropdown menu content.
 *
 * This component is responsible for displaying the options within the dropdown menu. It handles layout, positioning, and any interactive items contained within the menu, such as buttons or links.
 */
const DropdownMenuContent = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuContentPrimitive>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuContentPrimitive>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<DropdownMenuPortal>
		<DropdownMenuContentPrimitive
			ref={ref}
			sideOffset={sideOffset}
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			{...props}
		/>
	</DropdownMenuPortal>
));
DropdownMenuContent.displayName = DropdownMenuContentPrimitive.displayName;

/**
 * DropdownMenuItem component for rendering an individual selectable item in the dropdown menu.
 *
 * This component renders a clickable or tappable item within the dropdown menu. It can be used to represent actions, links, or any other selectable options in the menu.
 */
const DropdownMenuItem = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuItemPrimitive>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuItemPrimitive> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<DropdownMenuItemPrimitive
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
			inset && "pl-8",
			className,
		)}
		{...props}
	/>
));
DropdownMenuItem.displayName = DropdownMenuItemPrimitive.displayName;

/**
 * DropdownMenuCheckboxItem component for rendering an item with a checkbox in the dropdown menu.
 *
 * This component displays a checkbox next to the dropdown item, allowing users to select or deselect the item. It is useful for multi-select options within the dropdown menu.
 */
const DropdownMenuCheckboxItem = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuCheckboxItemPrimitive>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuCheckboxItemPrimitive>
>(({ className, children, checked, ...props }, ref) => (
	<DropdownMenuCheckboxItemPrimitive
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
			className,
		)}
		checked={checked}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuItemIndicator>
				<Check className="h-4 w-4" />
			</DropdownMenuItemIndicator>
		</span>
		{children}
	</DropdownMenuCheckboxItemPrimitive>
));
DropdownMenuCheckboxItem.displayName =
	DropdownMenuCheckboxItemPrimitive.displayName;

/**
 * DropdownMenuRadioItem component for rendering a radio button item in the dropdown menu.
 *
 * This component displays a radio button next to the dropdown item, allowing users to select a single option from a group of mutually exclusive choices.
 */
const DropdownMenuRadioItem = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuRadioItemPrimitive>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuRadioItemPrimitive>
>(({ className, children, ...props }, ref) => (
	<DropdownMenuRadioItemPrimitive
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
			className,
		)}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<DropdownMenuItemIndicator>
				<Circle className="h-2 w-2 fill-current" />
			</DropdownMenuItemIndicator>
		</span>
		{children}
	</DropdownMenuRadioItemPrimitive>
));
DropdownMenuRadioItem.displayName = DropdownMenuRadioItemPrimitive.displayName;

/**
 * DropdownMenuLabel component for displaying a non-interactive label within the dropdown menu.
 *
 * This component renders a label or title for a section of the dropdown menu, providing a way to group related items or add context to the options presented.
 */
const DropdownMenuLabel = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuLabelPrimitive>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuLabelPrimitive> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<DropdownMenuLabelPrimitive
		ref={ref}
		className={cn(
			"px-2 py-1.5 font-semibold text-sm",
			inset && "pl-8",
			className,
		)}
		{...props}
	/>
));
DropdownMenuLabel.displayName = DropdownMenuLabelPrimitive.displayName;

/**
 * DropdownMenuSeparator component for creating a visual divider between dropdown menu items.
 *
 * This component renders a horizontal separator line that helps to visually separate groups of items or actions within the dropdown menu.
 */
const DropdownMenuSeparator = React.forwardRef<
	React.ComponentRef<typeof DropdownMenuSeparatorPrimitive>,
	React.ComponentPropsWithoutRef<typeof DropdownMenuSeparatorPrimitive>
>(({ className, ...props }, ref) => (
	<DropdownMenuSeparatorPrimitive
		ref={ref}
		className={cn("-mx-1 my-1 h-px bg-muted", className)}
		{...props}
	/>
));
DropdownMenuSeparator.displayName = DropdownMenuSeparatorPrimitive.displayName;

/**
 * DropdownMenuShortcut component for displaying keyboard shortcuts next to dropdown menu items.
 *
 * This component is used to show the keyboard shortcut associated with a menu item, providing users with quick visual cues on how to perform the action using the keyboard.
 */
const DropdownMenuShortcut = ({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
			{...props}
		/>
	);
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
	createDropdownMenuScope,
	//
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuPortal,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuItemIndicator,
	DropdownMenuSeparator,
	DropdownMenuArrow,
	DropdownMenuSub,
	DropdownMenuSubTrigger,
	DropdownMenuSubContent,
	DropdownMenuShortcut,
};
export type {
	DropdownMenuProps,
	DropdownMenuTriggerProps,
	DropdownMenuPortalProps,
	DropdownMenuContentProps,
	DropdownMenuGroupProps,
	DropdownMenuLabelProps,
	DropdownMenuItemProps,
	DropdownMenuCheckboxItemProps,
	DropdownMenuRadioGroupProps,
	DropdownMenuRadioItemProps,
	DropdownMenuItemIndicatorProps,
	DropdownMenuSeparatorProps,
	DropdownMenuArrowProps,
	DropdownMenuSubProps,
	DropdownMenuSubTriggerProps,
	DropdownMenuSubContentProps,
};
