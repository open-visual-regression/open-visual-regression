import { describe, expect, it } from "vitest";

import { collectAllPages, type Page } from "../paginate";

const fakeSource = (pages: Record<string, Page<string, string>>, firstCursor: string) => {
  const fetchPage = async (cursor: string | undefined): Promise<Page<string, string>> => {
    const key = cursor ?? firstCursor;
    const page = pages[key];

    if (!page) {
      throw new Error(`No page for cursor ${key}`);
    }

    return page;
  };

  return fetchPage;
};

describe("collectAllPages", () => {
  it("should return the only page when there is no next cursor", async () => {
    const fetchPage = fakeSource({ first: { items: ["a", "b"], nextCursor: null } }, "first");

    await expect(collectAllPages({ fetchPage })).resolves.toEqual({
      items: ["a", "b"],
      nextCursor: null,
    });
  });

  it("should follow every cursor and concatenate the pages in order", async () => {
    const fetchPage = fakeSource(
      {
        first: { items: ["a"], nextCursor: "second" },
        second: { items: ["b"], nextCursor: "third" },
        third: { items: ["c"], nextCursor: null },
      },
      "first",
    );

    await expect(collectAllPages({ fetchPage })).resolves.toEqual({
      items: ["a", "b", "c"],
      nextCursor: null,
    });
  });

  it("should stop at maxPages and return the cursor it did not follow", async () => {
    const fetchPage = fakeSource(
      {
        first: { items: ["a"], nextCursor: "second" },
        second: { items: ["b"], nextCursor: "third" },
        third: { items: ["c"], nextCursor: null },
      },
      "first",
    );

    await expect(collectAllPages({ fetchPage, maxPages: 2 })).resolves.toEqual({
      items: ["a", "b"],
      nextCursor: "third",
    });
  });
});
