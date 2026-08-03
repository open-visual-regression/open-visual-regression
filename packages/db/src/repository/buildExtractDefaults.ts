import { db, type DbClient } from "../db";
import { buildExtractDefaults } from "../schema";

type CreateInput = typeof buildExtractDefaults.$inferInsert & { tx?: DbClient };

export const create = async ({ tx = db, ...values }: CreateInput) => {
  const [row] = await tx
    .insert(buildExtractDefaults)
    .values(values)
    .onConflictDoNothing()
    .returning();
  return row;
};

export const findByBuild = (buildId: string) =>
  db.query.buildExtractDefaults.findFirst({
    where: (buildExtractDefaults, { eq }) => eq(buildExtractDefaults.buildId, buildId),
  });

export type BuildExtractDefaultsDbSchema = Awaited<ReturnType<typeof findByBuild>>;
