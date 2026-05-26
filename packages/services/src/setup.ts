import { count } from "drizzle-orm";
import { db } from "@ovr/db/client";
import { user } from "@ovr/db/schema/auth";

export const getUserCount = async (): Promise<number> => {
  const [row] = await db.select({ count: count() }).from(user);
  return row?.count ?? 0;
};
