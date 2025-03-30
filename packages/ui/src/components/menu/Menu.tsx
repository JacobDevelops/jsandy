import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@jsandy/ui/cn";
import { createCollection } from "@jsandy/ui/collection";
import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { composeRefs, useComposedRefs } from "@jsandy/ui/compose-refs";
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
import { Primitive, dispatchDiscreteCustomEvent } from "@jsandy/ui/primitive";
import {
	RovingFocusGroup,
	RovingFocusGroupItem,
	createRovingFocusGroupScope,
} from "@jsandy/ui/roving-focus";
import { Slot } from "@jsandy/ui/slot";
import { useCallbackRef } from "@jsandy/ui/use-callback-ref";
import { useDirection } from "@jsandy/ui/use-direction";
import { useId } from "@jsandy/ui/use-id";
import { hideOthers } from "aria-hidden";
import * as React from "react";
import { RemoveScroll } from "react-remove-scroll";

type Direction = "ltr" | "rtl";

const SELECTION_KEYS = ["Enter", " "];
const FIRST_KEYS = ["ArrowDown", "PageUp", "Home"];
const LAST_KEYS = ["ArrowUp", "PageDown", "End"];
const FIRST_LAST_KEYS = [...FIRST_KEYS, ...LAST_KEYS];
const SUB_OPEN_KEYS: Record<Direction, string[]> = {
	ltr: [...SELECTION_KEYS, "ArrowRight"],
	rtl: [...SELECTION_KEYS, "ArrowLeft"],
};
const SUB_CLOSE_KEYS: Record<Direction, string[]> = {
	ltr: ["ArrowLeft"],
	rtl: ["ArrowRight"],
};

/* -------------------------------------------------------------------------------------------------
 * Menu
 * -----------------------------------------------------------------------------------------------*/

const MENU_NAME = "Menu";

type ItemData = { disabled: boolean; textValue: string };
const [Collection, useCollection, createCollectionScope] = createCollection<
	MenuItemElement,
	ItemData
>(MENU_NAME);

type ScopedProps<P> = P & { __scopeMenu?: Scope };
const [createMenuContext, createMenuScope] = createContextScope(MENU_NAME, [
	createCollectionScope,
	createPopperScope,
	createRovingFocusGroupScope,
]);
const usePopperScope = createPopperScope();
const useRovingFocusGroupScope = createRovingFocusGroupScope();

type MenuContextValue = {
	open: boolean;
	onOpenChange(open: boolean): void;
	content: MenuContentElement | null;
	onContentChange(content: MenuContentElement | null): void;
};

const [MenuProvider, useMenuContext] =
	createMenuContext<MenuContextValue>(MENU_NAME);

type MenuRootContextValue = {
	onClose(): void;
	isUsingKeyboardRef: React.RefObject<boolean>;
	dir: Direction;
	modal: boolean;
};

const [MenuRootProvider, useMenuRootContext] =
	createMenuContext<MenuRootContextValue>(MENU_NAME);

interface MenuProps {
	children?: React.ReactNode;
	open?: boolean;
	onOpenChange?(open: boolean): void;
	dir?: Direction;
	modal?: boolean;
}

const Menu: React.FC<MenuProps> = (props: ScopedProps<MenuProps>) => {
	const {
		__scopeMenu,
		open = false,
		children,
		dir,
		onOpenChange,
		modal = true,
	} = props;
	const popperScope = usePopperScope(__scopeMenu);
	const [content, setContent] = React.useState<MenuContentElement | null>(null);
	const isUsingKeyboardRef = React.useRef(false);
	const handleOpenChange = useCallbackRef(onOpenChange);
	const direction = useDirection(dir);

	React.useEffect(() => {
		// Capture phase ensures we set the boolean before any side effects execute
		// in response to the key or pointer event as they might depend on this value.
		const handleKeyDown = () => {
			isUsingKeyboardRef.current = true;
			document.addEventListener("pointerdown", handlePointer, {
				capture: true,
				once: true,
			});
			document.addEventListener("pointermove", handlePointer, {
				capture: true,
				once: true,
			});
		};
		// biome-ignore lint/suspicious/noAssignInExpressions: This is a workaround for a bug in React
		const handlePointer = () => (isUsingKeyboardRef.current = false);
		document.addEventListener("keydown", handleKeyDown, { capture: true });
		return () => {
			document.removeEventListener("keydown", handleKeyDown, { capture: true });
			document.removeEventListener("pointerdown", handlePointer, {
				capture: true,
			});
			document.removeEventListener("pointermove", handlePointer, {
				capture: true,
			});
		};
	}, []);

	return (
		<Popper {...popperScope}>
			<MenuProvider
				scope={__scopeMenu}
				open={open}
				onOpenChange={handleOpenChange}
				content={content}
				onContentChange={setContent}
			>
				<MenuRootProvider
					scope={__scopeMenu}
					onClose={React.useCallback(
						() => handleOpenChange(false),
						[handleOpenChange],
					)}
					isUsingKeyboardRef={isUsingKeyboardRef}
					dir={direction}
					modal={modal}
				>
					{children}
				</MenuRootProvider>
			</MenuProvider>
		</Popper>
	);
};

Menu.displayName = MENU_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuAnchor
 * -----------------------------------------------------------------------------------------------*/

const ANCHOR_NAME = "MenuAnchor";

type MenuAnchorElement = React.ComponentRef<typeof PopperAnchor>;
type PopperAnchorProps = React.ComponentPropsWithoutRef<typeof PopperAnchor>;
type MenuAnchorProps = PopperAnchorProps;

const MenuAnchor = React.forwardRef<MenuAnchorElement, MenuAnchorProps>(
	(props: ScopedProps<MenuAnchorProps>, forwardedRef) => {
		const { __scopeMenu, ...anchorProps } = props;
		const popperScope = usePopperScope(__scopeMenu);
		return (
			<PopperAnchor {...popperScope} {...anchorProps} ref={forwardedRef} />
		);
	},
);

MenuAnchor.displayName = ANCHOR_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuPortal
 * -----------------------------------------------------------------------------------------------*/

const PORTAL_NAME = "MenuPortal";

type PortalContextValue = { forceMount?: true };
const [PortalProvider, usePortalContext] =
	createMenuContext<PortalContextValue>(PORTAL_NAME, {
		forceMount: undefined,
	});

