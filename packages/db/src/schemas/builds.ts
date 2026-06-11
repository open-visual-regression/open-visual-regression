import { sql } from "drizzle-orm/sql";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { v7 as uuidv7 } from "uuid";

import { user } from "./auth";
import { captureConfigurations, projects, utcTimestamp } from "./schemas";

export const buildStatusEnum = pgEnum("build_status", [
  "pending",
  "needs_review",
  "passed",
  "error",
]);

export type BuildStatus = (typeof buildStatusEnum.enumValues)[number];

export const snapshotStatusEnum = pgEnum("snapshot_status", ["pending", "captured", "error"]);

export type SnapshotStatus = (typeof snapshotStatusEnum.enumValues)[number];

export const diffStatusEnum = pgEnum("diff_status", [
  "pending",
  "auto_approved",
  "needs_review",
  "approved",
  "rejected",
  "error",
]);

export type DiffStatus = (typeof diffStatusEnum.enumValues)[number];

export const captureModeEnum = pgEnum("capture_mode", ["worker", "pre_captured"]);

export type CaptureMode = (typeof captureModeEnum.enumValues)[number];

export const builds = pgTable("builds", {
  id: uuid().primaryKey().$defaultFn(uuidv7),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  branch: varchar({ length: 255 }).notNull(),
  commitSha: varchar("commit_sha", { length: 64 }).notNull(),
  status: buildStatusEnum().notNull().default("pending"),
  captureMode: captureModeEnum("capture_mode").notNull().default("worker"),
  storybookPath: text("storybook_path").notNull(),
  createdAt: utcTimestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  createdBy: text("created_by")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
});

export const snapshots = pgTable(
  "snapshots",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    buildId: uuid("build_id")
      .references(() => builds.id, { onDelete: "cascade" })
      .notNull(),
    captureConfigurationId: uuid("capture_configuration_id")
      .references(() => captureConfigurations.id)
      .notNull(),
    storyId: varchar("story_id", { length: 255 }).notNull(),
    status: snapshotStatusEnum().notNull().default("pending"),
    imagePath: text("image_path"),
    hasRenderError: boolean("has_render_error").notNull().default(false),
  },
  (table) => [index("snapshots_buildId_idx").on(table.buildId)],
);

export const snapshotLogs = pgTable("snapshot_logs", {
  id: uuid().primaryKey().$defaultFn(uuidv7),
  snapshotId: uuid("snapshot_id")
    .references(() => snapshots.id, { onDelete: "cascade" })
    .notNull(),
  level: varchar({ length: 50 }).notNull(),
  message: text().notNull(),
  timestamp: utcTimestamp()
    .default(sql`now()`)
    .notNull(),
});

export const diffs = pgTable(
  "diffs",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    snapshotId: uuid("snapshot_id")
      .references(() => snapshots.id, { onDelete: "cascade" })
      .notNull(),
    baselineSnapshotId: uuid("baseline_snapshot_id").references(() => snapshots.id, {
      onDelete: "set null",
    }),
    status: diffStatusEnum().notNull().default("pending"),
    diffImagePath: text("diff_image_path"),
    pixelDiffCount: integer("pixel_diff_count"),
    diffPercent: real("diff_percent"),
    reviewerId: text("reviewer_id").references(() => user.id),
    reviewedAt: utcTimestamp("reviewed_at"),
  },
  (table) => [index("diffs_snapshotId_idx").on(table.snapshotId)],
);

export const baselines = pgTable(
  "baselines",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    captureConfigurationId: uuid("capture_configuration_id")
      .references(() => captureConfigurations.id)
      .notNull(),
    storyId: varchar("story_id", { length: 255 }).notNull(),
    snapshotId: uuid("snapshot_id")
      .references(() => snapshots.id)
      .notNull(),
    approvedAt: utcTimestamp("approved_at")
      .default(sql`now()`)
      .notNull(),
    approvedBy: text("approved_by")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    uniqueIndex("baselines_project_capture_configuration_story_uidx").on(
      table.projectId,
      table.captureConfigurationId,
      table.storyId,
    ),
  ],
);
