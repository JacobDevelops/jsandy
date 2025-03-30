import { composeEventHandlers } from "@jsandy/ui/compose-events";
import { useComposedRefs } from "@jsandy/ui/compose-refs";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Presence } from "@jsandy/ui/presence";
import { Primitive } from "@jsandy/ui/primitive";
import { usePrevious } from "@jsandy/ui/use-previous";
import { useSize } from "@jsandy/ui/use-size";
import * as React from "react";

/* -------------------------------------------------------------------------------------------------
 * Radio
 * -----------------------------------------------------------------------------------------------*/

const RADIO_NAME = "Radio";

type ScopedProps<P> = P & { __scopeRadio?: Scope };
const [createRadioContext, createRadioScope] = createContextScope(RADIO_NAME);

type RadioContextValue = { checked: boolean; disabled?: boolean };
const [RadioProvider, useRadioContext] =
	createRadioContext<RadioContextValue>(RADIO_NAME);

type RadioElement = React.ComponentRef<typeof Primitive.button>;
type PrimitiveButtonProps = React.ComponentPropsWithoutRef<
	typeof Primitive.button
>;
interface RadioProps extends PrimitiveButtonProps {
	/** Indicates whether the radio button is checked. */
	checked?: boolean;
	/** Specifies if the radio button is required in the form. */
	required?: boolean;
	/** Callback function triggered when the radio button is checked. */
	onCheck?(): void;
}

/**
 * Radio component for rendering a custom radio button element.
 *
 * This component renders a button that behaves as a radio input, with the ability to manage its checked state and integrate with forms. It supports accessibility features such as aria attributes and form validation.
 *
 * The component automatically handles the checked state, and when placed inside a form, it ensures only one radio button can be selected at a time.
 */
const Radio = React.forwardRef<RadioElement, RadioProps>(
	(props: ScopedProps<RadioProps>, forwardedRef) => {
		const {
			__scopeRadio,
			name,
			checked = false,
			required,
			disabled,
			value = "on",
			onCheck,
			form,
			...radioProps
		} = props;
		const [button, setButton] = React.useState<HTMLButtonElement | null>(null);
		const composedRefs = useComposedRefs(forwardedRef, (node) =>
			setButton(node),
		);
		const hasConsumerStoppedPropagationRef = React.useRef(false);
		// We set this to true by default so that events bubble to forms without JS (SSR)
		const isFormControl = button ? form || !!button.closest("form") : true;

		return (
			<RadioProvider scope={__scopeRadio} checked={checked} disabled={disabled}>
				<Primitive.button
					type="button"
					role="radio"
					aria-checked={checked}
					data-state={getState(checked)}
					data-disabled={disabled ? "" : undefined}
					disabled={disabled}
					value={value}
					{...radioProps}
					ref={composedRefs}
					onClick={composeEventHandlers(props.onClick, (event) => {
						// radios cannot be unchecked so we only communicate a checked state
						if (!checked) {
							onCheck?.();
						}
						if (isFormControl) {
							hasConsumerStoppedPropagationRef.current =
								event.isPropagationStopped();
							// if radio is in a form, stop propagation from the button so that we only propagate
							// one click event (from the input). We propagate changes from an input so that native
							// form validation works and form events reflect radio updates.
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
			</RadioProvider>
		);
	},
);

Radio.displayName = RADIO_NAME;

/* -------------------------------------------------------------------------------------------------
 * RadioIndicator
 * -----------------------------------------------------------------------------------------------*/

const INDICATOR_NAME = "RadioIndicator";

type RadioIndicatorElement = React.ComponentRef<typeof Primitive.span>;
type PrimitiveSpanProps = React.ComponentPropsWithoutRef<typeof Primitive.span>;
export interface RadioIndicatorProps extends PrimitiveSpanProps {
	/**
	 * Used to force mounting when more control is needed. Useful when
	 * controlling animation with React animation libraries.
	 */
	forceMount?: true;
}

/**
 * RadioIndicator component for displaying an indicator when the radio button is checked.
 *
 * This component renders a span element that serves as a visual indicator, such as a dot or a checkmark, to show whether the associated radio button is selected.
 * The component is conditionally mounted based on the checked state or the forceMount prop.
 */
const RadioIndicator = React.forwardRef<
	RadioIndicatorElement,
	RadioIndicatorProps
>((props: ScopedProps<RadioIndicatorProps>, forwardedRef) => {
	const { __scopeRadio, forceMount, ...indicatorProps } = props;
	const context = useRadioContext(INDICATOR_NAME, __scopeRadio);
	return (
		<Presence present={forceMount || context.checked}>
			<Primitive.span
				data-state={getState(context.checked)}
				data-disabled={context.disabled ? "" : undefined}
				{...indicatorProps}
				ref={forwardedRef}
			/>
		</Presence>
	);
});

RadioIndicator.displayName = INDICATOR_NAME;

/* ---------------------------------------------------------------------------------------------- */

type InputProps = React.ComponentPropsWithoutRef<"input">;
interface BubbleInputProps extends Omit<InputProps, "checked"> {
	/** Whether the radio input is checked. */
	checked: boolean;
	/** The control element that the input is associated with. */
	control: HTMLElement | null;
	/** Whether the change event should bubble up to parent elements. */
	bubbles: boolean;
}

/**
 * BubbleInput component for managing the native radio input.
 *
 * This component renders a hidden input element for radio buttons that is used to handle form interactions and bubble events like changes. It synchronizes the checked state with the visual control and ensures the form is aware of the radio button's state.
 *
 * The component is positioned absolutely on top of the associated control element, and it dispatches events to the form for native validation and submission purposes.
 */
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
			type="radio"
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

export {
	createRadioScope,
	//
	Radio,
	RadioIndicator,
};
export type { RadioProps };