type PortalProps = React.ComponentPropsWithoutRef<typeof PortalPrimitive>;
interface MenuPortalProps {
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

const MenuPortal: React.FC<MenuPortalProps> = (
	props: ScopedProps<MenuPortalProps>,
) => {
	const { __scopeMenu, forceMount, children, container } = props;
	const context = useMenuContext(PORTAL_NAME, __scopeMenu);
	return (
		<PortalProvider scope={__scopeMenu} forceMount={forceMount}>
			<Presence present={forceMount || context.open}>
				<PortalPrimitive asChild container={container}>
					{children}
				</PortalPrimitive>
			</Presence>
		</PortalProvider>
	);
};

MenuPortal.displayName = PORTAL_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = "MenuContent";

type MenuContentContextValue = {
	onItemEnter(event: React.PointerEvent): void;
	onItemLeave(event: React.PointerEvent): void;
	onTriggerLeave(event: React.PointerEvent): void;
	searchRef: React.RefObject<string>;
	pointerGraceTimerRef: React.RefObject<number>;
	onPointerGraceIntentChange(intent: GraceIntent | null): void;
};
const [MenuContentProvider, useMenuContentContext] =
	createMenuContext<MenuContentContextValue>(CONTENT_NAME);

type MenuContentElement = MenuRootContentTypeElement;
/**
 * We purposefully don't union MenuRootContent and MenuSubContent props here because
 * they have conflicting prop types. We agreed that we would allow MenuSubContent to
 * accept props that it would just ignore.
 */
interface MenuContentProps extends MenuRootContentTypeProps {
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

const MenuContentPrimitive = React.forwardRef<
	MenuContentElement,
	MenuContentProps
>((props: ScopedProps<MenuContentProps>, forwardedRef) => {
	const portalContext = usePortalContext(CONTENT_NAME, props.__scopeMenu);
	const { forceMount = portalContext.forceMount, ...contentProps } = props;
	const context = useMenuContext(CONTENT_NAME, props.__scopeMenu);
	const rootContext = useMenuRootContext(CONTENT_NAME, props.__scopeMenu);

	return (
		<Collection.Provider scope={props.__scopeMenu}>
			<Presence present={forceMount || context.open}>
				<Collection.Slot scope={props.__scopeMenu}>
					{rootContext.modal ? (
						<MenuRootContentModal {...contentProps} ref={forwardedRef} />
					) : (
						<MenuRootContentNonModal {...contentProps} ref={forwardedRef} />
					)}
				</Collection.Slot>
			</Presence>
		</Collection.Provider>
	);
});

/* ---------------------------------------------------------------------------------------------- */

type MenuRootContentTypeElement = MenuContentImplElement;
type MenuRootContentTypeProps = Omit<
	MenuContentImplProps,
	keyof MenuContentImplPrivateProps
>;

const MenuRootContentModal = React.forwardRef<
	MenuRootContentTypeElement,
	MenuRootContentTypeProps
>((props: ScopedProps<MenuRootContentTypeProps>, forwardedRef) => {
	const context = useMenuContext(CONTENT_NAME, props.__scopeMenu);
	const ref = React.useRef<MenuRootContentTypeElement>(null);
	const composedRefs = useComposedRefs(forwardedRef, ref);

	// Hide everything from ARIA except the `MenuContent`
	React.useEffect(() => {
		const content = ref.current;
		if (content) return hideOthers(content);
	}, []);

	return (
		<MenuContentImpl
			{...props}
			ref={composedRefs}
			// we make sure we're not trapping once it's been closed
			// (closed !== unmounted when animating out)
			trapFocus={context.open}
			// make sure to only disable pointer events when open
			// this avoids blocking interactions while animating out
			disableOutsidePointerEvents={context.open}
			disableOutsideScroll
			// When focus is trapped, a `focusout` event may still happen.
			// We make sure we don't trigger our `onDismiss` in such case.
			onFocusOutside={composeEventHandlers(
				props.onFocusOutside,
				(event) => event.preventDefault(),
				{ checkForDefaultPrevented: false },
			)}
			onDismiss={() => context.onOpenChange(false)}
		/>
	);
});

const MenuRootContentNonModal = React.forwardRef<
	MenuRootContentTypeElement,
	MenuRootContentTypeProps
>((props: ScopedProps<MenuRootContentTypeProps>, forwardedRef) => {
	const context = useMenuContext(CONTENT_NAME, props.__scopeMenu);
	return (
		<MenuContentImpl
			{...props}
			ref={forwardedRef}
			trapFocus={false}
			disableOutsidePointerEvents={false}
			disableOutsideScroll={false}
			onDismiss={() => context.onOpenChange(false)}
		/>
	);
});

/* ---------------------------------------------------------------------------------------------- */

type MenuContentImplElement = React.ComponentRef<typeof PopperContent>;
type FocusScopeProps = React.ComponentPropsWithoutRef<typeof FocusScope>;
type DismissableLayerProps = React.ComponentPropsWithoutRef<
	typeof DismissableLayer
>;
type RovingFocusGroupProps = React.ComponentPropsWithoutRef<
	typeof RovingFocusGroup
>;
type PopperContentProps = React.ComponentPropsWithoutRef<typeof PopperContent>;
type MenuContentImplPrivateProps = {
	onOpenAutoFocus?: FocusScopeProps["onMountAutoFocus"];
	onDismiss?: DismissableLayerProps["onDismiss"];
	disableOutsidePointerEvents?: DismissableLayerProps["disableOutsidePointerEvents"];

	/**
	 * Whether scrolling outside the `MenuContent` should be prevented
	 * (default: `false`)
	 */
	disableOutsideScroll?: boolean;

	/**
	 * Whether focus should be trapped within the `MenuContent`
	 * (default: false)
	 */
	trapFocus?: FocusScopeProps["trapped"];
};
interface MenuContentImplProps
	extends MenuContentImplPrivateProps,
		Omit<PopperContentProps, "dir" | "onPlaced"> {
	/**
	 * Event handler called when auto-focusing on close.
	 * Can be prevented.
	 */
	onCloseAutoFocus?: FocusScopeProps["onUnmountAutoFocus"];

	/**
	 * Whether keyboard navigation should loop around
	 * @defaultValue false
	 */
	loop?: RovingFocusGroupProps["loop"];

	onEntryFocus?: RovingFocusGroupProps["onEntryFocus"];
	onEscapeKeyDown?: DismissableLayerProps["onEscapeKeyDown"];
	onPointerDownOutside?: DismissableLayerProps["onPointerDownOutside"];
	onFocusOutside?: DismissableLayerProps["onFocusOutside"];
	onInteractOutside?: DismissableLayerProps["onInteractOutside"];
}

const MenuContentImpl = React.forwardRef<
	MenuContentImplElement,
	MenuContentImplProps
>((props: ScopedProps<MenuContentImplProps>, forwardedRef) => {
	const {
		__scopeMenu,
		loop = false,
		trapFocus,
		onOpenAutoFocus,
		onCloseAutoFocus,
		disableOutsidePointerEvents,
		onEntryFocus,
		onEscapeKeyDown,
		onPointerDownOutside,
		onFocusOutside,
		onInteractOutside,
		onDismiss,
		disableOutsideScroll,
		...contentProps
	} = props;
	const context = useMenuContext(CONTENT_NAME, __scopeMenu);
	const rootContext = useMenuRootContext(CONTENT_NAME, __scopeMenu);
	const popperScope = usePopperScope(__scopeMenu);
	const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu);
	const getItems = useCollection(__scopeMenu);
	const [currentItemId, setCurrentItemId] = React.useState<string | null>(null);
	const contentRef = React.useRef<HTMLDivElement>(null);
	const composedRefs = useComposedRefs(
		forwardedRef,
		contentRef,
		context.onContentChange,
	);
	const timerRef = React.useRef(0);
	const searchRef = React.useRef("");
	const pointerGraceTimerRef = React.useRef(0);
	const pointerGraceIntentRef = React.useRef<GraceIntent | null>(null);
	const pointerDirRef = React.useRef<Side>("right");
	const lastPointerXRef = React.useRef(0);

	const ScrollLockWrapper = disableOutsideScroll
		? RemoveScroll
		: React.Fragment;
	const scrollLockWrapperProps = disableOutsideScroll
		? { as: Slot, allowPinchZoom: true }
		: undefined;

	const handleTypeaheadSearch = (key: string) => {
		const search = searchRef.current + key;
		const items = getItems().filter((item) => !item.disabled);
		const currentItem = document.activeElement;
		const currentMatch = items.find(
			(item) => item.ref.current === currentItem,
		)?.textValue;
		const values = items.map((item) => item.textValue);
		const nextMatch = getNextMatch(values, search, currentMatch);
		const newItem = items.find((item) => item.textValue === nextMatch)?.ref
			.current;

		// Reset `searchRef` 1 second after it was last updated
		(function updateSearch(value: string) {
			searchRef.current = value;
			window.clearTimeout(timerRef.current);
			if (value !== "")
				timerRef.current = window.setTimeout(() => updateSearch(""), 1000);
		})(search);

		if (newItem) {
			/**
			 * Imperative focus during keydown is risky so we prevent React's batching updates
			 * to avoid potential bugs. See: https://github.com/facebook/react/issues/20332
			 */
			setTimeout(() => (newItem as HTMLElement).focus());
		}
	};

	React.useEffect(() => {
		return () => window.clearTimeout(timerRef.current);
	}, []);

	// Make sure the whole tree has focus guards as our `MenuContent` may be
	// the last element in the DOM (because of the `Portal`)
	useFocusGuards();

	const isPointerMovingToSubmenu = React.useCallback(
		(event: React.PointerEvent) => {
			const isMovingTowards =
				pointerDirRef.current === pointerGraceIntentRef.current?.side;
			return (
				isMovingTowards &&
				isPointerInGraceArea(event, pointerGraceIntentRef.current?.area)
			);
		},
		[],
	);

	return (
		<MenuContentProvider
			scope={__scopeMenu}
			searchRef={searchRef}
			onItemEnter={React.useCallback(
				(event) => {
					if (isPointerMovingToSubmenu(event)) event.preventDefault();
				},
				[isPointerMovingToSubmenu],
			)}
			onItemLeave={React.useCallback(
				(event) => {
					if (isPointerMovingToSubmenu(event)) return;
					contentRef.current?.focus();
					setCurrentItemId(null);
				},
				[isPointerMovingToSubmenu],
			)}
			onTriggerLeave={React.useCallback(
				(event) => {
					if (isPointerMovingToSubmenu(event)) event.preventDefault();
				},
				[isPointerMovingToSubmenu],
			)}
			pointerGraceTimerRef={pointerGraceTimerRef}
			onPointerGraceIntentChange={React.useCallback((intent) => {
				pointerGraceIntentRef.current = intent;
			}, [])}
		>
			<ScrollLockWrapper {...scrollLockWrapperProps}>
				<FocusScope
					asChild
					trapped={trapFocus}
					onMountAutoFocus={composeEventHandlers(onOpenAutoFocus, (event) => {
						// when opening, explicitly focus the content area only and leave
						// `onEntryFocus` in  control of focusing first item
						event.preventDefault();
						contentRef.current?.focus({ preventScroll: true });
					})}
					onUnmountAutoFocus={onCloseAutoFocus}
				>
					<DismissableLayer
						asChild
						disableOutsidePointerEvents={disableOutsidePointerEvents}
						onEscapeKeyDown={onEscapeKeyDown}
						onPointerDownOutside={onPointerDownOutside}
						onFocusOutside={onFocusOutside}
						onInteractOutside={onInteractOutside}
						onDismiss={onDismiss}
					>
						<RovingFocusGroup
							asChild
							{...rovingFocusGroupScope}
							dir={rootContext.dir}
							orientation="vertical"
							loop={loop}
							currentTabStopId={currentItemId}
							onCurrentTabStopIdChange={setCurrentItemId}
							onEntryFocus={composeEventHandlers(onEntryFocus, (event) => {
								// only focus first item when using keyboard
								if (!rootContext.isUsingKeyboardRef.current)
									event.preventDefault();
							})}
							preventScrollOnEntryFocus
						>
							<PopperContent
								role="menu"
								aria-orientation="vertical"
								data-state={getOpenState(context.open)}
								data-jsandy-menu-content=""
								dir={rootContext.dir}
								{...popperScope}
								{...contentProps}
								ref={composedRefs}
								style={{ outline: "none", ...contentProps.style }}
								onKeyDown={composeEventHandlers(
									contentProps.onKeyDown,
									(event) => {
										// submenu key events bubble through portals. We only care about keys in this menu.
										const target = event.target as HTMLElement;
										const isKeyDownInside =
											target.closest("[data-jsandy-menu-content]") ===
											event.currentTarget;
										const isModifierKey =
											event.ctrlKey || event.altKey || event.metaKey;
										const isCharacterKey = event.key.length === 1;
										if (isKeyDownInside) {
											// menus should not be navigated using tab key so we prevent it
											if (event.key === "Tab") event.preventDefault();
											if (!isModifierKey && isCharacterKey)
												handleTypeaheadSearch(event.key);
										}
										// focus first/last item based on key pressed
										const content = contentRef.current;
										if (event.target !== content) return;
										if (!FIRST_LAST_KEYS.includes(event.key)) return;
										event.preventDefault();
										const items = getItems().filter((item) => !item.disabled);

										const candidateNodes = items
											.map((item) => item.ref.current)
											.filter((node) => node !== null);
										if (LAST_KEYS.includes(event.key)) candidateNodes.reverse();
										focusFirst(candidateNodes);
									},
								)}
								onBlur={composeEventHandlers(props.onBlur, (event) => {
									// clear search buffer when leaving the menu
									if (!event.currentTarget.contains(event.target)) {
										window.clearTimeout(timerRef.current);
										searchRef.current = "";
									}
								})}
								onPointerMove={composeEventHandlers(
									props.onPointerMove,
									whenMouse((event) => {
										const target = event.target as HTMLElement;
										const pointerXHasChanged =
											lastPointerXRef.current !== event.clientX;

										// We don't use `event.movementX` for this check because Safari will
										// always return `0` on a pointer event.
										if (
											event.currentTarget.contains(target) &&
											pointerXHasChanged
										) {
											const newDir =
												event.clientX > lastPointerXRef.current
													? "right"
													: "left";
											pointerDirRef.current = newDir;
											lastPointerXRef.current = event.clientX;
										}
									}),
								)}
							/>
						</RovingFocusGroup>
					</DismissableLayer>
				</FocusScope>
			</ScrollLockWrapper>
		</MenuContentProvider>
	);
});

MenuContentPrimitive.displayName = CONTENT_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuGroup
 * -----------------------------------------------------------------------------------------------*/

const GROUP_NAME = "MenuGroup";

type MenuGroupElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
type MenuGroupProps = PrimitiveDivProps;

const MenuGroup = React.forwardRef<MenuGroupElement, MenuGroupProps>(
	(props: ScopedProps<MenuGroupProps>, forwardedRef) => {
		const { __scopeMenu, ...groupProps } = props;
		return <Primitive.div role="group" {...groupProps} ref={forwardedRef} />;
	},
);

MenuGroup.displayName = GROUP_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuLabel
 * -----------------------------------------------------------------------------------------------*/

const LABEL_NAME = "MenuLabel";

type MenuLabelElement = React.ComponentRef<typeof Primitive.div>;
type MenuLabelProps = PrimitiveDivProps;

const MenuLabelPrimitive = React.forwardRef<MenuLabelElement, MenuLabelProps>(
	(props: ScopedProps<MenuLabelProps>, forwardedRef) => {
		const { __scopeMenu, ...labelProps } = props;
		return <Primitive.div {...labelProps} ref={forwardedRef} />;
	},
);

MenuLabelPrimitive.displayName = LABEL_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuItem
 * -----------------------------------------------------------------------------------------------*/

const ITEM_NAME = "MenuItem";
const ITEM_SELECT = "menu.itemSelect";

type MenuItemElement = MenuItemImplElement;
interface MenuItemProps extends Omit<MenuItemImplProps, "onSelect"> {
	onSelect?: (event: Event) => void;
}

const MenuItemPrimitive = React.forwardRef<MenuItemElement, MenuItemProps>(
	(props: ScopedProps<MenuItemProps>, forwardedRef) => {
		const { disabled = false, onSelect, ...itemProps } = props;
		const ref = React.useRef<HTMLDivElement>(null);
		const rootContext = useMenuRootContext(ITEM_NAME, props.__scopeMenu);
		const contentContext = useMenuContentContext(ITEM_NAME, props.__scopeMenu);
		const composedRefs = useComposedRefs(forwardedRef, ref);
		const isPointerDownRef = React.useRef(false);

		const handleSelect = () => {
			const menuItem = ref.current;
			if (!disabled && menuItem) {
				const itemSelectEvent = new CustomEvent(ITEM_SELECT, {
					bubbles: true,
					cancelable: true,
				});
				menuItem.addEventListener(ITEM_SELECT, (event) => onSelect?.(event), {
					once: true,
				});
				dispatchDiscreteCustomEvent(menuItem, itemSelectEvent);
				if (itemSelectEvent.defaultPrevented) {
					isPointerDownRef.current = false;
				} else {
					rootContext.onClose();
				}
			}
		};

		return (
			<MenuItemImpl
				{...itemProps}
				ref={composedRefs}
				disabled={disabled}
				onClick={composeEventHandlers(props.onClick, handleSelect)}
				onPointerDown={(event) => {
					props.onPointerDown?.(event);
					isPointerDownRef.current = true;
				}}
				onPointerUp={composeEventHandlers(props.onPointerUp, (event) => {
					// Pointer down can move to a different menu item which should activate it on pointer up.
					// We dispatch a click for selection to allow composition with click based triggers and to
					// prevent Firefox from getting stuck in text selection mode when the menu closes.
					if (!isPointerDownRef.current) event.currentTarget?.click();
				})}
				onKeyDown={composeEventHandlers(props.onKeyDown, (event) => {
					const isTypingAhead = contentContext.searchRef.current !== "";
					if (disabled || (isTypingAhead && event.key === " ")) return;
					if (SELECTION_KEYS.includes(event.key)) {
						event.currentTarget.click();
						/**
						 * We prevent default browser behaviour for selection keys as they should trigger
						 * a selection only:
						 * - prevents space from scrolling the page.
						 * - if keydown causes focus to move, prevents keydown from firing on the new target.
						 */
						event.preventDefault();
					}
				})}
			/>
		);
	},
);

MenuItemPrimitive.displayName = ITEM_NAME;

/* ---------------------------------------------------------------------------------------------- */

type MenuItemImplElement = React.ComponentRef<typeof Primitive.div>;
export interface MenuItemImplProps extends PrimitiveDivProps {
	disabled?: boolean;
	textValue?: string;
}

const MenuItemImpl = React.forwardRef<MenuItemImplElement, MenuItemImplProps>(
	(props: ScopedProps<MenuItemImplProps>, forwardedRef) => {
		const { __scopeMenu, disabled = false, textValue, ...itemProps } = props;
		const contentContext = useMenuContentContext(ITEM_NAME, __scopeMenu);
		const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeMenu);
		const ref = React.useRef<HTMLDivElement>(null);
		const composedRefs = useComposedRefs(forwardedRef, ref);
		const [isFocused, setIsFocused] = React.useState(false);

		// get the item's `.textContent` as default strategy for typeahead `textValue`
		const [textContent, setTextContent] = React.useState("");
		React.useEffect(() => {
			const menuItem = ref.current;
			if (menuItem) {
				setTextContent((menuItem.textContent ?? "").trim());
			}
		}, [itemProps.children]);

		return (
			<Collection.ItemSlot
				scope={__scopeMenu}
				disabled={disabled}
				textValue={textValue ?? textContent}
			>
				<RovingFocusGroupItem
					asChild
					{...rovingFocusGroupScope}
					focusable={!disabled}
				>
					<Primitive.div
						role="menuitem"
						data-highlighted={isFocused ? "" : undefined}
						aria-disabled={disabled || undefined}
						data-disabled={disabled ? "" : undefined}
						{...itemProps}
						ref={composedRefs}
						/**
						 * We focus items on `pointerMove` to achieve the following:
						 *
						 * - Mouse over an item (it focuses)
						 * - Leave mouse where it is and use keyboard to focus a different item
						 * - Wiggle mouse without it leaving previously focused item
						 * - Previously focused item should re-focus
						 *
						 * If we used `mouseOver`/`mouseEnter` it would not re-focus when the mouse
						 * wiggles. This is to match native menu implementation.
						 */
						onPointerMove={composeEventHandlers(
							props.onPointerMove,
							whenMouse((event) => {
								if (disabled) {
									contentContext.onItemLeave(event);
								} else {
									contentContext.onItemEnter(event);
									if (!event.defaultPrevented) {
										const item = event.currentTarget;
										item.focus({ preventScroll: true });
									}
								}
							}),
						)}
						onPointerLeave={composeEventHandlers(
							props.onPointerLeave,
							whenMouse((event) => contentContext.onItemLeave(event)),
						)}
						onFocus={composeEventHandlers(props.onFocus, () =>
							setIsFocused(true),
						)}
						onBlur={composeEventHandlers(props.onBlur, () =>
							setIsFocused(false),
						)}
					/>
				</RovingFocusGroupItem>
			</Collection.ItemSlot>
		);
	},
);

