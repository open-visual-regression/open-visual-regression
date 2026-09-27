import { describe, expect, it } from "@/test-utils";

import { getLoginPath, getSafeRedirectPath } from "../redirects";

describe("redirects", () => {
  describe("getLoginPath", () => {
    it("should encode the path to return to", () => {
      expect(getLoginPath("/projects/1/baseline/storybook?path=/story/a")).toBe(
        "/login?callback_url=%2Fprojects%2F1%2Fbaseline%2Fstorybook%3Fpath%3D%2Fstory%2Fa",
      );
    });
  });

  describe("getSafeRedirectPath", () => {
    it("should keep a same-site path with its query", () => {
      expect(getSafeRedirectPath("/projects/1/baseline/storybook?path=/story/a")).toBe(
        "/projects/1/baseline/storybook?path=/story/a",
      );
    });

    it.each([
      undefined,
      ["/projects"],
      "",
      "projects",
      "https://example.com",
      "//example.com",
      "/\\example.com",
    ])("should fall back to the projects page for %j", (next) => {
      expect(getSafeRedirectPath(next)).toBe("/projects");
    });
  });
});
