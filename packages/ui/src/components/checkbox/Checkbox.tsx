import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { useComposedRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Presence } from "@jsandy/ui/presence";
import { Primitive } from "@jsandy/ui/primitive";
import { useControllableState } from "@jsandy/ui/use-controllable-state";
import { usePrevious } from "@jsandy/ui/use-previous";
import { useSize } from "@jsandy/ui/use-size";
import * as React from "react";

import { Check } from "lucide-react";
import { cn } from "@jsandy/ui/cn";

/* -------------------------------------------------------------------------------------------------
 * Checkbox
 * -----------------------------------------------------------------------------------------------*/

const CHECKBOX_NAME = "Checkbox";

type ScopedProps<P> = P & { __scopeCheckbox?: Scope };
const [createCheckboxContext, createCheckboxScope] =
	createContextScope(CHECKBOX_NAME);

type CheckedState = boolean | "indeterminate";

type CheckboxContextValue = {
	/** Whether the checkbox is checked or not */
	state: CheckedState;
	/** Whether the checkbox is disabled or not */
	disabled?: boolean;
};

const [CheckboxProvider, useCheckboxContext] =
	createCheckboxContext<CheckboxContextValue>(CHECKBOX_NAME);

type CheckboxElement = React.ComponentRef<typeof Primitive.button>;
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<
	typeof Primitive.button
>;
interface CheckboxProps
	extends Omit<PrimitiveButtonProps, "checked" | "defaultChecked"> {
	/** Whether the checkbox is checked or not */
	checked?: CheckedState;
	/** The default checked state for the checkbox */
	defaultChecked?: CheckedState;
	/** Whether the checkbox is required in a form */
	required?: boolean;
	/** The callback function that is called when the checkbox state is changed */
	onCheckedChange?(checked: CheckedState): void;
}

const CheckboxPrimitive = React.forwardRef<CheckboxElement, CheckboxProps>(
	(props: ScopedProps<CheckboxProps>, forwardedRef) => {
		const {
			__scopeCheckbox,
			name,
			checked: checkedProp,
			defaultChecked,
			required,
			disabled,
			value = "on",
			onCheckedChange,
			form,
			...checkboxProps
		} = props;
		const [button, setButton] = React.useState<HTMLButtonElement | null>(null);
		const composedRefs = useComposedRefs(forwardedRef, (node) =>
			setButton(node),
		);
		const hasConsumerStoppedPropagationRef = React.useRef(false);
		// We set this to true by default so that events bubble to forms without JS (SSR)
		const isFormControl = button ? form || !!button.closest("form") : true;
		const [checked = false, setChecked] = useControllableState({
			prop: checkedProp,
			defaultProp: defaultChecked,
			onChange: onCheckedChange,
		});
		const initialCheckedStateRef = React.useRef(checked);
		React.useEffect(() => {
			const form = button?.form;
			if (form) {
				const reset = () => setChecked(initialCheckedStateRef.current);
				form.addEventListener("reset", reset);
				return () => form.removeEventListener("reset", reset);
			}
		}, [button, setChecked]);

		return (
			<CheckboxProvider
				scope={__scopeCheckbox}
				state={checked}
				disabled={disabled}
			>
				<Primitive.button
					type="button"
					role="checkbox"
					aria-checked={isIndeterminate(checked) ? "mixed" : checked}
					aria-required={required}
					data-state={getState(checked)}
					data-disabled={disabled ? "" : undefined}
					disabled={disabled}
					value={value}
					{...checkboxProps}
					ref={composedRefs}
					onKeyDown={composeEventHandlers(props.onKeyDown, (event) => {
						// According to WAI ARIA, Checkboxes don't activate on enter keypress
						if (event.key === "Enter") {
							event.preventDefault();
						}
					})}
					onClick={composeEventHandlers(props.onClick, (event) => {
						setChecked((prevChecked) =>
							isIndeterminate(prevChecked) ? true : !prevChecked,
						);
						if (isFormControl) {
							hasConsumerStoppedPropagationRef.current =
								event.isPropagationStopped();
							// if checkbox is in a form, stop propagation from the button so that we only propagate
							// one click event (from the input). We propagate changes from an input so that native
							// form validation works and form events reflect checkbox updates.
							if (!hasConsumerStoppedPropagationRef.current) {
								event.stopPropagation();
							}
						}
					})}
				/>
				{isFormControl && (
					<BubbleInput
						control={button}
						bubbles={!hasConsumerStoppedPropagationRef.current}
						name={name}
						value={value}
						checked={checked}
						required={required}
						disabled={disabled}
						form={form}
						// We transform because the input is absolutely positioned but we have
						// rendered it **after** the button. This pulls it back to sit on top
						// of the button.
						style={{ transform: "translateX(-100%)" }}
						defaultChecked={
							isIndeterminate(defaultChecked) ? false : defaultChecked
						}
					/>
				)}
			</CheckboxProvider>
		);
	},
);

CheckboxPrimitive.displayName = CHECKBOX_NAME;

