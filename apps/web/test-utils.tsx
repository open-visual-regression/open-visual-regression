import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import type { NextRouter } from "next/dist/shared/lib/router/router";
import type { ReactElement } from "react";
import { test as base, vi } from "vitest";

import { user } from "@/lib/testing/user";

export const it = base.extend<{ user: typeof user }>({
  user: async ({}, use) => {
    await use(user);
  },
});

// Outside of Next's own build step (which aliases `next/link` to an app-router-aware
// implementation), `next/link` resolves to the Pages Router implementation and reads this
// context directly. Without it, clicking a `Link` skips `preventDefault` and lets jsdom attempt
// a real navigation, logging "Not implemented: navigation to another Document".
const mockRouter: NextRouter = {
  route: "/",
  pathname: "/",
  query: {},
  asPath: "/",
  basePath: "",
  isLocaleDomain: false,
  isFallback: false,
  isReady: true,
  isPreview: false,
  push: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(() => Promise.resolve()),
  beforePopState: vi.fn(),
  events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
};

const render = (ui: ReactElement, options?: RenderOptions) =>
  rtlRender(<RouterContext.Provider value={mockRouter}>{ui}</RouterContext.Provider>, options);

export { expect, describe } from "vitest";
export { render };
export * from "@testing-library/react";
