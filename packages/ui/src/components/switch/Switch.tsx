import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { useComposedRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Primitive } from "@jsandy/ui/primitive";
import { useControllableState } from "@jsandy/ui/use-controllable-state";
import { usePrevious } from "@jsandy/ui/use-previous";
import { useSize } from "@jsandy/ui/use-size";
import * as React from "react";

import { cn } from "@jsandy/ui/cn";

/* -------------------------------------------------------------------------------------------------
 * Switch
 * -----------------------------------------------------------------------------------------------*/

const SWITCH_NAME = "Switch";

type ScopedProps<P> = P & { __scopeSwitch?: Scope };
const [createSwitchContext, createSwitchScope] =
	createContextScope(SWITCH_NAME);

type SwitchContextValue = { checked: boolean; disabled?: boolean };
const [SwitchProvider, useSwitchContext] =
	createSwitchContext<SwitchContextValue>(SWITCH_NAME);

type SwitchElement = React.ComponentRef<typeof Primitive.button>;
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<
	typeof Primitive.button
>;
interface SwitchProps extends PrimitiveButtonProps {
	/** Indicates whether the switch is checked (controlled). */
	checked?: boolean;

	/** The default checked state of the switch (uncontrolled). */
	defaultChecked?: boolean;

	/** Specifies whether the switch is required in a form. */
	required?: boolean;

	/** Callback function triggered when the checked state changes. */
	onCheckedChange?(checked: boolean): void;
}

const SwitchPrimitive = React.forwardRef<SwitchElement, SwitchProps>(
	(props: ScopedProps<SwitchProps>, forwardedRef) => {
		const {
			__scopeSwitch,
			name,
			checked: checkedProp,
			defaultChecked,
			required,
			disabled,
			value = "on",
			onCheckedChange,
			form,
			...switchProps
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

		return (
			<SwitchProvider
				scope={__scopeSwitch}
				checked={checked}
				disabled={disabled}
			>
				<Primitive.button
					type="button"
					role="switch"
					aria-checked={checked}
					aria-required={required}
					data-state={getState(checked)}
					data-disabled={disabled ? "" : undefined}
					disabled={disabled}
					value={value}
					{...switchProps}
					ref={composedRefs}
					onClick={composeEventHandlers(props.onClick, (event) => {
						setChecked((prevChecked) => !prevChecked);
						if (isFormControl) {
							hasConsumerStoppedPropagationRef.current =
								event.isPropagationStopped();
							// if switch is in a form, stop propagation from the button so that we only propagate
							// one click event (from the input). We propagate changes from an input so that native
							// form validation works and form events reflect switch updates.
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
					/>
				)}
			</SwitchProvider>
		);
	},
);

SwitchPrimitive.displayName = SWITCH_NAME;

/* -------------------------------------------------------------------------------------------------
 * SwitchThumb
 * -----------------------------------------------------------------------------------------------*/

const THUMB_NAME = "SwitchThumb";

type SwitchThumbElement = React.ComponentRef<typeof Primitive.span>;
type PrimitiveSpanProps = React.ComponentPropsWithoutRef<typeof Primitive.span>;
type SwitchThumbProps = PrimitiveSpanProps;

/**
 * SwitchThumb component for the movable part of the switch
 *
 * This component renders the visual indicator that moves to show the current state of the switch.
 */
const SwitchThumb = React.forwardRef<SwitchThumbElement, SwitchThumbProps>(
	(props: ScopedProps<SwitchThumbProps>, forwardedRef) => {
		const { __scopeSwitch, ...thumbProps } = props;
		const context = useSwitchContext(THUMB_NAME, __scopeSwitch);
		return (
			<Primitive.span
				data-state={getState(context.checked)}
				data-disabled={context.disabled ? "" : undefined}
				{...thumbProps}
				ref={forwardedRef}
			/>
		);
	},
);

SwitchThumb.displayName = THUMB_NAME;

/* ---------------------------------------------------------------------------------------------- */

type InputProps = React.ComponentPropsWithoutRef<"input">;
interface BubbleInputProps extends Omit<InputProps, "checked"> {
	/** Indicates whether the input is checked. */
	checked: boolean;

	/** The control element associated with the input (e.g., the switch button). */
	control: HTMLElement | null;

	/** Indicates whether events from the input should bubble up to parent elements. */
	bubbles: boolean;
}

const BubbleInput = (props: BubbleInputProps) => {
	const { control, checked, bubbles = true, ...inputProps } = props;
	const ref = React.useRef<HTMLInputElement>(null);
	const prevChecked = usePrevious(checked);
	const controlSize = useSize(control);

	// Bubble checked change to parents (e.g form change event)
	React.useEffect(() => {
		const input = ref.current;
		if (!input) return;
		const inputProto = window.HTMLInputElement.prototype;
		const descriptor = Object.getOwnPropertyDescriptor(
			inputProto,
			"checked",
		) as PropertyDescriptor;
		const setChecked = descriptor.set;
		if (prevChecked !== checked && setChecked) {
			const event = new Event("click", { bubbles });
			setChecked.call(input, checked);
			input.dispatchEvent(event);
		}
	}, [prevChecked, checked, bubbles]);

	return (
		<input
			type="checkbox"
			aria-hidden
			defaultChecked={checked}
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

function getState(checked: boolean) {
	return checked ? "checked" : "unchecked";
}

/**
 * Switch component for toggling between two states
 *
 * The Switch component provides a visual toggle between two mutually exclusive states, typically used for enabling or disabling a feature. It offers an intuitive and accessible way for users to change a setting.
 *
 * Key features:
 * - Clear visual indication of current state
 * - Smooth transition animation between states
 * - Customizable appearance through className prop
 * - Accessible, using appropriate ARIA attributes
 * - Support for keyboard interaction
 *
 * Usage considerations:
 * - Use for boolean settings that can be turned on or off
 * - Provide clear labels to indicate what the switch controls
 * - Consider using the switch for immediate actions, where the effect is instantaneous
 * - Ensure sufficient color contrast between the switch states for visibility
 * - Use in forms or settings panels where binary choices are appropriate
 */
const Switch = React.forwardRef<
	React.ComponentRef<typeof SwitchPrimitive>,
	React.ComponentPropsWithoutRef<typeof SwitchPrimitive>
>(({ className, ...props }, ref) => (
	<SwitchPrimitive
		className={cn(
			"peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
			className,
		)}
		{...props}
		ref={ref}
	>
		<SwitchThumb
			className={cn(
				"pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
			)}
		/>
	</SwitchPrimitive>
));
Switch.displayName = SwitchPrimitive.displayName;

export {
	createSwitchScope,
	//
	Switch,
	SwitchThumb,
};
export type { SwitchProps, SwitchThumbProps };
