import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

export const user = userEvent.setup({
  advanceTimers: (delay) => {
    if (vi.isFakeTimers()) {
      vi.advanceTimersByTime(delay);
    }
  },
});
