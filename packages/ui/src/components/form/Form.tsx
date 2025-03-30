"use client";

import { cn } from "@jsandy/ui/cn";
import { type Scope, createContextScope } from "@jsandy/ui/context";
import { Label } from "@jsandy/ui/label";
import { Slot } from "@jsandy/ui/slot";
import { useId } from "@jsandy/ui/use-id";
import * as React from "react";

// ------------------------------------------------------------------------------------------------
// Type Definitions
// ------------------------------------------------------------------------------------------------

/**
 * Basic record type for form values.
 */
type FieldValues = Record<string, unknown>;

/**
 * Context for form field components, providing identification and name.
 */
interface FormFieldContextValue {
	/** Unique name of the field in the form */
	name: string;
	/** Unique ID for DOM references */
	id: string;
}

/**
 * Context for form item components, providing identification.
 */
interface FormItemContextValue {
	/** Unique ID for DOM references */
	id: string;
}

/**
 * Represents a validation error for a single field.
 */
interface FieldError {
	/** Error message to display to the user */
	message?: string;
}

/**
 * Map of field names to their validation errors.
 */
interface FieldErrors {
	[key: string]: FieldError | undefined;
}

/**
 * Result structure returned by form validation resolvers.
 */
interface ResolverResult<TFieldValues extends FieldValues = FieldValues> {
	/** The values after validation processing */
	values: TFieldValues;
	/** Any validation errors that occurred */
	errors: FieldErrors;
}

/**
 * Function signature for custom validation resolvers.
 */
type Resolver<TFieldValues extends FieldValues = FieldValues> = (
	values: TFieldValues,
) => ResolverResult<TFieldValues>;

/**
 * Complete form state representation.
 * Includes validation state, field interactions, and submission status.
 */
interface FormStateValues {
	/** Validation errors, keyed by field name */
	errors: FieldErrors;
	/** Whether the form is currently being submitted */
	isSubmitting: boolean;
	/** Whether any field has been changed from default values */
	isDirty: boolean;
	/** Whether the form has passed all validations */
	isValid: boolean;
	/** Record of which fields have been modified */
	dirtyFields: Record<string, boolean>;
	/** Record of which fields have been interacted with */
	touchedFields: Record<string, boolean>;
}

/**
 * Configuration options for the useForm hook.
 */
interface UseFormProps<TFieldValues extends FieldValues = FieldValues> {
	/** Initial values to populate the form with */
	defaultValues?: Partial<TFieldValues>;
	/** When to trigger validation */
	mode?: "onSubmit" | "onChange" | "onBlur";
	/** When to re-validate after initial validation */
	reValidateMode?: "onSubmit" | "onChange" | "onBlur";
	/** Custom validation resolver function */
	resolver?: Resolver<TFieldValues>;
}

/**
 * Field value type representing all possible form input value types
 */
type FieldValue = string | number | boolean | Date | string[] | undefined;

/**
 * Field definition used by form controls
 */
interface FieldDefinition<T = FieldValue> {
	/** Name of the field */
	name: string;
	/** Current value of the field */
	value?: T;
	/** Handler for value changes */
	onChange: (event: unknown) => void;
	/** Handler for blur events */
	onBlur: () => void;
	/** Ref callback for the input element */
	ref: (instance: HTMLElement | null) => void;
}

/**
 * Return value from the useForm hook, providing form manipulation methods.
 */
interface UseFormReturn<TFieldValues extends FieldValues = FieldValues> {
	/** Register a field with the form */
	register: <TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
	) => FieldDefinition<FieldPathValue<TFieldValues, TFieldName>>;

	/** Controller object for use with useFieldArray and other utilities */
	control: {
		_formValues: Partial<TFieldValues>;
		_fields: Map<string, HTMLElement | null>;
	};

	/** Create a submit handler that validates before calling onSubmit */
	handleSubmit: (
		onSubmit: (data: TFieldValues) => void,
	) => (e: React.FormEvent) => void;

	/** Programmatically set a field's value */
	setValue: <TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
		value: FieldPathValue<TFieldValues, TFieldName>,
		options?: { shouldValidate?: boolean; shouldDirty?: boolean },
	) => void;

	/** Get current form values */
	getValues(): TFieldValues;
	getValues<TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
	): FieldPathValue<TFieldValues, TFieldName>;

	/** Current form state */
	formState: FormStateValues;

	/** Reset the form to default or specified values */
	reset: (values?: Partial<TFieldValues>) => void;

	/** Watch for form value changes */
	watch(): TFieldValues;
	watch<TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
	): FieldPathValue<TFieldValues, TFieldName>;
	watch(callback: (values: TFieldValues) => void): { unsubscribe: () => void };
}

/**
 * Form context provided to all child components.
 */
interface FormContextValue<TFieldValues extends FieldValues = FieldValues> {
	/** Register a field with the form */
	register: (name: string) => FieldDefinition;

	/** Controller object for use with useFieldArray and other utilities */
	control: {
		_formValues: Record<string, unknown>;
		_fields: Map<string, HTMLElement | null>;
	};

