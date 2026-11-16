import type { listBuildsInputSchema } from "@ovr/api/contracts/builds";

type LimitSchema = typeof listBuildsInputSchema.shape.limit;

export const getMaxLimit = (schema: LimitSchema): number => schema.unwrap().maxValue!;

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

export const parseLimit = (limit: string, schema: LimitSchema): number => {
  const result = schema.safeParse(Number(limit));

  if (!result.success) {
    throw new Error(`--limit must be an integer between 1 and ${getMaxLimit(schema)}.`);
  }

  return result.data;
};
