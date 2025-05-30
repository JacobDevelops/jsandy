import type { ZodObject, ZodType } from "zod/v4";
import type { z } from "zod/v4";

type StrictEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

export function createSchema<T extends Record<string, unknown>>() {
	return <U extends z.ZodRawShape>(
		schema: StrictEqual<T, z.infer<z.ZodObject<U>>> extends true
			? z.ZodObject<U>
			: never,
	) => {
		return schema;
	};
}

export function createEnumSchema<T extends string>() {
	return <const U extends Readonly<Record<string, T>>>(
		schema: z.ZodEnum<U>,
	): z.ZodEnum<U> => schema;
}

// Function to extract types from serialized zod schema
export function extractZodTypes(schemaDef: ZodObject | ZodType) {
	if (!schemaDef || !schemaDef.def) return null;

	const def = schemaDef.def;

	// Handle different zod types
	switch (def.type) {
		case "object": {
			const objectTypes: Record<string, unknown> = {};
			if ("shape" in def && def.shape) {
				for (const [key, value] of Object.entries(def.shape)) {
					objectTypes[key] = extractZodTypes(value);
				}
			}
			return objectTypes;
		}

		case "string":
		case "number":
		case "boolean":
		case "date":
		case "array":
		case "union":
		case "optional":
		case "nullable":
			return def.type;

		default:
			return def.type || "unknown";
	}
}
