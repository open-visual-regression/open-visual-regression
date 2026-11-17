import { sql } from "drizzle-orm";

import { db } from "../db";
import { settings, type SettingKey } from "../schema";

export const find = (key: SettingKey) =>
  db.query.settings.findFirst({
    where: (settings, { eq }) => eq(settings.key, key),
  });

type UpsertInput = {
  key: SettingKey;
  value: Record<string, unknown>;
  updatedBy: string;
};

export const upsert = async ({ key, value, updatedBy }: UpsertInput) => {
  const [row] = await db
    .insert(settings)
    .values({ key, value, updatedBy })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedBy, updatedAt: sql`now()` },
    })
    .returning();
  return row;
};

export type SettingDbSchema = NonNullable<Awaited<ReturnType<typeof find>>>;
