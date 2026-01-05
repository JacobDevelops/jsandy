import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { z } from "zod";
import { EventEmitter } from "../../sockets/event-emitter";

// Mock WebSocket
class MockWebSocket {
	static OPEN = 1;
	static CLOSED = 3;

	readyState = MockWebSocket.OPEN;
	send = mock();
	close = mock();
}

describe("EventEmitter", () => {
	let mockWebSocket: MockWebSocket;
	let emitter: EventEmitter;
	let incomingSchema: z.ZodObject<any>;
	let outgoingSchema: z.ZodObject<any>;

	beforeEach(() => {
		mockWebSocket = new MockWebSocket();
		incomingSchema = z.object({
			payload: z.any(),
			type: z.string(),
		});
		outgoingSchema = z.object({
			message: z.string(),
			timestamp: z.number(),
		});

		emitter = new EventEmitter(mockWebSocket as any, {
			incomingSchema,
			outgoingSchema,
		});

		mock.restore();
	});

	describe("constructor", () => {
		it("should initialize with WebSocket and schemas", () => {
			expect(emitter.ws).toBe(mockWebSocket as any);
			expect(emitter.incomingSchema).toBe(incomingSchema);
			expect(emitter.outgoingSchema).toBe(outgoingSchema);
			expect(emitter.eventHandlers).toBeInstanceOf(Map);
		});

		it("should work without schemas", () => {
			const emitterWithoutSchemas = new EventEmitter(mockWebSocket as any, {
				incomingSchema: undefined,
				outgoingSchema: undefined,
			});

			expect(emitterWithoutSchemas.incomingSchema).toBeUndefined();
			expect(emitterWithoutSchemas.outgoingSchema).toBeUndefined();
		});
	});

	describe("emit", () => {
		it("should emit valid data", () => {
			const validData = {
				message: "Hello world",
				timestamp: Date.now(),
			};

			const result = emitter.emit("test", validData);

			expect(result).toBe(true);
			expect(mockWebSocket.send).toHaveBeenCalledWith(
				JSON.stringify(["test", validData]),
			);
		});

		it("should return false when WebSocket is not open", () => {
			mockWebSocket.readyState = MockWebSocket.CLOSED;

			const result = emitter.emit("test", { message: "test", timestamp: 123 });

			expect(result).toBe(false);
			expect(mockWebSocket.send).not.toHaveBeenCalled();
		});

		it("should validate outgoing data against schema", () => {
			const invalidData = {
				message: "test",
				// missing timestamp
			};

			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
			const result = emitter.emit("test", invalidData);

			expect(result).toBe(false);
			expect(mockWebSocket.send).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it("should work without outgoing schema", () => {
			const emitterNoSchema = new EventEmitter(mockWebSocket as any, {
				incomingSchema: undefined,
				outgoingSchema: undefined,
			});

			const result = emitterNoSchema.emit("test", { anything: "goes" });

			expect(result).toBe(true);
			expect(mockWebSocket.send).toHaveBeenCalled();
		});

		it("should handle schema validation errors gracefully", () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			const result = emitter.emit("test", "invalid data");

			expect(result).toBe(false);
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe("on", () => {
		it("should register event handler", () => {
			const handler = mock();
			emitter.on("test", handler);

			expect(emitter.eventHandlers.get("test")).toContain(handler);
		});

		it("should register multiple handlers for same event", () => {
			const handler1 = mock();
			const handler2 = mock();

			emitter.on("test", handler1);
			emitter.on("test", handler2);

			const handlers = emitter.eventHandlers.get("test");
			expect(handlers).toContain(handler1);
			expect(handlers).toContain(handler2);
			expect(handlers).toHaveLength(2);
		});

		it("should handle missing callback", () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			emitter.on("test", undefined as any);

			expect(emitter.eventHandlers.get("test")).toBeUndefined();
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe("off", () => {
		it("should remove specific handler", () => {
			const handler1 = mock();
			const handler2 = mock();

			emitter.on("test", handler1);
			emitter.on("test", handler2);
			emitter.off("test", handler1);

			const handlers = emitter.eventHandlers.get("test");
			expect(handlers).not.toContain(handler1);
			expect(handlers).toContain(handler2);
		});

		it("should remove all handlers for event", () => {
			const handler1 = mock();
			const handler2 = mock();

			emitter.on("test", handler1);
			emitter.on("test", handler2);
			emitter.off("test");

			expect(emitter.eventHandlers.get("test")).toBeUndefined();
		});

		it("should clean up empty handler arrays", () => {
			const handler = mock();

			emitter.on("test", handler);
			emitter.off("test", handler);

			expect(emitter.eventHandlers.get("test")).toBeUndefined();
		});

		it("should handle removing non-existent handler", () => {
			const handler = mock();

			// No error should be thrown
			emitter.off("test", handler);
			expect(emitter.eventHandlers.get("test")).toBeUndefined();
		});
	});

	describe("handleEvent", () => {
		it("should call registered handlers with valid data", () => {
			const handler = mock();
			const validData = {
				payload: "test data",
				type: "message",
			};

			emitter.on("test", handler);
			emitter.handleEvent("test", validData);

			expect(handler).toHaveBeenCalledWith(validData);
		});

		it("should validate incoming data against schema", () => {
			const handler = mock();
			const invalidData = {
				payload: "test",
				type: 123, // should be string
			};

			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			emitter.on("test", handler);
			emitter.handleEvent("test", invalidData);

			expect(handler).not.toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it("should work without incoming schema", () => {
			const emitterNoSchema = new EventEmitter(mockWebSocket as any, {
				incomingSchema: undefined,
				outgoingSchema: undefined,
			});

			const handler = mock();
			emitterNoSchema.on("test", handler);
			emitterNoSchema.handleEvent("test", { anything: "goes" });

			expect(handler).toHaveBeenCalledWith({ anything: "goes" });
		});

		it("should warn when no handlers are registered", () => {
			const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});

			emitter.handleEvent("unregistered", { data: "test" });

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					'No handlers registered for event "unregistered"',
				),
			);
			consoleSpy.mockRestore();
		});

		it("should handle errors in event handlers", () => {
			const errorHandler = mock(() => {
				throw new Error("Handler error");
			});
			const goodHandler = mock();

			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			emitter.on("test", errorHandler);
			emitter.on("test", goodHandler);

			expect(() => {
				emitter.handleEvent("test", { payload: "data", type: "test" });
			}).toThrow("One or more handlers failed");

			expect(errorHandler).toHaveBeenCalled();
			expect(goodHandler).toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it("should call all handlers even if some fail", () => {
			const handler1 = mock(() => {
				throw new Error("Error 1");
			});
			const handler2 = mock();
			const handler3 = mock(() => {
				throw new Error("Error 3");
			});

			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			emitter.on("test", handler1);
			emitter.on("test", handler2);
			emitter.on("test", handler3);

			expect(() => {
				emitter.handleEvent("test", { payload: "data", type: "test" });
			}).toThrow();

			expect(handler1).toHaveBeenCalled();
			expect(handler2).toHaveBeenCalled();
			expect(handler3).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});

	describe("schema validation error handling", () => {
		it("should handle ZodError for outgoing data", () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			const invalidData = {
				message: 123, // should be string
				timestamp: "invalid", // should be number
			};

			emitter.emit("test", invalidData);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid outgoing event data for "test"'),
				expect.any(Object),
			);
			consoleSpy.mockRestore();
		});

		it("should handle ZodError for incoming data", () => {
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			const invalidData = {
				type: 123, // should be string
			};

			emitter.on("test", mock());
			emitter.handleEvent("test", invalidData);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid incoming event data for "test"'),
				expect.any(Object),
			);
			consoleSpy.mockRestore();
		});

		it("should handle non-ZodError validation errors", () => {
			// Create a schema that throws a non-ZodError
			const mockSchema = {
				parse: mock(() => {
					throw new Error("Custom validation error");
				}),
			};

			const emitterWithMockSchema = new EventEmitter(mockWebSocket as any, {
				incomingSchema: mockSchema as any,
				outgoingSchema: undefined,
			});

			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			emitterWithMockSchema.on("test", mock());
			emitterWithMockSchema.handleEvent("test", { data: "test" });

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Error validating incoming event "test"'),
				expect.any(Error),
			);
			consoleSpy.mockRestore();
		});
	});

	describe("edge cases", () => {
		it("should handle empty event names", () => {
			const handler = mock();
			emitter.on("", handler);
			emitter.handleEvent("", { payload: "test", type: "empty" });

			expect(handler).toHaveBeenCalled();
		});

		it("should handle special characters in event names", () => {
			const handler = mock();
			const eventName = "test:event-with_special.chars";

			emitter.on(eventName, handler);
			emitter.handleEvent(eventName, { payload: "test", type: "special" });

			expect(handler).toHaveBeenCalled();
		});

		it("should handle null and undefined data", () => {
			const emitterNoSchema = new EventEmitter(mockWebSocket as any, {
				incomingSchema: undefined,
				outgoingSchema: undefined,
			});

			const handler = mock();
			emitterNoSchema.on("test", handler);

			emitterNoSchema.handleEvent("test", null);
			emitterNoSchema.handleEvent("test", undefined);

			expect(handler).toHaveBeenCalledTimes(2);
			expect(handler.mock.calls).toEqual([[null], [undefined]]);
		});
	});
});
