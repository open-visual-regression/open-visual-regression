import "@testing-library/jest-dom/vitest";
import {
  resetIntersectionMocking,
  setupIntersectionMocking,
} from "react-intersection-observer/test-utils";
import { afterEach, beforeEach, vi } from "vitest";

import { toast } from "@ovr/ui/components/toast";

// `waitFor`/`findBy*` only auto-advance vitest's fake timers when this jest-shaped
// global is present. See https://github.com/testing-library/dom-testing-library/issues/987
globalThis.jest ??= { advanceTimersByTime: vi.advanceTimersByTime };

beforeEach(() => {
  setupIntersectionMocking(vi.fn);
});

afterEach(() => {
  resetIntersectionMocking();
  // Sonner's toast store lives outside React and isn't cleared by unmounting a `Toaster`, so a
  // toast raised in one test would otherwise still be "active" and get replayed into the next
  // test's `Toaster` if it mounts within the same test file before the toast's duration elapses.
  toast.dismissAll();
});