/* -------------------------------------------------------------------------------------------------
 * MenuCheckboxItem
 * -----------------------------------------------------------------------------------------------*/

const CHECKBOX_ITEM_NAME = "MenuCheckboxItem";

type MenuCheckboxItemElement = MenuItemElement;

type CheckedState = boolean | "indeterminate";

interface MenuCheckboxItemProps extends MenuItemProps {
	checked?: CheckedState;
	// `onCheckedChange` can never be called with `"indeterminate"` from the inside
	onCheckedChange?: (checked: boolean) => void;
}

const MenuCheckboxItemPrimitive = React.forwardRef<
	MenuCheckboxItemElement,
	MenuCheckboxItemProps
>((props: ScopedProps<MenuCheckboxItemProps>, forwardedRef) => {
	const { checked = false, onCheckedChange, ...checkboxItemProps } = props;
	return (
		<ItemIndicatorProvider scope={props.__scopeMenu} checked={checked}>
			<MenuItem
				role="menuitemcheckbox"
				aria-checked={isIndeterminate(checked) ? "mixed" : checked}
				{...checkboxItemProps}
				ref={forwardedRef}
				data-state={getCheckedState(checked)}
				onSelect={composeEventHandlers(
					checkboxItemProps.onSelect,
					() => onCheckedChange?.(isIndeterminate(checked) ? true : !checked),
					{ checkForDefaultPrevented: false },
				)}
			/>
		</ItemIndicatorProvider>
	);
});

