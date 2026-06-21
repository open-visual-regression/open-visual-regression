const partition = <T>(items: readonly T[], parts: number): T[][] =>
  Array.from({ length: parts }, (_, i) => items.filter((_, index) => index % parts === i));

export const mapWithConcurrency = async <T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> => {
  if (items.length === 0) {
    return [];
  }

  const groups = partition(items, Math.min(concurrency, items.length));
  const results = await Promise.all(groups.map((group) => Promise.all(group.map(fn))));

  return results.flat();
};
