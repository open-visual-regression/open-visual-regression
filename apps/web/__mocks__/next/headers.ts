import { vi } from "vitest";

export const cookies = vi.fn().mockResolvedValue({ set: vi.fn() });
export const headers = vi.fn().mockResolvedValue(new Headers());
