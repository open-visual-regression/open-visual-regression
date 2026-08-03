import { db, type DbClient } from "../db";
import { buildExtractInputs } from "../schema";

type CreateInput = typeof buildExtractInputs.$inferInsert & { tx?: DbClient };

export const create = async ({ tx = db, ...values }: CreateInput) => {
  const [row] = await tx.insert(buildExtractInputs).values(values).returning();
  return row;
};

export const findByBuild = (buildId: string) =>
  db.query.buildExtractInputs.findFirst({
    where: (buildExtractInputs, { eq }) => eq(buildExtractInputs.buildId, buildId),
  });

export const copyToBuild = async (
  sourceBuildId: string,
  destinationBuildId: string,
  tx: DbClient = db,
) => {
  const source = await findByBuild(sourceBuildId);

  if (!source) {
    return undefined;
  }

  const [row] = await tx
    .insert(buildExtractInputs)
    .values({
      buildId: destinationBuildId,
      targets: source.targets,
      viewports: source.viewports,
      diffThreshold: source.diffThreshold,
    })
    .returning();
  return row;
};

export type BuildExtractInputDbSchema = Awaited<ReturnType<typeof findByBuild>>;
