import { describe, expect, it } from "vitest";

import { formatTable } from "../table";

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
