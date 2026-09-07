import { act } from "react";
import { afterEach, beforeEach, vi } from "vitest";

import { describe, expect, it, render, screen, waitFor } from "@/test-utils";

import { BuildDuration } from "../BuildDuration";

const CREATED_AT = "2026-06-20T12:00:00.000Z";
const STARTED_AT = "2026-06-20T12:00:12.000Z";
const FINISHED_AT = "2026-06-20T12:01:52.000Z";

describe("BuildDuration", () => {
  it("should show the total from creation to completion", () => {
    render(
      <BuildDuration createdAt={CREATED_AT} startedAt={STARTED_AT} finishedAt={FINISHED_AT} />,
    );

    expect(screen.getByText("1m 52s")).toBeVisible();
  });

  it("should break the total into queued and build time on hover", async ({ user }) => {
    render(
      <BuildDuration createdAt={CREATED_AT} startedAt={STARTED_AT} finishedAt={FINISHED_AT} />,
    );

    await user.hover(screen.getByRole("button", { name: /total time/i }));

    await waitFor(() => {
      expect(screen.getByText("queued")).toBeVisible();
    });
    expect(screen.getByText("12s")).toBeVisible();
    expect(screen.getByText("build")).toBeVisible();
    expect(screen.getByText("1m 40s")).toBeVisible();
  });

  it("should report only queued time for a build canceled before it started", async ({ user }) => {
    render(<BuildDuration createdAt={CREATED_AT} startedAt={null} finishedAt={STARTED_AT} />);

    expect(screen.getByText("12s")).toBeVisible();

    await user.hover(screen.getByRole("button", { name: /total time/i }));

    await waitFor(() => {
      expect(screen.getByText("queued")).toBeVisible();
    });
    expect(screen.queryByText("build")).not.toBeInTheDocument();
  });

  describe("while the build is still running", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(FINISHED_AT));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should keep counting up until the build finishes", async () => {
      render(<BuildDuration createdAt={CREATED_AT} startedAt={STARTED_AT} finishedAt={null} />);

      expect(screen.getByText("1m 52s")).toBeVisible();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(screen.getByText("1m 57s")).toBeVisible();
    });

    it("should stop counting once the build has finished", async () => {
      render(
        <BuildDuration createdAt={CREATED_AT} startedAt={STARTED_AT} finishedAt={FINISHED_AT} />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      expect(screen.getByText("1m 52s")).toBeVisible();
    });
  });
});
