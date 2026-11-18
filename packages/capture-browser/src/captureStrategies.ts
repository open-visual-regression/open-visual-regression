import type { Page } from "playwright";

import { assertSupportedStorybookBuild } from "@ovr/storybook-compat/version";

// Kinds stay independent of the ingestion source so other target types can report the same ones.
// `unavailable`: the bundle's runtime never exposed what capture drives it with.
// `missing`: the bundle has no target with the requested id.
// `render`: the target threw while rendering.
// `interaction`: a scripted interaction run after rendering (e.g. a play function) failed.
// `timeout`: the target never reported that it finished, which may be the target or a slow worker.
export type RenderFailureKind = "unavailable" | "missing" | "render" | "interaction" | "timeout";

export type RenderFailure = { kind: RenderFailureKind; message: string };

export type RenderResult = { ok: true } | { ok: false; error: RenderFailure };

export type CaptureStrategy = {
  entryPath: string;
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
  storeInitializationPromise?: Promise<unknown>;
  loadStory: (args: {
    storyId: string;
  }) => Promise<{ parameters?: Record<string, unknown> } | undefined>;
};

declare global {
  var __STORYBOOK_ADDONS_CHANNEL__: StorybookChannel | undefined;
  var __STORYBOOK_PREVIEW__: StorybookPreview | undefined;
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
      resolve({
        ok: false,
        error: {
          kind: "unavailable",
          message: "Storybook channel (__STORYBOOK_ADDONS_CHANNEL__) not found",
        },
      });
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      resolve({
        ok: false,
        error: { kind: "timeout", message: `Timed out waiting for "${targetId}" to render` },
      });
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeout);
      for (const [event, listener] of Object.entries(listeners)) {
        channel.off(event, listener);
      }
    };

    let remounted = false;

    const listeners: Record<string, (...args: never[]) => void> = {
      storyRendered: () => {
        cleanup();
        resolve({ ok: true });
      },
      storyUnchanged: () => {
        if (remounted) {
          cleanup();
          resolve({ ok: true });
          return;
        }
        remounted = true;
        channel.emit("forceRemount", { storyId: targetId });
      },
      storyErrored: (payload?: { description?: string }) => {
        cleanup();
        resolve({
          ok: false,
          error: { kind: "render", message: payload?.description ?? "story errored" },
        });
      },
      storyThrewException: (error?: { message?: string }) => {
        cleanup();
        resolve({
          ok: false,
          error: { kind: "render", message: error?.message ?? "story threw an exception" },
        });
      },
      storyMissing: (id?: string) => {
        if (id !== targetId) {
          return;
        }
        cleanup();
        resolve({
          ok: false,
          error: { kind: "missing", message: `story "${targetId}" was missing` },
        });
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
      resolve({
        ok: false,
        error: {
          kind: "unavailable",
          message: "Storybook channel (__STORYBOOK_ADDONS_CHANNEL__) not found",
        },
      });
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      resolve({
        ok: false,
        error: { kind: "timeout", message: `Timed out waiting for "${targetId}" to render` },
      });
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeout);
      for (const [event, listener] of Object.entries(listeners)) {
        channel.off(event, listener);
      }
    };

    const errorMessages: string[] = [];
    let interactionFailed = false;
    let remounted = false;

    const listeners: Record<string, (...args: never[]) => void> = {
      storyFinished: (payload?: { storyId?: string; status?: "error" | "success" }) => {
        if (payload?.storyId !== targetId) {
          return;
        }
        cleanup();
        if (payload.status === "success" && errorMessages.length === 0) {
          resolve({ ok: true });
          return;
        }
        resolve({
          ok: false,
          error: {
            kind: interactionFailed ? "interaction" : "render",
            message:
              errorMessages.length > 0 ? errorMessages.join("\n") : "story finished with errors",
          },
        });
      },
      storyUnchanged: () => {
        if (remounted) {
          cleanup();
          resolve({ ok: true });
          return;
        }
        remounted = true;
        channel.emit("forceRemount", { storyId: targetId });
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
        interactionFailed = true;
        if (error?.message) {
          errorMessages.push(error.message);
        }
      },
      unhandledErrorsWhilePlaying: (errors?: { message?: string }[]) => {
        interactionFailed = true;
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
        resolve({
          ok: false,
          error: { kind: "missing", message: `story "${targetId}" was missing` },
        });
      },
    };

    for (const [event, listener] of Object.entries(listeners)) {
      channel.on(event, listener);
    }
    channel.emit("setCurrentStory", { storyId: targetId, viewMode: "story" });
  });

const storybookCaptureStrategy: CaptureStrategy = {
  entryPath: "iframe.html",
  waitForBoot: async (page, timeoutMs) => {
    await page.waitForSelector("#storybook-root, #root", { timeout: timeoutMs, state: "attached" });
    await page.waitForFunction(() => Boolean(globalThis.__STORYBOOK_ADDONS_CHANNEL__), undefined, {
      timeout: timeoutMs,
    });
  },
  waitForTargetRendered: waitForStorybookTargetRendered,
  waitForTargetPlayed: waitForStorybookTargetPlayed,
};

export const detectCaptureStrategy = async (bundleDir: string): Promise<CaptureStrategy> => {
  await assertSupportedStorybookBuild(bundleDir);
  return storybookCaptureStrategy;
};
