import { vi } from "vitest";

export const redirect = vi.fn();
export const notFound = vi.fn();
export const useRouter = vi.fn().mockReturnValue({ push: vi.fn(), refresh: vi.fn() });
