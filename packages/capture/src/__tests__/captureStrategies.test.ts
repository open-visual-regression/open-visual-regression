import { afterEach, describe, expect, it } from "vitest";

import { storybookCaptureStrategy } from "../captureStrategies";

type Listener = (...args: never[]) => void;

class FakeStorybookChannel {
  private readonly listeners = new Map<string, Set<Listener>>();

  on(event: string, listener: Listener): void {
    const existing = this.listeners.get(event) ?? new Set();
    existing.add(listener);
    this.listeners.set(event, existing);
  }

  off(event: string, listener: Listener): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, payload?: unknown): void {
    for (const listener of this.listeners.get(event) ?? []) {
      (listener as (payload?: unknown) => void)(payload);
    }
  }
}

afterEach(() => {
  delete globalThis.__STORYBOOK_ADDONS_CHANNEL__;
});

describe("storybookCaptureStrategy.waitForTargetPlayed", () => {
  it("fails when the story throws during render, even if storyFinished reports success", async () => {
    const channel = new FakeStorybookChannel();
    // Mirrors Storybook's own behavior: a render error caught by its error
    // boundary still emits storyFinished with status "success".
    channel.on("setCurrentStory", () => {
      channel.emit("storyThrewException", {
        message: "No QueryClient set, use QueryClientProvider to set one",
      });
      channel.emit("storyFinished", { storyId: "target", status: "success" });
    });
    globalThis.__STORYBOOK_ADDONS_CHANNEL__ = channel;

    const result = await storybookCaptureStrategy.waitForTargetPlayed({
      targetId: "target",
      timeoutMs: 1_000,
    });

    expect(result).toEqual({
      ok: false,
      error: "No QueryClient set, use QueryClientProvider to set one",
    });
  });

  it("succeeds when the story finishes cleanly with no errors", async () => {
    const channel = new FakeStorybookChannel();
    channel.on("setCurrentStory", () => {
      channel.emit("storyFinished", { storyId: "target", status: "success" });
    });
    globalThis.__STORYBOOK_ADDONS_CHANNEL__ = channel;

    const result = await storybookCaptureStrategy.waitForTargetPlayed({
      targetId: "target",
      timeoutMs: 1_000,
    });

    expect(result).toEqual({ ok: true });
  });

  it("fails when storyFinished reports status error", async () => {
    const channel = new FakeStorybookChannel();
    channel.on("setCurrentStory", () => {
      channel.emit("playFunctionThrewException", { message: "assertion failed" });
      channel.emit("storyFinished", { storyId: "target", status: "error" });
    });
    globalThis.__STORYBOOK_ADDONS_CHANNEL__ = channel;

    const result = await storybookCaptureStrategy.waitForTargetPlayed({
      targetId: "target",
      timeoutMs: 1_000,
    });

    expect(result).toEqual({ ok: false, error: "assertion failed" });
  });
});
