import { db, type DbClient } from "../db";
import { buildExtractInputs } from "../schema";

type CreateInput = typeof buildExtractInputs.$inferInsert & { tx?: DbClient };

export const create = async ({ tx = db, ...values }: CreateInput) => {
  const [row] = await tx
    .insert(buildExtractInputs)
    .values(values)
    .onConflictDoNothing()
    .returning();
  return row;
};

export const findByBuild = (buildId: string) =>
  db.query.buildExtractInputs.findFirst({
    where: (buildExtractInputs, { eq }) => eq(buildExtractInputs.buildId, buildId),
  });

export type BuildExtractInputDbSchema = Awaited<ReturnType<typeof findByBuild>>;
