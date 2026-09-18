import { describe, expect, it } from "@/test-utils";

import {
  parseSnapshotFilters,
  snapshotFiltersQuery,
  withSnapshotFiltersQuery,
} from "../snapshotFilters";

describe("parseSnapshotFilters", () => {
  it("should read every filter from the search params", () => {
    expect(
      parseSnapshotFilters({
        search: "button",
        status: ["needs_review", "error"],
        browser: "chromium",
        viewport: ["desktop", "mobile"],
      }),
    ).toEqual({
      search: "button",
      statuses: ["needs_review", "error"],
      browsers: ["chromium"],
      viewports: ["desktop", "mobile"],
    });
  });

  it("should return empty filters when no search params are set", () => {
    expect(parseSnapshotFilters({})).toEqual({
      search: undefined,
      statuses: [],
      browsers: [],
      viewports: [],
    });
  });

  it("should drop an unrecognised status rather than failing the page", () => {
    expect(parseSnapshotFilters({ status: "not-a-status" }).statuses).toEqual([]);
  });

  it("should treat an empty search as no search", () => {
    expect(parseSnapshotFilters({ search: "" }).search).toBeUndefined();
  });
});

describe("snapshotFiltersQuery", () => {
  it("should repeat a parameter for each selected value", () => {
    expect(
      snapshotFiltersQuery({
        search: "button",
        statuses: ["needs_review", "error"],
        browsers: ["chromium"],
        viewports: [],
      }),
    ).toBe("search=button&status=needs_review&status=error&browser=chromium");
  });

  it("should return an empty query when nothing is filtered", () => {
    expect(snapshotFiltersQuery({ statuses: [], browsers: [], viewports: [] })).toBe("");
  });
});

describe("withSnapshotFiltersQuery", () => {
  it("should append the query to the path", () => {
    expect(withSnapshotFiltersQuery("/builds/1", "status=error")).toBe("/builds/1?status=error");
  });

  it("should leave the path untouched when there is no query", () => {
    expect(withSnapshotFiltersQuery("/builds/1", "")).toBe("/builds/1");
  });
});
