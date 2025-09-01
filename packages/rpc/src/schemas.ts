import type { z } from "zod";
import type { JSONSchema } from "zod/v4/core";
import type { Router } from "./router";

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

interface GroupedRoute {
	path: string;
	schema: JSONSchema.BaseSchema | null;
}

interface GroupedRoutes {
	[groupPath: string]: {
		routes: GroupedRoute[];
		subGroups: GroupedRoutes;
	};
}

export async function extractRouterSchemas(
	router: Router,
): Promise<GroupedRoutes> {
	const result: GroupedRoutes = {};

	async function traverse(
		currentRouter: Router | Promise<Router>,
		currentPath: string,
		targetGroup: GroupedRoutes,
	) {
		if (currentRouter instanceof Promise) {
			currentRouter = await currentRouter;
		}
		const metadata = currentRouter._metadata;

		// Process procedures at current level
		if (metadata.procedures) {
			for (const [procedureName, procedure] of Object.entries(
				metadata.procedures,
			)) {
				const fullPath = `${currentPath}/${procedureName}`;
				const pathParts = fullPath.split("/").filter(Boolean);

				// Create nested group structure
				let currentGroup = targetGroup;
				let groupPath = "";

				// Create groups for each path segment except the last (which is the procedure)
				for (let i = 0; i < pathParts.length - 1; i++) {
					const segment = pathParts[i];
					groupPath += `/${segment}`;

					if (!currentGroup[groupPath]) {
						currentGroup[groupPath] = { routes: [], subGroups: {} };
					}
					currentGroup = currentGroup[groupPath].subGroups;
				}

				// Add the route to the appropriate group
				const routeGroupPath = groupPath || "/";
				if (!targetGroup[routeGroupPath]) {
					targetGroup[routeGroupPath] = {
						routes: [],
						subGroups: {},
					};
				}

				targetGroup[routeGroupPath].routes.push({
					path: fullPath,
					schema: procedure.schema,
				});
			}
		}

		// Recursively process sub-routers
		if (metadata.subRouters) {
			for (const [routePath, subRouter] of Object.entries(
				metadata.subRouters,
			)) {
				const newPath = `${currentPath}${routePath}`;
				await traverse(subRouter, newPath, targetGroup);
			}
		}
	}

	await traverse(router, "", result);
	return result;
}
