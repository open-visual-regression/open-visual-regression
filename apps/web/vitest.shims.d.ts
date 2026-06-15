/// <reference types="@vitest/browser-playwright" />

import type { vi } from "vitest";

declare global {
  // eslint-disable-next-line no-var
  var jest: { advanceTimersByTime: typeof vi.advanceTimersByTime } | undefined;
}
