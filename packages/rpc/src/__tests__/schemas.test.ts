import { describe, expect, it } from "bun:test";
import { z } from "zod/v4";
import { createSchema, createEnumSchema } from "../schemas";

describe("Schema Utilities", () => {
	describe("createSchema", () => {
		it("should create schema that matches target type exactly", () => {
			type User = {
				name: string;
				age: number;
				email: string;
			};

			const userSchemaBuilder = createSchema<User>();
			const userSchema = userSchemaBuilder(
				z.object({
					name: z.string(),
					age: z.number(),
					email: z.string(),
				}),
			);

			expect(userSchema).toBeDefined();
			expect(userSchema.parse).toBeDefined();
		});

		it("should validate data against schema", () => {
			type Product = {
				id: string;
				name: string;
				price: number;
				inStock: boolean;
			};

			const productSchemaBuilder = createSchema<Product>();
			const productSchema = productSchemaBuilder(
				z.object({
					id: z.string(),
					name: z.string(),
					price: z.number(),
					inStock: z.boolean(),
				}),
			);

			const validProduct = {
				id: "123",
				name: "Test Product",
				price: 29.99,
				inStock: true,
			};

			const result = productSchema.parse(validProduct);
			expect(result).toEqual(validProduct);
		});

		it("should reject invalid data", () => {
			type Config = {
				apiUrl: string;
				timeout: number;
			};

			const configSchemaBuilder = createSchema<Config>();
			const configSchema = configSchemaBuilder(
				z.object({
					apiUrl: z.string(),
					timeout: z.number(),
				}),
			);

			const invalidConfig = {
				apiUrl: 123, // Should be string
				timeout: "30", // Should be number
			};

			expect(() => configSchema.parse(invalidConfig)).toThrow();
		});

		it("should handle optional properties", () => {
			type UserProfile = {
				username: string;
				bio?: string;
				avatar?: string;
			};

			const profileSchemaBuilder = createSchema<UserProfile>();
			const profileSchema = profileSchemaBuilder(
				z.object({
					username: z.string(),
					bio: z.string().optional(),
					avatar: z.string().optional(),
				}),
			);

			const minimalProfile = { username: "testuser" };
			const fullProfile = {
				username: "testuser",
				bio: "Hello world",
				avatar: "avatar.jpg",
			};

			expect(profileSchema.parse(minimalProfile)).toEqual(minimalProfile);
			expect(profileSchema.parse(fullProfile)).toEqual(fullProfile);
		});

		it("should handle nested objects", () => {
			type Address = {
				street: string;
				city: string;
				zipCode: string;
			};

			type Contact = {
				name: string;
				address: Address;
			};

			const contactSchemaBuilder = createSchema<Contact>();
			const contactSchema = contactSchemaBuilder(
				z.object({
					name: z.string(),
					address: z.object({
						street: z.string(),
						city: z.string(),
						zipCode: z.string(),
					}),
				}),
			);

			const validContact = {
				name: "John Doe",
				address: {
					street: "123 Main St",
					city: "Anytown",
					zipCode: "12345",
				},
			};

			const result = contactSchema.parse(validContact);
			expect(result).toEqual(validContact);
		});

		it("should handle arrays", () => {
			type TaggedItem = {
				id: string;
				tags: string[];
			};

			const itemSchemaBuilder = createSchema<TaggedItem>();
			const itemSchema = itemSchemaBuilder(
				z.object({
					id: z.string(),
					tags: z.array(z.string()),
				}),
			);

			const validItem = {
				id: "item1",
				tags: ["tag1", "tag2", "tag3"],
			};

			const result = itemSchema.parse(validItem);
			expect(result).toEqual(validItem);
		});
	});

	describe("createEnumSchema", () => {
		it("should create enum schema for string literals", () => {
			type Status = "active" | "inactive" | "pending";

			const statusSchemaBuilder = createEnumSchema<Status>();
			const statusSchema = statusSchemaBuilder(
				z.enum(["active", "inactive", "pending"]),
			);

			expect(statusSchema.parse("active")).toBe("active");
			expect(statusSchema.parse("inactive")).toBe("inactive");
			expect(statusSchema.parse("pending")).toBe("pending");
		});

		it("should reject invalid enum values", () => {
			type Priority = "low" | "medium" | "high";

			const prioritySchemaBuilder = createEnumSchema<Priority>();
			const prioritySchema = prioritySchemaBuilder(
				z.enum(["low", "medium", "high"]),
			);

			expect(() => prioritySchema.parse("invalid")).toThrow();
			expect(() => prioritySchema.parse("urgent")).toThrow();
		});

		it("should work with single value enums", () => {
			type SingleValue = "only";

			const singleSchemaBuilder = createEnumSchema<SingleValue>();
			const singleSchema = singleSchemaBuilder(z.enum(["only"]));

			expect(singleSchema.parse("only")).toBe("only");
			expect(() => singleSchema.parse("other")).toThrow();
		});

		it("should work with many enum values", () => {
			type Color =
				| "red"
				| "orange"
				| "yellow"
				| "green"
				| "blue"
				| "indigo"
				| "violet";

			const colorSchemaBuilder = createEnumSchema<Color>();
			const colorSchema = colorSchemaBuilder(
				z.enum([
					"red",
					"orange",
					"yellow",
					"green",
					"blue",
					"indigo",
					"violet",
				]),
			);

			expect(colorSchema.parse("red")).toBe("red");
			expect(colorSchema.parse("violet")).toBe("violet");
			expect(() => colorSchema.parse("pink")).toThrow();
		});

		it("should preserve enum type information", () => {
			type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

			const methodSchemaBuilder = createEnumSchema<HttpMethod>();
			const methodSchema = methodSchemaBuilder(
				z.enum(["GET", "POST", "PUT", "DELETE"]),
			);

			// Type checking happens at compile time
			const result = methodSchema.parse("GET");
			expect(result).toBe("GET");
		});
	});

	describe("Type safety", () => {
		it("should enforce exact type matching for createSchema", () => {
			type StrictType = {
				requiredField: string;
				optionalField?: number;
			};

			const schemaBuilder = createSchema<StrictType>();

			// This should compile - exact match
			const validSchema = schemaBuilder(
				z.object({
					requiredField: z.string(),
					optionalField: z.number().optional(),
				}),
			);

			expect(validSchema).toBeDefined();

			// Note: The following would cause TypeScript compilation errors:
			// - Missing required fields
			// - Extra fields
			// - Wrong types
			// But we can't test compilation errors in runtime tests
		});

		it("should enforce string literal types for createEnumSchema", () => {
			type Theme = "light" | "dark";

			const themeSchemaBuilder = createEnumSchema<Theme>();
			const themeSchema = themeSchemaBuilder(z.enum(["light", "dark"]));

			expect(themeSchema).toBeDefined();

			// The type system ensures only valid enum values can be used
			// Compilation would fail for invalid values
		});
	});

	describe("Integration with Zod features", () => {
		it("should work with Zod transformations", () => {
			type TransformedData = {
				name: string;
				normalizedName: string;
			};

			const schemaBuilder = createSchema<TransformedData>();
			const schema = schemaBuilder(
				z.object({
					name: z.string(),
					normalizedName: z.string().transform((val) => val.toLowerCase()),
				}),
			);

			const result = schema.parse({
				name: "Test",
				normalizedName: "TEST",
			});

			expect(result.normalizedName).toBe("test");
		});

		it("should work with Zod refinements", () => {
			type ValidatedEmail = {
				email: string;
			};

			const schemaBuilder = createSchema<ValidatedEmail>();
			const schema = schemaBuilder(
				z.object({
					email: z.string().refine((val) => val.includes("@"), {
						message: "Must be a valid email",
					}),
				}),
			);

			expect(schema.parse({ email: "test@example.com" })).toEqual({
				email: "test@example.com",
			});

			expect(() => schema.parse({ email: "invalid-email" })).toThrow();
		});

		it("should work with Zod defaults", () => {
			type ConfigWithDefaults = {
				host: string;
				port: number;
				ssl: boolean;
			};

			const schemaBuilder = createSchema<ConfigWithDefaults>();
			const schema = schemaBuilder(
				z.object({
					host: z.string().default("localhost"),
					port: z.number().default(3000),
					ssl: z.boolean().default(false),
				}),
			);

			const result = schema.parse({});
			expect(result).toEqual({
				host: "localhost",
				port: 3000,
				ssl: false,
			});
		});
	});
});
