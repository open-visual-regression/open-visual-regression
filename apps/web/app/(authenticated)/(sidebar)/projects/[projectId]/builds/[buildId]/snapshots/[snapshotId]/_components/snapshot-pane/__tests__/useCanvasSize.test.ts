import { afterEach, beforeEach, vi } from "vitest";

import { describe, expect, it, renderHook, waitFor } from "@/test-utils";

import { useCanvasSize } from "../useCanvasSize";

const imageSizes: Record<string, { width: number; height: number }> = {
  "baseline.png": { width: 375, height: 839 },
  "new.png": { width: 1312, height: 800 },
};

class FakeImage extends EventTarget {
  naturalWidth = 0;
  naturalHeight = 0;

  set src(src: string) {
    queueMicrotask(() => {
      const size = imageSizes[src];

      if (!size) {
        this.dispatchEvent(new Event("error"));
        return;
      }

      this.naturalWidth = size.width;
      this.naturalHeight = size.height;
      this.dispatchEvent(new Event("load"));
    });
  }
}

describe("useCanvasSize", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should fit every image anchored to the top-left corner", async () => {
    const { result } = renderHook(() => useCanvasSize(["baseline.png", "new.png"]));

    await waitFor(() => expect(result.current).toEqual({ width: 1312, height: 839 }));
  });

  it("should ignore images that are missing or fail to load", async () => {
    const { result } = renderHook(() => useCanvasSize([null, "broken.png", "baseline.png"]));

    await waitFor(() => expect(result.current).toEqual({ width: 375, height: 839 }));
  });

  it("should not keep the previous canvas while the next images load", async () => {
    const { result, rerender } = renderHook(({ imagePaths }) => useCanvasSize(imagePaths), {
      initialProps: { imagePaths: ["new.png"] },
    });

    await waitFor(() => expect(result.current).toEqual({ width: 1312, height: 800 }));

    rerender({ imagePaths: ["baseline.png"] });

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual({ width: 375, height: 839 }));
  });
});
