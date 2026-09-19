import { describe, expect, it } from "vitest";

import type { BuildSchema } from "@ovr/api/contracts/builds";

import { formatAppliedFilters, formatBuildsOutput } from "../table";

const BUILD: BuildSchema = {
  id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fb",
  project: { id: "01a092d6-b0aa-71bf-9312-dd8ef48a22fc", name: "web" },
  branch: "main",
  commitSha: "a1b2c3d4e5f6",
  name: "fix: cart total rounding",
  author: "tgfischer",
  errorMessage: null,
  status: "needs_review",
  buildType: "storybook",
  createdAt: "2026-09-12T10:43:15Z",
};

describe("formatBuildsOutput", () => {
  it("should print the builds, total and next cursor as JSON when json is true", () => {
    expect(formatBuildsOutput({ builds: [BUILD], total: 42, nextCursor: "abc" }, true)).toBe(
      JSON.stringify({ builds: [BUILD], total: 42, nextCursor: "abc" }, null, 2),
    );
  });

  it("should print an empty result as JSON when json is true and there are no builds", () => {
    expect(formatBuildsOutput({ builds: [], total: 0, nextCursor: null }, true)).toBe(
      JSON.stringify({ builds: [], total: 0, nextCursor: null }, null, 2),
    );
  });

  it("should leave the applied filters out of the JSON", () => {
    const output = formatBuildsOutput(
      { builds: [], total: 0, nextCursor: null, filters: { branch: "main" } },
      true,
    );

    expect(JSON.parse(output)).not.toHaveProperty("filters");
  });

  it("should print 'No builds found.' when json is false and there are no builds", () => {
    expect(formatBuildsOutput({ builds: [], total: 0, nextCursor: null }, false)).toBe(
      "No builds found.",
    );
  });

  it("should report the filters that produced an empty result", () => {
    expect(
      formatBuildsOutput(
        { builds: [], total: 0, nextCursor: null, filters: { branch: "mian", status: ["error"] } },
        false,
      ),
    ).toBe("No builds found.\nFilters: branch=mian, status=error");
  });

  it("should print a table when json is false and there are builds", () => {
    const output = formatBuildsOutput({ builds: [BUILD], total: 1, nextCursor: null }, false);

    expect(output.split("\n")).toHaveLength(2);
    expect(output).toContain("BUILD");
    expect(output).toContain(BUILD.id);
    expect(output).toContain("fix: cart total rounding");
  });

  it("should not invite a next page when there is no next cursor", () => {
    expect(
      formatBuildsOutput({ builds: [BUILD], total: 1, nextCursor: null }, false),
    ).not.toContain("--cursor");
  });

  it("should print the cursor for the next page when there is one", () => {
    expect(formatBuildsOutput({ builds: [BUILD], total: 42, nextCursor: "abc" }, false)).toContain(
      "Showing 1 of 42. Next page: --cursor abc",
    );
  });
});

describe("formatAppliedFilters", () => {
  it("should return undefined when no filters were applied", () => {
    expect(formatAppliedFilters(undefined)).toBeUndefined();
  });

  it("should ignore flags that were not passed", () => {
    expect(formatAppliedFilters({ branch: undefined, status: [], search: "cart" })).toBe(
      "Filters: search=cart",
    );
  });

  it("should join the values of a repeated flag", () => {
    expect(formatAppliedFilters({ branch: ["main", "next"] })).toBe("Filters: branch=main,next");
  });
});