MenuCheckboxItemPrimitive.displayName = CHECKBOX_ITEM_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuRadioGroup
 * -----------------------------------------------------------------------------------------------*/

const RADIO_GROUP_NAME = "MenuRadioGroup";

const [RadioGroupProvider, useRadioGroupContext] =
	createMenuContext<MenuRadioGroupProps>(RADIO_GROUP_NAME, {
		value: undefined,
		onValueChange: () => {},
	});

type MenuRadioGroupElement = React.ComponentRef<typeof MenuGroup>;
interface MenuRadioGroupProps extends MenuGroupProps {
	value?: string;
	onValueChange?: (value: string) => void;
}

const MenuRadioGroup = React.forwardRef<
	MenuRadioGroupElement,
	MenuRadioGroupProps
>((props: ScopedProps<MenuRadioGroupProps>, forwardedRef) => {
	const { value, onValueChange, ...groupProps } = props;
	const handleValueChange = useCallbackRef(onValueChange);
	return (
		<RadioGroupProvider
			scope={props.__scopeMenu}
			value={value}
			onValueChange={handleValueChange}
		>
			<MenuGroup {...groupProps} ref={forwardedRef} />
		</RadioGroupProvider>
	);
});

MenuRadioGroup.displayName = RADIO_GROUP_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuRadioItem
 * -----------------------------------------------------------------------------------------------*/