	/** Create a submit handler that validates before calling onSubmit */
	handleSubmit: (
		onSubmit: (data: TFieldValues) => void,
	) => (e: React.FormEvent) => void;

	/** Programmatically set a field's value */
	setValue: (
		name: string,
		value: unknown,
		options?: { shouldValidate?: boolean; shouldDirty?: boolean },
	) => void;

	/** Get current form values */
	getValues: (name?: string) => unknown;

	/** Current form state */
	formState: FormStateValues;

	/** Reset the form to default or specified values */
	reset: (values?: Record<string, unknown>) => void;
}

// ------------------------------------------------------------------------------------------------
// Context Creation
// ------------------------------------------------------------------------------------------------

/**
 * Create form-related contexts with proper scoping for isolation
 */
const FORM_NAME = "Form";
const [createFormContext, createFormScope] = createContextScope(FORM_NAME);
const [FormProvider, useFormContext] =
	createFormContext<FormContextValue<FieldValues>>(FORM_NAME);

const FIELD_NAME = "FormField";
const [createFormFieldContext, createFieldScope] =
	createContextScope(FIELD_NAME);
const [FormFieldProvider, useFormFieldContext] =
	createFormFieldContext<FormFieldContextValue>(FIELD_NAME);

const ITEM_NAME = "FormItem";
const [createFormItemContext, createItemScope] = createContextScope(ITEM_NAME);
const [FormItemProvider, useFormItemContext] =
	createFormItemContext<FormItemContextValue>(ITEM_NAME);

// ------------------------------------------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------------------------------------------

/**
 * Creates a typesafe getValues function that can retrieve either all values or a specific field value
 */
function createGetValues<TFieldValues extends FieldValues>(
	formValues: Partial<TFieldValues>,
): {
	(): TFieldValues;
	<TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
	): FieldPathValue<TFieldValues, TFieldName>;
} {
	function getValues(): TFieldValues;

	function getValues<TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
	): FieldPathValue<TFieldValues, TFieldName>;

	function getValues<TFieldName extends FieldPath<TFieldValues>>(
		name?: TFieldName,
	): TFieldValues | FieldPathValue<TFieldValues, TFieldName> {
		if (name !== undefined) {
			return formValues[name] as FieldPathValue<TFieldValues, TFieldName>;
		}
		return formValues as TFieldValues;
	}

	return getValues as {
		(): TFieldValues;
		<TFieldName extends FieldPath<TFieldValues>>(
			name: TFieldName,
		): FieldPathValue<TFieldValues, TFieldName>;
	};
}

/**
 * Creates a typesafe watch function to observe form value changes
 */
function createWatcher<TFieldValues extends FieldValues>(
	formValues: Partial<TFieldValues>,
	onFormValuesChange: (callback: (values: TFieldValues) => void) => () => void,
): {
	(): TFieldValues;
	<TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
	): FieldPathValue<TFieldValues, TFieldName>;
	(callback: (values: TFieldValues) => void): { unsubscribe: () => void };
} {
	function watch(): TFieldValues;

	function watch<TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
	): FieldPathValue<TFieldValues, TFieldName>;

	function watch(callback: (values: TFieldValues) => void): {
		unsubscribe: () => void;
	};

	function watch<TFieldName extends FieldPath<TFieldValues>>(
		nameOrCallback?: TFieldName | ((values: TFieldValues) => void),
	):
		| TFieldValues
		| FieldPathValue<TFieldValues, TFieldName>
		| { unsubscribe: () => void } {
		if (nameOrCallback === undefined) {
			return formValues as TFieldValues;
		}
		if (typeof nameOrCallback === "function") {
			const unsubscribeFn = onFormValuesChange(nameOrCallback);
			return {
				unsubscribe: unsubscribeFn,
			};
		}
		return formValues[nameOrCallback] as FieldPathValue<
			TFieldValues,
			TFieldName
		>;
	}

	return watch as {
		(): TFieldValues;
		<TFieldName extends FieldPath<TFieldValues>>(
			name: TFieldName,
		): FieldPathValue<TFieldValues, TFieldName>;
		(callback: (values: TFieldValues) => void): { unsubscribe: () => void };
	};
}

// ------------------------------------------------------------------------------------------------
// Form Hooks
// ------------------------------------------------------------------------------------------------

/**
 * A custom hook that manages form state, validation, and submission.
 * Provides field registration, value updates, and form submission handling.
 */
