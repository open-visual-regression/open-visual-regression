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

type StorybookPreview = {
  storyStoreValue?: {
    getStoryContext?: (storyId: string) => { parameters?: Record<string, unknown> } | undefined;
  };
};

declare global {
  var __STORYBOOK_ADDONS_CHANNEL__: StorybookChannel | undefined;
  var __STORYBOOK_PREVIEW__: StorybookPreview | undefined;
}

export type OvrStoryParameterViewport =
  | string
  | { browser?: string; width: number; height?: number };

export type OvrStoryParameters = { viewports?: OvrStoryParameterViewport[] };

export const readOvrStoryParameters = (targetId: string): OvrStoryParameters | null => {
  const context = globalThis.__STORYBOOK_PREVIEW__?.storyStoreValue?.getStoryContext?.(targetId);
  const ovr = context?.parameters?.ovr;
  return (ovr as OvrStoryParameters | undefined) ?? null;
};

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

const detectStorybookManifestVersion = async (proxyOrigin: string): Promise<number | undefined> => {
  try {
    const response = await fetch(`${proxyOrigin}/index.json`);
    if (!response.ok) {
      return undefined;
    }
    const manifest = (await response.json()) as { v?: unknown };
    return typeof manifest.v === "number" ? manifest.v : undefined;
  } catch {
    return undefined;
  }
};

export const detectCaptureStrategy = async (proxyOrigin: string): Promise<CaptureStrategy> => {
  const storybookManifestVersion = await detectStorybookManifestVersion(proxyOrigin);
  switch (storybookManifestVersion) {
    default:
      return storybookCaptureStrategy;
  }
};
