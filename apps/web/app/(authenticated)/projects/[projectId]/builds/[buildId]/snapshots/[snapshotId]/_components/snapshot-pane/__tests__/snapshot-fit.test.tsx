import { afterEach } from "vitest";

import { ScrollContainer } from "@/lib/providers/ScrollContainer";
import { describe, expect, it, render, screen } from "@/test-utils";

import { SnapshotFitProvider } from "../snapshot-fit";
import { SnapshotPaneImage } from "../SnapshotPaneImage";

// jsdom lays nothing out, so the geometry the fit is worked out from is stubbed:
// a scroll region of a given height, holding images of a given natural size.
const stubLayout = ({
  scrollHeight,
  images,
}: {
  scrollHeight: number;
  images: Record<string, { width: number; height: number }>;
}) => {
  const naturalSize = (image: HTMLImageElement) => images[image.getAttribute("src") ?? ""];

  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(HTMLImageElement.prototype, "complete", {
    configurable: true,
    get: () => true,
  });
  Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
    configurable: true,
    get(this: HTMLImageElement) {
      return naturalSize(this)?.width ?? 0;
    },
  });
  Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", {
    configurable: true,
    get(this: HTMLImageElement) {
      return naturalSize(this)?.height ?? 0;
    },
  });
};

const fitStyleOf = (alt: string) =>
  screen.getByAltText(alt).closest("div[style]")?.getAttribute("style");

afterEach(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "clientHeight");
  Reflect.deleteProperty(HTMLImageElement.prototype, "complete");
  Reflect.deleteProperty(HTMLImageElement.prototype, "naturalWidth");
  Reflect.deleteProperty(HTMLImageElement.prototype, "naturalHeight");
});

describe("SnapshotFitProvider", () => {
  it("should cap the panes at the width a portrait snapshot needs to fit the space left below it", () => {
    stubLayout({ scrollHeight: 800, images: { "new.png": { width: 375, height: 1400 } } });

    render(
      <ScrollContainer>
        <SnapshotFitProvider>
          <SnapshotPaneImage imagePath="new.png" alt="snapshot" />
        </SnapshotFitProvider>
      </ScrollContainer>,
    );

    // 800 less the pane's label row, and the width that keeps a 375x1400
    // snapshot inside a box that tall.
    expect(fitStyleOf("snapshot")).toContain("--ovr-snapshot-fit-height: 772px");
    expect(fitStyleOf("snapshot")).toContain("--ovr-snapshot-fit-width: 206px");
  });

  it("should cap every pane at the width the tallest snapshot needs, so they share a scale", () => {
    stubLayout({
      scrollHeight: 800,
      images: {
        "baseline.png": { width: 375, height: 1000 },
        "new.png": { width: 375, height: 1400 },
      },
    });

    render(
      <ScrollContainer>
        <SnapshotFitProvider>
          <SnapshotPaneImage imagePath="baseline.png" alt="baseline snapshot" />
          <SnapshotPaneImage imagePath="new.png" alt="snapshot" />
        </SnapshotFitProvider>
      </ScrollContainer>,
    );

    expect(fitStyleOf("baseline snapshot")).toContain("--ovr-snapshot-fit-width: 206px");
  });

  it("should leave the boxes unsized when there is no scroll region to fit them into", () => {
    stubLayout({ scrollHeight: 800, images: { "new.png": { width: 375, height: 1400 } } });

    render(
      <SnapshotFitProvider>
        <SnapshotPaneImage imagePath="new.png" alt="snapshot" />
      </SnapshotFitProvider>,
    );

    expect(fitStyleOf("snapshot")).toBeUndefined();
  });
});
