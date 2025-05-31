import type { z } from "zod/v4";

/**
 * Utility type that performs strict equality comparison between two types
 * Returns true only if T and U are exactly the same type (bidirectional extends check)
 * @template T - First type to compare
 * @template U - Second type to compare
 */
type StrictEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

/**
 * Creates a type-safe schema builder that ensures the Zod schema exactly matches the target type T
 * This function provides compile-time type safety by enforcing that the schema's inferred type
 * is strictly equal to the specified target type
 *
 * @template T - The target type that the schema must match exactly
 * @returns A function that accepts a Zod schema and validates it matches type T
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   age: number;
 * }
 *
 * const userSchemaBuilder = createSchema<User>();
 * const userSchema = userSchemaBuilder(z.object({
 *   name: z.string(),
 *   age: z.number()
 * })); // ✅ Valid - schema matches User interface exactly
 * ```
 */
export function createSchema<T extends Record<string, unknown>>() {
	return <U extends z.ZodRawShape>(
		/**
		 * Zod object schema that must exactly match the target type T
		 * @param schema - The Zod schema to validate against type T
		 */
		schema: StrictEqual<T, z.infer<z.ZodObject<U>>> extends true
			? z.ZodObject<U>
			: never,
	) => {
		return schema;
	};
}

/**
 * Creates a type-safe enum schema builder for Zod enums with string values
 * This function ensures the enum schema contains values of the specified string type T
 *
 * @template T - The string literal type that enum values must extend
 * @returns A function that accepts a Zod enum schema and validates its value types
 *
 * @example
 * ```typescript
 * type Status = "active" | "inactive" | "pending";
 *
 * const statusSchemaBuilder = createEnumSchema<Status>();
 * const statusSchema = statusSchemaBuilder(
 *   z.enum(["active", "inactive", "pending"])
 * ); // ✅ Valid - all enum values are of type Status
 * ```
 */
export function createEnumSchema<T extends string>() {
	return <const U extends Readonly<Record<string, T>>>(
		/**
		 * Zod enum schema with values that must be of type T
		 * @param schema - The Zod enum schema to return
		 */
		schema: z.ZodEnum<U>,
	): z.ZodEnum<U> => schema;
}
