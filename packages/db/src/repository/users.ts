import { count, desc, eq, max } from "drizzle-orm";
import { db } from "../db";
import { session, user } from "../schemas/auth";

export const getUserCount = async (): Promise<number> => {
  const [row] = await db.select({ count: count() }).from(user);
  return row?.count ?? 0;
};

export const findByEmail = (email: string) =>
  db.query.user.findFirst({ where: eq(user.email, email) });

export const findAll = () =>
  db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: max(session.createdAt),
    })
    .from(user)
    .leftJoin(session, eq(session.userId, user.id))
    .groupBy(user.id)
    .orderBy(desc(user.createdAt));

export type FindAllResult = Awaited<ReturnType<typeof findAll>>;

export type UserDbSchema = FindAllResult[number];
