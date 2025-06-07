import { type ZodType, toJSONSchema } from "zod/v4";
import type { JSONSchema } from "zod/v4/core";
import type { ProcedureDescription } from "./procedure";
import type { Router } from "./router";
import type { ZodAny } from "./types";

/**
 * OpenAPI specification structure
 */
export interface OpenAPISpec {
	openapi: string;
	info: {
		title: string;
		version: string;
		description?: string;
	};
	servers?: Array<{
		url: string;
		description?: string;
	}>;
	paths: Record<string, any>;
	components?: {
		schemas?: Record<string, any>;
		securitySchemes?: Record<string, any>;
	};
	tags?: Array<{
		name: string;
		description?: string;
	}>;
}

/**
 * Configuration for OpenAPI generation
 */
export interface OpenAPIConfig {
	/** API title */
	title: string;
	/** API version */
	version: string;
	/** API description */
	description?: string;
	/** Server configurations */
	servers?: Array<{
		url: string;
		description?: string;
	}>;
	/** Base path for all routes */
	basePath?: string;
	/** Security schemes */
	securitySchemes?: Record<string, any>;
}

/**
 * Generates OpenAPI documentation from JSandy routers with procedure descriptions
 *
 * @param router - The router instance to generate documentation from
 * @param config - Configuration for the OpenAPI specification
 * @returns Complete OpenAPI specification object
 *
 * @example
 * ```typescript
 * import { generateOpenAPISpec } from '@jsandy/rpc';
 *
 * const spec = await generateOpenAPISpec(appRouter, {
 *   title: 'My API',
 *   version: '1.0.0',
 *   description: 'A comprehensive API built with JSandy',
 *   servers: [
 *     { url: 'https://api.example.com', description: 'Production' },
 *     { url: 'http://localhost:8080', description: 'Development' }
 *   ]
 * });
 *
 * // Use with Hono to serve documentation
 * app.get('/openapi.json', (c) => c.json(spec));
 * ```
 */
export async function generateOpenAPISpec(
	router: Router,
	config: OpenAPIConfig,
): Promise<OpenAPISpec> {
	const spec: OpenAPISpec = {
		openapi: "3.0.0",
		info: {
			title: config.title,
			version: config.version,
			description: config.description,
		},
		servers: config.servers,
		paths: {},
		components: {
			schemas: {},
			securitySchemes: config.securitySchemes,
		},
		tags: [],
	};

	// Track unique tags and schemas
	const tags = new Set<string>();
	const schemas = new Map<string, any>();

	await processRouter(router, "", spec, tags, schemas, config.basePath);

	// Add collected tags to spec
	spec.tags = Array.from(tags).map((tag) => ({ name: tag }));

	// Add collected schemas to spec
	if (schemas.size > 0) {
		// biome-ignore lint/style/noNonNullAssertion: We just checked that schemas.size > 0
		spec.components!.schemas = Object.fromEntries(schemas);
	}

	return spec;
}

/**
 * Recursively processes a router and its sub-routers to extract OpenAPI paths
 */
async function processRouter(
	router: Router | Promise<Router>,
	basePath: string,
	spec: OpenAPISpec,
	tags: Set<string>,
	schemas: Map<string, any>,
	configBasePath?: string,
): Promise<void> {
	// Resolve router if it's a promise (dynamic import)
	const resolvedRouter = await Promise.resolve(router);
	const metadata = resolvedRouter._metadata;

	// Process procedures at current level
	if (metadata.procedures) {
		for (const [procedureName, procedure] of Object.entries(
			metadata.procedures,
		)) {
			const fullPath = `${basePath}/${procedureName}`;
			const pathKey = (configBasePath || "") + fullPath;

			// Skip WebSocket procedures for now (OpenAPI doesn't have great WebSocket support)
			if (procedure.type === "ws") {
				continue;
			}

			// Initialize path object if it doesn't exist
			if (!spec.paths[pathKey]) {
				spec.paths[pathKey] = {};
			}

			// Get the actual operation from the router to access description
			const operation = findOperationInRouter(resolvedRouter, procedureName);
			const description = operation?.description;

			// Process GET operations
			if (procedure.type === "get") {
				spec.paths[pathKey].get = createOperationSpec(
					procedure,
					description,
					tags,
					schemas,
				);
			}

			// Process POST operations
			if (procedure.type === "post") {
				spec.paths[pathKey].post = createOperationSpec(
					procedure,
					description,
					tags,
					schemas,
				);
			}
		}
	}

	// Recursively process sub-routers
	if (metadata.subRouters) {
		for (const [routePath, subRouter] of Object.entries(metadata.subRouters)) {
			const newPath = `${basePath}${routePath}`;
			await processRouter(
				subRouter,
				newPath,
				spec,
				tags,
				schemas,
				configBasePath,
			);
		}
	}
}

/**
 * Finds an operation in the router to access its description metadata
 */
