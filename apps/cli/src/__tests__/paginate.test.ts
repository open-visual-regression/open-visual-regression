import { describe, expect, it, vi } from "vitest";

import { collectAllPages, type Page } from "../paginate";

describe("collectAllPages", () => {
  it("should return the only page when there is no next cursor", async () => {
    const fetchPage = vi
      .fn<(cursor: string | undefined) => Promise<Page<string, string>>>()
      .mockResolvedValue({ items: ["a", "b"], nextCursor: null });

    await expect(collectAllPages({ fetchPage })).resolves.toEqual({
      items: ["a", "b"],
      nextCursor: null,
    });
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(undefined);
  });

  it("should follow every cursor and concatenate the pages in order", async () => {
    const fetchPage = vi
      .fn<(cursor: string | undefined) => Promise<Page<string, string>>>()
      .mockResolvedValueOnce({ items: ["a"], nextCursor: "page-2" })
      .mockResolvedValueOnce({ items: ["b"], nextCursor: "page-3" })
      .mockResolvedValueOnce({ items: ["c"], nextCursor: null });

    await expect(collectAllPages({ fetchPage })).resolves.toEqual({
      items: ["a", "b", "c"],
      nextCursor: null,
    });
    expect(fetchPage).toHaveBeenNthCalledWith(2, "page-2");
    expect(fetchPage).toHaveBeenNthCalledWith(3, "page-3");
  });

  it("should stop at maxPages and return the cursor it did not follow", async () => {
    const fetchPage = vi
      .fn<(cursor: string | undefined) => Promise<Page<string, string>>>()
      .mockResolvedValue({ items: ["a"], nextCursor: "page-2" });

    await expect(collectAllPages({ fetchPage, maxPages: 2 })).resolves.toEqual({
      items: ["a", "a"],
      nextCursor: "page-2",
    });
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
