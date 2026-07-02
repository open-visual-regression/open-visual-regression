import type { Page } from "playwright";

export type RenderResult = { ok: boolean; error?: string };

export type CaptureStrategy = {
  waitForBoot: (page: Page, timeoutMs: number) => Promise<void>;
  waitForTargetRendered: (args: { targetId: string; timeoutMs: number }) => Promise<RenderResult>;
  waitForTargetPlayed: (args: { targetId: string; timeoutMs: number }) => Promise<RenderResult>;
};

type StorybookChannel = {
  on: (event: string, listener: (...args: never[]) => void) => void;
  off: (event: string, listener: (...args: never[]) => void) => void;
  emit: (event: string, payload: unknown) => void;
};

type StorybookPreview = {
  currentRender?: {
    story?: { id?: string; parameters?: Record<string, unknown> };
  };
};

declare global {
  var __STORYBOOK_ADDONS_CHANNEL__: StorybookChannel | undefined;
  var __STORYBOOK_PREVIEW__: StorybookPreview | undefined;
}

export type OvrStoryParameterViewport =
  | string
  | { browser?: string; width: number; height?: number };

export type OvrStoryParameters = {
  viewports?: OvrStoryParameterViewport[];
  diffThreshold?: number;
  skip?: boolean;
};

// `getStoryContext` takes the prepared story object, not a story id, so the
// just-rendered story's own parameters (set on currentRender.story) are read
// directly instead.
export const readOvrStoryParameters = (targetId: string): OvrStoryParameters | null => {
  const story = globalThis.__STORYBOOK_PREVIEW__?.currentRender?.story;
  if (story?.id !== targetId) {
    return null;
  }
  const ovr = story.parameters?.ovr;
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
      for (const [event, listener] of Object.entries(listeners)) {
        channel.off(event, listener);
      }
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
      storyMissing: (id?: string) => {
        if (id !== targetId) {
          return;
        }
        cleanup();
        resolve({ ok: false, error: `story "${targetId}" was missing` });
      },
    };

    for (const [event, listener] of Object.entries(listeners)) {
      channel.on(event, listener);
    }
    channel.emit("setCurrentStory", { storyId: targetId, viewMode: "story" });
  });

const waitForStorybookTargetPlayed = ({
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
      for (const [event, listener] of Object.entries(listeners)) {
        channel.off(event, listener);
      }
    };

    const errorMessages: string[] = [];

    const listeners: Record<string, (...args: never[]) => void> = {
      storyFinished: (payload?: { storyId?: string; status?: "error" | "success" }) => {
        if (payload?.storyId !== targetId) {
          return;
        }
        cleanup();
        if (payload.status === "success") {
          resolve({ ok: true });
          return;
        }
        resolve({
          ok: false,
          error: errorMessages.length > 0 ? errorMessages.join("\n") : "story finished with errors",
        });
      },
      // Re-selecting the already-current story (e.g. capturing it at another
      // viewport) re-runs no play function, so Storybook reports it unchanged
      // rather than finished. The story is already rendered and played.
      storyUnchanged: () => {
        cleanup();
        resolve({ ok: true });
      },
      storyErrored: (payload?: { description?: string }) => {
        if (payload?.description) {
          errorMessages.push(payload.description);
        }
      },
      storyThrewException: (error?: { message?: string }) => {
        if (error?.message) {
          errorMessages.push(error.message);
        }
      },
      playFunctionThrewException: (error?: { message?: string }) => {
        if (error?.message) {
          errorMessages.push(error.message);
        }
      },
      unhandledErrorsWhilePlaying: (errors?: { message?: string }[]) => {
        for (const error of errors ?? []) {
          if (error.message) {
            errorMessages.push(error.message);
          }
        }
      },
      storyMissing: (id?: string) => {
        if (id !== targetId) {
          return;
        }
        cleanup();
        resolve({ ok: false, error: `story "${targetId}" was missing` });
      },
    };

    for (const [event, listener] of Object.entries(listeners)) {
      channel.on(event, listener);
    }
    channel.emit("setCurrentStory", { storyId: targetId, viewMode: "story" });
  });

const storybookCaptureStrategy: CaptureStrategy = {
  waitForBoot: async (page, timeoutMs) => {
    await page.waitForSelector("#storybook-root, #root", { timeout: timeoutMs, state: "attached" });
    await page.waitForFunction(() => Boolean(globalThis.__STORYBOOK_ADDONS_CHANNEL__), undefined, {
      timeout: timeoutMs,
    });
  },
  waitForTargetRendered: waitForStorybookTargetRendered,
  waitForTargetPlayed: waitForStorybookTargetPlayed,
};

const DETECT_STRATEGY_TIMEOUT_MS = 10_000;

const detectStorybookManifestVersion = async (proxyOrigin: string): Promise<number | undefined> => {
  try {
    const response = await fetch(`${proxyOrigin}/index.json`, {
      signal: AbortSignal.timeout(DETECT_STRATEGY_TIMEOUT_MS),
    });
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
