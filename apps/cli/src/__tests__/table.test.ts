import { describe, expect, it } from "vitest";

import { formatAppliedFilters, formatNextPageHint, formatTable } from "../table";

describe("formatTable", () => {
  it("should print only the header row when there are no rows", () => {
    expect(formatTable(["NAME", "STATUS"], [])).toBe("NAME  STATUS");
  });

  it("should widen a column to fit its longest value", () => {
    const table = formatTable(
      ["NAME", "STATUS"],
      [
        ["a-very-long-name", "ok"],
        ["short", "ok"],
      ],
    );
    const lines = table.split("\n");
    const statusColumnStart = lines[0]!.indexOf("STATUS");

    expect(lines[1]!.slice(statusColumnStart)).toBe("ok");
    expect(lines[2]!.slice(statusColumnStart)).toBe("ok");
  });

  it("should not leave trailing whitespace on a row", () => {
    const table = formatTable(["NAME", "STATUS"], [["a-very-long-name", "ok"]]);

    expect(table.split("\n").every((line) => line === line.trimEnd())).toBe(true);
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

describe("formatNextPageHint", () => {
  it("should report what was shown and how to resume", () => {
    expect(formatNextPageHint(20, 137, "abc")).toBe("Showing 20 of 137. Next page: --cursor abc");
  });
});
