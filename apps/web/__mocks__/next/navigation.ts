import { ReadonlyURLSearchParams, unstable_rethrow } from "next/navigation";
import { vi } from "vitest";

export { ReadonlyURLSearchParams, unstable_rethrow };
export const redirect = vi.fn();
export const notFound = vi.fn();
export const useRouter = vi
  .fn()
  .mockReturnValue({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() });
export const usePathname = vi.fn().mockReturnValue("/");
export const useSearchParams = vi.fn().mockReturnValue(new ReadonlyURLSearchParams());
