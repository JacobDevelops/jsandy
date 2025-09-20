import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { IO } from "../../sockets/io";

// Mock Pub/Sub adapter
const mockAdapter = {
	publish: mock(),
	subscribe: mock(() => Promise.resolve()),
};

// Structured logger matching the Logger interface
const mockLogger = {
	debug: mock(),
	info: mock(),
	warn: mock(),
	error: mock(),
	success: mock(),
	log: mock(),
};

// Optional: route console.* to mockLogger so any accidental console usage is visible
// (IO uses the injected logger; EventEmitter tests use console directly)
global.console = mockLogger as any;

describe("IO", () => {
	let io: IO<any, any>;

	beforeEach(() => {
		io = new IO(mockAdapter as any, {
			logger: mockLogger,
			// no broadcastChannel => emit() without to() should warn and skip publish
		});
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
			// biome-ignore lint/complexity/useLiteralKeys: This is a private property
			expect(io["adapter"]).toBeDefined();

			// biome-ignore lint/complexity/useLiteralKeys: This is a private property
			expect(io["targetRoom"]).toBeNull();
		});
	});

	describe("emit", () => {
		it("should warn and skip when no room is targeted and no broadcastChannel set", async () => {
			const warnSpy = spyOn(mockLogger, "warn");

			await io.emit("testEvent", { message: "hello" });

			// Should not call adapter when no room/broadcastChannel is set
			expect(mockAdapter.publish).not.toHaveBeenCalled();
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					"emit() called without .to(room) and no broadcastChannel set; skipping publish",
				),
				expect.objectContaining({ event: "testEvent" }),
			);

			warnSpy.mockRestore();
		});

		it("should emit to specific room when targeted and log info", async () => {
			mockAdapter.publish.mockResolvedValue(undefined);
			const infoSpy = spyOn(mockLogger, "info");

			await io.to("room1").emit("testEvent", { message: "hello room1" });

			expect(mockAdapter.publish).toHaveBeenCalledWith("room1", [
				"testEvent",
				{ message: "hello room1" },
			]);

			expect(infoSpy).toHaveBeenCalledWith(
				"IO publish",
				expect.objectContaining({
					room: "room1",
					event: "testEvent",
					data: "[payload omitted]",
				}),
			);

			infoSpy.mockRestore();
		});

		it("should reset target room after emission", async () => {
			mockAdapter.publish.mockResolvedValue(undefined);

			await io.to("room1").emit("testEvent", { data: "test" });
			// biome-ignore lint/complexity/useLiteralKeys: This is a private property
			expect(io["targetRoom"]).toBeNull();

			// Next emit without .to() should not target any room and should warn/skip
			const warnSpy = spyOn(mockLogger, "warn");
			await io.emit("nextEvent", { data: "broadcast" });

			expect(mockAdapter.publish).toHaveBeenCalledTimes(1); // Only the first call
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					"emit() called without .to(room) and no broadcastChannel set; skipping publish",
				),
				expect.objectContaining({ event: "nextEvent" }),
			);
			warnSpy.mockRestore();
		});

		it("should handle different data types", async () => {
			mockAdapter.publish.mockResolvedValue(undefined);
			const infoSpy = spyOn(mockLogger, "info");

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

			// Ensure we logged an info for the last call at least (all will log)
			expect(infoSpy).toHaveBeenCalledWith(
				"IO publish",
				expect.objectContaining({
					room: "testRoom",
					event: expect.any(String),
					data: "[payload omitted]",
				}),
			);

			infoSpy.mockRestore();
		});
	});
});
