import { describe, expect, it, vi } from "vitest";

import { mapBuildStatus, send } from "../publisher";

describe("mapBuildStatus", () => {
  it("maps in-flight processing to pending", () => {
    expect(
      mapBuildStatus({ processingStatus: "processing", reviewStatus: "not_required" }).state,
    ).toBe("pending");
  });

  it("maps a processing error to error", () => {
    expect(mapBuildStatus({ processingStatus: "error", reviewStatus: "not_required" }).state).toBe(
      "error",
    );
  });

  it("maps needs_review to failure", () => {
    expect(
      mapBuildStatus({ processingStatus: "success", reviewStatus: "needs_review" }).state,
    ).toBe("failure");
  });

  it("maps approved/auto_approved/unchanged to success", () => {
    expect(mapBuildStatus({ processingStatus: "success", reviewStatus: "approved" }).state).toBe(
      "success",
    );
    expect(
      mapBuildStatus({ processingStatus: "success", reviewStatus: "auto_approved" }).state,
    ).toBe("success");
    expect(mapBuildStatus({ processingStatus: "success", reviewStatus: "unchanged" }).state).toBe(
      "success",
    );
  });
});

const request = { url: "https://api.example.com/status", headers: {}, body: {} };

describe("send", () => {
  it("returns ok on a 2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 201 })));
    const result = await send(request);
    expect(result).toEqual({ outcome: "ok", httpStatus: 201, retryable: false });
  });

  it("treats a 401 as a terminal error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
    const result = await send(request);
    expect(result.outcome).toBe("error");
    expect(result.retryable).toBe(false);
  });

  it("treats a 500 as retryable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    const result = await send(request);
    expect(result.retryable).toBe(true);
  });

  it("treats a network failure as retryable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const result = await send(request);
    expect(result).toMatchObject({ outcome: "error", retryable: true });
  });
});
