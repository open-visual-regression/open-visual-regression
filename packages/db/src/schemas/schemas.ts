import { pgTable, text, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { customType } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm/relations";
import { sql } from "drizzle-orm/sql";
import { v7 as uuidv7 } from "uuid";

import { organization, user } from "./auth";

export const utcTimestamp = customType<{
  data: string;
  driverData: string;
}>({
  dataType: () => "timestamp",
  fromDriver: (value: string): string => value.replace(" ", "T") + "Z",
});

export const projects = pgTable("projects", {
  id: uuid().primaryKey().$defaultFn(uuidv7),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 511 }),
  gitMainBranch: varchar("git_main_branch", { length: 255 }).notNull(),
  requiredReviewerCount: integer("required_reviewer_count").notNull().default(1),
  organizationId: text("organization_id")
    .references(() => organization.id, { onDelete: "cascade" })
    .notNull(),
  creatorId: text("creator_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  retentionDays: integer("retention_days").notNull().default(90),
  totalBuildsCount: integer("total_builds_count").notNull().default(0),
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