function useForm<TFieldValues extends FieldValues = FieldValues>(
	options: UseFormProps<TFieldValues> = {},
): UseFormReturn<TFieldValues> {
	// Store default values to enable form reset
	const defaultValuesRef = React.useRef<Partial<TFieldValues>>(
		options.defaultValues || ({} as Partial<TFieldValues>),
	);

	// Main form state
	const [formValues, setFormValues] = React.useState<Partial<TFieldValues>>(
		defaultValuesRef.current as Partial<TFieldValues>,
	);

	// Form metadata state (validation, dirty state, etc.)
	const [formState, setFormState] = React.useState<FormStateValues>({
		errors: {},
		isSubmitting: false,
		isDirty: false,
		isValid: true,
		dirtyFields: {},
		touchedFields: {},
	});

	// References to DOM elements and tracking field names
	const fieldsRef = React.useRef<Map<string, HTMLElement | null>>(new Map());
	const fieldsNamesRef = React.useRef<Set<string>>(new Set());

	// Observer pattern for watching form value changes
	const watchCallbacksRef = React.useRef<Set<(values: TFieldValues) => void>>(
		new Set(),
	);

	/**
	 * Registers a callback to run when form values change
	 * Returns an unsubscribe function
	 */
	const onFormValuesChange = React.useCallback(
		(callback: (values: TFieldValues) => void) => {
			watchCallbacksRef.current.add(callback);
			callback(formValues as TFieldValues);
			return () => {
				watchCallbacksRef.current.delete(callback);
			};
		},
		[formValues],
	);

	/**
	 * Validates a single field against the form resolver
	 */
	const validateField = React.useCallback(
		(name: string, value: unknown) => {
			if (options.resolver) {
				const currentValues = {
					...formValues,
					[name]: value,
				} as TFieldValues;

				const { errors } = options.resolver(currentValues);

				setFormState((prev) => ({
					...prev,
					errors,
					isValid: Object.keys(errors).length === 0,
				}));
			}
			return true;
		},
		[formValues, options],
	);

	/**
	 * Sets a value in a nested object path (e.g. 'user.profile.name')
	 */
	const setNestedValue = React.useCallback(
		<TFieldName extends FieldPath<TFieldValues>>(
			obj: Partial<TFieldValues>,
			path: TFieldName | string,
			value: unknown,
		): void => {
			if (!path) return;

			const keys = path.split(".");
			const lastKey = keys.pop();

			if (!lastKey) return;

			const target = keys.reduce(
				(acc: Record<string, unknown>, key: string) => {
					if (acc[key] === undefined || acc[key] === null) {
						const nextKey = keys[keys.indexOf(key) + 1] || lastKey;
						acc[key] = !Number.isNaN(Number(nextKey)) ? [] : {};
					}

					const next = acc[key];
					if (typeof next === "object" && next !== null) {
						return next as Record<string, unknown>;
					}

					acc[key] = {};
					return acc[key] as Record<string, unknown>;
				},
				obj as unknown as Record<string, unknown>,
			);

			target[lastKey] = value;
		},
		[],
	);

	/**
	 * Gets a value from a nested object path (e.g. 'user.profile.name')
	 */
	const getNestedValue = React.useCallback(
		<TFieldName extends FieldPath<TFieldValues>>(
			obj: Partial<TFieldValues>,
			path: TFieldName | string,
		): FieldPathValue<TFieldValues, TFieldName> | undefined => {
			if (!path) return obj as FieldPathValue<TFieldValues, TFieldName>;

			const keys = path.split(".");
			return keys.reduce((acc: unknown, key: string) => {
				if (acc && typeof acc === "object") {
					return (acc as Record<string, unknown>)[key];
				}
				return undefined;
			}, obj) as FieldPathValue<TFieldValues, TFieldName> | undefined;
		},
		[],
	);

	/**
	 * Programmatically sets a field value
	 */
	const setValue = React.useCallback(
		(
			name: string,
			value: unknown,
			opts?: { shouldValidate?: boolean; shouldDirty?: boolean },
		) => {
			setFormValues((prev) => {
				const newValues = { ...prev };
				setNestedValue(newValues, name, value);

				for (const callback of watchCallbacksRef.current) {
					callback(newValues as TFieldValues);
				}

				return newValues;
			});

			setFormState((prev) => ({
				...prev,
				isDirty: true,
				dirtyFields: {
					...prev.dirtyFields,
					[name]: true,
				},
			}));

			if (opts?.shouldValidate) {
				validateField(name, value);
			}
		},
		[setNestedValue, validateField],
	);

	/**
	 * Creates a submit handler that performs validation
	 */
	const handleSubmit = React.useCallback(
		(onSubmit: (data: TFieldValues) => void) => {
			return async (e: React.FormEvent) => {
				e.preventDefault();

				setFormState((prev) => ({
					...prev,
					isSubmitting: true,
				}));

				let isValid = true;
				const validatedValues = formValues as TFieldValues;

				if (options.resolver) {
					const result = options.resolver(validatedValues);
					isValid = Object.keys(result.errors).length === 0;

					setFormState((prev) => ({
						...prev,
						errors: result.errors,
						isValid,
					}));
				}

				if (isValid) {
					await onSubmit(validatedValues);
				}

				setFormState((prev) => ({
					...prev,
					isSubmitting: false,
				}));
			};
		},
		[formValues, options],
	);

	/**
	 * Registers a field with the form
	 */
	const register = React.useCallback(
		<TFieldName extends FieldPath<TFieldValues>>(
			name: TFieldName,
		): FieldDefinition<FieldPathValue<TFieldValues, TFieldName>> => {
			fieldsNamesRef.current.add(name);

			return {
				name,
				value: getNestedValue(formValues, name) as
					| FieldPathValue<TFieldValues, TFieldName>
					| undefined,
				onChange: (e: unknown) => {
					let value: unknown;

					if (
						e &&
						typeof e === "object" &&
						e !== null &&
						"target" in e &&
						e.target &&
						typeof e.target === "object" &&
						"value" in e.target
					) {
						({ value } = e.target as HTMLInputElement);
					} else {
						value = e;
					}

					setFormValues((prev) => {
						const newValues = { ...prev };
						setNestedValue(newValues, name, value);

						for (const callback of watchCallbacksRef.current) {
							callback(newValues as TFieldValues);
						}

						return newValues;
					});

					setFormState((prev) => ({
						...prev,
						isDirty: true,
						dirtyFields: {
							...prev.dirtyFields,
							[name]: true,
						},
					}));

					if (options.mode === "onChange") {
						validateField(name, value);
					}
				},
				onBlur: () => {
					setFormState((prev) => ({
						...prev,
						touchedFields: {
							...prev.touchedFields,
							[name]: true,
						},
					}));

					if (options.mode === "onBlur") {
						validateField(name, getNestedValue(formValues, name));
					}
				},
				ref: (instance: HTMLElement | null) => {
					fieldsRef.current.set(name, instance);
				},
			};
		},
		[formValues, getNestedValue, options.mode, setNestedValue, validateField],
	);

	// Create a memoized version of getValues
	const getValues = React.useMemo(
		() => createGetValues<TFieldValues>(formValues),
		[formValues],
	);

	// Create a memoized version of watch
	const watch = React.useMemo(
		() => createWatcher<TFieldValues>(formValues, onFormValuesChange),
		[formValues, onFormValuesChange],
	);

	/**
	 * Resets the form to default values or specified values
	 */
	const reset = React.useCallback((values?: Partial<TFieldValues>) => {
		const resetValues = values || defaultValuesRef.current;
		setFormValues(resetValues as Partial<TFieldValues>);
		setFormState({
			errors: {},
			isSubmitting: false,
			isDirty: false,
			isValid: true,
			dirtyFields: {},
			touchedFields: {},
		});
	}, []);

	// Control object for useFieldArray and other hooks
	const control = React.useMemo(
		() => ({
			_formValues: formValues,
			_fields: fieldsRef.current,
		}),
		[formValues],
	);

	return {
		register,
		control,
		handleSubmit,
		setValue,
		getValues,
		watch,
		formState,
		reset,
	};
}

