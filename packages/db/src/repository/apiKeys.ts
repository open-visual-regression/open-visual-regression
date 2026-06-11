import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { apikey, user } from "../schemas/auth";

type FindByProjectInput = {
  projectId: string;
  limit: number;
  offset: number;
};

export const findByProject = async ({ projectId, limit, offset }: FindByProjectInput) => {
  const projectFilter = sql`${apikey.metadata}::jsonb ->> 'projectId' = ${projectId}`;

  const [apiKeys, [totalResult]] = await Promise.all([
    db
      .select({
        id: apikey.id,
        name: apikey.name,
        prefix: apikey.prefix,
        ownerName: user.name,
        createdAt: apikey.createdAt,
        lastRequest: apikey.lastRequest,
      })
      .from(apikey)
      .innerJoin(user, eq(apikey.referenceId, user.id))
      .where(projectFilter)
      .orderBy(desc(apikey.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(apikey).where(projectFilter),
  ]);

  return { apiKeys, total: totalResult?.count ?? 0 };
};

export type FindByProjectResult = Awaited<ReturnType<typeof findByProject>>;

export type ApiKeyDbSchema = FindByProjectResult["apiKeys"][number];
