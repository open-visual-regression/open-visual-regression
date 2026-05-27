import { count } from "drizzle-orm";
import { db } from "../client";
import { organization } from "../schema/auth";

export const getOrganizationCount = async (): Promise<number> => {
  const [row] = await db.select({ count: count() }).from(organization);
  return row?.count ?? 0;
};
