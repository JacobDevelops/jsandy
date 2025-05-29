import type z from "zod/v4";

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
