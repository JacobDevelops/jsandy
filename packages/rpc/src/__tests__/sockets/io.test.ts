import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { IO } from "../../sockets/io";

// Mock fetch for Redis API calls
const mockFetch = mock();
const mockLogger = {
	info: mock(),
	error: mock(),
	debug: mock(),
	warn: mock(),
	success: mock(),
	log: mock(),
};
global.fetch = mockFetch as any;
global.console = mockLogger as any;

describe("IO", () => {
	let io: IO<any, any>;
	const mockRedisUrl = "https://redis.upstash.io";
	const mockRedisToken = "test-token";

	beforeEach(() => {
		io = new IO(mockRedisUrl, mockRedisToken);
		mockFetch.mockClear();
		mockLogger.info.mockClear();
		mockLogger.error.mockClear();
		mockLogger.debug.mockClear();
		mockLogger.warn.mockClear();
		mockLogger.success.mockClear();
		mockLogger.log.mockClear();
		mock.restore();
	});

	describe("constructor", () => {
		it("should initialize with Redis credentials", () => {
			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			expect(io["redisUrl"]).toBe(mockRedisUrl);
			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			expect(io["redisToken"]).toBe(mockRedisToken);
			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			expect(io["targetRoom"]).toBeNull();
		});
	});

	describe("emit", () => {
		it("should emit to all clients when no room is targeted", async () => {
			const consoleSpy = spyOn(console, "log").mockImplementation(() => {});

			await io.emit("testEvent", { message: "hello" });

			// Should not call Redis when no room is targeted
			expect(mockFetch).not.toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('IO emitted to room "null"'),
				expect.any(Object),
			);
		});

		it("should emit to specific room when targeted", async () => {
			mockFetch.mockResolvedValue({ ok: true });
			const consoleSpy = spyOn(console, "log").mockImplementation(() => {});

			await io.to("room1").emit("testEvent", { message: "hello room1" });

			expect(mockFetch).toHaveBeenCalledWith(`${mockRedisUrl}/publish/room1`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${mockRedisToken}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(["testEvent", { message: "hello room1" }]),
			});

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('IO emitted to room "room1"'),
				expect.any(Object),
			);
			consoleSpy.mockRestore();
		});

		it("should reset target room after emission", async () => {
			mockFetch.mockResolvedValue({ ok: true });

			await io.to("room1").emit("testEvent", { data: "test" });
			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			expect(io["targetRoom"]).toBeNull();

			// Next emit without .to() should not target any room
			await io.emit("nextEvent", { data: "broadcast" });
			expect(mockFetch).toHaveBeenCalledTimes(1); // Only the first call
		});

		it("should handle different data types", async () => {
			mockFetch.mockResolvedValue({ ok: true });

			const testCases = [
				{ event: "string", data: "simple string" },
				{ event: "number", data: 42 },
				{ event: "object", data: { nested: { value: true } } },
				{ event: "array", data: [1, 2, 3] },
				{ event: "null", data: null },
				{ event: "boolean", data: false },
			];

			for (const { event, data } of testCases) {
				await io.to("testRoom").emit(event, data);

				expect(mockFetch).toHaveBeenCalledWith(
					expect.stringContaining("/publish/testRoom"),
					expect.objectContaining({
						body: JSON.stringify([event, data]),
					}),
				);
			}
		});
	});
});