// ------------------------------------------------------------------------------------------------
// Field Array Types and Hook
// ------------------------------------------------------------------------------------------------

/**
 * A field array item with a unique ID for tracking
 */
type FieldArrayWithId<
	TFieldArrayValue extends Record<string, unknown> = Record<string, unknown>,
> = TFieldArrayValue & { id: string };

/**
 * Methods provided by the useFieldArray hook
 */
interface FieldArrayMethods<
	TFieldArrayValue extends Record<string, unknown> = Record<string, unknown>,
> {
	/** Swap two items in the array */
	swap: (indexA: number, indexB: number) => void;
	/** Move an item from one position to another */
	move: (from: number, to: number) => void;
	/** Add items to the beginning of the array */
	prepend: (value: TFieldArrayValue | TFieldArrayValue[]) => void;
	/** Add items to the end of the array */
	append: (value: TFieldArrayValue | TFieldArrayValue[]) => void;
	/** Remove item(s) from the array */
	remove: (index?: number | number[]) => void;
	/** Insert item(s) at a specific position */
	insert: (index: number, value: TFieldArrayValue | TFieldArrayValue[]) => void;
	/** Update an item at a specific position */
	update: (index: number, value: TFieldArrayValue) => void;
	/** Replace all items in the array */
	replace: (values: TFieldArrayValue[]) => void;
	/** Current array fields with IDs */
	fields: Array<FieldArrayWithId<TFieldArrayValue>>;
}

/**
 * Props for the useFieldArray hook
 */
interface UseFieldArrayProps<
	TFieldValues extends FieldValues = FieldValues,
	TFieldArrayName extends keyof TFieldValues = keyof TFieldValues,
> {
	/** Control object from useForm */
	control: {
		_formValues: Partial<TFieldValues>;
		_fields: Map<string, HTMLElement | null>;
	};
	/** Name of the field array */
	name: TFieldArrayName & string;
	/** Property name to use for unique IDs (default: 'id') */
	keyName?: string;
}

/**
 * A hook for managing arrays of form fields.
 * Allows adding, removing, and manipulating array items while maintaining form state.
 */
function useFieldArray<
	TFieldValues extends FieldValues = FieldValues,
	TFieldArrayName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
	TFieldArrayValue extends Record<
		string,
		unknown
	> = TFieldValues[TFieldArrayName] extends Array<Record<string, unknown>>
		? TFieldValues[TFieldArrayName][number]
		: Record<string, unknown>,
