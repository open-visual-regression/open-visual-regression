import { count } from "drizzle-orm";
import { db } from "../client";
import { user } from "../schema/auth";

export const getUserCount = async (): Promise<number> => {
  const [row] = await db.select({ count: count() }).from(user);
  return row?.count ?? 0;
};
