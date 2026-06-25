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
      Object.entries(listeners).forEach(([event, listener]) => channel.off(event, listener));
    };

    // Storybook emits `storyRendered` once the story mounts but BEFORE its play
    // function runs — resolving there would screenshot mid-interaction. `storyFinished`
    // fires after render, play, and afterEach all complete (success or error), so it's
    // the only event that's safe to resolve on.
    let lastError: string | undefined;

    const listeners: Record<string, (...args: never[]) => void> = {
      storyFinished: (payload?: { storyId?: string; status?: "error" | "success" }) => {
        if (payload?.storyId !== targetId) {
          return;
        }
        cleanup();
        resolve(
          payload.status === "success"
            ? { ok: true }
            : { ok: false, error: lastError ?? "story finished with errors" },
        );
      },
      storyErrored: (payload?: { description?: string }) => {
        lastError = payload?.description ?? lastError;
      },
      storyThrewException: (error?: { message?: string }) => {
        lastError = error?.message ?? lastError;
      },
      playFunctionThrewException: (error?: { message?: string }) => {
        lastError = error?.message ?? lastError;
      },
      unhandledErrorsWhilePlaying: (errors?: { message?: string }[]) => {
        lastError = errors?.[0]?.message ?? lastError;
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
