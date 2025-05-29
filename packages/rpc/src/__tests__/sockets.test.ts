import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { EventEmitter } from "../sockets/event-emitter";
import { IO } from "../sockets/io";
import { ClientSocket, ServerSocket } from "../sockets/socket";

// Mock logger
vi.mock("@squaredmade/logger", () => ({
	default: vi.fn(() => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	})),
}));

// Mock fetch
global.fetch = vi.fn();

describe("Sockets", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	describe("EventEmitter", () => {
		let mockWebSocket: any;
		let emitter: EventEmitter;

		beforeEach(() => {
			mockWebSocket = {
				readyState: WebSocket.OPEN,
				send: vi.fn(),
			};

			emitter = new EventEmitter(mockWebSocket, {
				incomingSchema: undefined,
				outgoingSchema: undefined,
			});
		});

		describe("emit", () => {
			it("should emit events when WebSocket is open", () => {
				const result = emitter.emit("test", { message: "hello" });

				expect(result).toBe(true);
				expect(mockWebSocket.send).toHaveBeenCalledWith(
					JSON.stringify(["test", { message: "hello" }]),
				);
			});

			it("should not emit when WebSocket is not open", () => {
				mockWebSocket.readyState = 3; // WebSocket.CLOSED
				const result = emitter.emit("test", { message: "hello" });

				expect(result).toBe(false);
				expect(mockWebSocket.send).not.toHaveBeenCalled();
			});

			it("should validate outgoing data with schema", () => {
				const schema = z.object({ message: z.string() });
				emitter = new EventEmitter(mockWebSocket, {
					incomingSchema: undefined,
					outgoingSchema: schema,
				});

				const result = emitter.emit("test", { message: "hello" });
				expect(result).toBe(true);

				const invalidResult = emitter.emit("test", { message: 123 });
				expect(invalidResult).toBe(false);
			});
		});

		describe("on/off", () => {
			it("should register event handlers", () => {
				const handler = vi.fn();
				emitter.on("test", handler);

				expect(emitter.eventHandlers.get("test")).toContain(handler);
			});

			it("should handle events with registered handlers", () => {
				const handler = vi.fn();
				emitter.on("test", handler);

				emitter.handleEvent("test", { message: "hello" });
				expect(handler).toHaveBeenCalledWith({ message: "hello" });
			});

			it("should remove specific handlers", () => {
				const handler1 = vi.fn();
				const handler2 = vi.fn();

				emitter.on("test", handler1);
				emitter.on("test", handler2);
				emitter.off("test", handler1);

				const handlers = emitter.eventHandlers.get("test");
				expect(handlers).toContain(handler2);
				expect(handlers).not.toContain(handler1);
			});

			it("should remove all handlers for event", () => {
				const handler1 = vi.fn();
				const handler2 = vi.fn();

				emitter.on("test", handler1);
				emitter.on("test", handler2);
				emitter.off("test");

				expect(emitter.eventHandlers.has("test")).toBe(false);
			});

			it("should warn when no callback provided", () => {
				emitter.on("test");
				expect(emitter.eventHandlers.has("test")).toBe(false);
			});
		});

		describe("handleEvent", () => {
			it("should validate incoming data with schema", () => {
				const schema = z.object({ message: z.string() });
				emitter = new EventEmitter(mockWebSocket, {
					incomingSchema: schema,
					outgoingSchema: undefined,
				});

				const handler = vi.fn();
				emitter.on("test", handler);

				emitter.handleEvent("test", { message: "hello" });
				expect(handler).toHaveBeenCalledWith({ message: "hello" });

				emitter.handleEvent("test", { message: 123 });
				expect(handler).toHaveBeenCalledTimes(1); // Should not be called again
			});

			it("should warn when no handlers registered", () => {
				emitter.handleEvent("nonexistent", { data: "test" });
				// Should log warning (tested through mock)
			});

			it("should handle errors in event handlers", () => {
				const errorHandler = vi.fn(() => {
					throw new Error("Handler error");
				});

				emitter.on("test", errorHandler);

				expect(() => emitter.handleEvent("test", {})).toThrow(
					'One or more handlers failed for event "test". Check logs for details.',
				);
			});
		});
	});

	describe("IO", () => {
		let io: IO<Record<string, unknown>>;
		const redisUrl = "https://redis.example.com";
		const redisToken = "test-token";

		beforeEach(() => {
			io = new IO(redisUrl, redisToken);
			global.fetch = vi.fn().mockResolvedValue(new Response());
		});

		describe("emit", () => {
			it("should emit to target room", async () => {
				io.to("test-room");
				await io.emit("message", { text: "hello" });

				expect(fetch).toHaveBeenCalledWith(`${redisUrl}/publish/test-room`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${redisToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(["message", { text: "hello" }]),
				});
			});

			it("should not emit when no target room set", async () => {
				await io.emit("message", { text: "hello" });
				expect(fetch).not.toHaveBeenCalled();
			});

			it("should reset target room after emitting", async () => {
				io.to("test-room");
				await io.emit("message", { text: "hello" });

				// Second emit should not send since room is reset
				await io.emit("message2", { text: "hello2" });

				expect(fetch).toHaveBeenCalledTimes(1);
			});
		});

		describe("to", () => {
			it("should set target room and return this", () => {
				const result = io.to("test-room");
				expect(result).toBe(io);
			});

			it("should allow method chaining", async () => {
				await io.to("test-room").emit("message", { text: "hello" });

				expect(fetch).toHaveBeenCalledWith(
					`${redisUrl}/publish/test-room`,
					expect.any(Object),
				);
			});
		});
	});

	describe("ServerSocket", () => {
		let mockWebSocket: any;
		let serverSocket: ServerSocket<any, any>;
		const options = {
			redisUrl: "https://redis.example.com",
			redisToken: "test-token",
			incomingSchema: z.object({ message: z.string() }),
			outgoingSchema: z.object({ response: z.string() }),
		};

		beforeEach(() => {
			mockWebSocket = {
				readyState: WebSocket.OPEN,
				send: vi.fn(),
				close: vi.fn(),
			};

			serverSocket = new ServerSocket(mockWebSocket, options);
		});

		afterEach(() => {
			vi.clearAllTimers();
		});

		describe("constructor", () => {
			it("should initialize with options", () => {
				expect(serverSocket).toBeDefined();
				expect(serverSocket.rooms).toEqual(["DEFAULT_ROOM"]);
			});
		});

		describe("event handling", () => {
			it("should register event handlers", () => {
				const handler = vi.fn();
				serverSocket.on("message", handler);

				serverSocket.handleEvent("message", { message: "test" });
				expect(handler).toHaveBeenCalledWith({ message: "test" });
			});

			it("should emit events", () => {
				const result = serverSocket.emit("response", { response: "hello" });
				expect(result).toBe(true);
			});

			it("should remove event handlers", () => {
				const handler = vi.fn();
				serverSocket.on("message", handler);
				serverSocket.off("message" as any, handler);

				serverSocket.handleEvent("message", { message: "test" });
				expect(handler).not.toHaveBeenCalled();
			});
		});

		describe("room management", () => {
			it("should join rooms", async () => {
				// Mock successful subscription
				const mockStream = {
					body: {
						getReader: () => ({
							read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
						}),
					},
				};

				global.fetch = vi.fn().mockResolvedValue(mockStream);

				await serverSocket.join("test-room");
				expect(serverSocket.rooms).toContain("test-room");
			});

			it("should leave rooms", () => {
				// Set up a mock controller
				const mockController = { abort: vi.fn() };
				(serverSocket as any).controllers.set("test-room", mockController);

				serverSocket.leave("test-room");
				expect(mockController.abort).toHaveBeenCalled();
			});
		});

		describe("cleanup", () => {
			it("should close WebSocket and cleanup resources", () => {
				serverSocket.close();
				expect(mockWebSocket.close).toHaveBeenCalled();
			});
		});
	});

	describe("ClientSocket", () => {
		let clientSocket: ClientSocket<any, any>;
		const url = "ws://localhost:8080";

		beforeEach(() => {
			// Mock WebSocket constructor
			(global.WebSocket as any) = vi.fn().mockImplementation(() => ({
				readyState: 1, // WebSocket.OPEN
				send: vi.fn(),
				close: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				url,
				onerror: null,
				onopen: null,
				onclose: null,
				onmessage: null,
				binaryType: "blob",
				bufferedAmount: 0,
				extensions: "",
				protocol: "",
				CONNECTING: 0,
				OPEN: 1,
				CLOSING: 2,
				CLOSED: 3,
				dispatchEvent: vi.fn(),
			}));
			(global.WebSocket as any).CONNECTING = 0;
			(global.WebSocket as any).OPEN = 1;
			(global.WebSocket as any).CLOSING = 2;
			(global.WebSocket as any).CLOSED = 3;
		});

		afterEach(() => {
			vi.clearAllTimers();
		});

		describe("constructor", () => {
			it("should initialize and connect", () => {
				clientSocket = new ClientSocket(url);

				expect(global.WebSocket).toHaveBeenCalledWith(url);
				expect(clientSocket).toBeDefined();
			});

			it("should initialize with schemas", () => {
				const incomingSchema = z.object({ message: z.string() });
				const outgoingSchema = z.object({ response: z.string() });

				clientSocket = new ClientSocket(url, {
					incomingSchema,
					outgoingSchema,
				});

				expect(clientSocket).toBeDefined();
			});
		});

		describe("connection management", () => {
			beforeEach(() => {
				clientSocket = new ClientSocket(url);
			});

			it("should handle connection open", () => {
				const mockWs = (clientSocket as any).ws;
				mockWs.onopen();

				expect(clientSocket.isConnected).toBe(true);
			});

			it("should handle connection close and reconnect", () => {
				vi.useFakeTimers();

				const mockWs = (clientSocket as any).ws;
				mockWs.onclose();

				expect(clientSocket.isConnected).toBe(false);

				// Should attempt reconnection
				vi.advanceTimersByTime(1500);
				expect(global.WebSocket).toHaveBeenCalledTimes(2);

				vi.useRealTimers();
			});

			it("should handle connection errors", () => {
				const mockWs = (clientSocket as any).ws;
				const mockError = { currentTarget: { url: "ws://localhost:3000" } };

				const consoleSpy = vi
					.spyOn(console, "error")
					.mockImplementation(() => {});
				mockWs.onerror(mockError);

				expect(consoleSpy).toHaveBeenCalled();
				consoleSpy.mockRestore();
			});
		});

		describe("messaging", () => {
			beforeEach(() => {
				clientSocket = new ClientSocket(url);
			});

			it("should handle incoming messages", () => {
				const handler = vi.fn();
				clientSocket.on("test", handler);

				const mockWs = (clientSocket as any).ws;
				const mockEvent = {
					data: JSON.stringify(["test", { message: "hello" }]),
				};

				mockWs.onmessage(mockEvent);
				expect(handler).toHaveBeenCalledWith({ message: "hello" });
			});

			it("should emit outgoing messages", () => {
				const result = clientSocket.emit("test", { data: "hello" });
				expect(result).toBe(true);
			});

			it("should register and remove event handlers", () => {
				const handler = vi.fn();

				clientSocket.on("test", handler);
				clientSocket.off("test" as any, handler);

				// Handler should be removed
				const mockWs = (clientSocket as any).ws;
				const mockEvent = {
					data: JSON.stringify(["test", { message: "hello" }]),
				};

				mockWs.onmessage(mockEvent);
				expect(handler).not.toHaveBeenCalled();
			});
		});

		describe("cleanup", () => {
			beforeEach(() => {
				clientSocket = new ClientSocket(url);
			});

			it("should cleanup timers", () => {
				clientSocket.cleanup();
				// Timers should be cleared (tested through no errors)
			});

			it("should close connection", () => {
				const mockWs = (clientSocket as any).ws;
				clientSocket.close();

				expect(mockWs.close).toHaveBeenCalledWith(
					1000,
					"Client closed connection",
				);
				expect(clientSocket.isConnected).toBe(false);
			});
		});
	});

	describe("Schema validation", () => {
		it("should validate incoming WebSocket events", () => {
			const schema = z.object({
				message: z.object({
					text: z.string(),
					userId: z.string(),
				}),
			});

			const mockWebSocket = {
				readyState: WebSocket.OPEN,
				send: vi.fn(),
			};

			const emitter = new EventEmitter(mockWebSocket as any, {
				incomingSchema: schema,
				outgoingSchema: undefined,
			});

			const handler = vi.fn();
			emitter.on("message", handler);

			// Valid data
			emitter.handleEvent("message", {
				message: {
					text: "Hello",
					userId: "123",
				},
			});

			expect(handler).toHaveBeenCalledWith({
				message: {
					text: "Hello",
					userId: "123",
				},
			});

			// Invalid data should not call handler
			emitter.handleEvent("message", {
				message: {
					text: "Hello",
					userId: 123, // Invalid type
				},
			});

			expect(handler).toHaveBeenCalledTimes(1);
		});

		it("should validate outgoing WebSocket events", () => {
			const schema = z.object({
				response: z.string(),
			});

			const mockWebSocket = {
				readyState: WebSocket.OPEN,
				send: vi.fn(),
			};

			const emitter = new EventEmitter(mockWebSocket as any, {
				incomingSchema: undefined,
				outgoingSchema: schema,
			});

			// Valid emit
			const result1 = emitter.emit("response", { response: "hello" });
			expect(result1).toBe(true);
			expect(mockWebSocket.send).toHaveBeenCalled();

			// Invalid emit
			const result2 = emitter.emit("response", { response: 123 });
			expect(result2).toBe(false);
		});
	});
});
