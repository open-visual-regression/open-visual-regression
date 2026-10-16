import "@testing-library/jest-dom/vitest";
import {
  resetIntersectionMocking,
  setupIntersectionMocking,
} from "react-intersection-observer/test-utils";
import { afterAll, afterEach, beforeEach, vi } from "vitest";

import { toast } from "@ovr/ui/components/toast";

import { server } from "@/lib/testing/server";

// `waitFor`/`findBy*` only auto-advance vitest's fake timers when this jest-shaped
// global is present. See https://github.com/testing-library/dom-testing-library/issues/987
globalThis.jest ??= { advanceTimersByTime: vi.advanceTimersByTime };

server.listen({ onUnhandledRequest: "error" });

beforeEach(() => {
  setupIntersectionMocking(vi.fn);
});

afterEach(() => {
  resetIntersectionMocking();
  toast.dismissAll();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