const RADIO_ITEM_NAME = "MenuRadioItem";

type MenuRadioItemElement = React.ComponentRef<typeof MenuItem>;
interface MenuRadioItemProps extends MenuItemProps {
	value: string;
}

const MenuRadioItemPrimitive = React.forwardRef<
	MenuRadioItemElement,
	MenuRadioItemProps
>((props: ScopedProps<MenuRadioItemProps>, forwardedRef) => {
	const { value, ...radioItemProps } = props;
	const context = useRadioGroupContext(RADIO_ITEM_NAME, props.__scopeMenu);
	const checked = value === context.value;
	return (
		<ItemIndicatorProvider scope={props.__scopeMenu} checked={checked}>
			<MenuItem
				role="menuitemradio"
				aria-checked={checked}
				{...radioItemProps}
				ref={forwardedRef}
				data-state={getCheckedState(checked)}
				onSelect={composeEventHandlers(
					radioItemProps.onSelect,
					() => context.onValueChange?.(value),
					{ checkForDefaultPrevented: false },
				)}
			/>
		</ItemIndicatorProvider>
	);
});

MenuRadioItemPrimitive.displayName = RADIO_ITEM_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuItemIndicator
 * -----------------------------------------------------------------------------------------------*/

const ITEM_INDICATOR_NAME = "MenuItemIndicator";

type CheckboxContextValue = { checked: CheckedState };

const [ItemIndicatorProvider, useItemIndicatorContext] =
	createMenuContext<CheckboxContextValue>(ITEM_INDICATOR_NAME, {
		checked: false,
	});

