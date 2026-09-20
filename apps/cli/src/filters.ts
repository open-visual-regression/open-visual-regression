export const MAX_LIMIT = 100;

export const parseEnumOption = <T extends string>(
  flag: string,
  values: string[] | undefined,
  allowed: readonly T[],
): T[] | undefined => {
  if (!values) {
    return undefined;
  }

  const invalid = values.filter((value) => !allowed.includes(value as T));

  if (invalid.length > 0) {
    throw new Error(
      `Invalid ${flag} value(s): ${invalid.join(", ")}. Valid values: ${allowed.join(", ")}`,
    );
  }

  return values as T[];
};

export const parseLimit = (limit: string): number => {
  const parsed = Number(limit);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw new Error(`--limit must be an integer between 1 and ${MAX_LIMIT}.`);
  }

  return parsed;
};
