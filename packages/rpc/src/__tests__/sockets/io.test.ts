import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { IO } from "../../sockets/io";

// Mock Pub/Sub adapter
const mockAdapter = {
	publish: mock(),
	subscribe: mock(() => Promise.resolve()),
};
const mockLogger = {
	info: mock(),
	error: mock(),
	debug: mock(),
	warn: mock(),
	success: mock(),
	log: mock(),
};

global.console = mockLogger as any;

describe("IO", () => {
	let io: IO<any, any>;

	beforeEach(() => {
		io = new IO(mockAdapter as any);
		mockAdapter.publish.mockClear();
		mockLogger.info.mockClear();
		mockLogger.error.mockClear();
		mockLogger.debug.mockClear();
		mockLogger.warn.mockClear();
		mockLogger.success.mockClear();
		mockLogger.log.mockClear();
		mock.restore();
	});

	describe("constructor", () => {
		it("should initialize with adapter", () => {
			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			expect(io["adapter"]).toBeDefined();

			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			expect(io["targetRoom"]).toBeNull();
		});
	});

	describe("emit", () => {
		it("should emit to all clients when no room is targeted", async () => {
			const consoleSpy = spyOn(console, "log").mockImplementation(() => {});

			await io.emit("testEvent", { message: "hello" });

			// Should not call adapter when no room is targeted
			expect(mockAdapter.publish).not.toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('IO emitted to room "null"'),
				expect.any(Object),
			);
		});

		it("should emit to specific room when targeted", async () => {
			mockAdapter.publish.mockResolvedValue(undefined);
			const consoleSpy = spyOn(console, "log").mockImplementation(() => {});

			await io.to("room1").emit("testEvent", { message: "hello room1" });

			expect(mockAdapter.publish).toHaveBeenCalledWith("room1", [
				"testEvent",
				{ message: "hello room1" },
			]);

			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('IO emitted to room "room1"'),
				expect.any(Object),
			);
			consoleSpy.mockRestore();
		});

		it("should reset target room after emission", async () => {
			mockAdapter.publish.mockResolvedValue(undefined);

			await io.to("room1").emit("testEvent", { data: "test" });
			// biome-ignore lint/complexity/useLiteralKeys: <explanation>
			expect(io["targetRoom"]).toBeNull();

			// Next emit without .to() should not target any room
			await io.emit("nextEvent", { data: "broadcast" });
			expect(mockAdapter.publish).toHaveBeenCalledTimes(1); // Only the first call
		});

		it("should handle different data types", async () => {
			mockAdapter.publish.mockResolvedValue(undefined);

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

				expect(mockAdapter.publish).toHaveBeenCalledWith("testRoom", [
					event,
					data,
				]);
			}
		});
	});
});