type MenuItemIndicatorElement = React.ComponentRef<typeof Primitive.span>;
type PrimitiveSpanProps = React.ComponentPropsWithoutRef<typeof Primitive.span>;
interface MenuItemIndicatorProps extends PrimitiveSpanProps {
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

const MenuItemIndicator = React.forwardRef<
	MenuItemIndicatorElement,
	MenuItemIndicatorProps
>((props: ScopedProps<MenuItemIndicatorProps>, forwardedRef) => {
	const { __scopeMenu, forceMount, ...itemIndicatorProps } = props;
	const indicatorContext = useItemIndicatorContext(
		ITEM_INDICATOR_NAME,
		__scopeMenu,
	);
	return (
		<Presence
			present={
				forceMount ||
				isIndeterminate(indicatorContext.checked) ||
				indicatorContext.checked === true
			}
		>
			<Primitive.span
				{...itemIndicatorProps}
				ref={forwardedRef}
				data-state={getCheckedState(indicatorContext.checked)}
			/>
		</Presence>
	);
});

MenuItemIndicator.displayName = ITEM_INDICATOR_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuSeparator
 * -----------------------------------------------------------------------------------------------*/

const SEPARATOR_NAME = "MenuSeparator";

type MenuSeparatorElement = React.ComponentRef<typeof Primitive.div>;
type MenuSeparatorProps = PrimitiveDivProps;

const MenuSeparatorPrimitive = React.forwardRef<
	MenuSeparatorElement,
	MenuSeparatorProps
>((props: ScopedProps<MenuSeparatorProps>, forwardedRef) => {
	const { __scopeMenu, ...separatorProps } = props;
	return (
		<Primitive.div
			role="separator"
			aria-orientation="horizontal"
			{...separatorProps}
			ref={forwardedRef}
		/>
	);
});

MenuSeparatorPrimitive.displayName = SEPARATOR_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuArrow
 * -----------------------------------------------------------------------------------------------*/

const ARROW_NAME = "MenuArrow";

type MenuArrowElement = React.ComponentRef<typeof PopperArrow>;
type PopperArrowProps = React.ComponentPropsWithoutRef<typeof PopperArrow>;
type MenuArrowProps = PopperArrowProps;

const MenuArrow = React.forwardRef<MenuArrowElement, MenuArrowProps>(
	(props: ScopedProps<MenuArrowProps>, forwardedRef) => {
		const { __scopeMenu, ...arrowProps } = props;
		const popperScope = usePopperScope(__scopeMenu);
		return <PopperArrow {...popperScope} {...arrowProps} ref={forwardedRef} />;
	},
);

MenuArrow.displayName = ARROW_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuSub
 * -----------------------------------------------------------------------------------------------*/

const SUB_NAME = "MenuSub";

type MenuSubContextValue = {
	contentId: string;
	triggerId: string;
	trigger: MenuSubTriggerElement | null;
	onTriggerChange(trigger: MenuSubTriggerElement | null): void;
};

const [MenuSubProvider, useMenuSubContext] =
	createMenuContext<MenuSubContextValue>(SUB_NAME);

interface MenuSubProps {
	children?: React.ReactNode;
	open?: boolean;
	onOpenChange?(open: boolean): void;
}

const MenuSub: React.FC<MenuSubProps> = (props: ScopedProps<MenuSubProps>) => {
	const { __scopeMenu, children, open = false, onOpenChange } = props;
	const parentMenuContext = useMenuContext(SUB_NAME, __scopeMenu);
	const popperScope = usePopperScope(__scopeMenu);
	const [trigger, setTrigger] = React.useState<MenuSubTriggerElement | null>(
		null,
	);
	const [content, setContent] = React.useState<MenuContentElement | null>(null);
	const handleOpenChange = useCallbackRef(onOpenChange);

	// Prevent the parent menu from reopening with open submenus.
	React.useEffect(() => {
		if (parentMenuContext.open === false) handleOpenChange(false);
		return () => handleOpenChange(false);
	}, [parentMenuContext.open, handleOpenChange]);

	return (
		<Popper {...popperScope}>
			<MenuProvider
				scope={__scopeMenu}
				open={open}
				onOpenChange={handleOpenChange}
				content={content}
				onContentChange={setContent}
			>
				<MenuSubProvider
					scope={__scopeMenu}
					contentId={useId()}
					triggerId={useId()}
					trigger={trigger}
					onTriggerChange={setTrigger}
				>
					{children}
				</MenuSubProvider>
			</MenuProvider>
		</Popper>
	);
};

MenuSub.displayName = SUB_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuSubTrigger
 * -----------------------------------------------------------------------------------------------*/

const SUB_TRIGGER_NAME = "MenuSubTrigger";

type MenuSubTriggerElement = MenuItemImplElement;
type MenuSubTriggerProps = MenuItemImplProps;

const MenuSubTriggerPrimitive = React.forwardRef<
	MenuSubTriggerElement,
	MenuSubTriggerProps
>((props: ScopedProps<MenuSubTriggerProps>, forwardedRef) => {
	const context = useMenuContext(SUB_TRIGGER_NAME, props.__scopeMenu);
	const rootContext = useMenuRootContext(SUB_TRIGGER_NAME, props.__scopeMenu);
	const subContext = useMenuSubContext(SUB_TRIGGER_NAME, props.__scopeMenu);
	const contentContext = useMenuContentContext(
		SUB_TRIGGER_NAME,
		props.__scopeMenu,
	);
	const openTimerRef = React.useRef<number | null>(null);
	const { pointerGraceTimerRef, onPointerGraceIntentChange } = contentContext;
	const scope = { __scopeMenu: props.__scopeMenu };

	const clearOpenTimer = React.useCallback(() => {
		if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
		openTimerRef.current = null;
	}, []);

	React.useEffect(() => clearOpenTimer, [clearOpenTimer]);

	React.useEffect(() => {
		const pointerGraceTimer = pointerGraceTimerRef.current;
		return () => {
			window.clearTimeout(pointerGraceTimer);
			onPointerGraceIntentChange(null);
		};
	}, [pointerGraceTimerRef, onPointerGraceIntentChange]);

	return (
		<MenuAnchor asChild {...scope}>
			<MenuItemImpl
				id={subContext.triggerId}
				aria-haspopup="menu"
				aria-expanded={context.open}
				aria-controls={subContext.contentId}
				data-state={getOpenState(context.open)}
				{...props}
				ref={composeRefs(forwardedRef, subContext.onTriggerChange)}
				// This is redundant for mouse users but we cannot determine pointer type from
				// click event and we cannot use pointerup event (see git history for reasons why)
				onClick={(event) => {
					props.onClick?.(event);
					if (props.disabled || event.defaultPrevented) return;
					/**
					 * We manually focus because iOS Safari doesn't always focus on click (e.g. buttons)
					 * and we rely heavily on `onFocusOutside` for submenus to close when switching
					 * between separate submenus.
					 */
					event.currentTarget.focus();
					if (!context.open) context.onOpenChange(true);
				}}
				onPointerMove={composeEventHandlers(
					props.onPointerMove,
					whenMouse((event) => {
						contentContext.onItemEnter(event);
						if (event.defaultPrevented) return;
						if (!props.disabled && !context.open && !openTimerRef.current) {
							contentContext.onPointerGraceIntentChange(null);
							openTimerRef.current = window.setTimeout(() => {
								context.onOpenChange(true);
								clearOpenTimer();
							}, 100);
						}
					}),
				)}
				onPointerLeave={composeEventHandlers(
					props.onPointerLeave,
					whenMouse((event) => {
						clearOpenTimer();

						const contentRect = context.content?.getBoundingClientRect();
						if (contentRect) {
							// TODO: make sure to update this when we change positioning logic
							const side = context.content?.dataset.side as Side;
							const rightSide = side === "right";
							const bleed = rightSide ? -5 : +5;
							const contentNearEdge = contentRect[rightSide ? "left" : "right"];
							const contentFarEdge = contentRect[rightSide ? "right" : "left"];

							contentContext.onPointerGraceIntentChange({
								area: [
									// Apply a bleed on clientX to ensure that our exit point is
									// consistently within polygon bounds
									{ x: event.clientX + bleed, y: event.clientY },
									{ x: contentNearEdge, y: contentRect.top },
									{ x: contentFarEdge, y: contentRect.top },
									{ x: contentFarEdge, y: contentRect.bottom },
									{ x: contentNearEdge, y: contentRect.bottom },
								],
								side,
							});

							window.clearTimeout(pointerGraceTimerRef.current);
							pointerGraceTimerRef.current = window.setTimeout(
								() => contentContext.onPointerGraceIntentChange(null),
								300,
							);
						} else {
							contentContext.onTriggerLeave(event);
							if (event.defaultPrevented) return;

							// There's 100ms where the user may leave an item before the submenu was opened.
							contentContext.onPointerGraceIntentChange(null);
						}
					}),
				)}
				onKeyDown={composeEventHandlers(props.onKeyDown, (event) => {
					const isTypingAhead = contentContext.searchRef.current !== "";
					if (props.disabled || (isTypingAhead && event.key === " ")) return;
					if (SUB_OPEN_KEYS[rootContext.dir].includes(event.key)) {
						context.onOpenChange(true);
						// The trigger may hold focus if opened via pointer interaction
						// so we ensure content is given focus again when switching to keyboard.
						context.content?.focus();
						// prevent window from scrolling
						event.preventDefault();
					}
				})}
			/>
		</MenuAnchor>
	);
});

MenuSubTriggerPrimitive.displayName = SUB_TRIGGER_NAME;

/* -------------------------------------------------------------------------------------------------
 * MenuSubContent
 * -----------------------------------------------------------------------------------------------*/

const SUB_CONTENT_NAME = "MenuSubContent";

type MenuSubContentElement = MenuContentImplElement;
interface MenuSubContentProps
	extends Omit<
		MenuContentImplProps,
		| keyof MenuContentImplPrivateProps
		| "onCloseAutoFocus"
		| "onEntryFocus"
		| "side"
		| "align"
	> {
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

const MenuSubContentPrimitive = React.forwardRef<
	MenuSubContentElement,
	MenuSubContentProps
>((props: ScopedProps<MenuSubContentProps>, forwardedRef) => {
	const portalContext = usePortalContext(CONTENT_NAME, props.__scopeMenu);
	const { forceMount = portalContext.forceMount, ...subContentProps } = props;
	const context = useMenuContext(CONTENT_NAME, props.__scopeMenu);
	const rootContext = useMenuRootContext(CONTENT_NAME, props.__scopeMenu);
	const subContext = useMenuSubContext(SUB_CONTENT_NAME, props.__scopeMenu);
	const ref = React.useRef<MenuSubContentElement>(null);
	const composedRefs = useComposedRefs(forwardedRef, ref);
	return (
		<Collection.Provider scope={props.__scopeMenu}>
			<Presence present={forceMount || context.open}>
				<Collection.Slot scope={props.__scopeMenu}>
					<MenuContentImpl
						id={subContext.contentId}
						aria-labelledby={subContext.triggerId}
						{...subContentProps}
						ref={composedRefs}
						align="start"
						side={rootContext.dir === "rtl" ? "left" : "right"}
						disableOutsidePointerEvents={false}
						disableOutsideScroll={false}
						trapFocus={false}
						onOpenAutoFocus={(event) => {
							// when opening a submenu, focus content for keyboard users only
							if (rootContext.isUsingKeyboardRef.current) ref.current?.focus();
							event.preventDefault();
						}}
						// The menu might close because of focusing another menu item in the parent menu. We
						// don't want it to refocus the trigger in that case so we handle trigger focus ourselves.
						onCloseAutoFocus={(event) => event.preventDefault()}
						onFocusOutside={composeEventHandlers(
							props.onFocusOutside,
							(event) => {
								// We prevent closing when the trigger is focused to avoid triggering a re-open animation
								// on pointer interaction.
								if (event.target !== subContext.trigger)
									context.onOpenChange(false);
							},
						)}
						onEscapeKeyDown={composeEventHandlers(
							props.onEscapeKeyDown,
							(event) => {
								rootContext.onClose();
								// ensure pressing escape in submenu doesn't escape full screen mode
								event.preventDefault();
							},
						)}
						onKeyDown={composeEventHandlers(props.onKeyDown, (event) => {
							// Submenu key events bubble through portals. We only care about keys in this menu.
							const isKeyDownInside = event.currentTarget.contains(
								event.target as HTMLElement,
							);
							const isCloseKey = SUB_CLOSE_KEYS[rootContext.dir].includes(
								event.key,
							);
							if (isKeyDownInside && isCloseKey) {
								context.onOpenChange(false);
								// We focus manually because we prevented it in `onCloseAutoFocus`
								subContext.trigger?.focus();
								// prevent window from scrolling
								event.preventDefault();
							}
						})}
					/>
				</Collection.Slot>
			</Presence>
		</Collection.Provider>
	);
});

MenuSubContentPrimitive.displayName = SUB_CONTENT_NAME;

/* -----------------------------------------------------------------------------------------------*/

function getOpenState(open: boolean) {
	return open ? "open" : "closed";
}

function isIndeterminate(checked?: CheckedState): checked is "indeterminate" {
	return checked === "indeterminate";
}

function getCheckedState(checked: CheckedState) {
	return isIndeterminate(checked)
		? "indeterminate"
		: checked
			? "checked"
			: "unchecked";
}

function focusFirst(candidates: HTMLElement[]) {
	const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
	for (const candidate of candidates) {
		// if focus is already where we want to go, we don't want to keep going through the candidates
		if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
		candidate.focus();
		if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
	}
}

/**
 * Wraps an array around itself at a given start index
 * Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
 */
function wrapArray<T>(array: T[], startIndex: number) {
	return array.map((_, index) => array[(startIndex + index) % array.length]);
}

/**
 * This is the "meat" of the typeahead matching logic. It takes in all the values,
 * the search and the current match, and returns the next match (or `undefined`).
 *
 * We normalize the search because if a user has repeatedly pressed a character,
 * we want the exact same behavior as if we only had that one character
 * (ie. cycle through options starting with that character)
 *
 * We also reorder the values by wrapping the array around the current match.
 * This is so we always look forward from the current match, and picking the first
 * match will always be the correct one.
 *
 * Finally, if the normalized search is exactly one character, we exclude the
 * current match from the values because otherwise it would be the first to match always
 * and focus would never move. This is as opposed to the regular case, where we
 * don't want focus to move if the current match still matches.
 */
function getNextMatch(values: string[], search: string, currentMatch?: string) {
	const isRepeated =
		search.length > 1 && Array.from(search).every((char) => char === search[0]);
	const normalizedSearch = isRepeated ? search[0] : search;
	const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
	let wrappedValues = wrapArray(values, Math.max(currentMatchIndex, 0));
	const excludeCurrentMatch = normalizedSearch.length === 1;
	if (excludeCurrentMatch)
		wrappedValues = wrappedValues.filter((v) => v !== currentMatch);
	const nextMatch = wrappedValues.find((value) =>
		value.toLowerCase().startsWith(normalizedSearch.toLowerCase()),
	);
	return nextMatch !== currentMatch ? nextMatch : undefined;
}

type Point = { x: number; y: number };
type Polygon = Point[];
type Side = "left" | "right";
type GraceIntent = { area: Polygon; side: Side };

// Determine if a point is inside of a polygon.
// Based on https://github.com/substack/point-in-polygon
function isPointInPolygon(point: Point, polygon: Polygon) {
	const { x, y } = point;
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i].x;
		const yi = polygon[i].y;
		const xj = polygon[j].x;
		const yj = polygon[j].y;

		// prettier-ignore
		const intersect =
			yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}