>({
	control,
	name,
	keyName = "id",
}: UseFieldArrayProps<
	TFieldValues,
	TFieldArrayName
>): FieldArrayMethods<TFieldArrayValue> {
	const { _formValues } = control;

	/**
	 * Gets a value from a nested object path
	 */
	const getNestedValue = React.useCallback(
		<T,>(
			obj: Record<string, unknown> | undefined,
			path: string,
		): T | undefined => {
			if (!obj || !path) return undefined;

			const keys = path.split(".");
			let current: unknown = obj;

			for (const key of keys) {
				if (current === undefined || current === null) {
					return undefined;
				}

				if (typeof current !== "object") {
					return undefined;
				}

				current = (current as Record<string, unknown>)[key];
			}

			return current as T | undefined;
		},
		[],
	);

	/**
	 * Sets a value in a nested object path
	 */
	const setNestedValue = React.useCallback(
		(obj: Record<string, unknown>, path: string, value: unknown): void => {
			if (!path) return;

			const keys = path.split(".");
			const lastKey = keys.pop();

			if (!lastKey) return;

			let current = obj;

			for (const key of keys) {
				if (current[key] === undefined || current[key] === null) {
					const nextKey = keys[keys.indexOf(key) + 1];
					current[key] = nextKey && !Number.isNaN(Number(nextKey)) ? [] : {};
				}

				current = current[key] as Record<string, unknown>;

				if (!current || typeof current !== "object") {
					current = {};
					break;
				}
			}

			current[lastKey] = value;
		},
		[],
	);

	// Get initial fields from form values
	const initialFields = React.useMemo(() => {
		const fieldValue = getNestedValue<TFieldArrayValue[]>(
			_formValues as Record<string, unknown>,
			name as string,
		);
		return Array.isArray(fieldValue) ? fieldValue : [];
	}, [_formValues, name, getNestedValue]);

	/**
	 * Generates a unique ID for field tracking
	 */
	const generateId = React.useCallback(() => {
		return Math.random().toString(36).substring(2, 9);
	}, []);

	/**
	 * Adds unique IDs to field array items if they don't have them
	 */
	const getFieldsWithIds = React.useCallback(
		(data: TFieldArrayValue[]): Array<FieldArrayWithId<TFieldArrayValue>> => {
			return data.map((field) => {
				const fieldObj = field ? { ...field } : {};
				return {
					...fieldObj,
					[keyName]: field?.[keyName] || generateId(),
				} as FieldArrayWithId<TFieldArrayValue>;
			});
		},
		[keyName, generateId],
	);

	// State for fields with IDs
	const [fields, setFields] = React.useState<
		Array<FieldArrayWithId<TFieldArrayValue>>
	>(() => getFieldsWithIds(initialFields));

	/**
	 * Updates the form values with the current field array state
	 */
	const updateFormValues = React.useCallback(
		(newFields: Array<FieldArrayWithId<TFieldArrayValue>>) => {
			if (control._formValues) {
				const fieldValues = newFields.map((field) => {
					const fieldCopy = { ...field } as Record<string, unknown>;

					if (
						keyName !== "id" ||
						!(initialFields[0] as Record<string, unknown>)?.[keyName]
					) {
						delete fieldCopy[keyName];
					}

					return fieldCopy as TFieldArrayValue;
				});

				setNestedValue(
					control._formValues as Record<string, unknown>,
					name as string,
					fieldValues,
				);
			}
		},
		[control, name, keyName, initialFields, setNestedValue],
	);

	// Create array manipulation methods
	const methods = React.useMemo(() => {
		return {
			swap: (indexA: number, indexB: number) => {
				setFields((currentFields) => {
					if (
						indexA < 0 ||
						indexB < 0 ||
						indexA >= currentFields.length ||
						indexB >= currentFields.length
					) {
						return currentFields;
					}

					const newFields = [...currentFields];
					[newFields[indexA], newFields[indexB]] = [
						newFields[indexB],
						newFields[indexA],
					];
					updateFormValues(newFields);
					return newFields;
				});
			},
			move: (from: number, to: number) => {
				setFields((currentFields) => {
					if (from < 0 || from >= currentFields.length) {
						return currentFields;
					}

					const newFields = [...currentFields];
					const item = newFields[from];
					newFields.splice(from, 1);
					newFields.splice(to, 0, item);
					updateFormValues(newFields);
					return newFields;
				});
			},
			prepend: (value: TFieldArrayValue | TFieldArrayValue[]) => {
				const valuesToPrepend = Array.isArray(value) ? value : [value];

				setFields((currentFields) => {
					const fieldsWithIds = valuesToPrepend.map((field) => ({
						...field,
						[keyName]: generateId(),
					})) as Array<FieldArrayWithId<TFieldArrayValue>>;

					const newFields = [...fieldsWithIds, ...currentFields];
					updateFormValues(newFields);
					return newFields;
				});
			},
			append: (value: TFieldArrayValue | TFieldArrayValue[]) => {
				const valuesToAppend = Array.isArray(value) ? value : [value];

				setFields((currentFields) => {
					const fieldsWithIds = valuesToAppend.map((field) => ({
						...field,
						[keyName]: generateId(),
					})) as Array<FieldArrayWithId<TFieldArrayValue>>;

					const newFields = [...currentFields, ...fieldsWithIds];
					updateFormValues(newFields);
					return newFields;
				});
			},
			remove: (index?: number | number[]) => {
				setFields((currentFields) => {
					let newFields: Array<FieldArrayWithId<TFieldArrayValue>>;

					if (index === undefined) {
						newFields = [];
					} else if (Array.isArray(index)) {
						const indexSet = new Set(index);
						newFields = currentFields.filter((_, i) => !indexSet.has(i));
					} else {
						newFields = currentFields.filter((_, i) => i !== index);
					}

					updateFormValues(newFields);
					return newFields;
				});
			},
			insert: (index: number, value: TFieldArrayValue | TFieldArrayValue[]) => {
				const valuesToInsert = Array.isArray(value) ? value : [value];

				setFields((currentFields) => {
					const fieldsWithIds = valuesToInsert.map((field) => ({
						...field,
						[keyName]: generateId(),
					})) as Array<FieldArrayWithId<TFieldArrayValue>>;

					const newFields = [...currentFields];
					newFields.splice(index, 0, ...fieldsWithIds);
					updateFormValues(newFields);
					return newFields;
				});
			},
			update: (index: number, value: TFieldArrayValue) => {
				setFields((currentFields) => {
					if (index < 0 || index >= currentFields.length) {
						return currentFields;
					}

					const newFields = [...currentFields];
					newFields[index] = {
						...value,
						[keyName]: currentFields[index]?.[keyName] || generateId(),
					} as FieldArrayWithId<TFieldArrayValue>;

					updateFormValues(newFields);
					return newFields;
				});
			},
			replace: (values: TFieldArrayValue[]) => {
				const newFields = getFieldsWithIds(values);
				setFields(newFields);
				updateFormValues(newFields);
			},
			fields,
		};
	}, [fields, updateFormValues, generateId, getFieldsWithIds, keyName]);

	// Update field IDs when initialFields change
	React.useEffect(() => {
		setFields(getFieldsWithIds(initialFields));
	}, [initialFields, getFieldsWithIds]);

	return methods;
}

