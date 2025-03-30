import { Circle } from "lucide-react";
import { cn } from "@jsandy/ui/cn";
import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { useComposedRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Primitive } from "@jsandy/ui/primitive";
import {
	RovingFocusGroup,
	RovingFocusGroupItem,
	createRovingFocusGroupScope,
} from "@jsandy/ui/roving-focus";
import { useControllableState } from "@jsandy/ui/use-controllable-state";
import { useDirection } from "@jsandy/ui/use-direction";
import * as React from "react";
import { Radio, RadioIndicator, createRadioScope } from "./Radio";

const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

/* -------------------------------------------------------------------------------------------------
 * RadioGroup
 * -----------------------------------------------------------------------------------------------*/
const RADIO_GROUP_NAME = "RadioGroup";

type ScopedProps<P> = P & { __scopeRadioGroup?: Scope };
const [createRadioGroupContext, createRadioGroupScope] = createContextScope(
	RADIO_GROUP_NAME,
	[createRovingFocusGroupScope, createRadioScope],
);
const useRovingFocusGroupScope = createRovingFocusGroupScope();
const useRadioScope = createRadioScope();

type RadioGroupContextValue = {
	name?: string;
	required: boolean;
	disabled: boolean;
	value?: string;
	onValueChange(value: string): void;
};

const [RadioGroupProvider, useRadioGroupContext] =
	createRadioGroupContext<RadioGroupContextValue>(RADIO_GROUP_NAME);

type RadioGroupElement = React.ComponentRef<typeof Primitive.div>;
type RovingFocusGroupProps = React.ComponentPropsWithoutRef<
	typeof RovingFocusGroup
>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface RadioGroupProps extends PrimitiveDivProps {
	/** The name of the radio group, used to group radio buttons for form submission. */
	name?: RadioGroupContextValue["name"];

	/** Specifies if selecting a radio button in the group is required. */
	required?: React.ComponentPropsWithoutRef<typeof Radio>["required"];

	/** Indicates whether the radio group and its radio buttons are disabled. */
	disabled?: React.ComponentPropsWithoutRef<typeof Radio>["disabled"];

	/** Specifies the text direction ('ltr' for left-to-right, 'rtl' for right-to-left). */
	dir?: RovingFocusGroupProps["dir"];

	/** Determines the orientation of the radio buttons, either horizontally or vertically. */
	orientation?: RovingFocusGroupProps["orientation"];

	/** Whether focus should loop around when navigating with keyboard controls. */
	loop?: RovingFocusGroupProps["loop"];

	/** The initial selected value for an uncontrolled radio group. */
	defaultValue?: string;

	/** The currently selected value for a controlled radio group. */
	value?: RadioGroupContextValue["value"];

	/** Callback function triggered when the selected value changes. */
	onValueChange?: RadioGroupContextValue["onValueChange"];
}

/**
 * RadioGroup component for grouping radio buttons
 *
 * The RadioGroup component provides a way to group related radio buttons, ensuring that only one option can be selected at a time. It offers a consistent and accessible interface for creating radio button groups.
 *
 * Key features:
 * - Manages the selection state of radio buttons within the group
 * - Provides a consistent styling and layout for radio buttons
 * - Ensures proper accessibility attributes for screen readers
 * - Customizable appearance through className props
 *
 * Usage considerations:
 * - Use when you need users to select one option from a list of mutually exclusive choices
 * - Provide clear and concise labels for each radio button option
 * - Consider using a default selected option when appropriate
 * - Ensure sufficient spacing between options for easy interaction
 * - Use in forms where a single selection from multiple options is required
 */
const RadioGroupPrimitive = React.forwardRef<
	RadioGroupElement,
	RadioGroupProps
>((props: ScopedProps<RadioGroupProps>, forwardedRef) => {
	const {
		__scopeRadioGroup,
		name,
		defaultValue,
		value: valueProp,
		required = false,
		disabled = false,
		orientation,
		dir,
		loop = true,
		onValueChange,
		...groupProps
	} = props;
	const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeRadioGroup);
	const direction = useDirection(dir);
	const [value, setValue] = useControllableState({
		prop: valueProp,
		defaultProp: defaultValue,
		onChange: onValueChange,
	});

	return (
		<RadioGroupProvider
			scope={__scopeRadioGroup}
			name={name}
			required={required}
			disabled={disabled}
			value={value}
			onValueChange={setValue}
		>
			<RovingFocusGroup
				asChild
				{...rovingFocusGroupScope}
				orientation={orientation}
				dir={direction}
				loop={loop}
			>
				<Primitive.div
					role="radiogroup"
					aria-required={required}
					aria-orientation={orientation}
					data-disabled={disabled ? "" : undefined}
					dir={direction}
					{...groupProps}
					ref={forwardedRef}
				/>
			</RovingFocusGroup>
		</RadioGroupProvider>
	);
});

RadioGroupPrimitive.displayName = RADIO_GROUP_NAME;

/* -------------------------------------------------------------------------------------------------
 * RadioGroupItem
 * -----------------------------------------------------------------------------------------------*/

const ITEM_NAME = "RadioGroupItem";

