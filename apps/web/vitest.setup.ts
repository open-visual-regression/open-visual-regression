import "@testing-library/jest-dom/vitest";
import {
  resetIntersectionMocking,
  setupIntersectionMocking,
} from "react-intersection-observer/test-utils";
import { afterEach, beforeEach, vi } from "vitest";

// `waitFor`/`findBy*` only auto-advance vitest's fake timers when this jest-shaped
// global is present. See https://github.com/testing-library/dom-testing-library/issues/987
globalThis.jest ??= { advanceTimersByTime: vi.advanceTimersByTime };

beforeEach(() => {
  setupIntersectionMocking(vi.fn);
});

afterEach(() => {
  resetIntersectionMocking();
});
