import type * as z from "zod";

// ------------------------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------------------------

/**
 * Represents a validation error for a single field.
 */
interface FieldError {
	message?: string;
}

/**
 * Map of field names to their validation errors.
 */
interface FieldErrors {
	[key: string]: FieldError | undefined;
}

// ------------------------------------------------------------------------------------------------
// Zod Resolver
// ------------------------------------------------------------------------------------------------

/**
 * A resolver that integrates Zod schemas with the form validation system.
 * Converts Zod validation errors into the format expected by useForm.
 */
function zodResolver<T extends z.ZodType<unknown, z.ZodTypeDef, unknown>>(
	schema: T,
) {
	return (values: z.infer<T>) => {
		try {
			schema.parse(values);
			return { values, errors: {} };
		} catch (error) {
			const zodError = error as z.ZodError;
			const errors: FieldErrors = {};

			for (const err of zodError.errors) {
				const path = err.path[0]?.toString() || "";
				if (!errors[path]) {
					errors[path] = { message: err.message };
				}
			}

			return { values, errors };
		}
	};
}

export { zodResolver };