	return inside;
}

function isPointerInGraceArea(event: React.PointerEvent, area?: Polygon) {
	if (!area) return false;
	const cursorPos = { x: event.clientX, y: event.clientY };
	return isPointInPolygon(cursorPos, area);
}

function whenMouse<E>(
	handler: React.PointerEventHandler<E>,
): React.PointerEventHandler<E> {
	return (event) =>
		event.pointerType === "mouse" ? handler(event) : undefined;
}

const MenuSubTrigger = React.forwardRef<
	React.ComponentRef<typeof MenuSubTriggerPrimitive>,
	React.ComponentPropsWithoutRef<typeof MenuSubTriggerPrimitive> & {
		inset?: boolean;
	}
>(({ className, inset, children, ...props }, ref) => (
	<MenuSubTriggerPrimitive
		ref={ref}
		className={cn(
			"flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
			inset && "pl-8",
			className,
		)}
		{...props}
	>
		{children}
		<ChevronRight className="ml-auto" />
	</MenuSubTriggerPrimitive>
));

MenuSubTrigger.displayName = MenuSubTriggerPrimitive.displayName;

const MenuSubContent = React.forwardRef<
	React.ComponentRef<typeof MenuSubContentPrimitive>,
	React.ComponentPropsWithoutRef<typeof MenuSubContentPrimitive>
