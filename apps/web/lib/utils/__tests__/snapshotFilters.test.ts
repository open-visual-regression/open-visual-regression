import { describe, expect, it } from "@/test-utils";

import { parseSnapshotFilters, withSnapshotFilters } from "../snapshotFilters";

describe("snapshotFilters", () => {
  describe("parseSnapshotFilters", () => {
    it("should read every filter from the search params", () => {
      expect(
        parseSnapshotFilters({
          search: "button",
          status: ["needs_review", "error"],
          browser: "chromium",
          viewport: ["desktop", "mobile"],
          flag: ["flaky", "warning"],
        }),
      ).toEqual({
        search: "button",
        statuses: ["needs_review", "error"],
        browsers: ["chromium"],
        viewports: ["desktop", "mobile"],
        flags: ["flaky", "warning"],
      });
    });

    it("should return empty filters when no search params are set", () => {
      expect(parseSnapshotFilters({})).toEqual({
        search: undefined,
        statuses: [],
        browsers: [],
        viewports: [],
        flags: [],
      });
    });

    it("should drop an unrecognised status rather than failing the page", () => {
      expect(parseSnapshotFilters({ status: "not-a-status" }).statuses).toEqual([]);
    });

    it("should drop an unrecognised flag rather than failing the page", () => {
      expect(parseSnapshotFilters({ flag: "not-a-flag" }).flags).toEqual([]);
    });

    it("should treat an empty search as no search", () => {
      expect(parseSnapshotFilters({ search: "" }).search).toBeUndefined();
    });
  });

  describe("withSnapshotFilters", () => {
    it("should repeat a parameter for each selected value", () => {
      expect(
        withSnapshotFilters("/builds/1", {
          search: "button",
          statuses: ["needs_review", "error"],
          browsers: ["chromium"],
          viewports: [],
          flags: ["flaky"],
        }),
      ).toBe(
        "/builds/1?search=button&status=needs_review&status=error&browser=chromium&flag=flaky",
      );
    });

    it("should leave the path untouched when nothing is filtered", () => {
      expect(
        withSnapshotFilters("/builds/1", { statuses: [], browsers: [], viewports: [], flags: [] }),
      ).toBe("/builds/1");
    });

    it("should leave the path untouched when there are no filters", () => {
      expect(withSnapshotFilters("/builds/1")).toBe("/builds/1");
    });

    it("should round-trip the filters parsed from the build page's search params", () => {
      const searchParams = { search: "button", status: ["needs_review"], browser: "chromium" };

      expect(withSnapshotFilters("/builds/1", parseSnapshotFilters(searchParams))).toBe(
        "/builds/1?search=button&status=needs_review&browser=chromium",
      );
    });
  });
});