function findOperationInRouter(router: Router, procedureName: string): any {
	// This is a bit of a hack since we need to access the original operations
	// In a real implementation, you might want to store this differently
	// For now, we'll try to access it through the router's internal structure
	try {
		return router._metadata.operations?.[procedureName];
	} catch {
		return null;
	}
}

/**
 * Creates an OpenAPI operation specification from a procedure
 */
function createOperationSpec(
	procedure: any,
	description: ProcedureDescription | undefined,
	tags: Set<string>,
	schemas: Map<string, any>,
): OpenAPISpec["paths"][string] {
	const operation: OpenAPISpec["paths"][string] = {
		summary:
			description?.summary || `${procedure.type.toUpperCase()} operation`,
		description: description?.description || "",
		operationId: description?.operationId,
		deprecated: description?.deprecated || false,
		tags: description?.tags || [],
		responses: {
			200: {
				description: "Successful response",
				content: {
					"application/json": {
						schema: { type: "object" },
					},
				},
			},
		},
	};

	// Add tags to the global tag set
	if (description?.tags) {
		for (const tag of description.tags) {
			tags.add(tag);
		}
	}

	// Handle input schema (query parameters for GET, request body for POST)
	if (procedure.schema) {
		const inputSchema = convertZodToOpenAPI(procedure.schema, schemas);

		if (procedure.type === "get") {
			// For GET requests, convert schema properties to query parameters
			operation.parameters = createQueryParameters(inputSchema, schemas);
		} else if (procedure.type === "post") {
			// For POST requests, use schema as request body
			operation.requestBody = {
				required: true,
				content: {
					"application/json": {
						schema: inputSchema,
					},
				},
			};
		}
	}

	// Handle output schema from description
	if (description?.schema) {
		const outputSchema = convertZodToOpenAPI(description.schema, schemas);
		operation.responses[200].content["application/json"].schema = outputSchema;
	}

	// Add additional OpenAPI metadata from description
	if (description?.openapi) {
		if (description.openapi.security) {
			operation.security = description.openapi.security;
		}
		if (description.openapi.responses) {
			Object.assign(operation.responses, description.openapi.responses);
		}
	}

	// Add error responses
	operation.responses[400] = {
		description: "Bad Request",
		content: {
			"application/json": {
				schema: {
					type: "object",
					properties: {
						error: { type: "string" },
						message: { type: "string" },
					},
				},
			},
		},
	};

	operation.responses[500] = {
		description: "Internal Server Error",
		content: {
			"application/json": {
				schema: {
					type: "object",
					properties: {
						error: { type: "string" },
						message: { type: "string" },
					},
				},
			},
		},
	};

	return operation;
}

/**
 * Converts a Zod schema to OpenAPI JSON Schema format
 */
function convertZodToOpenAPI(
	zodSchema: ZodAny | JSONSchema.BaseSchema,
	schemas: Map<string, any>,
): JSONSchema.BaseSchema {
	try {
		// We cannot convert zod v3 schemas to openapi, so we return an empty object
		if (!("_zod" in zodSchema) && !("$schema" in zodSchema)) {
			return { type: "object" };
		}
		let jsonSchema: JSONSchema.BaseSchema;
		if (!("$schema" in zodSchema)) {
			jsonSchema = toJSONSchema(zodSchema as ZodType);
		} else {
			jsonSchema = zodSchema as JSONSchema.BaseSchema;
		}

		// Only create schema references for complex objects that would benefit from reuse
		const shouldCreateReference = isComplexSchema(jsonSchema);

		if (shouldCreateReference) {
			// Use the schema's title if available, otherwise generate a meaningful name
			const schemaName =
				jsonSchema.title || generateSchemaName(jsonSchema, schemas);

			// Check if we already have this schema to avoid duplicates
			const existingSchema = findExistingSchema(jsonSchema, schemas);
			if (existingSchema) {
				return { $ref: `#/components/schemas/${existingSchema}` };
			}

			schemas.set(schemaName, jsonSchema);
			return { $ref: `#/components/schemas/${schemaName}` };
		}

		return jsonSchema;
	} catch (error) {
		console.warn("Failed to convert Zod schema to OpenAPI:", error);
		return { type: "object" };
	}
}

/**
 * Determines if a schema is complex enough to warrant creating a reusable reference
 */
function isComplexSchema(jsonSchema: JSONSchema.BaseSchema): boolean {
	// Don't create references for simple schemas
	if (
		!jsonSchema.type ||
		jsonSchema.type !== "object" ||
		!jsonSchema.properties
	) {
		return false;
	}

	const propertyCount = Object.keys(jsonSchema.properties).length;

	// Create references for schemas with:
	// 1. More than 3 properties (complex enough to be worth reusing)
	// 2. Nested objects (likely to be reused)
	// 3. Arrays of objects (complex structure)
	// 4. Explicit title (developer indicated it should be a named schema)

	if (jsonSchema.title) {
		return true; // Explicit title indicates developer wants it as a named schema
	}

	if (propertyCount > 3) {
		return true; // Complex object with many properties
	}

	// Check for nested objects or arrays of objects
	for (const [_, property] of Object.entries(jsonSchema.properties)) {
		const prop = property as any;

		// Nested object
		if (prop.type === "object" && prop.properties) {
			return true;
		}

		// Array of objects
		if (
			prop.type === "array" &&
			prop.items?.type === "object" &&
			prop.items?.properties
		) {
			return true;
		}
	}

	return false;
}

