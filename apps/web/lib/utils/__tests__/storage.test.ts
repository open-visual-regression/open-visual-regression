import { describe, expect, it } from "@/test-utils";

import { getStorybookPath, getStorybookStoryPath, hasHostedStorybook } from "../storage";

describe("storage", () => {
  describe("getStorybookStoryPath", () => {
    it("should deep-link to the story within the build's storybook bundle", () => {
      expect(getStorybookStoryPath("build-1", "ui-button--primary")).toBe(
        `${getStorybookPath("build-1")}?path=/story/ui-button--primary`,
      );
    });

    it("should encode story ids with url-unsafe characters", () => {
      expect(getStorybookStoryPath("build-1", "foo/bar baz")).toBe(
        `${getStorybookPath("build-1")}?path=/story/foo%2Fbar%20baz`,
      );
    });
  });

  describe("hasHostedStorybook", () => {
    it("should be true for a finished storybook build", () => {
      expect(hasHostedStorybook({ buildType: "storybook", status: "unchanged" })).toBe(true);
    });

    it.each(["queued", "processing", "error"] as const)(
      "should be false while a storybook build is %s",
      (status) => {
        expect(hasHostedStorybook({ buildType: "storybook", status })).toBe(false);
      },
    );
  });
});
