import { cn } from "@jsandy/ui/cn";
import { Primitive } from "@jsandy/ui/primitive";
import * as React from "react";

/* -------------------------------------------------------------------------------------------------
 *  Separator
 * -----------------------------------------------------------------------------------------------*/

const NAME = "Separator";
const DEFAULT_ORIENTATION = "horizontal";
const ORIENTATIONS = ["horizontal", "vertical"] as const;

type Orientation = (typeof ORIENTATIONS)[number];
type SeparatorElement = React.ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = React.ComponentPropsWithoutRef<typeof Primitive.div>;
interface SeparatorProps extends PrimitiveDivProps {
	/**
	 * Either `vertical` or `horizontal`. Defaults to `horizontal`.
	 */
	orientation?: Orientation;
	/**
	 * Whether or not the component is purely decorative. When true, accessibility-related attributes
	 * are updated so that that the rendered element is removed from the accessibility tree.
	 */
	decorative?: boolean;
}

/**
 * Separator component for visually separating content
 *
 * The Separator component provides a simple, customizable way to visually separate content in your application. It can be used to create clear divisions between sections, items in a list, or any other elements that need visual separation.
 *
 * Key features:
 * - Supports both horizontal and vertical orientations
 * - Customizable appearance through className prop
 * - Accessible, using appropriate ARIA role
 * - Consistent styling with other UI components
 * - Lightweight and easy to implement
 *
 * Usage considerations:
 * - Use separators to improve the visual structure and readability of your content
 * - Consider the appropriate orientation based on your layout (horizontal for row layouts, vertical for column layouts)
 * - Ensure sufficient contrast between the separator and its background for visibility
 * - Use sparingly to avoid cluttering the interface
 * - Consider using margin or padding instead for subtle separations
 */
const SeparatorPrimitive = React.forwardRef<SeparatorElement, SeparatorProps>(
	(props, forwardedRef) => {
		const {
			decorative,
			orientation: orientationProp = DEFAULT_ORIENTATION,
			...domProps
		} = props;
		const orientation = isValidOrientation(orientationProp)
			? orientationProp
			: DEFAULT_ORIENTATION;
		// `aria-orientation` defaults to `horizontal` so we only need it if `orientation` is vertical
		const ariaOrientation =
			orientation === "vertical" ? orientation : undefined;
		const semanticProps = decorative
			? { role: "none" }
			: { "aria-orientation": ariaOrientation, role: "separator" };

		return (
			<Primitive.div
				data-orientation={orientation}
				{...semanticProps}
				{...domProps}
				ref={forwardedRef}
			/>
		);
	},
);

SeparatorPrimitive.displayName = NAME;

/* -----------------------------------------------------------------------------------------------*/

function isValidOrientation(
	orientation: Orientation,
): orientation is Orientation {
	return ORIENTATIONS.includes(orientation);
}

const Separator = React.forwardRef<
	React.ComponentRef<typeof SeparatorPrimitive>,
	React.ComponentPropsWithoutRef<typeof SeparatorPrimitive>
>(
	(
		{ className, orientation = "horizontal", decorative = true, ...props },
		ref,
	) => (
		<SeparatorPrimitive
			ref={ref}
			decorative={decorative}
			orientation={orientation}
			className={cn(
				"shrink-0 bg-border",
				orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
				className,
			)}
			{...props}
		/>
	),
);
Separator.displayName = SeparatorPrimitive.displayName;

export { Separator };
export type { SeparatorProps };
