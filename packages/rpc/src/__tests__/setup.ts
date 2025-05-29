import { beforeEach, vi } from "vitest";

// Mock global fetch for tests
global.fetch = vi.fn();

// Mock WebSocket
Object.defineProperty(global, "WebSocket", {
	value: vi.fn().mockImplementation(() => ({
		CONNECTING: 0,
		OPEN: 1,
		CLOSING: 2,
		CLOSED: 3,
		send: vi.fn(),
		close: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	})),
	writable: true,
});

// Mock WebSocketPair for Cloudflare Workers
Object.defineProperty(global, "WebSocketPair", {
	value: vi.fn(() => [
		{ accept: vi.fn(), send: vi.fn(), close: vi.fn() },
		{ accept: vi.fn(), send: vi.fn(), close: vi.fn() },
	]),
	writable: true,
});

beforeEach(() => {
	vi.clearAllMocks();
});
