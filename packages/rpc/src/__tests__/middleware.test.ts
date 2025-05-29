import { beforeEach, describe, expect, it, vi } from "vitest";
import { bodyParsingMiddleware, queryParsingMiddleware } from "../middleware";
import { parseSuperJSON } from "../middleware/utils";

// Mock superjson
vi.mock("@squaredmade/superjson", () => ({
	default: {
		parse: vi.fn((data) => {
			try {
				return JSON.parse(data);
			} catch {
				return data;
			}
		}),
	},
}));

describe("Middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("queryParsingMiddleware", () => {
		it("should parse query parameters", async () => {
			const mockContext = {
				req: {
					query: vi.fn().mockReturnValue({
						name: '"John Doe"',
						age: 25,
						active: true,
					}),
				},
				set: vi.fn(),
			};

			const mockNext = vi.fn();

			await queryParsingMiddleware(mockContext as any, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith("__parsed_query", {
				name: "John Doe",
				age: 25,
				active: true,
			});
			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle empty query parameters", async () => {
			const mockContext = {
				req: {
					query: vi.fn().mockReturnValue({}),
				},
				set: vi.fn(),
			};

			const mockNext = vi.fn();

			await queryParsingMiddleware(mockContext as any, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith("__parsed_query", {});
			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle complex query parameters", async () => {
			const mockContext = {
				req: {
					query: vi.fn().mockReturnValue({
						filter: '{"status":"active","type":"user"}',
						sort: "name",
						limit: 10,
					}),
				},
				set: vi.fn(),
			};

			const mockNext = vi.fn();

			await queryParsingMiddleware(mockContext as any, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith("__parsed_query", {
				filter: { status: "active", type: "user" },
				sort: "name",
				limit: 10,
			});
			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle malformed JSON in query", async () => {
			const mockContext = {
				req: {
					query: vi.fn().mockReturnValue({
						data: "{invalid json}",
						name: "test",
					}),
				},
				set: vi.fn(),
			};

			const mockNext = vi.fn();

			await queryParsingMiddleware(mockContext as any, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith("__parsed_query", {
				data: "{invalid json}",
				name: "test",
			});
			expect(mockNext).toHaveBeenCalled();
		});
	});

	describe("bodyParsingMiddleware", () => {
		it("should parse JSON body", async () => {
			const mockContext = {
				req: {
					json: vi.fn().mockResolvedValue({
						title: '"My Post"',
						content: "This is content",
						tags: '["tag1","tag2"]',
					}),
				},
				set: vi.fn(),
			};

			const mockNext = vi.fn();

			await bodyParsingMiddleware(mockContext as any, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith("__parsed_body", {
				title: "My Post",
				content: "This is content",
				tags: ["tag1", "tag2"],
			});
			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle empty body", async () => {
			const mockContext = {
				req: {
					json: vi.fn().mockResolvedValue({}),
				},
				set: vi.fn(),
			};

			const mockNext = vi.fn();

			await bodyParsingMiddleware(mockContext as any, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith("__parsed_body", {});
			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle complex nested objects", async () => {
			const mockContext = {
				req: {
					json: vi.fn().mockResolvedValue({
						user: '{"id":1,"name":"John"}',
						preferences: '{"theme":"dark","notifications":true}',
						simple: "value",
					}),
				},
				set: vi.fn(),
			};

			const mockNext = vi.fn();

			await bodyParsingMiddleware(mockContext as any, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith("__parsed_body", {
				user: { id: 1, name: "John" },
				preferences: { theme: "dark", notifications: true },
				simple: "value",
			});
			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle malformed JSON in body", async () => {
			const mockContext = {
				req: {
					json: vi.fn().mockResolvedValue({
						data: "{invalid json}",
						valid: '"test"',
					}),
				},
				set: vi.fn(),
			};

			const mockNext = vi.fn();

			await bodyParsingMiddleware(mockContext as any, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith("__parsed_body", {
				data: "{invalid json}",
				valid: "test",
			});
			expect(mockNext).toHaveBeenCalled();
		});

		it("should handle request.json() errors", async () => {
			const mockContext = {
				req: {
					json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
				},
				set: vi.fn(),
			};

			const mockNext = vi.fn();

			await expect(
				bodyParsingMiddleware(mockContext as any, mockNext),
			).rejects.toThrow("Invalid JSON");

			expect(mockContext.set).not.toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});
	});
});

describe("Middleware Utils", () => {
	describe("parseSuperJSON", () => {
		it("should parse valid JSON strings", () => {
			const result = parseSuperJSON('{"name":"John","age":30}');
			expect(result).toEqual({ name: "John", age: 30 });
		});

		it("should parse simple quoted strings", () => {
			const result = parseSuperJSON('"hello world"');
			expect(result).toBe("hello world");
		});

		it("should parse numbers", () => {
			const result = parseSuperJSON("42");
			expect(result).toBe(42);
		});

		it("should parse booleans", () => {
			expect(parseSuperJSON("true")).toBe(true);
			expect(parseSuperJSON("false")).toBe(false);
		});

		it("should parse null", () => {
			const result = parseSuperJSON("null");
			expect(result).toBe(null);
		});

		it("should parse arrays", () => {
			const result = parseSuperJSON('[1,2,3,"test"]');
			expect(result).toEqual([1, 2, 3, "test"]);
		});

		it("should return original string for invalid JSON", () => {
			const input = "not-valid-json";
			const result = parseSuperJSON(input);
			expect(result).toBe(input);
		});

		it("should handle empty strings", () => {
			const result = parseSuperJSON("");
			expect(result).toBe("");
		});

		it("should handle malformed objects", () => {
			const input = "{key: value}"; // Missing quotes around key
			const result = parseSuperJSON(input);
			expect(result).toBe(input);
		});

		it("should handle special characters", () => {
			const input = "special@chars#here";
			const result = parseSuperJSON(input);
			expect(result).toBe(input);
		});

		it("should handle nested objects", () => {
			const jsonString =
				'{"user":{"id":1,"profile":{"name":"John","settings":{"theme":"dark"}}}}';
			const result = parseSuperJSON(jsonString);
			expect(result).toEqual({
				user: {
					id: 1,
					profile: {
						name: "John",
						settings: {
							theme: "dark",
						},
					},
				},
			});
		});

		it("should handle arrays with objects", () => {
			const jsonString = '[{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"}]';
			const result = parseSuperJSON(jsonString);
			expect(result).toEqual([
				{ id: 1, name: "Item 1" },
				{ id: 2, name: "Item 2" },
			]);
		});
	});
});
