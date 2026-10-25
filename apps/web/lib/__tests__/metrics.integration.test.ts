import { randomUUID } from "node:crypto";

import { vi } from "vitest";

import { dbClient } from "@ovr/db/client";
import { db } from "@ovr/db/db";
import { projects } from "@ovr/db/schema";
import { QueueName } from "@ovr/queue";
import { enqueueDiff } from "@ovr/queue/producer";

import { observeBuildsInProgress, observeQueues } from "@/lib/metrics";
import { describe, expect, test } from "@/lib/testing/fixtures";

vi.mock("next/headers");

const OLD_TIMESTAMP = "2020-01-01T00:00:00.000Z";

// Other tests may leave jobs in the shared Valkey.
const readValue = (body: string, series: string): number => {
  const line = body.split("\n").find((candidate) => candidate.startsWith(`${series} `));
  return Number(line?.slice(series.length + 1));
};

describe("metrics", () => {
  describe("observeQueues", () => {
    test("should report how many jobs each queue holds in each state", async ({
      metrics,
      trackJob,
    }) => {
      observeQueues();
      const series = `ovr_queue_jobs{queue="${QueueName.SNAPSHOT_DIFF}",state="waiting"}`;
      const before = readValue(await metrics.scrape(), series);

      trackJob(await enqueueDiff({ snapshotId: randomUUID(), diffId: randomUUID() }));

      const body = await metrics.scrape();

      expect(readValue(body, series)).toBe(before + 1);
      expect(body).toContain(
        `ovr_queue_jobs{queue="${QueueName.SNAPSHOT_CAPTURE}",state="prioritized"}`,
      );
    });
  });

  describe("observeBuildsInProgress", () => {
    test("should report zero for each status when nothing is in progress", async ({ metrics }) => {
      observeBuildsInProgress();

      const body = await metrics.scrape();

      expect(body).toContain('ovr_builds_in_progress{processing_status="queued"} 0');
      expect(body).toContain('ovr_builds_in_progress{processing_status="processing"} 0');
      expect(body).toContain(
        'ovr_builds_in_progress_oldest_age_seconds{processing_status="queued"} 0',
      );
    });

    test("should report in-progress builds and how long the oldest has been waiting", async ({
      admin,
      organization,
      metrics,
    }) => {
      const [project] = await db
        .insert(projects)
        .values({
          name: "Metrics Project",
          gitMainBranch: "main",
          organizationId: organization.id,
          creatorId: admin.id,
        })
        .returning();
      await dbClient.builds.create({
        projectId: project!.id,
        branch: "main",
        commitSha: "a".repeat(40),
        artifactPath: "builds/metrics/artifact",
        createdBy: admin.id,
        createdAt: OLD_TIMESTAMP,
      });
      observeBuildsInProgress();

      const body = await metrics.scrape();

      expect(body).toContain('ovr_builds_in_progress{processing_status="queued"} 1');
      const age = readValue(
        body,
        'ovr_builds_in_progress_oldest_age_seconds{processing_status="queued"}',
      );
      expect(age).toBeGreaterThan((Date.now() - Date.parse(OLD_TIMESTAMP)) / 1000 - 60);
    });
  });
});
