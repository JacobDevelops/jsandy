import { afterAll, beforeEach, vi } from "vitest";

const spyFetch = vi.spyOn(globalThis, "fetch");

beforeEach(() => {
	spyFetch.mockReset();
});

afterAll(() => {
	spyFetch.mockRestore();
});
