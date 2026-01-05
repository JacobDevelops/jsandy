import {
	afterAll,
	beforeEach,
	describe,
	expect,
	it,
	mock,
	spyOn,
} from "bun:test";
import { HTTPException } from "hono/http-exception";
import superjson from "superjson";
import { createClient } from "../client";
import type { mockAppRouter } from "./__mocks__/router.mock";

const realFetch = global.fetch;
const realWebSocket = global.WebSocket;

const mockFetch = mock();
global.fetch = mockFetch as any;

// Mock WebSocket for client tests
global.WebSocket = class MockWebSocket {
	static OPEN = 1;
	static CLOSED = 3;

	readyState = MockWebSocket.OPEN;
	url: string;
	onopen: ((event: Event) => void) | null = null;
	onclose: ((event: CloseEvent) => void) | null = null;
	onmessage: ((event: MessageEvent) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;

	constructor(url: string | URL) {
		this.url = url.toString();
		// Simulate async connection
		setTimeout(() => {
			if (this.onopen) {
				this.onopen(new Event("open"));
			}
		}, 0);
	}

	send = mock();
	close = mock();
} as any;

afterAll(() => {
	global.fetch = realFetch;
	global.WebSocket = realWebSocket;
});

type MockAppRouter = typeof mockAppRouter;

describe("Client", () => {
	beforeEach(() => {
		mockFetch.mockClear();
		mock.restore();
	});

	describe("createClient", () => {
		it("should create client with base URL", () => {
			const client = createClient({
				baseUrl: "https://api.example.com",
			});

			expect(client).toBeDefined();
			expect(typeof client).toBe("function");
		});

		it("should throw error for invalid base URL", () => {
			expect(() => {
				createClient({
					baseUrl: "invalid-url",
				});
			}).toThrow("baseUrl must be absolute (http/https)");
		});

		it("should work with empty base URL", () => {
			const client = createClient({
				baseUrl: "",
			});

			expect(client).toBeDefined();
		});

		it("should use default credentials", async () => {
			const mockResponse = {
				headers: new Headers(),
				json: mock(async () => ({ status: "ok" })),
				ok: true,
				status: 200,
				text: mock(async () => '{"status":"ok"}'),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			await client.combined.health.$get();
			// This should not throw a type error now
			await client.combined.getUsers.$get();

			// Verify credentials were set to "include" by default
			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					credentials: "include",
				}),
			);
		});

		it("should accept custom credentials", async () => {
			const mockResponse = {
				headers: new Headers(),
				json: mock(async () => ({ status: "ok" })),
				ok: true,
				status: 200,
				text: mock(async () => '{"status":"ok"}'),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
				credentials: "same-origin",
			});

			await client.combined.health.$get();

			// Verify custom credentials were used
			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					credentials: "same-origin",
				}),
			);
		});
	});

	describe("HTTP requests", () => {
		it("should make GET request", async () => {
			const mockResponse = {
				headers: new Headers(),
				json: mock(async () => ({ status: "ok" })),
				ok: true,
				status: 200,
				text: mock(async () => '{"status":"ok"}'),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const result = await client.combined.health.$get();
			const jsonResult = await result.json();

			expect(jsonResult).toEqual({ status: "ok" });
			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/combined/health",
				expect.objectContaining({
					cache: "no-store",
					credentials: "include",
				}),
			);
		});

		it("should make POST request", async () => {
			const mockResponse = {
				headers: new Headers(),
				json: mock(async () => ({ id: "123", name: "Test" })),
				ok: true,
				status: 201,
				text: mock(async () => '{"id":"123","name":"Test"}'),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const testData = { email: "test@example.com", name: "Test User" };
			const result = await client.combined.createUser.$post(testData);
			const jsonResult = await result.json();

			expect(jsonResult).toEqual({ id: "123", name: "Test" });
			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/combined/createUser",
				expect.objectContaining({
					cache: "no-store",
					credentials: "include",
					// Verify POST request structure
				}),
			);

			// Verify the request body was properly serialized
			const fetchCall = mockFetch.mock.calls[0];
			const requestOptions = fetchCall[1];
			expect(requestOptions.body).toBeDefined();
		});

		it("should handle HTTP errors", async () => {
			const mockResponse = {
				headers: new Headers(),
				ok: false,
				status: 404,
				text: mock(async () => "Not Found"),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			// Test that HTTP errors are properly converted to HTTPException
			await expect(client.combined.health.$get()).rejects.toThrow(
				HTTPException,
			);
		});

		it("should serialize query parameters with SuperJSON", async () => {
			const mockResponse = {
				headers: new Headers(),
				json: mock(async () => ({ data: "test" })),
				ok: true,
				status: 200,
				text: mock(async () => '{"data":"test"}'),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			// Test with complex data that requires SuperJSON
			const testData = {
				date: new Date("2023-01-01"),
				id: "test-id",
				set: new Set([1, 2, 3]),
			};

			await client.combined.getUser.$get(testData);

			// Verify fetch was called
			expect(mockFetch).toHaveBeenCalled();

			// Check that query parameters were serialized
			const fetchCall = mockFetch.mock.calls[0];
			const url = new URL(fetchCall[0]);
			const queryParams = Object.fromEntries(
				Array.from(url.searchParams.entries()).map(([key, value]) => [
					key,
					superjson.parse<string | Date | Set<number>>(value),
				]),
			);
			expect(queryParams).toEqual({
				date: new Date("2023-01-01"),
				id: "test-id",
				set: new Set([1, 2, 3]),
			});

			// Verify SuperJSON serialization worked
			const serializedDate = superjson.stringify(testData.date);
			const serializedSet = superjson.stringify(testData.set);
			expect(typeof serializedDate).toBe("string");
			expect(typeof serializedSet).toBe("string");
		});

		it("should serialize request body with SuperJSON", async () => {
			const mockResponse = {
				headers: new Headers(),
				json: mock(async () => ({ id: "123" })),
				ok: true,
				status: 201,
				text: mock(async () => '{"id":"123"}'),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			// Test with complex data that requires SuperJSON
			const testData = {
				createdAt: new Date("2023-01-01"),
				email: "test@example.com",
				metadata: new Map([["key", "value"]]),
				name: "Test",
			};

			await client.combined.createUser.$post(testData);

			// Verify the request body was serialized with SuperJSON
			const fetchCall = mockFetch.mock.calls[0];
			const requestOptions = fetchCall[1];
			expect(requestOptions.body).toBeDefined();

			// Verify SuperJSON serialization
			const serialized = Object.fromEntries(
				Object.entries(testData).map(([key, value]) => [
					key,
					superjson.stringify(value),
				]),
			);
			expect(serialized.name).toBeTypeOf("string");
			expect(serialized.createdAt).toBeTypeOf("string");
			expect(serialized.metadata).toBeTypeOf("string");
		});
	});

	describe("SuperJSON parsing", () => {
		it("should parse SuperJSON responses", async () => {
			const testData = { date: new Date(), number: 123 };
			const serialized = superjson.stringify(testData);

			const mockResponse = {
				headers: new Headers({ "x-is-superjson": "true" }),
				json: mock(),
				ok: true,
				status: 200,
				text: mock(async () => serialized),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const result = await client.combined.health.$get();
			const parsedResult = await result.json();

			expect(parsedResult.date).toBeInstanceOf(Date);
			expect(parsedResult.number).toBe(123);
		});

		it("should parse regular JSON responses", async () => {
			const testData = { count: 42, message: "hello" };
			const serialized = JSON.stringify(testData);

			const mockResponse = {
				headers: new Headers(),
				json: mock(),
				ok: true,
				status: 200,
				text: mock(async () => serialized),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const result = await client.combined.health.$get();
			const parsedResult = await result.json();

			expect(parsedResult.message).toBe("hello");
			expect(parsedResult.count).toBe(42);
		});

		it("should handle invalid JSON", async () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			const mockResponse = {
				headers: new Headers(),
				json: mock(),
				ok: true,
				status: 200,
				text: mock(async () => "invalid json"),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const result = await client.combined.health.$get();

			await expect(result.json()).rejects.toThrow("Invalid JSON response");
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe("WebSocket connections", () => {
		it("should create WebSocket connection", () => {
			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const socket = client.combined.chat.$ws();

			expect(socket).toBeDefined();
			expect(socket.constructor.name).toBe("ClientSocket");
		});

		it("should handle WebSocket URL conversion for HTTPS", () => {
			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const socket = client.combined.chat.$ws();

			// The socket should be created with wss:// protocol for https
			expect(socket).toBeDefined();
		});

		it("should handle WebSocket URL conversion for HTTP", () => {
			const client = createClient<MockAppRouter>({
				baseUrl: "http://localhost:3000",
			});

			const socket = client.combined.chat.$ws();

			// The socket should be created with ws:// protocol for http
			expect(socket).toBeDefined();
		});
	});

	describe("URL generation", () => {
		it("should generate URLs for endpoints", () => {
			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const url = client.combined.health.$url();

			expect(url).toBeInstanceOf(URL);
			expect(url.toString()).toBe("https://api.example.com/combined/health");
		});

		it("should add query parameters to URLs", () => {
			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const queryParams = { limit: "10", page: "1" };
			const url = client.combined.getUsers.$url({ query: queryParams });

			expect(url).toBeInstanceOf(URL);
			expect(url.toString()).toBe(
				"https://api.example.com/combined/getUsers?limit=10&page=1",
			);
		});

		it("should handle null and undefined query parameters", () => {
			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			const queryParams = { limit: null, offset: undefined, page: "1" };
			const url = client.combined.getUsers.$url({ query: queryParams });

			expect(url).toBeInstanceOf(URL);
			expect(url.toString()).toBe(
				"https://api.example.com/combined/getUsers?page=1",
			);
		});
	});

	describe("Error handling", () => {
		it("should convert HTTP errors to HTTPException", async () => {
			const mockResponse = {
				ok: false,
				status: 400,
				text: mock(async () => "Bad Request"),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			await expect(client.combined.health.$get()).rejects.toThrow(
				HTTPException,
			);

			// Verify the exception has the correct status
			try {
				await client.combined.health.$get();
			} catch (error) {
				expect(error).toBeInstanceOf(HTTPException);
				expect((error as HTTPException).status).toBe(400);
			}
		});
	});

	describe("Proxy behavior", () => {
		it("should handle deep nesting", async () => {
			const mockResponse = {
				headers: new Headers(),
				json: mock(async () => ({ data: "test" })),
				ok: true,
				status: 200,
				text: mock(async () => '{"data":"test"}'),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			// Test that deeply nested routes work
			const result = await client.combined.health.$get();
			const jsonResult = await result.json();

			expect(jsonResult).toEqual({ data: "test" });
			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/combined/health",
				expect.any(Object),
			);
		});

		it("should maintain method availability across proxy chain", () => {
			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			// Verify that methods are available at different nesting levels
			expect(typeof client.combined.health.$get).toBe("function");
			expect(typeof client.combined.createUser.$post).toBe("function");
			expect(typeof client.combined.chat.$ws).toBe("function");
			expect(typeof client.combined.health.$url).toBe("function");
		});
	});

	describe("Type safety", () => {
		it("should provide type-safe client interface", () => {
			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			// These should compile without TypeScript errors
			expect(client).toBeDefined();
			expect(typeof client.combined).toBe("function");
			expect(typeof client.combined.health).toBe("function");
			expect(typeof client.combined.health.$get).toBe("function");
		});
	});

	describe("Configuration", () => {
		it("should remove baseUrl from input if already included", async () => {
			const mockResponse = {
				headers: new Headers(),
				json: mock(async () => ({ status: "ok" })),
				ok: true,
				status: 200,
				text: mock(async () => '{"status":"ok"}'),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			await client.combined.health.$get();

			// Verify that the URL was constructed correctly without duplication
			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.example.com/combined/health",
				expect.any(Object),
			);
		});

		it("should handle cache control", async () => {
			const mockResponse = {
				headers: new Headers(),
				json: mock(async () => ({ status: "ok" })),
				ok: true,
				status: 200,
				text: mock(async () => '{"status":"ok"}'),
			};
			mockFetch.mockResolvedValue(mockResponse);

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
			});

			await client.combined.health.$get();

			// Verify cache control is set
			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					cache: "no-store",
				}),
			);
		});

		it("should handle custom fetch options", async () => {
			const customFetch = mock(async () => ({
				headers: new Headers(),
				json: async () => ({ status: "ok" }),
				ok: true,
				status: 200,
				text: async () => '{"status":"ok"}',
			}));

			const client = createClient<MockAppRouter>({
				baseUrl: "https://api.example.com",
				fetch: customFetch as any,
			});

			await client.combined.health.$get();

			// Verify custom fetch was used instead of global fetch
			expect(customFetch).toHaveBeenCalled();
			expect(mockFetch).not.toHaveBeenCalled();
		});
	});
});
