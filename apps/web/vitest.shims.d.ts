/// <reference types="@vitest/browser-playwright" />

import type { vi } from "vitest";

declare global {
  var jest: { advanceTimersByTime: typeof vi.advanceTimersByTime } | undefined;
}
