import userEvent from "@testing-library/user-event";
import { test as base, vi } from "vitest";

declare global {
  // eslint-disable-next-line no-var
  var jest: { advanceTimersByTime: typeof vi.advanceTimersByTime } | undefined;
}

// `waitFor`/`findBy*` only auto-advance vitest's fake timers when this jest-shaped
// global is present. See https://github.com/testing-library/dom-testing-library/issues/987
globalThis.jest ??= { advanceTimersByTime: vi.advanceTimersByTime };

export const it = base.extend<{ user: ReturnType<typeof userEvent.setup> }>({
  user: async ({}, use) => {
    await use(
      userEvent.setup({
        advanceTimers: (delay) => {
          if (vi.isFakeTimers()) {
            vi.advanceTimersByTime(delay);
          }
        },
      }),
    );
  },
});

export { expect, describe } from "vitest";
export * from "@testing-library/react";