>(({ className, ...props }, ref) => (
	<MenuSubContentPrimitive
		ref={ref}
		className={cn(
			"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in",
			className,
		)}
		{...props}
	/>
));
MenuSubContent.displayName = MenuSubContentPrimitive.displayName;

const MenuContent = React.forwardRef<
	React.ComponentRef<typeof MenuContentPrimitive>,
	React.ComponentPropsWithoutRef<typeof MenuContentPrimitive>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<MenuPortal>
		<MenuContentPrimitive
			ref={ref}
			sideOffset={sideOffset}
			className={cn(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			{...props}
		/>
	</MenuPortal>
));
MenuContent.displayName = MenuContentPrimitive.displayName;

const MenuItem = React.forwardRef<
	React.ComponentRef<typeof MenuItemPrimitive>,
	React.ComponentPropsWithoutRef<typeof MenuItemPrimitive> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<MenuItemPrimitive
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
			inset && "pl-8",
			className,
		)}
		{...props}
	/>
));
MenuItem.displayName = MenuItemPrimitive.displayName;

const MenuCheckboxItem = React.forwardRef<
	React.ComponentRef<typeof MenuCheckboxItemPrimitive>,
	React.ComponentPropsWithoutRef<typeof MenuCheckboxItemPrimitive>
>(({ className, children, checked, ...props }, ref) => (
	<MenuCheckboxItemPrimitive
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
			className,
		)}
		checked={checked}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<MenuItemIndicator>
				<Check className="h-4 w-4" />
			</MenuItemIndicator>
		</span>
		{children}
	</MenuCheckboxItemPrimitive>
));
MenuCheckboxItem.displayName = MenuCheckboxItemPrimitive.displayName;

const MenuRadioItem = React.forwardRef<
	React.ComponentRef<typeof MenuRadioItemPrimitive>,
	React.ComponentPropsWithoutRef<typeof MenuRadioItemPrimitive>
>(({ className, children, ...props }, ref) => (
	<MenuRadioItemPrimitive
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
			className,
		)}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<MenuItemIndicator>
				<Circle className="h-2 w-2 fill-current" />
			</MenuItemIndicator>
		</span>
		{children}
	</MenuRadioItemPrimitive>
));
MenuRadioItem.displayName = MenuRadioItemPrimitive.displayName;

const MenuLabel = React.forwardRef<
	React.ComponentRef<typeof MenuLabelPrimitive>,
	React.ComponentPropsWithoutRef<typeof MenuLabelPrimitive> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<MenuLabelPrimitive
		ref={ref}
		className={cn(
			"px-2 py-1.5 font-semibold text-sm",
			inset && "pl-8",
			className,
		)}
		{...props}
	/>
));
MenuLabel.displayName = MenuLabelPrimitive.displayName;

const MenuSeparator = React.forwardRef<
	React.ComponentRef<typeof MenuSeparatorPrimitive>,
	React.ComponentPropsWithoutRef<typeof MenuSeparatorPrimitive>
>(({ className, ...props }, ref) => (
	<MenuSeparatorPrimitive
		ref={ref}
		className={cn("-mx-1 my-1 h-px bg-muted", className)}
		{...props}
	/>
));
MenuSeparator.displayName = MenuSeparatorPrimitive.displayName;

const MenuShortcut = ({
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
MenuShortcut.displayName = "MenuShortcut";

export {
	createMenuScope,
	//
	Menu,
	MenuAnchor,
	MenuArrow,
	MenuCheckboxItem,
	MenuContent,
	MenuGroup,
	MenuItem,
	MenuItemIndicator,
	MenuLabel,
	MenuPortal,
	MenuRadioGroup,
	MenuRadioItem,
	MenuSeparator,
	MenuSub,
	MenuSubContent,
	MenuSubTrigger,
	//
	MenuCheckboxItemPrimitive,
	MenuContentPrimitive,
	MenuItemPrimitive,
	MenuLabelPrimitive,
	MenuRadioItemPrimitive,
	MenuSeparatorPrimitive,
	MenuSubContentPrimitive,
	MenuSubTriggerPrimitive,
};
export type {
	MenuAnchorProps,
	MenuArrowProps,
	MenuCheckboxItemProps,
	MenuContentProps,
	MenuGroupProps,
	MenuItemIndicatorProps,
	MenuItemProps,
	MenuLabelProps,
	MenuPortalProps,
	MenuProps,
	MenuRadioGroupProps,
	MenuRadioItemProps,
	MenuSeparatorProps,
	MenuSubContentProps,
	MenuSubProps,
	MenuSubTriggerProps,
};
