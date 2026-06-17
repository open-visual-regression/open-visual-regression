import type { Page } from "playwright";

export type RenderResult = { ok: boolean; error?: string };

export type CaptureStrategy = {
  waitForBoot: (page: Page, timeoutMs: number) => Promise<void>;
  waitForTargetRendered: (args: { targetId: string; timeoutMs: number }) => Promise<RenderResult>;
};

type StorybookChannel = {
  on: (event: string, listener: (...args: never[]) => void) => void;
  off: (event: string, listener: (...args: never[]) => void) => void;
  emit: (event: string, payload: unknown) => void;
};

declare global {
  var __STORYBOOK_ADDONS_CHANNEL__: StorybookChannel | undefined;
}

const waitForStorybookTargetRendered = ({
  targetId,
  timeoutMs,
}: {
  targetId: string;
  timeoutMs: number;
}): Promise<RenderResult> =>
  new Promise((resolve) => {
    const channel = globalThis.__STORYBOOK_ADDONS_CHANNEL__;

    if (!channel) {
      resolve({ ok: false, error: "Storybook channel (__STORYBOOK_ADDONS_CHANNEL__) not found" });
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      resolve({ ok: false, error: `Timed out waiting for "${targetId}" to render` });
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeout);
      Object.entries(listeners).forEach(([event, listener]) => channel.off(event, listener));
    };

    const listeners: Record<string, (...args: never[]) => void> = {
      storyRendered: () => {
        cleanup();
        resolve({ ok: true });
      },
      storyUnchanged: () => {
        cleanup();
        resolve({ ok: true });
      },
      storyErrored: (payload?: { description?: string }) => {
        cleanup();
        resolve({ ok: false, error: payload?.description ?? "story errored" });
      },
      storyThrewException: (error?: { message?: string }) => {
        cleanup();
        resolve({ ok: false, error: error?.message ?? "story threw an exception" });
      },
      playFunctionThrewException: (error?: { message?: string }) => {
        cleanup();
        resolve({ ok: false, error: error?.message ?? "play function threw an exception" });
      },
      unhandledErrorsWhilePlaying: (errors?: { message?: string }[]) => {
        cleanup();
        resolve({ ok: false, error: errors?.[0]?.message ?? "unhandled error while playing" });
      },
      storyMissing: (id?: string) => {
        if (id !== targetId) {
          return;
        }
        cleanup();
        resolve({ ok: false, error: `story "${targetId}" was missing` });
      },
    };

    Object.entries(listeners).forEach(([event, listener]) => channel.on(event, listener));
    channel.emit("setCurrentStory", { storyId: targetId, viewMode: "story" });
  });

const storybookCaptureStrategy: CaptureStrategy = {
  waitForBoot: (page, timeoutMs) =>
    page
      .waitForSelector("#storybook-root, #root", { timeout: timeoutMs, state: "attached" })
      .then(() => undefined),
  waitForTargetRendered: waitForStorybookTargetRendered,
};

const detectStorybookIndexVersion = async (proxyOrigin: string): Promise<number | undefined> => {
  try {
    const response = await fetch(`${proxyOrigin}/index.json`);
    if (!response.ok) {
      return undefined;
    }
    const index = (await response.json()) as { v?: unknown };
    return typeof index.v === "number" ? index.v : undefined;
  } catch {
    return undefined;
  }
};

export const detectCaptureStrategy = async (proxyOrigin: string): Promise<CaptureStrategy> => {
  const storybookIndexVersion = await detectStorybookIndexVersion(proxyOrigin);
  switch (storybookIndexVersion) {
    default:
      return storybookCaptureStrategy;
  }
};
