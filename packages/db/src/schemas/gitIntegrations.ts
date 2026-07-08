import { pgEnum, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql";
import { v7 as uuidv7 } from "uuid";

import { projects, utcTimestamp } from "./schemas";

export const gitProviderEnum = pgEnum("git_provider", ["github", "gitea"]);

export type GitProvider = (typeof gitProviderEnum.enumValues)[number];

export const gitIntegrations = pgTable(
  "git_integrations",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    provider: gitProviderEnum().notNull(),
    baseUrl: text("base_url"),
    repoIdentifier: varchar("repo_identifier", { length: 512 }).notNull(),
    encryptedToken: text("encrypted_token").notNull(),
    checkContext: varchar("check_context", { length: 255 }).notNull().default("ovr/visual-review"),
    createdAt: utcTimestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: utcTimestamp("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
      .notNull(),
  },
  (table) => [uniqueIndex("git_integrations_projectId_uidx").on(table.projectId)],
);