/**
 * Generates a meaningful schema name based on the schema structure
 */
function generateSchemaName(
	jsonSchema: any,
	schemas: Map<string, any>,
): string {
	// Try to generate a name based on property names
	const properties = Object.keys(jsonSchema.properties || {});

	if (properties.length === 0) {
		return `Schema_${schemas.size + 1}`;
	}

	// Create a name from key properties (max 3 to keep it readable)
	const keyProps = properties.slice(0, 3);
	const baseName = keyProps
		.map((prop) => prop.charAt(0).toUpperCase() + prop.slice(1))
		.join("");

	// Ensure uniqueness
	let schemaName = baseName;
	let counter = 1;
	while (schemas.has(schemaName)) {
		schemaName = `${baseName}_${counter}`;
		counter++;
	}

	return schemaName;
}

/**
 * Finds an existing schema that matches the given schema structure
 */
function findExistingSchema(
	jsonSchema: any,
	schemas: Map<string, any>,
): string | null {
	// Simple structural comparison to avoid duplicate schemas
	const currentSchemaString = JSON.stringify(jsonSchema);

	for (const [name, existingSchema] of schemas) {
		if (JSON.stringify(existingSchema) === currentSchemaString) {
			return name;
		}
	}

	return null;
}

/**
 * Creates OpenAPI query parameters from a JSON schema
 */
function createQueryParameters(
	schema: JSONSchema.BaseSchema,
	schemas: Map<string, any>,
): any[] {
	if (!schema.properties && !getReusableSchema(schema, schemas)) {
		return [];
	}
	if (schema.$ref) {
		// biome-ignore lint/style/noParameterAssign: We need to assign the schema to the reusable schema
		schema = getReusableSchema(schema, schemas) as JSONSchema.BaseSchema;
	}

	return Object.entries(schema.properties || {}).map(
		([name, propSchema]: [string, any]) => ({
			name,
			in: "query",
			required: schema.required?.includes(name) || false,
			schema: propSchema,
			description: propSchema.description,
		}),
	);
}

/**
 * Creates a Swagger UI HTML page for API documentation
 *
 * @param specUrl - URL where the OpenAPI spec JSON is served
 * @param title - Title for the documentation page
 * @returns HTML string for Swagger UI
 *
 * @example
 * ```typescript
 * // Serve Swagger UI
 * app.get('/docs', (c) => {
 *   const html = createSwaggerUI('/openapi.json', 'My API Documentation');
 *   return c.html(html);
 * });
 * ```
 */
export function createSwaggerUI(
	specUrl: string,
	title = "API Documentation",
): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '${specUrl}',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.presets.standalone,
        ],
        layout: "StandaloneLayout",
      });
    };
  </script>
</body>
</html>`;
}

/**
 * Helper function to add OpenAPI documentation routes to a Hono app
 *
 * @param app - Hono application instance
 * @param router - JSandy router to generate docs from
 * @param config - OpenAPI configuration
 * @param options - Additional options for documentation routes
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { addOpenAPIRoutes } from '@jsandy/rpc';
 *
 * const app = new Hono();
 *
 * // Add OpenAPI documentation routes
 * await addOpenAPIRoutes(app, userRouter, {
 *   title: 'User API',
 *   version: '1.0.0',
 *   description: 'API for managing users'
 * }, {
 *   specPath: '/api-spec.json',
 *   docsPath: '/api-docs'
 * });
 * ```
 */
export async function addOpenAPIRoutes(
	app: any, // Hono instance
	router: Router,
	config: OpenAPIConfig,
	options: {
		specPath?: string;
		docsPath?: string;
	} = {},
): Promise<void> {
	const { specPath = "/openapi.json", docsPath = "/docs" } = options;

	// Generate the OpenAPI specification
	const spec = await generateOpenAPISpec(router, config);

	// Add route for serving the OpenAPI JSON spec
	app.get(specPath, (c: any) => c.json(spec));

	// Add route for serving Swagger UI documentation
	app.get(docsPath, (c: any) => {
		const html = createSwaggerUI(specPath, config.title);
		return c.html(html);
	});
}

function getReusableSchema(
	schema: JSONSchema.BaseSchema,
	schemas: Map<string, any>,
): JSONSchema.BaseSchema | null {
	const schemaRef = schema.$ref;
	if (!schemaRef || !schemaRef.startsWith("#/components/schemas/")) {
		return null;
	}
	// biome-ignore lint/style/noNonNullAssertion: We just checked that schemaRef is not null
	return schemas.get(schemaRef.split("/").pop()!);
}
