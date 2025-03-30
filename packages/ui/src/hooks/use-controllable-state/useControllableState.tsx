import { useCallbackRef } from "@jsandy/ui/use-callback-ref";
import * as React from "react";

/**
 * Parameters for the useControllableState hook
 */
type UseControllableStateParams<T> = {
	/** The controlled value */
	prop?: T | undefined;
	/** The default value for uncontrolled state */
	defaultProp?: T | undefined;
	/** Callback function called when the state changes */
	onChange?: (state: T) => void;
};

/** Function type for setState that can accept a function to update state */
type SetStateFn<T> = (prevState?: T) => T;

/**
 * A hook that manages both controlled and uncontrolled state
 */
function useControllableState<T>({
	prop,
	defaultProp,
	onChange = () => {},
}: UseControllableStateParams<T>) {
	const [uncontrolledProp, setUncontrolledProp] = useUncontrolledState({
		defaultProp,
		onChange,
	});
	const isControlled = prop !== undefined;
	const value = isControlled ? prop : uncontrolledProp;
	const handleChange = useCallbackRef(onChange);

	const setValue: React.Dispatch<React.SetStateAction<T | undefined>> =
		React.useCallback(
			(nextValue) => {
				if (isControlled) {
					const setter = nextValue as SetStateFn<T>;
					const value =
						typeof nextValue === "function" ? setter(prop) : nextValue;
					if (value !== prop) {
						handleChange(value as T);
					}
				} else {
					setUncontrolledProp(nextValue);
				}
			},
			[isControlled, prop, setUncontrolledProp, handleChange],
		);

	return [value, setValue] as const;
}

/**
 * A hook that manages uncontrolled state
 */
function useUncontrolledState<T>({
	defaultProp,
	onChange,
}: Omit<UseControllableStateParams<T>, "prop">) {
	const uncontrolledState = React.useState<T | undefined>(defaultProp);
	const [value] = uncontrolledState;
	const prevValueRef = React.useRef(value);
	const handleChange = useCallbackRef(onChange);

	React.useEffect(() => {
		if (prevValueRef.current !== value) {
			handleChange(value as T);
			prevValueRef.current = value;
		}
	}, [value, prevValueRef, handleChange]);

	return uncontrolledState;
}

export { useControllableState };