// ------------------------------------------------------------------------------------------------
// TypeScript Utility Types
// ------------------------------------------------------------------------------------------------

/** Helper type to get all elements except the first (proper tail recursion) */
type Tail<T extends readonly unknown[]> = T extends readonly [
	unknown,
	...infer Rest,
]
	? Rest
	: [];

/**
 * Recursively builds a union type of all possible paths through a nested object
 * Depth parameter limits maximum recursion depth to prevent TS errors
 */
type RecursivePath<
	T,
	Depth extends readonly number[] = [0, 1, 2, 3, 4, 5],
> = Depth["length"] extends 0
	? never
	: T extends Array<infer U>
		? U extends Record<string, unknown>
			? `${number}` | `${number}.${RecursivePath<U, Tail<Depth>>}`
			: `${number}`
		: T extends Record<string, unknown>
			? {
					[K in keyof T & string]:
						| `${K}`
						| `${K}.${RecursivePath<T[K], Tail<Depth>>}`;
				}[keyof T & string]
			: never;

/**
 * Creates a union type of all possible field paths in a form values type
 * Example: 'name' | 'age' | 'addresses.0.street' | 'addresses.0.city'
 */
type FieldPath<TFieldValues extends FieldValues> = {
	[K in keyof TFieldValues & string]:
		| K
		| `${K}.${RecursivePath<TFieldValues[K]>}`;
}[keyof TFieldValues & string];

/**
 * Gets the type of the value at a specific path in a form values type
 * Example: FieldPathValue<{ user: { name: string } }, 'user.name'> = string
 */
type FieldPathValue<
	TFieldValues extends FieldValues,
	TPath extends FieldPath<TFieldValues>,
> = TPath extends `${infer K}.${infer R}`
	? K extends keyof TFieldValues
		? R extends `${number}.${infer P}`
			? TFieldValues[K] extends Array<infer Item>
				? Item extends Record<string, unknown>
					? P extends keyof Item
						? Item[P]
						: never
					: never
				: never
			: R extends `${number}`
				? TFieldValues[K] extends Array<infer Item>
					? Item
					: never
				: TFieldValues[K] extends Record<string, unknown>
					? R extends FieldPath<Required<TFieldValues[K]>>
						? FieldPathValue<Required<TFieldValues[K]>, R>
						: never
					: never
		: never
	: TPath extends keyof TFieldValues
		? TFieldValues[TPath]
		: never;

// ------------------------------------------------------------------------------------------------
// Form Components
// ------------------------------------------------------------------------------------------------

/**
 * Props for the Form component
 */
