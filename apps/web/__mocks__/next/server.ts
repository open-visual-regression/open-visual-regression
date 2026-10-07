import { vi } from "vitest";

export * from "next/server";

export const connection = vi.fn().mockResolvedValue(undefined);
