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
