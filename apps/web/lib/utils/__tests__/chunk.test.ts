import { describe, expect, it } from "@/test-utils";

import { chunk } from "../chunk";

describe("chunk", () => {
  it("should split items into groups of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5, 6], 2)).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it("should leave the remainder in a shorter final group", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should return no groups for an empty list", () => {
    expect(chunk([], 2)).toEqual([]);
  });
});
