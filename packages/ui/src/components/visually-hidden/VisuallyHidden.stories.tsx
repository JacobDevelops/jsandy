import { VisuallyHidden } from "@jsandy/ui/visually-hidden";

export default { title: "Layout/VisuallyHidden" };

export const Basic = () => (
	<button type="button">
		<VisuallyHidden>Save the file</VisuallyHidden>
		<span aria-hidden>💾</span>
	</button>
);
