export const getMonogram = (name: string): string =>
  name
    .split(/[\s\-_]+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toLowerCase() || "?";
