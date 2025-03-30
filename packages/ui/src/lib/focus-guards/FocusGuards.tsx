import * as React from "react";

/** Number of components which have requested interest to have focus guards */
let count = 0;

function FocusGuards(props: React.PropsWithChildren) {
	useFocusGuards();
	return props.children;
}

/**
 * Injects a pair of focus guards at the edges of the whole DOM tree
 * to ensure `focusin` & `focusout` events can be caught consistently.
 */
function useFocusGuards() {
	React.useEffect(() => {
		const edgeGuards = document.querySelectorAll("[data-jsandy-focus-guard]");
		document.body.insertAdjacentElement(
			"afterbegin",
			edgeGuards[0] ?? createFocusGuard(),
		);
		document.body.insertAdjacentElement(
			"beforeend",
			edgeGuards[1] ?? createFocusGuard(),
		);
		count++;

		return () => {
			if (count === 1) {
				for (const node of document.querySelectorAll(
					"[data-jsandy-focus-guard]",
				)) {
					node.remove();
				}
			}
			count--;
		};
	}, []);
}

function createFocusGuard() {
	const element = document.createElement("span");
	element.setAttribute("data-jsandy-focus-guard", "");
	element.tabIndex = 0;
	element.style.outline = "none";
	element.style.opacity = "0";
	element.style.position = "fixed";
	element.style.pointerEvents = "none";
	return element;
}

const Root = FocusGuards;

export {
	FocusGuards,
	//
	Root,
	//
	useFocusGuards,
};
