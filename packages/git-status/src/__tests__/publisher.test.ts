import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { mapBuildStatus, send, verify } from "../publisher";
import { server } from "./setup";

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
    server.use(http.post(request.url, () => new HttpResponse(null, { status: 201 })));
    const result = await send(request);
    expect(result).toEqual({ outcome: "ok", httpStatus: 201, retryable: false });
  });

  it("treats a 401 as a terminal error", async () => {
    server.use(http.post(request.url, () => new HttpResponse(null, { status: 401 })));
    const result = await send(request);
    expect(result.outcome).toBe("error");
    expect(result.retryable).toBe(false);
  });

  it("treats a 500 as retryable", async () => {
    server.use(http.post(request.url, () => new HttpResponse(null, { status: 500 })));
    const result = await send(request);
    expect(result.retryable).toBe(true);
  });

  it("treats a network failure as retryable", async () => {
    server.use(http.post(request.url, () => HttpResponse.error()));
    const result = await send(request);
    expect(result).toMatchObject({ outcome: "error", retryable: true });
  });
});

const verifyRequest = { url: "https://api.example.com/repos/acme/web", headers: {} };

describe("verify", () => {
  it("is ok when the token has push access", async () => {
    server.use(
      http.get(verifyRequest.url, () => HttpResponse.json({ permissions: { push: true } })),
    );
    const result = await verify(verifyRequest);
    expect(result).toEqual({ ok: true, httpStatus: 200, error: null });
  });

  it("is not ok when the token lacks push access (e.g. a public repo read-only token)", async () => {
    server.use(
      http.get(verifyRequest.url, () => HttpResponse.json({ permissions: { push: false } })),
    );
    const result = await verify(verifyRequest);
    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(200);
  });

  it("is not ok on a non-2xx response", async () => {
    server.use(http.get(verifyRequest.url, () => new HttpResponse(null, { status: 404 })));
    const result = await verify(verifyRequest);
    expect(result).toMatchObject({ ok: false, httpStatus: 404 });
  });

  it("reports a network failure", async () => {
    server.use(http.get(verifyRequest.url, () => HttpResponse.error()));
    const result = await verify(verifyRequest);
    expect(result).toMatchObject({ ok: false, httpStatus: null });
  });
});
