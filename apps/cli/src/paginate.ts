const DEFAULT_MAX_PAGES = 100;

export type Page<TItem, TCursor> = {
  items: TItem[];
  nextCursor: TCursor | null;
};

export type CollectAllPagesOptions<TItem, TCursor> = {
  fetchPage: (cursor: TCursor | undefined) => Promise<Page<TItem, TCursor>>;
  maxPages?: number;
};

export const collectAllPages = async <TItem, TCursor>({
  fetchPage,
  maxPages = DEFAULT_MAX_PAGES,
}: CollectAllPagesOptions<TItem, TCursor>): Promise<Page<TItem, TCursor>> => {
  const items: TItem[] = [];
  let cursor: TCursor | undefined;

  for (let page = 0; page < maxPages; page++) {
    const result = await fetchPage(cursor);

    items.push(...result.items);

    if (!result.nextCursor) {
      return { items, nextCursor: null };
    }

    cursor = result.nextCursor;
  }

  return { items, nextCursor: cursor ?? null };
};