interface FormProps<TFieldValues extends FieldValues = FieldValues>
	extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
	/** Scope for form context isolation */
	__scopeForm?: Scope;
	/** Field registration function from useForm */
	register?: <TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
	) => FieldDefinition<FieldPathValue<TFieldValues, TFieldName>>;
	/** Form control object from useForm */
	control?: {
		_formValues: Partial<TFieldValues>;
		_fields: Map<string, HTMLElement | null>;
	};
	/** Submit handler creator from useForm */
	handleSubmit?: (
		onSubmit: (data: TFieldValues) => void,
	) => (e: React.FormEvent) => void;
	/** Function to set field values */
	setValue?: <TFieldName extends FieldPath<TFieldValues>>(
		name: TFieldName,
		value: FieldPathValue<TFieldValues, TFieldName>,
		options?: { shouldValidate?: boolean; shouldDirty?: boolean },
	) => void;
	/** Function to get form values */
	getValues?: {
		(): TFieldValues;
		<TFieldName extends FieldPath<TFieldValues>>(
			name: TFieldName,
		): FieldPathValue<TFieldValues, TFieldName>;
	};
	/** Current form state */
	formState?: FormStateValues;
	/** Function to reset the form */
	reset?: (values?: Partial<TFieldValues>) => void;
	/** Submit handler for the form */
	onSubmit?: (data: TFieldValues) => void;
}

/**
 * The root form component that provides form context to its children.
 * Wraps a native HTML form element with the form state from useForm.
 */
function FormComponent<TFieldValues extends FieldValues = FieldValues>(
	props: FormProps<TFieldValues>,
	ref: React.ForwardedRef<HTMLFormElement>,
) {
	const {
		__scopeForm,
		className,
		children,
		onSubmit,
		register,
		control,
		handleSubmit,
		setValue,
		getValues,
		formState,
		reset,
		...formProps
	} = props;

	// Create form context to pass down to children
	const formContextValue: FormContextValue = {
		register: register as (name: string) => FieldDefinition,
		control: control as {
			_formValues: Record<string, unknown>;
			_fields: Map<string, HTMLElement | null>;
		},
		handleSubmit: handleSubmit as (
			onSubmit: (data: TFieldValues) => void,
		) => (e: React.FormEvent) => void,
		setValue: setValue as (
			name: string,
			value: unknown,
			options?: { shouldValidate?: boolean; shouldDirty?: boolean },
		) => void,
		getValues: getValues as (name?: string) => unknown,
		formState: formState || {
			errors: {},
			isSubmitting: false,
			isDirty: false,
			isValid: true,
			dirtyFields: {},
			touchedFields: {},
		},
		reset: reset as (values?: Record<string, unknown>) => void,
	};

	// Create a submit handler if both handleSubmit and onSubmit are provided
	const onSubmitHandler =
		handleSubmit && onSubmit ? handleSubmit(onSubmit) : undefined;

	return (
		<FormProvider scope={__scopeForm} {...formContextValue}>
			<form
				ref={ref}
				onSubmit={onSubmitHandler}
				className={cn(className)}
				{...formProps}
			>
				{children}
			</form>
		</FormProvider>
	);
}

/**
 * The Form component with forwardRef for DOM ref passing
 */
const Form = React.forwardRef(FormComponent) as <
	TFieldValues extends FieldValues = FieldValues,
>(
	props: FormProps<TFieldValues> & React.RefAttributes<HTMLFormElement>,
) => React.ReactElement;

(Form as React.FC).displayName = "Form";

/**
 * Props for the FormField component
 */
interface FormFieldProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	/** Field name in dot notation */
	name: TName;
	/** Form control object from useForm */
	control: {
		_formValues: Partial<TFieldValues>;
		_fields: Map<string, HTMLElement | null>;
	};
	/** Scope for context isolation */
	__scopeForm?: Scope;
	/** Render function for the field UI */
	render: (props: {
		field: FieldDefinition<FieldPathValue<TFieldValues, TName>>;
		formState: FormStateValues;
	}) => React.ReactElement;
}

/**
 * Connects a form control to the form state by name.
 * Renders the appropriate input component using the render prop pattern.
 */
function FormFieldComponent<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	__scopeForm,
	name,
	control: _control,
	render,
}: FormFieldProps<TFieldValues, TName>) {
	const formContext = useFormContext(FIELD_NAME, __scopeForm);
	const { formState } = formContext;

	// Generate a unique ID for this field
	const id = useId();

	// Get the typed register function
	const typedRegister = formContext.register as <K extends string>(
		name: K,
	) => FieldDefinition<FieldPathValue<TFieldValues, TName>>;

	// Register this field with the form
	const field = typedRegister(name);

	return (
		<FormFieldProvider scope={__scopeForm} name={name} id={id}>
			{render({ field, formState })}
		</FormFieldProvider>
	);
}

/**
 * The FormField component with TypeScript generics support
 */
const FormField = FormFieldComponent as <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
	props: FormFieldProps<TFieldValues, TName>,
) => React.ReactElement;

(FormField as React.FC).displayName = "FormField";

/**
 * Props for the FormItem component
 */
interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
	/** Scope for context isolation */
	__scopeForm?: Scope;
}

/**
 * Container component that groups related form elements.
 * Provides spacing and structure for form fields and their associated elements.
 */
