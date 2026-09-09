import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { apikey } from "../schemas/auth";

type FindByUserInput = {
  userId: string;
  limit: number;
  offset: number;
};

export const PERSONAL_TOKEN_TYPE = "personal";

export const personalTokenMetadata = (): Record<string, string> => ({
  type: PERSONAL_TOKEN_TYPE,
});

export const isPersonalTokenMetadata = (metadata: unknown): boolean =>
  typeof metadata === "object" &&
  metadata !== null &&
  (metadata as Record<string, unknown>).type === PERSONAL_TOKEN_TYPE;

const personalTokenFilter = (userId: string) =>
  and(
    eq(apikey.referenceId, userId),
    sql`${apikey.metadata}::jsonb ->> 'type' = ${PERSONAL_TOKEN_TYPE}`,
  );

export const findByUser = async ({ userId, limit, offset }: FindByUserInput) => {
  const [accessTokens, [totalResult]] = await Promise.all([
    db
      .select({
        id: apikey.id,
        name: apikey.name,
        createdAt: apikey.createdAt,
        lastRequest: apikey.lastRequest,
      })
      .from(apikey)
      .where(personalTokenFilter(userId))
      .orderBy(desc(apikey.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(apikey).where(personalTokenFilter(userId)),
  ]);

  return { accessTokens, total: totalResult?.count ?? 0 };
};

export const findByIdForUser = ({ tokenId, userId }: { tokenId: string; userId: string }) =>
  db.query.apikey.findFirst({
    where: and(eq(apikey.id, tokenId), personalTokenFilter(userId)),
    columns: { id: true },
  });
