/**
 * Composes two event handlers into a single function.
 */
function composeEventHandlers<E>(
	originalEventHandler?: (event: E) => void,
	ourEventHandler?: (event: E) => void,
	{ checkForDefaultPrevented = true } = {},
) {
	return function handleEvent(event: E): void {
		originalEventHandler?.(event);

		if (
			checkForDefaultPrevented === false ||
			!(event as unknown as Event).defaultPrevented
		) {
			// biome-ignore lint/correctness/noVoidTypeReturn: This is a valid use case
			return ourEventHandler?.(event);
		}
	};
}

export { composeEventHandlers };
