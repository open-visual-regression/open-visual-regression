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
import { sql } from "drizzle-orm/sql";
import { v7 as uuidv7 } from "uuid";

import { user } from "./auth";
import { projects, utcTimestamp } from "./schemas";

export const buildProcessingStatusEnum = pgEnum("build_processing_status", [
  "queued",
  "processing",
  "success",
  "error",
]);

export type BuildProcessingStatus = (typeof buildProcessingStatusEnum.enumValues)[number];

export const buildReviewStatusEnum = pgEnum("build_review_status", [
  "not_required",
  "unchanged",
  "auto_approved",
  "needs_review",
  "approved",
  "rejected",
]);

export type BuildReviewStatus = (typeof buildReviewStatusEnum.enumValues)[number];

export const snapshotStatusEnum = pgEnum("snapshot_status", [
  "queued",
  "processing",
  "success",
  "error",
]);

export type SnapshotStatus = (typeof snapshotStatusEnum.enumValues)[number];

export const diffProcessingStatusEnum = pgEnum("diff_processing_status", [
  "pending",
  "success",
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

export const captureModeEnum = pgEnum("capture_mode", ["worker"]);

export type CaptureMode = (typeof captureModeEnum.enumValues)[number];

export const buildTypeEnum = pgEnum("build_type", ["storybook"]);

export type BuildType = (typeof buildTypeEnum.enumValues)[number];

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
    processingStatus: buildProcessingStatusEnum("processing_status").notNull().default("queued"),
    reviewStatus: buildReviewStatusEnum("review_status").notNull().default("not_required"),
    errorMessage: text("error_message"),
    captureMode: captureModeEnum("capture_mode").notNull().default("worker"),
    buildType: buildTypeEnum("build_type").notNull().default("storybook"),
    artifactPath: text("artifact_path").notNull(),
    createdAt: utcTimestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: utcTimestamp("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
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
    viewportName: varchar("viewport_name", { length: 255 }).notNull(),
    targetId: varchar("target_id", { length: 255 }).notNull(),
    targetTitle: varchar("target_title", { length: 255 }).notNull().default(""),
    targetName: varchar("target_name", { length: 255 }).notNull().default(""),
    status: snapshotStatusEnum().notNull().default("queued"),
    imagePath: text("image_path"),
    hasRenderError: boolean("has_render_error").notNull().default(false),
    diffThreshold: numeric("diff_threshold", { mode: "number", precision: 3, scale: 2 })
      .notNull()
      .default(0.05),
    updatedAt: utcTimestamp("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
      .notNull(),
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
    updatedAt: utcTimestamp("updated_at")
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`)
      .notNull(),
  },
  (table) => [uniqueIndex("diffs_snapshotId_uidx").on(table.snapshotId)],
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
