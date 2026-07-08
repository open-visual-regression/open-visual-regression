import { db } from "../db";
import { gitStatusPublications } from "../schema";

export const record = async (values: typeof gitStatusPublications.$inferInsert) => {
  const [publication] = await db.insert(gitStatusPublications).values(values).returning();
  return publication;
};
