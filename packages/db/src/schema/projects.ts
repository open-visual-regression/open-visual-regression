import { relations } from "drizzle-orm";
import { integer, pgTable, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const project = pgTable(
  "project",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    defaultBranch: text("default_branch").notNull().default("main"),
    diffThreshold: real("diff_threshold").notNull().default(0.1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
  },
  (table) => [uniqueIndex("project_slug_uidx").on(table.slug)],
);

export const variant = pgTable("variant", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  browser: text("browser").notNull().default("chromium"),
  viewportWidth: integer("viewport_width").notNull().default(1280),
  viewportHeight: integer("viewport_height").notNull().default(800),
});

export const projectRelations = relations(project, ({ one, many }) => ({
  creator: one(user, {
    fields: [project.createdBy],
    references: [user.id],
  }),
  variants: many(variant),
}));

export const variantRelations = relations(variant, ({ one }) => ({
  project: one(project, {
    fields: [variant.projectId],
    references: [project.id],
  }),
}));
