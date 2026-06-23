import { sql } from "drizzle-orm/sql";
import {
  boolean,
  index,
  integer,
  numeric,
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
import { projects, utcTimestamp } from "./schemas";

export const buildStatusEnum = pgEnum("build_status", [
  "pending",
  "needs_review",
  "passed",
  "rejected",
  "error",
]);

export type BuildStatus = (typeof buildStatusEnum.enumValues)[number];

export const snapshotStatusEnum = pgEnum("snapshot_status", ["pending", "captured", "error"]);

export type SnapshotStatus = (typeof snapshotStatusEnum.enumValues)[number];

export const diffProcessingStatusEnum = pgEnum("diff_processing_status", [
  "pending",
  "diffed",
  "error",
]);

export type DiffProcessingStatus = (typeof diffProcessingStatusEnum.enumValues)[number];

export const diffReviewStatusEnum = pgEnum("diff_review_status", [
  "not_required",
  "needs_review",
  "approved",
  "rejected",
]);

export type DiffReviewStatus = (typeof diffReviewStatusEnum.enumValues)[number];

export const diffReviewVoteEnum = pgEnum("diff_review_vote", ["approve", "reject"]);

export type DiffReviewVote = (typeof diffReviewVoteEnum.enumValues)[number];

export const captureModeEnum = pgEnum("capture_mode", ["worker", "pre_captured"]);

export type CaptureMode = (typeof captureModeEnum.enumValues)[number];

export const builds = pgTable(
  "builds",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    branch: varchar({ length: 255 }).notNull(),
    commitSha: varchar("commit_sha", { length: 64 }).notNull(),
    name: varchar({ length: 255 }),
    author: varchar({ length: 255 }),
    status: buildStatusEnum().notNull().default("pending"),
    errorMessage: text("error_message"),
    captureMode: captureModeEnum("capture_mode").notNull().default("worker"),
    artifactPath: text("artifact_path").notNull(),
    createdAt: utcTimestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    createdBy: text("created_by")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    index("builds_projectId_createdAt_id_idx").on(table.projectId, table.createdAt, table.id),
  ],
);

export const storageOutbox = pgTable(
  "storage_outbox",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    projectId: uuid("project_id").notNull(),
    buildId: uuid("build_id").notNull(),
    prefix: text().notNull(),
    createdAt: utcTimestamp("created_at")
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [index("storage_outbox_projectId_idx").on(table.projectId)],
);

export const snapshots = pgTable(
  "snapshots",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    buildId: uuid("build_id")
      .references(() => builds.id, { onDelete: "cascade" })
      .notNull(),
    browser: varchar({ length: 50 }).notNull().default("chromium"),
    viewportWidth: integer("viewport_width").notNull().default(1280),
    // 0 means "auto/full-page height" — no fixed viewport height was requested.
    viewportHeight: integer("viewport_height").notNull().default(0),
    targetId: varchar("target_id", { length: 255 }).notNull(),
    targetTitle: varchar("target_title", { length: 255 }).notNull().default(""),
    targetName: varchar("target_name", { length: 255 }).notNull().default(""),
    status: snapshotStatusEnum().notNull().default("pending"),
    imagePath: text("image_path"),
    hasRenderError: boolean("has_render_error").notNull().default(false),
    diffThreshold: numeric("diff_threshold", { mode: "number", precision: 3, scale: 2 })
      .notNull()
      .default(0.05),
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
    processingStatus: diffProcessingStatusEnum("processing_status").notNull().default("pending"),
    reviewStatus: diffReviewStatusEnum("review_status").notNull().default("not_required"),
    diffImagePath: text("diff_image_path"),
    pixelDiffCount: integer("pixel_diff_count"),
    diffPercent: real("diff_percent"),
  },
  (table) => [index("diffs_snapshotId_idx").on(table.snapshotId)],
);

export const diffReviews = pgTable(
  "diff_reviews",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    diffId: uuid("diff_id")
      .references(() => diffs.id, { onDelete: "cascade" })
      .notNull(),
    reviewerId: text("reviewer_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    vote: diffReviewVoteEnum().notNull(),
    reviewedAt: utcTimestamp("reviewed_at")
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("diff_reviews_diffId_reviewerId_uidx").on(table.diffId, table.reviewerId),
  ],
);

export const baselines = pgTable(
  "baselines",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    browser: varchar({ length: 50 }).notNull().default("chromium"),
    viewportWidth: integer("viewport_width").notNull().default(1280),
    viewportHeight: integer("viewport_height").notNull().default(0),
    targetId: varchar("target_id", { length: 255 }).notNull(),
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
    uniqueIndex("baselines_project_browser_viewport_target_uidx").on(
      table.projectId,
      table.browser,
      table.viewportWidth,
      table.viewportHeight,
      table.targetId,
    ),
    index("baselines_snapshotId_idx").on(table.snapshotId),
  ],
);
