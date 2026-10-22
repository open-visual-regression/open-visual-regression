import { describe, expect, test } from "../../__tests__/fixtures";

describe("startMetricsServer", () => {
  test("serves queue and build gauges in the Prometheus text format", async ({
    build: _build,
    metricsUrl,
  }) => {
    const response = await fetch(`${metricsUrl}/metrics`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("# TYPE ovr_queue_jobs gauge");
    expect(body).toMatch(/^ovr_queue_jobs\{queue="snapshot-capture",state="waiting"\} \d+$/m);
    expect(body).toContain(`ovr_builds_in_flight{status="queued"} 1`);
    expect(body).toContain(`ovr_builds_in_flight{status="processing"} 0`);
  });

  test("returns 404 for any other path", async ({ metricsUrl }) => {
    expect((await fetch(`${metricsUrl}/other`)).status).toBe(404);
  });
});