/* -------------------------------------------------------------------------------------------------
 * CheckboxIndicator
 * -----------------------------------------------------------------------------------------------*/

const INDICATOR_NAME = "CheckboxIndicator";

type CheckboxIndicatorElement = React.ComponentRef<typeof Primitive.span>;
type PrimitiveSpanProps = React.ComponentPropsWithoutRef<typeof Primitive.span>;
interface CheckboxIndicatorProps extends PrimitiveSpanProps {
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

const CheckboxIndicator = React.forwardRef<
	CheckboxIndicatorElement,
	CheckboxIndicatorProps
>((props: ScopedProps<CheckboxIndicatorProps>, forwardedRef) => {
	const { __scopeCheckbox, forceMount, ...indicatorProps } = props;
	const context = useCheckboxContext(INDICATOR_NAME, __scopeCheckbox);
	return (
		<Presence
			present={
				forceMount || isIndeterminate(context.state) || context.state === true
			}
		>
			<Primitive.span
				data-state={getState(context.state)}
				data-disabled={context.disabled ? "" : undefined}
				{...indicatorProps}
				ref={forwardedRef}
				style={{ pointerEvents: "none", ...props.style }}
			/>
		</Presence>
	);
});

CheckboxIndicator.displayName = INDICATOR_NAME;

/* ---------------------------------------------------------------------------------------------- */

type InputProps = React.ComponentPropsWithoutRef<"input">;
interface BubbleInputProps extends Omit<InputProps, "checked"> {
	/** Whether the checkbox is checked or not */
	checked: CheckedState;
	/** The external element that visually represents the checkbox control */
	control: HTMLElement | null;
	/** Whether the input should bubble the change event to the control */
	bubbles: boolean;
}

const BubbleInput = (props: BubbleInputProps) => {
	const {
		control,
		checked,
		bubbles = true,
		defaultChecked,
		...inputProps
	} = props;
	const ref = React.useRef<HTMLInputElement>(null);
	const prevChecked = usePrevious(checked);
	const controlSize = useSize(control);

	// Bubble checked change to parents (e.g form change event)
	React.useEffect(() => {
		// biome-ignore lint/style/noNonNullAssertion: We know the input is always present
		const input = ref.current!;
		const inputProto = window.HTMLInputElement.prototype;
		const descriptor = Object.getOwnPropertyDescriptor(
			inputProto,
			"checked",
		) as PropertyDescriptor;
		const setChecked = descriptor.set;

		if (prevChecked !== checked && setChecked) {
			const event = new Event("click", { bubbles });
			input.indeterminate = isIndeterminate(checked);
			setChecked.call(input, isIndeterminate(checked) ? false : checked);
			input.dispatchEvent(event);
		}
	}, [prevChecked, checked, bubbles]);

	const defaultCheckedRef = React.useRef(
		isIndeterminate(checked) ? false : checked,
	);
	return (
		<input
			type="checkbox"
			aria-hidden
			defaultChecked={defaultChecked ?? defaultCheckedRef.current}
			{...inputProps}
			tabIndex={-1}
			ref={ref}
			style={{
				...props.style,
				...controlSize,
				position: "absolute",
				pointerEvents: "none",
				opacity: 0,
				margin: 0,
			}}
		/>
	);
};

function isIndeterminate(checked?: CheckedState): checked is "indeterminate" {
	return checked === "indeterminate";
}

function getState(checked: CheckedState) {
	return isIndeterminate(checked)
		? "indeterminate"
		: checked
			? "checked"
			: "unchecked";
}

/**
 * Checkbox component for selecting options
 *
 * The Checkbox component provides a customizable and accessible way to allow users to make binary choices. It combines a hidden native checkbox input with a styled visual representation, ensuring both aesthetics and functionality.
 *
 * Key features:
 * - Customizable appearance through CSS classes
 * - Accessible, using a native checkbox input
 * - Visual indicator for checked state
 * - Support for standard input attributes like disabled, required, etc.
 *
 * Usage considerations:
 * - Use checkboxes for binary choices or multiple selections from a list
 * - Ensure proper labeling for clarity (use in conjunction with a FormLabel component)
 * - Group related checkboxes together for better organization
 * - Consider using indeterminate state for parent checkboxes in hierarchical selections
 */
const Checkbox = React.forwardRef<
	React.ComponentRef<typeof CheckboxPrimitive>,
	React.ComponentPropsWithoutRef<typeof CheckboxPrimitive>
>(({ className, ...props }, ref) => (
	<CheckboxPrimitive
		ref={ref}
		className={cn(
			"peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
			className,
		)}
		{...props}
	>
		<CheckboxIndicator
			className={cn("flex items-center justify-center text-current")}
		>
			<Check className="h-4 w-4" />
		</CheckboxIndicator>
	</CheckboxPrimitive>
));
Checkbox.displayName = CheckboxPrimitive.displayName;

export {
	createCheckboxScope,
	//
	Checkbox,
};
export type { CheckboxProps };
