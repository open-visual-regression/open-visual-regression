import { test as base } from "vitest";

import { user } from "@/lib/testing/user";

export const it = base.extend<{ user: typeof user }>({
  user: async ({}, use) => {
    await use(user);
  },
});

export { expect, describe } from "vitest";
export * from "@testing-library/react";