type RadioGroupItemElement = React.ComponentRef<typeof Radio>;
type RadioProps = React.ComponentPropsWithoutRef<typeof Radio>;
interface RadioGroupItemProps extends Omit<RadioProps, "onCheck" | "name"> {
	/** The value of the radio button. */
	value: string;
}

/**
 * RadioGroupItem component for individual radio buttons
 *
 * This component renders a single radio button within the RadioGroup. It handles the styling and behavior of the radio button, including the label and the visual indicator.
 */
const RadioGroupItemPrimitive = React.forwardRef<
	RadioGroupItemElement,
	RadioGroupItemProps
>((props: ScopedProps<RadioGroupItemProps>, forwardedRef) => {
	const { __scopeRadioGroup, disabled, ...itemProps } = props;
	const context = useRadioGroupContext(ITEM_NAME, __scopeRadioGroup);
	const isDisabled = context.disabled || disabled;
	const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeRadioGroup);
	const radioScope = useRadioScope(__scopeRadioGroup);
	const ref = React.useRef<React.ComponentRef<typeof Radio>>(null);
	const composedRefs = useComposedRefs(forwardedRef, ref);
	const checked = context.value === itemProps.value;
	const isArrowKeyPressedRef = React.useRef(false);

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (ARROW_KEYS.includes(event.key)) {
				isArrowKeyPressedRef.current = true;
			}
		};
		// biome-ignore lint/suspicious/noAssignInExpressions: This is a workaround for a bug in React
		const handleKeyUp = () => (isArrowKeyPressedRef.current = false);
		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("keyup", handleKeyUp);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	return (
		<RovingFocusGroupItem
			asChild
			{...rovingFocusGroupScope}
			focusable={!isDisabled}
			active={checked}
		>
			<Radio
				disabled={isDisabled}
				required={context.required}
				checked={checked}
				{...radioScope}
				{...itemProps}
				name={context.name}
				ref={composedRefs}
				onCheck={() => context.onValueChange(itemProps.value)}
				onKeyDown={composeEventHandlers((event) => {
					// According to WAI ARIA, radio groups don't activate items on enter keypress
					if (event.key === "Enter") {
						event.preventDefault();
					}
				})}
				onFocus={composeEventHandlers(itemProps.onFocus, () => {
					/**
					 * Our `RovingFocusGroup` will focus the radio when navigating with arrow keys
					 * and we need to "check" it in that case. We click it to "check" it (instead
					 * of updating `context.value`) so that the radio change event fires.
					 */
					if (isArrowKeyPressedRef.current) {
						ref.current?.click();
					}
				})}
			/>
		</RovingFocusGroupItem>
	);
});

RadioGroupItemPrimitive.displayName = ITEM_NAME;

/* -------------------------------------------------------------------------------------------------
 * RadioGroupIndicator
 * -----------------------------------------------------------------------------------------------*/

const INDICATOR_NAME = "RadioGroupIndicator";

type RadioGroupIndicatorElement = React.ComponentRef<typeof RadioIndicator>;
type RadioIndicatorProps = React.ComponentPropsWithoutRef<
	typeof RadioIndicator
>;
type RadioGroupIndicatorProps = RadioIndicatorProps;

/**
 * RadioGroup.Indicator component for the visual indicator of the radio button
 *
 * This component renders the visual representation of the radio button's state (selected or unselected). It's designed to be used within the RadioGroup.Item component.
 */
const RadioGroupIndicator = React.forwardRef<
	RadioGroupIndicatorElement,
	RadioGroupIndicatorProps
>((props: ScopedProps<RadioGroupIndicatorProps>, forwardedRef) => {
	const { __scopeRadioGroup, ...indicatorProps } = props;
	const radioScope = useRadioScope(__scopeRadioGroup);
	return (
		<RadioIndicator {...radioScope} {...indicatorProps} ref={forwardedRef} />
	);
});

RadioGroupIndicator.displayName = INDICATOR_NAME;

/* ---------------------------------------------------------------------------------------------- */

const RadioGroup = React.forwardRef<
	React.ComponentRef<typeof RadioGroupPrimitive>,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive>
>(({ className, ...props }, ref) => {
	return (
		<RadioGroupPrimitive
			className={cn("grid gap-2", className)}
			{...props}
			ref={ref}
		/>
	);
});
RadioGroup.displayName = RadioGroupPrimitive.displayName;

const RadioGroupItem = React.forwardRef<
	React.ComponentRef<typeof RadioGroupItemPrimitive>,
	React.ComponentPropsWithoutRef<typeof RadioGroupItemPrimitive>
>(({ className, ...props }, ref) => {
	return (
		<RadioGroupItemPrimitive
			ref={ref}
			className={cn(
				"aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		>
			<RadioGroupIndicator className="flex items-center justify-center">
				<Circle className="h-2.5 w-2.5 fill-current text-current" />
			</RadioGroupIndicator>
		</RadioGroupItemPrimitive>
	);
});
RadioGroupItem.displayName = RadioGroupItemPrimitive.displayName;

export {
	//
	RadioGroup,
	RadioGroupIndicator,
	RadioGroupItem,
	createRadioGroupScope,
};
export type { RadioGroupIndicatorProps, RadioGroupItemProps, RadioGroupProps };
