import { pgTable, text, uuid, varchar, numeric } from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";
import { organization, user } from "./auth";
import { customType } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import { relations } from "drizzle-orm/relations";

const utcTimestamp = customType<{
  data: string;
  driverData: string;
}>({
  dataType: () => "timestamp",
  fromDriver: (value: string): string => value.replace(" ", "T") + "Z",
});

export const projects = pgTable("projects", {
  id: uuid().primaryKey().$defaultFn(uuidv7),
  name: varchar({ length: 255 }).notNull(),
  diffThreshold: numeric("diff_threshold", { mode: "number", precision: 3, scale: 2 }).notNull(),
  gitMainBranch: varchar("git_main_branch", { length: 255 }).notNull(),
  organizationId: text("organization_id")
    .references(() => organization.id, { onDelete: "cascade" })
    .notNull(),
  creatorId: text("creator_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: utcTimestamp("created_at")
    .default(sql`now()`)
    .notNull(),
});

export const projectsRelations = relations(projects, ({ one }) => ({
  creator: one(user, {
    fields: [projects.creatorId],
    references: [user.id],
  }),
}));