const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
	({ __scopeForm, className, ...props }, ref) => {
		const id = useId();

		return (
			<FormItemProvider scope={__scopeForm} id={id}>
				<div ref={ref} className={cn("space-y-2", className)} {...props} />
			</FormItemProvider>
		);
	},
);
FormItem.displayName = "FormItem";

/**
 * Props for the FormLabel component
 */
interface FormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
	/** Scope for context isolation */
	__scopeForm?: Scope;
}

/**
 * Label component for form inputs.
 * Automatically connects to its corresponding form control for accessibility.
 */
const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
	({ __scopeForm, className, ...props }, ref) => {
		const fieldContext = useFormFieldContext(FIELD_NAME, __scopeForm);
		const itemContext = useFormItemContext(ITEM_NAME, __scopeForm);
		const id = fieldContext?.id || itemContext?.id;

		return (
			<Label
				ref={ref}
				htmlFor={id}
				className={cn(
					"font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
					className,
				)}
				{...props}
			/>
		);
	},
);
FormLabel.displayName = "FormLabel";

/**
 * Props for the FormControl component
 */
interface FormControlProps extends React.HTMLAttributes<HTMLElement> {
	/** Scope for context isolation */
	__scopeForm?: Scope;
}

/**
 * A wrapper component that applies proper ARIA attributes to form controls.
 * Connects form controls with their labels and error messages.
 */
const FormControl = React.forwardRef<HTMLElement, FormControlProps>(
	({ __scopeForm, ...props }, ref) => {
		const fieldContext = useFormFieldContext(FIELD_NAME, __scopeForm);
		const itemContext = useFormItemContext(ITEM_NAME, __scopeForm);
		const id = fieldContext?.id || itemContext?.id;

		const formContext = useFormContext(FIELD_NAME, __scopeForm);
		const { errors } = formContext.formState;

		// Check if this field has an error
		const fieldName = fieldContext?.name;
		const hasError = fieldName ? !!errors[fieldName] : false;

		return (
			<Slot
				ref={ref}
				id={id}
				aria-invalid={hasError ? true : undefined}
				aria-describedby={hasError ? `${id}-error` : undefined}
				{...props}
			/>
		);
	},
);
FormControl.displayName = "FormControl";

/**
 * Props for the FormDescription component
 */
interface FormDescriptionProps
	extends React.HTMLAttributes<HTMLParagraphElement> {
	/** Scope for context isolation */
	__scopeForm?: Scope;
}

/**
 * Displays descriptive text below a form field.
 * Provides additional context or instructions for users.
 */
const FormDescription = React.forwardRef<
	HTMLParagraphElement,
	FormDescriptionProps
>(({ __scopeForm, className, ...props }, ref) => {
	const fieldContext = useFormFieldContext(FIELD_NAME, __scopeForm);
	const itemContext = useFormItemContext(ITEM_NAME, __scopeForm);
	const id = fieldContext?.id || itemContext?.id;

	return (
		<p
			ref={ref}
			id={`${id}-description`}
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
});
FormDescription.displayName = "FormDescription";

/**
 * Props for the FormMessage component
 */
interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
	/** Scope for context isolation */
	__scopeForm?: Scope;
}

/**
 * Displays validation error messages for form fields.
 * Automatically shows relevant error messages from form state.
 */
const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
	({ __scopeForm, className, children, ...props }, ref) => {
		const fieldContext = useFormFieldContext(FIELD_NAME, __scopeForm);
		const itemContext = useFormItemContext(ITEM_NAME, __scopeForm);
		const id = fieldContext?.id || itemContext?.id;

		const formContext = useFormContext(FIELD_NAME, __scopeForm);
		const { errors } = formContext.formState;

		// Get field error if it exists
		const fieldName = fieldContext?.name;
		let error: FieldError | undefined = undefined;

		if (fieldName) {
			// Handle nested field paths
			const parts = fieldName.split(".");
			let current: unknown = errors;

			for (const part of parts) {
				if (!current || typeof current !== "object") {
					current = undefined;
					break;
				}

				current = (current as Record<string, unknown>)[part];
			}

			if (
				current &&
				typeof current === "object" &&
				"message" in current &&
				(typeof current.message === "string" || current.message === undefined)
			) {
				error = current as FieldError;
			}

			// Special handling for array field errors
			if (!error && parts.length > 1) {
				const arrayPath = parts[0];
				if (errors[arrayPath] && typeof errors[arrayPath] === "object") {
					error = errors[arrayPath];
				}
			}
		}

		// Use provided children or error message
		const body = error ? String(error.message) : children;

		if (!body) {
			return null;
		}

		return (
			<p
				ref={ref}
				id={`${id}-error`}
				className={cn("font-medium text-destructive text-sm", className)}
				{...props}
			>
				{body}
			</p>
		);
	},
);
FormMessage.displayName = "FormMessage";

export {
	useForm,
	useFieldArray,
	useFormContext,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	createFormScope,
	createFieldScope,
	createItemScope,
};
