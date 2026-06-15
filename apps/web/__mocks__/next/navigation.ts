import { vi } from "vitest";
import { ReadonlyURLSearchParams } from "next/navigation";

export { ReadonlyURLSearchParams };
export const redirect = vi.fn();
export const notFound = vi.fn();
export const useRouter = vi
  .fn()
  .mockReturnValue({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() });
export const usePathname = vi.fn().mockReturnValue("/");
export const useSearchParams = vi.fn().mockReturnValue(new ReadonlyURLSearchParams());
