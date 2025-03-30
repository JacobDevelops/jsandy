import { cn } from "@jsandy/ui/cn";
import { Primitive } from "@jsandy/ui/primitive";
import * as React from "react";

/* -------------------------------------------------------------------------------------------------
 * Label
 * -----------------------------------------------------------------------------------------------*/

const NAME = "Label";

type LabelElement = React.ComponentRef<typeof Primitive.label>;
type PrimitiveLabelProps = React.ComponentPropsWithoutRef<
	typeof Primitive.label
>;
type LabelProps = PrimitiveLabelProps;

const LabelPrimitive = React.forwardRef<LabelElement, LabelProps>(
	(props, forwardedRef) => {
		return (
			// biome-ignore lint/a11y/noLabelWithoutControl: This is a valid use case
			<Primitive.label
				{...props}
				ref={forwardedRef}
				onMouseDown={(event) => {
					// only prevent text selection if clicking inside the label itself
					const target = event.target as HTMLElement;
					if (target.closest("button, input, select, textarea")) {
						return;
					}

					props.onMouseDown?.(event);
					// prevent text selection when double clicking label
					if (!event.defaultPrevented && event.detail > 1) {
						event.preventDefault();
					}
				}}
			/>
		);
	},
);

LabelPrimitive.displayName = NAME;

/* -----------------------------------------------------------------------------------------------*/

/**
 * Label component for form labels
 *
 * The Label component provides a consistent and accessible way to label form inputs. It's designed to work seamlessly with other form components while allowing for easy customization.
 *
 * Key features:
 * - Consistent styling with other form components
 * - Customizable appearance through className prop
 * - Proper semantic HTML using the <label> element
 * - Supports all standard label attributes
 *
 * Usage considerations:
 * - Always associate labels with their corresponding form inputs using the 'htmlFor' attribute
 * - Use clear and concise text for labels to improve form usability
 * - Consider the visual hierarchy of your form when styling labels
 * - Ensure sufficient color contrast between the label text and background
 * - Use labels consistently across your application for a cohesive user experience
 */
const Label = React.forwardRef<
	React.ComponentRef<typeof LabelPrimitive>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive>
>(({ className, ...props }, ref) => (
	<LabelPrimitive
		ref={ref}
		className={cn(
			"font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
			className,
		)}
		{...props}
	/>
));
Label.displayName = LabelPrimitive.displayName;

export { Label, LabelPrimitive };
export type { LabelProps };
