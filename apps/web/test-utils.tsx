import userEvent from "@testing-library/user-event";
import { test as base } from "vitest";

export const it = base.extend<{ user: ReturnType<typeof userEvent.setup> }>({
  user: async ({}, use) => {
    await use(userEvent.setup());
  },
});

export { expect, describe } from "vitest";
export * from "@testing-library/react";
